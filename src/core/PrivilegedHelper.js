const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PrivilegedHelper {
    constructor() {
        this.helperPath = '/Library/PrivilegedHelperTools/com.gateway.monitor.helper';
        this.isInstalled = this.checkHelperInstalled();
    }

    checkHelperInstalled() {
        try {
            return fs.existsSync(this.helperPath);
        } catch (error) {
            return false;
        }
    }

    async installHelper() {
        if (this.isInstalled) {
            console.log('✅ Privileged helper already installed');
            return true;
        }

        try {
            console.log('🔐 Installing privileged helper...');
            
            // Create helper script
            const helperScript = `#!/bin/bash
# Privileged Helper for macOS Gateway Monitor
case "$1" in
    "nettop")
        /usr/bin/nettop -P -l 1 -t wifi,wired
        ;;
    "lsof")
        /usr/bin/lsof "$2" "$3" "$4" "$5"
        ;;
    "kextstat")
        /usr/bin/kextstat
        ;;
    "pfctl")
        /usr/bin/pfctl -sr
        ;;
    "system_profiler")
        /usr/bin/system_profiler "$2"
        ;;
    *)
        echo "Unknown command: $1"
        exit 1
        ;;
esac
`;

            // Write helper to temp location
            const tempHelper = '/tmp/gateway-monitor-helper';
            fs.writeFileSync(tempHelper, helperScript);
            fs.chmodSync(tempHelper, 0o755);

            // Install with admin privileges
            execSync(`sudo mkdir -p /Library/PrivilegedHelperTools`, { stdio: 'inherit' });
            execSync(`sudo cp ${tempHelper} ${this.helperPath}`, { stdio: 'inherit' });
            execSync(`sudo chown root:wheel ${this.helperPath}`, { stdio: 'inherit' });
            execSync(`sudo chmod 4755 ${this.helperPath}`, { stdio: 'inherit' }); // setuid

            // Cleanup
            fs.unlinkSync(tempHelper);

            this.isInstalled = true;
            console.log('✅ Privileged helper installed successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to install privileged helper:', error.message);
            return false;
        }
    }

    async executePrivileged(command, args = []) {
        if (!this.isInstalled) {
            throw new Error('Privileged helper not installed. Run installHelper() first.');
        }

        try {
            const result = execSync(`${this.helperPath} ${command} ${args.join(' ')}`, {
                encoding: 'utf8',
                timeout: 10000
            });
            return { stdout: result, stderr: '' };
        } catch (error) {
            throw new Error(`Privileged command failed: ${error.message}`);
        }
    }

    async uninstallHelper() {
        try {
            if (this.isInstalled) {
                execSync(`sudo rm -f ${this.helperPath}`, { stdio: 'inherit' });
                this.isInstalled = false;
                console.log('✅ Privileged helper uninstalled');
            }
        } catch (error) {
            console.error('❌ Failed to uninstall helper:', error.message);
        }
    }
}

module.exports = PrivilegedHelper;
