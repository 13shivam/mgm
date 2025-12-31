/**
 * SystemInfoService - Handles system information retrieval and processing
 */
class SystemInfoService {
    constructor() {
        this.cachedInfo = null;
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        this.lastFetch = 0;
    }

    async getSystemInfo(forceRefresh = false) {
        const now = Date.now();
        
        if (!forceRefresh && this.cachedInfo && (now - this.lastFetch) < this.cacheExpiry) {
            return this.cachedInfo;
        }

        const { ipcRenderer } = require('electron');
        try {
            this.cachedInfo = await ipcRenderer.invoke('system:get-info');
            this.lastFetch = now;
            return this.cachedInfo;
        } catch (error) {
            throw new Error(`Failed to get system info: ${error.message}`);
        }
    }

    formatSystemInfo(info) {
        const uptimeDays = Math.floor(info.uptime / 86400);
        const uptimeHours = Math.floor((info.uptime % 86400) / 3600);
        const uptimeMinutes = Math.floor((info.uptime % 3600) / 60);
        
        const memoryUsed = ((info.totalMemory - info.freeMemory) / 1024 / 1024 / 1024).toFixed(2);
        const memoryTotal = (info.totalMemory / 1024 / 1024 / 1024).toFixed(2);
        const memoryFree = (info.freeMemory / 1024 / 1024 / 1024).toFixed(2);

        return {
            ...info,
            formattedUptime: `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`,
            formattedMemory: {
                used: memoryUsed,
                total: memoryTotal,
                free: memoryFree,
                usagePercent: ((memoryUsed / memoryTotal) * 100).toFixed(1)
            }
        };
    }

    renderSystemInfo(info) {
        const uptimeDays = Math.floor((info.uptime || 0) / 86400);
        const uptimeHours = Math.floor(((info.uptime || 0) % 86400) / 3600);
        const uptimeMinutes = Math.floor(((info.uptime || 0) % 3600) / 60);
        
        const memoryUsed = ((info.totalMemory - info.freeMemory) / 1024 / 1024 / 1024).toFixed(2);
        const memoryTotal = (info.totalMemory / 1024 / 1024 / 1024).toFixed(2);
        const memoryFree = (info.freeMemory / 1024 / 1024 / 1024).toFixed(2);
        const memoryPressure = ((memoryUsed / memoryTotal) * 100).toFixed(1);

        return `
            <div class="system-overview system-info-section">
                <h3>System Overview</h3>
                <div class="system-info-grid">
                    <div class="system-info-row">
                        <span class="system-info-label">Computer Name:</span>
                        <span class="system-info-value">${info.hostname || 'Unknown'}</span>
                    </div>
                    <div class="system-info-row">
                        <span class="system-info-label">Model:</span>
                        <span class="system-info-value">${info.modelName || 'Unknown Mac'}</span>
                    </div>
                    <div class="system-info-row">
                        <span class="system-info-label">Model Identifier:</span>
                        <span class="system-info-value">${info.modelIdentifier || 'N/A'}</span>
                    </div>
                    <div class="system-info-row">
                        <span class="system-info-label">Serial Number:</span>
                        <span class="system-info-value">${info.serialNumber || 'Not Available'}</span>
                    </div>
                </div>
            </div>

            <div class="system-info-section">
                <h3>Processor</h3>
                <div class="system-info-row">
                    <span class="system-info-label">Chip:</span>
                    <span class="system-info-value">${info.processorName || (info.cpus && info.cpus[0] ? info.cpus[0].model : 'Unknown')}</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Speed:</span>
                    <span class="system-info-value">${info.processorSpeed || (info.cpus && info.cpus[0] ? (info.cpus[0].speed + ' MHz') : 'Unknown')}</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Cores:</span>
                    <span class="system-info-value">${info.cpuCount || info.cpus?.length || 'Unknown'} cores</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Architecture:</span>
                    <span class="system-info-value">${info.arch || 'Unknown'}</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Load Average:</span>
                    <span class="system-info-value">${info.loadAverage && Array.isArray(info.loadAverage) && info.loadAverage.length > 0 ? info.loadAverage.map(l => l.toFixed(2)).join(', ') : 'N/A'}</span>
                </div>
            </div>

            <div class="system-info-section">
                <h3>Memory</h3>
                <div class="system-info-row">
                    <span class="system-info-label">Total Memory:</span>
                    <span class="system-info-value">${memoryTotal} GB</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Memory Used:</span>
                    <span class="system-info-value">${memoryUsed} GB (${memoryPressure}%)</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Memory Available:</span>
                    <span class="system-info-value">${memoryFree} GB</span>
                </div>
                ${info.memorySlots && info.memorySlots.length > 0 ? `
                <div class="system-info-row">
                    <span class="system-info-label">Memory Slots:</span>
                    <span class="system-info-value">${info.memorySlots.length} slots used</span>
                </div>
                ` : ''}
                <div class="system-info-row">
                    <span class="system-info-label">Memory Pressure:</span>
                    <span class="system-info-value">${memoryPressure < 60 ? 'Normal' : memoryPressure < 80 ? 'High' : 'Critical'}</span>
                </div>
            </div>

            <div class="system-info-section">
                <h3>macOS</h3>
                <div class="system-info-row">
                    <span class="system-info-label">Version:</span>
                    <span class="system-info-value">${info.macOSVersion || 'Unknown'}</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Build:</span>
                    <span class="system-info-value">${info.buildVersion || 'Unknown'}</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Kernel:</span>
                    <span class="system-info-value">${info.release || 'Unknown'}</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Boot Time:</span>
                    <span class="system-info-value">${info.bootTime || 'Unknown'}</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Uptime:</span>
                    <span class="system-info-value">${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m</span>
                </div>
            </div>

            ${info.diskUsage && info.diskUsage.total ? `
            <div class="system-info-section">
                <h3>Storage</h3>
                <div class="system-info-row">
                    <span class="system-info-label">Capacity:</span>
                    <span class="system-info-value">${info.diskUsage.total}</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Used:</span>
                    <span class="system-info-value">${info.diskUsage.used} (${info.diskUsage.percentage})</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Available:</span>
                    <span class="system-info-value">${info.diskUsage.available || 'N/A'}</span>
                </div>
            </div>
            ` : ''}

            ${info.graphicsCards && info.graphicsCards.length > 0 ? `
            <div class="system-info-section">
                <h3>Graphics</h3>
                ${info.graphicsCards.map(gpu => `
                    <div class="system-info-row">
                        <span class="system-info-label">GPU:</span>
                        <span class="system-info-value">${gpu._name || 'Unknown GPU'}</span>
                    </div>
                    ${gpu.vram ? `
                    <div class="system-info-row">
                        <span class="system-info-label">VRAM:</span>
                        <span class="system-info-value">${gpu.vram}</span>
                    </div>
                    ` : ''}
                `).join('')}
            </div>
            ` : ''}

            <div class="system-info-section">
                <h3>Security</h3>
                <div class="system-info-row">
                    <span class="system-info-label">FileVault:</span>
                    <span class="system-info-value">${info.fileVault || 'Unknown'}</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Gatekeeper:</span>
                    <span class="system-info-value">${info.gatekeeperStatus || 'Unknown'}</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">System Integrity Protection:</span>
                    <span class="system-info-value">${info.sipStatus || 'Unknown'}</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Secure Boot:</span>
                    <span class="system-info-value">${info.secureBootLevel || 'Unknown'}</span>
                </div>
            </div>

            <div class="system-info-section">
                <h3>User Account</h3>
                <div class="system-info-row">
                    <span class="system-info-label">Current User:</span>
                    <span class="system-info-value">${info.currentUser || 'Unknown'}</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">User ID:</span>
                    <span class="system-info-value">${info.userInfo?.uid || 'N/A'}</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Group ID:</span>
                    <span class="system-info-value">${info.userInfo?.gid || 'N/A'}</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Home Directory:</span>
                    <span class="system-info-value">${info.homeDirectory || 'Unknown'}</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Shell:</span>
                    <span class="system-info-value">${info.shell || 'Unknown'}</span>
                </div>
            </div>

            <div class="system-info-section">
                <h3>Development Environment</h3>
                <div class="system-info-row">
                    <span class="system-info-label">Node.js:</span>
                    <span class="system-info-value">${info.nodeVersion || 'Not installed'}</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Electron:</span>
                    <span class="system-info-value">${process.versions && process.versions.electron ? process.versions.electron : 'N/A'}</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Chrome:</span>
                    <span class="system-info-value">${process.versions && process.versions.chrome ? process.versions.chrome : 'N/A'}</span>
                </div>
                ${info.xcodeVersion ? `
                <div class="system-info-row">
                    <span class="system-info-label">Xcode:</span>
                    <span class="system-info-value">${info.xcodeVersion}</span>
                </div>
                ` : ''}
                ${info.pythonVersion ? `
                <div class="system-info-row">
                    <span class="system-info-label">Python:</span>
                    <span class="system-info-value">${info.pythonVersion}</span>
                </div>
                ` : ''}
                ${info.gitVersion ? `
                <div class="system-info-row">
                    <span class="system-info-label">Git:</span>
                    <span class="system-info-value">${info.gitVersion}</span>
                </div>
                ` : ''}
            </div>

            ${info.brewPackages && info.brewPackages.length > 0 ? `
            <div class="system-info-section">
                <h3>Package Management</h3>
                <div class="system-info-row">
                    <span class="system-info-label">Homebrew Packages:</span>
                    <span class="system-info-value">${info.brewPackages.length} installed</span>
                </div>
                <div style="font-size: 10px; color: #666; margin-top: 8px;">
                    Recent: ${info.brewPackages.slice(0, 8).join(', ')}${info.brewPackages.length > 8 ? '...' : ''}
                </div>
            </div>
            ` : ''}

            <div class="system-info-section">
                <h3>Application Information</h3>
                <div class="system-info-row">
                    <span class="system-info-label">App Name:</span>
                    <span class="system-info-value">macOS Gateway Monitor</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Version:</span>
                    <span class="system-info-value">0.0.1</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Build Date:</span>
                    <span class="system-info-value">${new Date().toLocaleDateString()}</span>
                </div>
                <div class="system-info-row">
                    <span class="system-info-label">Admin Privileges:</span>
                    <span class="system-info-value">${info.hasAdminAccess ? 'Available' : 'Limited'}</span>
                </div>
            </div>
        `;
    }

    clearCache() {
        this.cachedInfo = null;
        this.lastFetch = 0;
    }
}

module.exports = SystemInfoService;
