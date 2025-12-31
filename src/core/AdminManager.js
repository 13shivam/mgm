const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class AdminManager {
    constructor() {
        this.configPath = path.join(os.homedir(), '.macos-gateway-monitor');
        this.adminGranted = false;
        this.adminRequested = false; // Prevent multiple dialogs
        this.loadAdminStatus();
    }

    loadAdminStatus() {
        try {
            if (fs.existsSync(this.configPath)) {
                const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                this.adminGranted = config.adminGranted || false;
                
                // Verify admin status is still valid (check if we can run sudo without password)
                if (this.adminGranted) {
                    try {
                        execSync('sudo -n true', { stdio: 'ignore' });
                        console.log('✅ Admin privileges confirmed from cache');
                    } catch (error) {
                        console.log('⚠️  Cached admin privileges expired, will re-prompt when needed');
                        this.adminGranted = false;
                        this.saveAdminStatus();
                    }
                }
            }
        } catch (error) {
            console.warn('Could not load admin status:', error.message);
            this.adminGranted = false;
        }
    }

    saveAdminStatus() {
        try {
            const config = {
                adminGranted: this.adminGranted,
                timestamp: Date.now()
            };
            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
        } catch (error) {
            console.warn('Could not save admin status:', error.message);
        }
    }

    async requestAdminPrivileges() {
        if (this.adminGranted || this.adminRequested) {
            return this.adminGranted;
        }

        this.adminRequested = true;

        try {
            // Test if we already have sudo access
            execSync('sudo -n true', { stdio: 'ignore' });
            this.adminGranted = true;
            this.saveAdminStatus();
            console.log('✅ Admin privileges confirmed');
            return true;
        } catch (error) {
            // Try to extend sudo session
            try {
                console.log('🔐 Requesting admin privileges (one-time setup)...');
                
                // Use sudo -v to validate and extend timestamp
                execSync('sudo -v', { stdio: 'inherit' });
                
                // Set a longer timeout (default is 5 minutes, we can extend to 60 minutes)
                execSync('sudo -S sh -c "echo \\"Defaults timestamp_timeout=60\\" >> /etc/sudoers.d/macos-gateway-monitor-timeout"', { 
                    input: '', 
                    stdio: ['pipe', 'inherit', 'inherit'] 
                });
                
                this.adminGranted = true;
                this.saveAdminStatus();
                console.log('✅ Admin privileges granted with extended session');
                return true;
            } catch (promptError) {
                console.log('🔐 Running in limited mode - some features require admin privileges');
                console.log('💡 Run ./setup-admin.sh for passwordless setup');
                this.adminGranted = false;
                this.saveAdminStatus();
                return false;
            }
        }
    }

    // Keep sudo session alive
    async keepSessionAlive() {
        if (!this.adminGranted) return;
        
        try {
            // Refresh sudo timestamp every 4 minutes
            setInterval(() => {
                if (this.adminGranted) {
                    execSync('sudo -n true', { stdio: 'ignore' });
                }
            }, 4 * 60 * 1000); // 4 minutes
        } catch (error) {
            console.warn('Sudo session expired');
            this.adminGranted = false;
            this.saveAdminStatus();
        }
    }

    hasAdminPrivileges() {
        return this.adminGranted;
    }

    // Execute command with or without sudo based on admin status
    async execWithPrivileges(command, args = []) {
        if (this.adminGranted) {
            try {
                const result = execSync(`sudo ${command} ${args.join(' ')}`, { 
                    encoding: 'utf8',
                    timeout: 10000 
                });
                return { stdout: result, stderr: '' };
            } catch (error) {
                // If sudo fails, mark admin as not granted and retry without sudo
                this.adminGranted = false;
                this.saveAdminStatus();
                throw error;
            }
        } else {
            // Try without sudo first
            try {
                const result = execSync(`${command} ${args.join(' ')}`, { 
                    encoding: 'utf8',
                    timeout: 10000 
                });
                return { stdout: result, stderr: '' };
            } catch (error) {
                throw new Error(`Command requires admin privileges: ${error.message}`);
            }
        }
    }
}

module.exports = AdminManager;
