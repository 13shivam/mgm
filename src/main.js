const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const SystemMonitor = require('./core/SystemMonitor');
const SecurityScanner = require('./security/SecurityScanner');
const AdminManager = require('./core/AdminManager');

let mainWindow;
let systemMonitor;
let securityScanner;
let adminManager;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        titleBarStyle: 'default',
        title: 'macOS Gateway Monitor v0.0.1',
        show: false,
        icon: path.join(__dirname, '../assets/icon-512.png')
    });

    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
    mainWindow.maximize();
    mainWindow.show();
    
    // Setup application menu
    setupMenu();
    
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }

    // Initialize monitoring services
    adminManager = new AdminManager();
    systemMonitor = new SystemMonitor();
    securityScanner = new SecurityScanner();
    
    // Request admin privileges once on startup
    adminManager.requestAdminPrivileges();
}

function setupMenu() {
    const isDev = process.argv.includes('--dev');
    
    const template = [
        {
            label: 'macOS Gateway Monitor',
            submenu: [
                {
                    label: 'About macOS Gateway Monitor',
                    click: () => {
                        const { dialog } = require('electron');
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About macOS Gateway Monitor',
                            message: 'macOS Gateway Monitor v0.0.1',
                            detail: 'macOS security and network monitoring tool with real-time process analysis, network bandwidth tracking, and comprehensive security scanning.\n\nContact GitHub user @13shivam for any queries and MR raised.',
                            buttons: ['OK'],
                            icon: path.join(__dirname, '../assets/icon-512.png')
                        });
                    }
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
                { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectall' }
            ]
        }
    ];

    // Add developer menu only in dev mode
    if (isDev) {
        template.push({
            label: 'Developer',
            submenu: [
                {
                    label: 'Toggle Developer Tools',
                    accelerator: 'F12',
                    click: () => {
                        mainWindow.webContents.toggleDevTools();
                    }
                },
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        mainWindow.reload();
                    }
                }
            ]
        });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// IPC Handlers for System Monitoring
ipcMain.handle('system:get-processes', async () => {
    try {
        return await systemMonitor.getProcesses();
    } catch (error) {
        console.error('Error getting processes:', error);
        return { error: error.message };
    }
});

ipcMain.handle('system:get-network-connections', async () => {
    try {
        return await systemMonitor.getNetworkConnections();
    } catch (error) {
        console.error('Error getting network connections:', error);
        return { error: error.message };
    }
});

ipcMain.handle('system:get-network-usage', async () => {
    try {
        return await systemMonitor.getProcessNetworkUsage();
    } catch (error) {
        console.error('Error getting network usage:', error);
        return { error: error.message };
    }
});

// IPC Handlers for Security Scanning
ipcMain.handle('security:get-startup-items', async () => {
    try {
        return await securityScanner.getStartupItems();
    } catch (error) {
        console.error('Error getting startup items:', error);
        return { error: error.message };
    }
});

ipcMain.handle('security:get-gatekeeper-status', async () => {
    try {
        return await securityScanner.getGatekeeperStatus();
    } catch (error) {
        console.error('Error getting gatekeeper status:', error);
        return { error: error.message };
    }
});

ipcMain.handle('security:get-firewall-status', async () => {
    try {
        return await securityScanner.getFirewallStatus();
    } catch (error) {
        console.error('Error getting firewall status:', error);
        return { error: error.message };
    }
});

ipcMain.handle('security:perform-scan', async () => {
    try {
        return await securityScanner.performSecurityScan();
    } catch (error) {
        console.error('Error performing security scan:', error);
        return { error: error.message };
    }
});

ipcMain.handle('security:perform-detailed-scan', async () => {
    try {
        return await securityScanner.performDetailedSecurityScan();
    } catch (error) {
        console.error('Error performing detailed security scan:', error);
        return { error: error.message };
    }
});

// Legacy handlers for backward compatibility
ipcMain.handle('get-processes', async () => {
    try {
        return await systemMonitor.getProcesses();
    } catch (error) {
        return { error: error.message };
    }
});

ipcMain.handle('get-network', async () => {
    try {
        return await systemMonitor.getNetworkConnections();
    } catch (error) {
        return { error: error.message };
    }
});

ipcMain.handle('get-network-usage', async () => {
    try {
        return await systemMonitor.getProcessNetworkUsage();
    } catch (error) {
        return { error: error.message };
    }
});

ipcMain.handle('get-netstat', async () => {
    try {
        return await systemMonitor.exec('netstat', ['-rn']);
    } catch (error) {
        return { error: error.message };
    }
});

ipcMain.handle('get-ifconfig', async () => {
    try {
        const { stdout } = await systemMonitor.exec('ifconfig', ['-a']);
        return stdout;
    } catch (error) {
        return { error: error.message };
    }
});

ipcMain.handle('get-arp', async () => {
    try {
        const { stdout } = await systemMonitor.exec('arp', ['-a']);
        return stdout;
    } catch (error) {
        return { error: error.message };
    }
});

ipcMain.handle('get-dns', async () => {
    try {
        const { stdout } = await systemMonitor.exec('scutil', ['--dns']);
        return stdout;
    } catch (error) {
        return { error: error.message };
    }
});

app.whenReady().then(() => {
    createWindow();
    
    // Check admin privileges on startup
    console.log('🚀 macOS Gateway Monitor v0.0.1 starting...');
    console.log('🔐 Admin privileges may be required for full functionality');
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.handle('get-process-connections', async (event, pid) => {
    try {
        return await systemMonitor.getProcessConnections(pid);
    } catch (error) {
        return { error: error.message };
    }
});

ipcMain.handle('get-process-fds', async (event, pid) => {
    try {
        return await systemMonitor.getProcessFileDescriptors(pid);
    } catch (error) {
        return { error: error.message };
    }
});

ipcMain.handle('system:get-info', async () => {
    try {
        const { execSync } = require('child_process');
        const os = require('os');
        
        // Initialize all system info properties with defaults
        const systemInfo = {
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            release: os.release(),
            uptime: os.uptime(),
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            cpuCount: os.cpus().length,
            cpus: os.cpus(),
            loadAverage: os.loadavg(),
            currentUser: process.env.USER || 'unknown',
            homeDirectory: process.env.HOME || 'unknown',
            shell: process.env.SHELL || 'unknown',
            // Initialize security properties with defaults
            gatekeeperStatus: 'Unknown',
            sipStatus: 'Unknown',
            fileVault: 'Unknown',
            secureBootLevel: 'Unknown',
            // Initialize hardware properties with defaults
            modelName: 'Unknown Mac',
            modelIdentifier: 'Unknown',
            serialNumber: 'Not Available',
            processorName: 'Unknown Processor',
            processorSpeed: 'Unknown Speed',
            memoryDescription: 'Unknown Memory',
            // Initialize software properties with defaults
            macOSVersion: 'Unknown',
            buildVersion: 'Unknown',
            kernelVersion: 'Unknown',
            xcodeVersion: 'Not Installed',
            nodeVersion: process.version || 'Unknown',
            pythonVersion: 'Not Installed',
            gitVersion: 'Not Installed'
        };
        
        try {
            // macOS version info
            systemInfo.macOSVersion = execSync('sw_vers -productVersion', { encoding: 'utf8' }).trim();
            systemInfo.buildVersion = execSync('sw_vers -buildVersion', { encoding: 'utf8' }).trim();
            systemInfo.kernelVersion = execSync('uname -r', { encoding: 'utf8' }).trim();
            
            // Hardware info from system_profiler
            let hardwareInfo = '';
            try {
                hardwareInfo = execSync('system_profiler SPHardwareDataType', { encoding: 'utf8' });
                
                // Model information
                const modelMatch = hardwareInfo.match(/Model Name: (.+)/);
                if (modelMatch) systemInfo.modelName = modelMatch[1].trim();
                
                const modelIdMatch = hardwareInfo.match(/Model Identifier: (.+)/);
                if (modelIdMatch) systemInfo.modelIdentifier = modelIdMatch[1].trim();
                
                const serialMatch = hardwareInfo.match(/Serial Number \(system\): (.+)/);
                if (serialMatch) systemInfo.serialNumber = serialMatch[1].trim();
                
                // Processor info
                const chipMatch = hardwareInfo.match(/Chip: (.+)/);
                const processorMatch = hardwareInfo.match(/Processor Name: (.+)/);
                if (chipMatch) {
                    systemInfo.processorName = chipMatch[1].trim();
                } else if (processorMatch) {
                    systemInfo.processorName = processorMatch[1].trim();
                } else {
                    systemInfo.processorName = 'Unknown Processor';
                }
                
                const speedMatch = hardwareInfo.match(/Processor Speed: (.+)/);
                if (speedMatch) {
                    systemInfo.processorSpeed = speedMatch[1].trim();
                } else {
                    systemInfo.processorSpeed = 'Unknown Speed';
                }
                
                // Memory info
                const memoryMatch = hardwareInfo.match(/Memory: (.+)/);
                if (memoryMatch) {
                    systemInfo.memoryDescription = memoryMatch[1].trim();
                } else {
                    systemInfo.memoryDescription = 'Unknown Memory';
                }
                
            } catch (e) {
                // Fallback to basic system info
                systemInfo.modelName = 'Unknown Mac';
                systemInfo.modelIdentifier = 'Unknown';
                systemInfo.serialNumber = 'Not Available';
                systemInfo.processorName = 'Unknown Processor';
                systemInfo.processorSpeed = 'Unknown Speed';
                systemInfo.memoryDescription = 'Unknown Memory';
                console.log('ℹ️ system_profiler unavailable, using fallback hardware info');
            }
            
            // Boot time
            try {
                const bootTime = execSync('sysctl -n kern.boottime', { encoding: 'utf8' });
                const bootMatch = bootTime.match(/sec = (\d+)/);
                if (bootMatch) {
                    const bootTimestamp = parseInt(bootMatch[1]) * 1000;
                    systemInfo.bootTime = new Date(bootTimestamp).toLocaleString();
                }
            } catch (e) {
                systemInfo.bootTime = 'Unknown';
            }
            
            // User info
            try {
                const userInfo = execSync('id', { encoding: 'utf8' });
                const uidMatch = userInfo.match(/uid=(\d+)/);
                const gidMatch = userInfo.match(/gid=(\d+)/);
                systemInfo.userInfo = {
                    uid: uidMatch ? uidMatch[1] : 'N/A',
                    gid: gidMatch ? gidMatch[1] : 'N/A'
                };
            } catch (e) {
                systemInfo.userInfo = { uid: 'N/A', gid: 'N/A' };
            }
            
            // Security status
            try {
                const gatekeeperStatus = execSync('spctl --status', { encoding: 'utf8' }).trim();
                systemInfo.gatekeeperStatus = gatekeeperStatus.includes('enabled') ? 'Enabled' : 'Disabled';
            } catch (e) {
                systemInfo.gatekeeperStatus = 'Unknown';
            }
            
            try {
                const sipStatus = execSync('csrutil status', { encoding: 'utf8' }).trim();
                systemInfo.sipStatus = sipStatus.includes('enabled') ? 'Enabled' : 'Disabled';
            } catch (e) {
                systemInfo.sipStatus = 'Unknown';
            }
            
            try {
                const fileVaultStatus = execSync('fdesetup status', { encoding: 'utf8' }).trim();
                systemInfo.fileVault = fileVaultStatus.includes('FileVault is On') ? 'Enabled' : 'Disabled';
            } catch (e) {
                systemInfo.fileVault = 'Unknown';
            }
            
            try {
                const nvramOutput = execSync('nvram -p', { encoding: 'utf8' });
                
                // Enhanced Secure Boot detection
                if (nvramOutput.includes('SecureBootLevel')) {
                    const match = nvramOutput.match(/SecureBootLevel\s+(.+)/);
                    if (match) {
                        const level = match[1].trim();
                        systemInfo.secureBootLevel = level === 'Full' ? 'Full Security' : 
                                                   level === 'Medium' ? 'Reduced Security' : 
                                                   level === 'None' ? 'Permissive Security' : 
                                                   `Level: ${level}`;
                    } else {
                        systemInfo.secureBootLevel = 'Enabled';
                    }
                } else {
                    // Check if Apple Silicon (likely has Secure Boot)
                    try {
                        const archOutput = execSync('uname -m', { encoding: 'utf8' });
                        if (archOutput.includes('arm64')) {
                            systemInfo.secureBootLevel = 'Enabled (Apple Silicon)';
                        } else {
                            systemInfo.secureBootLevel = 'Not Available (Intel Mac)';
                        }
                    } catch (e2) {
                        systemInfo.secureBootLevel = 'Unknown';
                    }
                }
            } catch (e) {
                systemInfo.secureBootLevel = 'Detection Failed';
            }
            
            // Development tools
            try {
                systemInfo.xcodeVersion = execSync('xcodebuild -version', { encoding: 'utf8' }).split('\n')[0];
            } catch (e) {
                // Graceful fallback - Xcode not required for app functionality
                if (e.message.includes('xcode-select')) {
                    systemInfo.xcodeVersion = 'Command Line Tools Only';
                } else {
                    systemInfo.xcodeVersion = 'Not Installed';
                }
            }
            
            try {
                systemInfo.pythonVersion = execSync('python3 --version', { encoding: 'utf8' }).trim();
            } catch (e) {
                systemInfo.pythonVersion = null;
            }
            
            try {
                systemInfo.gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
            } catch (e) {
                systemInfo.gitVersion = null;
            }
            
        } catch (error) {
            console.warn('Could not get some system info:', error.message);
        }
        
        return systemInfo;
    } catch (error) {
        console.error('Error getting system info:', error);
        return { error: error.message };
    }
});

ipcMain.handle('get-routing', async () => {
    try {
        const { execSync } = require('child_process');
        return execSync('netstat -rn', { encoding: 'utf8' });
    } catch (error) {
        return `Error getting routing table: ${error.message}`;
    }
});

ipcMain.handle('get-interfaces', async () => {
    try {
        const { execSync } = require('child_process');
        return execSync('ifconfig', { encoding: 'utf8' });
    } catch (error) {
        return `Error getting interfaces: ${error.message}`;
    }
});

ipcMain.handle('request-admin-privileges', async () => {
    try {
        const adminManager = systemMonitor.adminManager;
        const granted = await adminManager.requestAdminPrivileges();
        return granted;
    } catch (error) {
        console.error('Error requesting admin privileges:', error);
        return false;
    }
});

// Handle app termination
app.on('before-quit', () => {
    console.log('🛑 Shutting down macOS Gateway Monitor...');
});
