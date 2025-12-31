const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const AdminManager = require('../core/AdminManager');
const { PROCESS_LIMITS } = require('../renderer/utils/constants');

class SecurityScanner {
    constructor() {
        this.adminManager = new AdminManager();
    }

    async exec(command, args = []) {
        return new Promise((resolve, reject) => {
            const proc = spawn(command, args);
            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (data) => stdout += data.toString());
            proc.stderr.on('data', (data) => stderr += data.toString());
            
            proc.on('close', (code) => {
                resolve({ stdout, stderr, code });
            });
        });
    }

    // Get startup/login items
    async getStartupItems() {
        const items = {
            systemDaemons: [],
            userAgents: [],
            loginItems: []
        };

        try {
            // System Launch Daemons
            const daemonPaths = [
                '/System/Library/LaunchDaemons',
                '/Library/LaunchDaemons'
            ];

            for (const daemonPath of daemonPaths) {
                try {
                    const files = await fs.readdir(daemonPath);
                    for (const file of files.filter(f => f.endsWith('.plist'))) {
                        items.systemDaemons.push({
                            name: file,
                            path: path.join(daemonPath, file),
                            type: 'daemon'
                        });
                    }
                } catch (error) {
                    console.warn(`Cannot read ${daemonPath}:`, error.message);
                }
            }

            // User Launch Agents
            const agentPaths = [
                '/System/Library/LaunchAgents',
                '/Library/LaunchAgents',
                path.join(process.env.HOME, 'Library/LaunchAgents')
            ];

            for (const agentPath of agentPaths) {
                try {
                    const files = await fs.readdir(agentPath);
                    for (const file of files.filter(f => f.endsWith('.plist'))) {
                        items.userAgents.push({
                            name: file,
                            path: path.join(agentPath, file),
                            type: 'agent'
                        });
                    }
                } catch (error) {
                    console.warn(`Cannot read ${agentPath}:`, error.message);
                }
            }

            // Login Items (requires osascript)
            try {
                const { stdout } = await this.exec('osascript', ['-e', 
                    'tell application "System Events" to get the name of every login item'
                ]);
                if (stdout.trim()) {
                    items.loginItems = stdout.trim().split(', ').map(name => ({
                        name: name,
                        type: 'login-item'
                    }));
                }
            } catch (error) {
                console.warn('Cannot get login items:', error.message);
            }

        } catch (error) {
            console.error('Error getting startup items:', error);
        }

        return items;
    }

    // Get Gatekeeper status
    async getGatekeeperStatus() {
        try {
            const { stdout } = await this.exec('spctl', ['--status']);
            return {
                enabled: stdout.includes('assessments enabled'),
                status: stdout.trim()
            };
        } catch (error) {
            return {
                enabled: false,
                error: error.message
            };
        }
    }

    // Get firewall status and rules
    async getFirewallStatus() {
        try {
            // Application firewall status
            let afStatus = '0';
            try {
                if (this.adminManager.hasAdminPrivileges()) {
                    const { stdout } = await this.adminManager.execWithPrivileges('defaults', [
                        'read', '/Library/Preferences/com.apple.alf', 'globalstate'
                    ]);
                    afStatus = stdout.trim();
                } else {
                    // Try without sudo
                    const { stdout } = await this.exec('defaults', [
                        'read', '/Library/Preferences/com.apple.alf', 'globalstate'
                    ]);
                    afStatus = stdout.trim();
                }
            } catch (error) {
                console.warn('Cannot read firewall status:', error.message);
            }

            return {
                applicationFirewall: {
                    enabled: parseInt(afStatus) > 0,
                    state: parseInt(afStatus)
                },
                packetFilter: {
                    rules: 'Admin privileges required for detailed rules'
                }
            };
        } catch (error) {
            return {
                error: error.message
            };
        }
    }

    // Get System Integrity Protection status
    async getSIPStatus() {
        try {
            const { stdout } = await this.exec('csrutil', ['status']);
            return {
                enabled: stdout.includes('enabled'),
                status: stdout.trim()
            };
        } catch (error) {
            return {
                error: error.message
            };
        }
    }

    // Get kernel extensions
    async getKernelExtensions() {
        try {
            const { stdout, stderr, code } = await this.exec('kextstat', []);
            
            if (code !== 0) {
                // Try with admin privileges if available
                if (this.adminManager.hasAdminPrivileges()) {
                    const { stdout: sudoOut } = await this.adminManager.execWithPrivileges('kextstat', []);
                    return this.parseKextOutput(sudoOut);
                } else {
                    console.warn('kextstat failed, admin privileges may be required');
                    return [];
                }
            }
            
            return this.parseKextOutput(stdout);
            
        } catch (error) {
            console.warn('Cannot get kernel extensions:', error.message);
            return [];
        }
    }

    parseKextOutput(output) {
        const lines = output.split('\n').slice(1);
        return lines.map(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 6) {
                const bundleId = parts[5];
                return {
                    index: parts[0],
                    refs: parts[1],
                    address: parts[2],
                    size: parts[3],
                    wired: parts[4],
                    name: bundleId,
                    bundle: bundleId,
                    version: parts[6] || '',
                    path: this.getKextPath(bundleId)
                };
            }
        }).filter(Boolean);
    }

    // Get likely path for a kernel extension bundle ID
    getKextPath(bundleId) {
        if (!bundleId) return 'Unknown Path';
        
        // Apple system extensions
        if (bundleId.startsWith('com.apple.')) {
            return `/System/Library/Extensions/${bundleId}.kext`;
        }
        
        // Common third-party locations
        const commonPaths = [
            `/Library/Extensions/${bundleId}.kext`,
            `/System/Library/Extensions/${bundleId}.kext`,
            `/Library/Application Support/*/Extensions/${bundleId}.kext`
        ];
        
        return commonPaths[0]; // Default to most common third-party location
    }

    // Enhanced startup items with detailed analysis
    async getStartupItemsDetailed() {
        const items = await this.getStartupItems();
        
        // Analyze each startup item
        for (const category of ['systemDaemons', 'userAgents']) {
            for (const item of items[category] || []) {
                try {
                    // Read plist content
                    const plistContent = await fs.readFile(item.path, 'utf8');
                    item.details = this.parsePlistContent(plistContent);
                    
                    // Check if process is running
                    item.runningProcess = await this.findRunningProcess(item.details.Label || item.name);
                    
                    // Security analysis
                    item.securityFlags = this.analyzeStartupSecurity(item.details, item.path);
                } catch (error) {
                    item.error = error.message;
                }
            }
        }
        
        return items;
    }

    parsePlistContent(content) {
        try {
            // Basic plist parsing (simplified)
            const details = {};
            
            const labelMatch = content.match(/<key>Label<\/key>\s*<string>([^<]+)<\/string>/);
            if (labelMatch) details.Label = labelMatch[1];
            
            const programMatch = content.match(/<key>Program<\/key>\s*<string>([^<]+)<\/string>/);
            if (programMatch) details.Program = programMatch[1];
            
            const runAtLoadMatch = content.match(/<key>RunAtLoad<\/key>\s*<(true|false)\/>/);
            if (runAtLoadMatch) details.RunAtLoad = runAtLoadMatch[1] === 'true';
            
            const keepAliveMatch = content.match(/<key>KeepAlive<\/key>\s*<(true|false)\/>/);
            if (keepAliveMatch) details.KeepAlive = keepAliveMatch[1] === 'true';
            
            return details;
        } catch (error) {
            return { error: error.message };
        }
    }

    async findRunningProcess(label) {
        try {
            const { stdout } = await this.exec('ps', ['-eo', 'pid,comm,args']);
            const lines = stdout.split('\n');
            
            for (const line of lines) {
                if (line.includes(label)) {
                    const parts = line.trim().split(/\s+/);
                    return {
                        pid: parts[0],
                        command: parts[1],
                        args: parts.slice(2).join(' ')
                    };
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    analyzeStartupSecurity(details, path) {
        const flags = [];
        
        if (details.RunAtLoad) flags.push('AUTO_START');
        if (details.KeepAlive) flags.push('PERSISTENT');
        if (path.includes('/System/')) flags.push('SYSTEM_LEVEL');
        if (path.includes('Library/LaunchDaemons')) flags.push('ROOT_DAEMON');
        if (details.Program && !details.Program.startsWith('/System/')) flags.push('THIRD_PARTY');
        
        return flags;
    }

    // Enhanced firewall analysis
    async getFirewallDetailed() {
        const basic = await this.getFirewallStatus();
        
        try {
            // Get application firewall exceptions
            const { stdout: exceptions } = await this.adminManager.execWithPrivileges('defaults', [
                'read', '/Library/Preferences/com.apple.alf', 'exceptions'
            ]);
            
            // Get firewall logging
            const { stdout: logging } = await this.adminManager.execWithPrivileges('defaults', [
                'read', '/Library/Preferences/com.apple.alf', 'loggingenabled'
            ]);
            
            // Get stealth mode
            const { stdout: stealth } = await this.adminManager.execWithPrivileges('defaults', [
                'read', '/Library/Preferences/com.apple.alf', 'stealthenabled'
            ]);

            // Get pfctl rules
            const { stdout: pfRules } = await this.adminManager.execWithPrivileges('pfctl', ['-sr']);
            
            basic.detailed = {
                exceptions: this.parseFirewallExceptions(exceptions),
                logging: logging.trim() === '1',
                stealth: stealth.trim() === '1'
            };

            basic.rules = this.parseFirewallRules(pfRules);
            
        } catch (error) {
            basic.detailed = { error: error.message };
            basic.rules = [];
        }
        
        return basic;
    }

    parseFirewallRules(output) {
        try {
            const rules = [];
            const lines = output.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                if (line.includes('pass') || line.includes('block')) {
                    rules.push({
                        rule: line.trim(),
                        action: line.includes('pass') ? 'allow' : 'block'
                    });
                }
            }
            
            return rules;
        } catch (error) {
            return [];
        }
    }

    parseFirewallExceptions(output) {
        try {
            // Parse firewall exceptions (simplified)
            const exceptions = [];
            const lines = output.split('\n');
            
            lines.forEach(line => {
                if (line.includes('bundleid') || line.includes('path')) {
                    exceptions.push(line.trim());
                }
            });
            
            return exceptions;
        } catch (error) {
            return [];
        }
    }

    // Enhanced kernel extensions with actual path verification
    async getKernelExtensionsDetailed() {
        const kexts = await this.getKernelExtensions();
        
        // Enhance each kext with actual path information
        for (const kext of kexts) {
            try {
                // Try to find the actual path using kextfind
                const { stdout: kextfindOut, stderr, code } = await this.exec('kextfind', ['-bundle-id', kext.bundle]);
                
                // kextfind often has warnings in stderr but still works (code 0)
                if (code === 0 && kextfindOut.trim()) {
                    const paths = kextfindOut.trim().split('\n').filter(p => p.trim());
                    if (paths.length > 0) {
                        kext.path = paths[0]; // Use first found path
                        kext.allPaths = paths; // Store all found paths
                    }
                }
                
                // Get kext info if we have a valid path
                if (kext.path && kext.path !== 'Unknown Path') {
                    try {
                        const { stdout } = await this.exec('kextutil', ['-print-diagnostics', '-no-load', kext.path]);
                        kext.diagnostics = stdout;
                    } catch (error) {
                        // Diagnostics not critical, continue
                    }
                    
                    // Check if it's signed
                    try {
                        const { stdout: signInfo } = await this.exec('codesign', ['-dv', kext.path]);
                        kext.signature = signInfo;
                    } catch (error) {
                        // Signature check not critical, continue
                    }
                }
                
                // Security flags
                kext.securityFlags = [];
                if (kext.bundle && kext.bundle.includes('com.apple.')) {
                    kext.securityFlags.push('APPLE_SIGNED');
                }
                if (kext.bundle && !kext.bundle.includes('com.apple.')) {
                    kext.securityFlags.push('THIRD_PARTY');
                }
                
            } catch (error) {
                kext.detailError = error.message;
                // Keep the estimated path if kextfind fails
                console.warn(`Failed to get details for kext ${kext.bundle}:`, error.message);
            }
        }
        
        return kexts;
    }

    // Basic security scan (for compatibility)
    async performSecurityScan() {
        console.log('🔍 Performing basic security scan...');
        
        const results = await Promise.allSettled([
            this.getStartupItems(),
            this.getGatekeeperStatus(),
            this.getFirewallStatus(),
            this.getSIPStatus(),
            this.getKernelExtensions()
        ]);

        return {
            startupItems: results[0].status === 'fulfilled' ? results[0].value : { error: results[0].reason },
            gatekeeper: results[1].status === 'fulfilled' ? results[1].value : { error: results[1].reason },
            firewall: results[2].status === 'fulfilled' ? results[2].value : { error: results[2].reason },
            sip: results[3].status === 'fulfilled' ? results[3].value : { error: results[3].reason },
            kernelExtensions: results[4].status === 'fulfilled' ? results[4].value : { error: results[4].reason },
            timestamp: new Date().toISOString(),
            detailed: false
        };
    }

    // Comprehensive security scan with detailed analysis
    async performDetailedSecurityScan() {
        console.log('🔍 Performing detailed security analysis...');
        
        const results = await Promise.allSettled([
            this.getStartupItemsDetailed(),
            this.getGatekeeperStatus(),
            this.getFirewallDetailed(),
            this.getSIPStatus(),
            this.getKernelExtensionsDetailed(),
            this.getSecurityPolicies(),
            this.getInstalledApplications(),
            this.getSecurityConfigurations(),
            this.getFileDescriptors()
        ]);

        return {
            startupItems: results[0].status === 'fulfilled' ? results[0].value : { error: results[0].reason },
            gatekeeper: results[1].status === 'fulfilled' ? results[1].value : { error: results[1].reason },
            firewall: results[2].status === 'fulfilled' ? results[2].value : { error: results[2].reason },
            sip: results[3].status === 'fulfilled' ? results[3].value : { error: results[3].reason },
            kernelExtensions: results[4].status === 'fulfilled' ? results[4].value : { error: results[4].reason },
            policies: results[5].status === 'fulfilled' ? results[5].value : { error: results[5].reason },
            applications: results[6].status === 'fulfilled' ? results[6].value : { error: results[6].reason },
            configurations: results[7].status === 'fulfilled' ? results[7].value : { error: results[7].reason },
            fileDescriptors: results[8].status === 'fulfilled' ? results[8].value : { error: results[8].reason },
            timestamp: new Date().toISOString(),
            detailed: true
        };
    }

    async getSecurityPolicies() {
        try {
            const policies = {
                files: [],
                endpoints: []
            };
            
            // FileVault status
            const fvResult = await this.exec('fdesetup', ['status']);
            policies.fileVault = fvResult.stdout.includes('FileVault is On') ? 'Enabled' : 'Disabled';
            policies.files.push({
                name: 'FileVault Configuration',
                path: '/var/db/FileVaultMaster.keychain',
                description: 'FileVault master keychain'
            });
            
            // Secure Boot level - multiple detection methods
            let secureBootStatus = 'Unknown';
            
            try {
                // Method 1: Check nvram for SecureBootLevel
                const sbResult = await this.exec('nvram', ['-p']);
                if (sbResult.stdout.includes('SecureBootLevel')) {
                    const match = sbResult.stdout.match(/SecureBootLevel\s+(.+)/);
                    if (match) {
                        const level = match[1].trim();
                        secureBootStatus = level === 'Full' ? 'Full Security' : 
                                         level === 'Medium' ? 'Reduced Security' : 
                                         level === 'None' ? 'Permissive Security' : 
                                         `Level: ${level}`;
                    } else {
                        secureBootStatus = 'Enabled';
                    }
                } else {
                    // Method 2: Check system_profiler for Secure Boot info
                    try {
                        const spResult = await this.exec('system_profiler', ['SPiBridgeDataType']);
                        if (spResult.stdout.includes('Secure Boot')) {
                            secureBootStatus = 'Enabled (T2/Apple Silicon)';
                        }
                    } catch (e) {
                        // Method 3: Check if running on Apple Silicon (likely has Secure Boot)
                        try {
                            const archResult = await this.exec('uname', ['-m']);
                            if (archResult.stdout.includes('arm64')) {
                                secureBootStatus = 'Enabled (Apple Silicon)';
                            }
                        } catch (e2) {
                            secureBootStatus = 'Unknown';
                        }
                    }
                }
            } catch (error) {
                secureBootStatus = 'Detection Failed';
            }
            
            policies.secureBoot = secureBootStatus;
            policies.files.push({
                name: 'Secure Boot Settings',
                path: '/System/Library/CoreServices/SystemVersion.plist',
                description: 'System version and boot configuration'
            });
            
            // Security configuration files
            const securityFiles = [
                {
                    name: 'Authorization Database',
                    path: '/var/db/auth.db',
                    description: 'System authorization policies'
                },
                {
                    name: 'Security Framework',
                    path: '/System/Library/Frameworks/Security.framework',
                    description: 'Core security framework'
                },
                {
                    name: 'Keychain Access Control',
                    path: '/System/Library/Keychains',
                    description: 'System keychains directory'
                },
                {
                    name: 'Gatekeeper Configuration',
                    path: '/var/db/SystemPolicy',
                    description: 'Gatekeeper policy database'
                }
            ];
            
            policies.files.push(...securityFiles);
            
            // Network endpoints
            policies.endpoints = [
                {
                    name: 'Apple Certificate Authority',
                    url: 'https://www.apple.com/certificateauthority/',
                    description: 'Certificate validation endpoint'
                },
                {
                    name: 'Gatekeeper Notarization',
                    url: 'https://api.apple-cloudkit.com',
                    description: 'App notarization verification'
                },
                {
                    name: 'System Software Updates',
                    url: 'https://swscan.apple.com',
                    description: 'Software update verification'
                }
            ];
            
            return policies;
        } catch (error) {
            return { error: error.message };
        }
    }

    async getInstalledApplications() {
        try {
            const apps = [];
            const appPaths = ['/Applications', '/System/Applications'];
            
            for (const appPath of appPaths) {
                try {
                    const files = await fs.readdir(appPath);
                    for (const file of files.filter(f => f.endsWith('.app'))) {
                        apps.push({
                            name: file.replace('.app', ''),
                            path: path.join(appPath, file),
                            isSystem: appPath.includes('System')
                        });
                    }
                } catch (error) {
                    // Path might not exist, continue
                }
            }
            
            return apps;
        } catch (error) {
            return { error: error.message };
        }
    }

    async getSecurityConfigurations() {
        try {
            const configs = {
                files: [],
                permissions: 'Standard'
            };
            
            // Check important security config files
            const configPaths = [
                '/etc/pf.conf',
                '/etc/hosts',
                '/etc/ssh/ssh_config'
            ];
            
            for (const configPath of configPaths) {
                try {
                    const stats = await fs.stat(configPath);
                    configs.files.push({
                        path: configPath,
                        size: stats.size,
                        modified: stats.mtime
                    });
                } catch (error) {
                    // File might not exist
                }
            }
            
            return configs;
        } catch (error) {
            return { error: error.message };
        }
    }

    async getFileDescriptors() {
        try {
            const lsofResult = await this.exec('lsof', ['-n']);
            const lines = lsofResult.stdout.split('\n');
            
            let openFiles = 0;
            let networkSockets = 0;
            const fileList = [];
            const processFiles = {};
            
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 9) {
                    const command = parts[0];
                    const pid = parts[1];
                    const type = parts[4];
                    const name = parts[8];
                    
                    if (line.includes('REG')) {
                        openFiles++;
                        if (name && name.startsWith('/')) {
                            fileList.push({
                                file: name,
                                process: command,
                                pid: pid,
                                type: 'file'
                            });
                        }
                    }
                    if (line.includes('IPv4') || line.includes('IPv6')) {
                        networkSockets++;
                        fileList.push({
                            file: name,
                            process: command,
                            pid: pid,
                            type: 'network'
                        });
                    }
                    
                    // Group by process
                    if (!processFiles[command]) {
                        processFiles[command] = [];
                    }
                    if (name && name.startsWith('/')) {
                        processFiles[command].push(name);
                    }
                }
            }
            
            return {
                openFiles,
                networkSockets,
                totalDescriptors: lines.length - 1,
                fileList: fileList.slice(0, PROCESS_LIMITS.MAX_SECURITY_FILE_LIST), // Centralized limit management
                processFiles: processFiles
            };
        } catch (error) {
            return { error: error.message };
        }
    }
}

module.exports = SecurityScanner;
