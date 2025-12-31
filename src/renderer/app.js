/**
 * Main Application Bootstrap
 */
const { EventBus, EVENTS } = require('./components/EventBus');
const TabManager = require('./components/TabManager');
const DetailPanel = require('./components/DetailPanel');
const ProcessService = require('./services/ProcessService');
const NetworkService = require('./services/NetworkService');
const SecurityService = require('./services/SecurityService');
const SystemInfoService = require('./services/SystemInfoService');
const ProcessTable = require('./components/ProcessTable');
const formatters = require('./utils/formatters');
const { REFRESH_INTERVALS, THEMES } = require('./utils/constants');

class App {
    constructor() {
        this.eventBus = new EventBus();
        this.tabManager = new TabManager(this.eventBus);
        this.detailPanel = new DetailPanel();
        
        // Services
        this.processService = new ProcessService();
        this.networkService = new NetworkService();
        this.securityService = new SecurityService();
        this.systemInfoService = new SystemInfoService();
        
        // Components
        this.processTable = new ProcessTable(this.processService, formatters);
        
        // State
        this.autoRefresh = true;
        this.refreshInterval = REFRESH_INTERVALS.NORMAL;
        this.currentFilter = '';
        this.currentSort = 'cpu';
        this.isSearchActive = false;
        this.searchResults = [];
        
        this.setupEventListeners();
        this.setupGlobalFunctions();
    }

    async init() {
        try {
            // Initialize components
            this.tabManager.init();
            this.detailPanel.init();
            this.processTable.init('processes-list');
            
            // Load initial data
            await this.loadInitialData();
            
            // Setup auto-refresh
            this.setupAutoRefresh();
            
            // Load saved preferences
            this.loadPreferences();
            
            console.log('✅ App initialized successfully');
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showError('Application failed to initialize: ' + error.message);
        }
    }

    setupEventListeners() {
        // Tab change events
        this.eventBus.on(EVENTS.TAB_CHANGED, (data) => {
            this.handleTabChange(data.tab);
        });

        // Process selection events
        this.eventBus.on(EVENTS.PROCESS_SELECTED, (data) => {
            this.handleProcessSelection(data.pid);
        });

        // Security scan events
        this.eventBus.on(EVENTS.SECURITY_SCAN_COMPLETE, (data) => {
            this.handleSecurityScanComplete(data);
        });

        // Error events
        this.eventBus.on(EVENTS.ERROR_OCCURRED, (data) => {
            this.showError(data.message);
        });

        // UI Events
        this.setupUIEventListeners();
    }

    setupUIEventListeners() {
        // Auto-refresh toggle
        const autoRefreshCheckbox = document.getElementById('auto-refresh');
        if (autoRefreshCheckbox) {
            autoRefreshCheckbox.addEventListener('change', (e) => {
                this.autoRefresh = e.target.checked;
            });
        }

        // Refresh interval
        const refreshIntervalSelect = document.getElementById('refresh-interval');
        if (refreshIntervalSelect) {
            refreshIntervalSelect.addEventListener('change', (e) => {
                this.refreshInterval = parseInt(e.target.value);
                this.setupAutoRefresh();
            });
        }

        // Filter input
        const filterInput = document.getElementById('filter');
        if (filterInput) {
            filterInput.addEventListener('input', (e) => {
                this.currentFilter = e.target.value;
                
                if (!this.currentFilter.trim()) {
                    // Clear search when filter is empty
                    this.clearSearch();
                } else {
                    // Regular filter (not search mode)
                    if (!this.isSearchActive) {
                        this.refreshCurrentTab();
                    }
                }
            });
        }

        // Sort select
        const sortSelect = document.getElementById('sort-by');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.refreshCurrentTab();
            });
        }
    }

    setupGlobalFunctions() {
        // Make functions available globally for HTML onclick handlers
        window.showTab = (tabName) => this.tabManager.showTab(tabName);
        window.selectProcess = (pid) => this.selectProcess(pid);
        window.closeDetail = () => this.detailPanel.hide();
        window.toggleTheme = () => this.toggleTheme();
        window.exitApp = () => window.close();
        window.showSystemInfo = () => this.showSystemInfo();
        window.closeSystemInfo = () => this.closeSystemInfo();
        window.showRowDetail = (type, data) => this.detailPanel.show(type, data);
        window.performDetailedScan = () => this.performDetailedScan();
        window.showTabInfo = (tabName, event) => this.showTabInfo(tabName, event);
        window.showCommandSearch = (event) => this.showCommandSearch(event);
        window.exportSystemInfo = () => this.exportSystemInfo();
        window.clearSearch = () => this.clearSearch();
        window.requestNetworkPrivileges = () => this.requestNetworkPrivileges();
        window.toggleRoutingView = () => this.toggleRoutingView();
        window.toggleInterfaceView = () => this.toggleInterfaceView();
        window.toggleArpView = () => this.toggleArpView();
        window.toggleSecuritySection = (sectionId) => this.toggleSecuritySection(sectionId);
        window.performSecurityScan = () => this.performSecurityScan();
        window.toggleDnsView = () => this.toggleDnsView();
        window.showProcessTooltip = (event, processData, networkData) => this.showProcessTooltip(event, processData, networkData);
        window.hideProcessTooltip = () => this.hideProcessTooltip();
        window.showNetworkTooltip = (event, connectionData) => this.showNetworkTooltip(event, connectionData);
        window.hideNetworkTooltip = () => this.hideNetworkTooltip();
        window.updateScanInterval = () => this.updateScanInterval();
    }

    async refreshSearchResults() {
        if (!this.isSearchActive || !this.currentFilter) return;
        
        try {
            // Load fresh process data
            await this.processService.loadProcesses();
            
            // Filter to only processes that match the search
            this.searchResults = this.processService.processes.filter(proc => 
                proc.args.toLowerCase().includes(this.currentFilter.toLowerCase())
            );
            
            // Update display with refreshed search results
            this.processTable.renderSearchResults(this.searchResults, this.currentFilter, this.currentSort);
            
        } catch (error) {
            console.error('Error refreshing search results:', error);
        }
    }

    clearSearch() {
        this.isSearchActive = false;
        this.searchResults = [];
        this.currentFilter = '';
        
        const filterInput = document.getElementById('filter');
        if (filterInput) {
            filterInput.value = '';
        }
        
        // Hide clear button
        const clearBtn = document.getElementById('clear-search-btn');
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
        
        // Resume normal refresh
        this.refreshCurrentTab();
        
        // Show feedback
        this.showAlert('Search cleared - returned to live process view');
    }

    async loadInitialData() {
        try {
            await this.processService.loadProcesses();
            this.processTable.render(this.currentFilter, this.currentSort);
        } catch (error) {
            this.eventBus.emit(EVENTS.ERROR_OCCURRED, { message: error.message });
        }
    }

    setupAutoRefresh() {
        // Clear existing interval
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }

        // Setup new interval
        this.refreshTimer = setInterval(() => {
            if (this.autoRefresh) {
                if (this.isSearchActive) {
                    // Only refresh search results, don't reload all processes
                    this.refreshSearchResults();
                } else {
                    // Normal refresh
                    this.refreshCurrentTab();
                }
                this.updateTimestamp();
            }
        }, this.refreshInterval);
    }

    async refreshCurrentTab() {
        const currentTab = this.tabManager.getCurrentTab();
        
        try {
            switch(currentTab) {
                case 'processes':
                    await this.processTable.refresh(this.currentFilter, this.currentSort);
                    break;
                case 'network':
                    await this.refreshNetwork();
                    break;
                case 'security':
                    // Security has its own refresh logic
                    break;
                case 'routing':
                    await this.refreshRouting();
                    break;
                case 'interfaces':
                    await this.refreshInterfaces();
                    break;
                case 'arp':
                    await this.refreshArp();
                    break;
                case 'dns':
                    await this.refreshDns();
                    break;
            }
        } catch (error) {
            this.eventBus.emit(EVENTS.ERROR_OCCURRED, { message: error.message });
        }
    }

    async refreshNetwork() {
        const connections = await this.networkService.loadNetworkConnections();
        // Update network display (simplified for now)
        const networkList = document.getElementById('network-list');
        if (networkList) {
            networkList.innerHTML = this.renderNetworkConnections(connections);
        }
    }

    async refreshRouting() {
        const routingData = await this.networkService.loadRoutingTable();
        const routingFriendly = document.getElementById('routing-friendly');
        if (routingFriendly) {
            const routes = this.networkService.parseRoutingTable(routingData);
            routingFriendly.innerHTML = this.renderRoutingCards(routes);
        }
    }

    async refreshInterfaces() {
        const interfaceData = await this.networkService.loadInterfaces();
        const interfacesFriendly = document.getElementById('interfaces-friendly');
        if (interfacesFriendly) {
            const interfaces = this.networkService.parseInterfaces(interfaceData);
            interfacesFriendly.innerHTML = this.renderInterfaceCards(interfaces);
        }
    }

    async refreshArp() {
        const arpData = await this.networkService.loadArpTable();
        const arpFriendly = document.getElementById('arp-friendly');
        if (arpFriendly) {
            const arpEntries = this.networkService.parseArpTable(arpData);
            arpFriendly.innerHTML = this.renderArpCards(arpEntries);
        }
    }

    async refreshDns() {
        const dnsData = await this.networkService.loadDnsInfo();
        const dnsRaw = document.getElementById('dns-list');
        const dnsFriendly = document.getElementById('dns-friendly');
        
        if (dnsRaw) {
            dnsRaw.textContent = dnsData;
        }
        
        if (dnsFriendly) {
            const parsedDns = this.networkService.parseDnsInfo(dnsData);
            dnsFriendly.innerHTML = this.networkService.renderDnsFriendlyView(parsedDns);
        }
    }

    renderNetworkConnections(connections) {
        return `
            <div class="network-header-row">
                <div class="resizable-header">PROTO</div>
                <div class="resizable-header">LOCAL ADDRESS</div>
                <div class="resizable-header">FOREIGN ADDRESS</div>
                <div class="resizable-header">STATE</div>
                <div class="resizable-header">PROCESS</div>
            </div>
            ${connections.slice(0, 100).map(conn => `
                <div class="network-row clickable-row" onclick="showRowDetail('network', ${formatters.sanitizeForHTML(JSON.stringify(conn))})">
                    <div class="network-cell">${conn.proto}</div>
                    <div class="network-cell">${conn.local}</div>
                    <div class="network-cell">${conn.foreign}</div>
                    <div class="network-cell" title="${conn.stateDescription || 'Unknown state'}">${conn.state}</div>
                    <div class="network-cell" title="PID: ${conn.pid || 'N/A'}">${conn.process || 'unknown'}</div>
                </div>
            `).join('')}
        `;
    }

    renderRoutingCards(routes) {
        return `
            <h3>🛣️ Network Routes</h3>
            ${routes.map(route => `
                <div class="network-card clickable-row" onclick="showRowDetail('routing', ${formatters.sanitizeForHTML(JSON.stringify(route))})">
                    <h4>${route.type === 'default' ? '🌐 Default Gateway' : '🏠 Local Network'}</h4>
                    <div class="network-detail">
                        <span>Destination:</span>
                        <span>${route.destination}</span>
                    </div>
                    <div class="network-detail">
                        <span>Gateway:</span>
                        <span>${route.gateway}</span>
                    </div>
                </div>
            `).join('')}
        `;
    }

    renderInterfaceCards(interfaces) {
        return `
            <h3>🔌 Network Interfaces</h3>
            ${interfaces.map(iface => `
                <div class="network-card clickable-row" onclick="showRowDetail('interface', ${formatters.sanitizeForHTML(JSON.stringify(iface))})">
                    <h4>${iface.type} - ${iface.name}</h4>
                    <div class="network-detail">
                        <span>Status:</span>
                        <span>
                            <span class="status-indicator ${iface.isUp ? 'status-up' : 'status-down'}"></span>
                            ${iface.status}
                        </span>
                    </div>
                    ${iface.ip ? `
                        <div class="network-detail">
                            <span>IP:</span>
                            <span>${iface.ip}</span>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        `;
    }

    renderArpCards(arpEntries) {
        return `
            <h3>🏠 Network Neighbors</h3>
            ${arpEntries.map(arp => `
                <div class="network-card clickable-row" onclick="showRowDetail('arp', ${formatters.sanitizeForHTML(JSON.stringify(arp))})">
                    <h4>${arp.deviceType}</h4>
                    <div class="network-detail">
                        <span>IP:</span>
                        <span>${arp.ip}</span>
                    </div>
                    <div class="network-detail">
                        <span>MAC:</span>
                        <span>${arp.mac}</span>
                    </div>
                </div>
            `).join('')}
        `;
    }

    async handleTabChange(tabName) {
        console.log(`Tab changed to: ${tabName}`);
        
        // Clear search when switching to processes tab (Option 2)
        if (tabName === 'processes' && this.isSearchActive) {
            this.clearSearch();
            return; // clearSearch already calls refreshCurrentTab
        }
        
        await this.refreshCurrentTab();
    }

    async handleProcessSelection(pid) {
        try {
            this.processService.selectProcess(pid);
            const details = await this.processService.getProcessDetails(pid);
            this.detailPanel.show('process', details);
        } catch (error) {
            this.eventBus.emit(EVENTS.ERROR_OCCURRED, { message: error.message });
        }
    }

    handleSecurityScanComplete(data) {
        console.log('Security scan completed:', data);
    }

    async selectProcess(pid) {
        this.eventBus.emit(EVENTS.PROCESS_SELECTED, { pid });
    }

    toggleTheme() {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.eventBus.emit(EVENTS.THEME_CHANGED, { theme: newTheme });
    }

    async showSystemInfo() {
        try {
            const modal = document.getElementById('system-info-modal');
            const details = document.getElementById('system-info-details');
            
            if (modal && details) {
                // Render content first while modal is hidden
                details.innerHTML = 'Loading system information...';
                const systemInfo = await this.systemInfoService.getSystemInfo();
                details.innerHTML = this.systemInfoService.renderSystemInfo(systemInfo);
                
                // Show modal after content is ready
                modal.style.display = 'block';
            }
        } catch (error) {
            this.eventBus.emit(EVENTS.ERROR_OCCURRED, { message: error.message });
        }
    }

    showTabInfo(tabName, event) {
        event.stopPropagation();
        
        const tabInfos = {
            processes: 'Monitor running processes with CPU, memory, and network usage in real-time',
            network: 'View active network connections and bandwidth usage per process',
            security: 'Comprehensive security analysis including startup items, firewall, and system integrity',
            routing: 'Network routing table showing how traffic flows through your Mac',
            interfaces: 'Network interface configuration and status information',
            arp: 'Address Resolution Protocol table showing local network devices',
            dns: 'DNS server configuration with performance and privacy analysis'
        };
        
        const info = tabInfos[tabName] || 'Information about this tab';
        alert(info);
    }

    async showCommandSearch(event) {
        event.stopPropagation();
        
        try {
            // Create a simple input dialog
            const searchTerm = await this.showInputDialog('Search Commands', 'Enter search term for commands:\n(executable name, path, or arguments)');
            
            if (searchTerm && searchTerm.trim()) {
                console.log('🔍 Starting search for:', searchTerm.trim());
                
                const filterInput = document.getElementById('filter');
                if (filterInput) {
                    filterInput.value = searchTerm.trim();
                    this.currentFilter = searchTerm.trim();
                    this.isSearchActive = true;
                    
                    // Get initial search results
                    await this.processService.loadProcesses();
                    this.searchResults = this.processService.processes.filter(proc => 
                        proc.args.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    
                    console.log('🔍 Found search results:', this.searchResults.length);
                    
                    // Render search results
                    this.processTable.renderSearchResults(this.searchResults, this.currentFilter, this.currentSort);
                    
                    // Show clear button
                    const clearBtn = document.getElementById('clear-search-btn');
                    if (clearBtn) {
                        clearBtn.style.display = 'inline-block';
                    }
                    
                    // Show feedback
                    setTimeout(() => {
                        this.showAlert(`Found ${this.searchResults.length} processes matching "${searchTerm}". Auto-refresh active for search results only.`);
                    }, 100);
                } else {
                    console.error('Filter input not found');
                }
            }
        } catch (error) {
            console.error('Search failed:', error);
            this.showAlert('Search failed: ' + error.message);
        }
    }

    showInputDialog(title, message) {
        // Create modal dialog for input
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center;
            justify-content: center; z-index: 10000;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: var(--bg-primary); padding: 20px; border-radius: 8px;
            min-width: 300px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        dialog.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: var(--text-primary);">${title}</h3>
            <p style="margin: 0 0 15px 0; color: var(--text-secondary); white-space: pre-line;">${message}</p>
            <input type="text" id="dialog-input" style="width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary);">
            <div style="text-align: right;">
                <button id="dialog-cancel" style="margin-right: 10px; padding: 6px 12px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); border-radius: 4px; cursor: pointer;">Cancel</button>
                <button id="dialog-ok" style="padding: 6px 12px; border: none; background: var(--text-primary); color: var(--bg-primary); border-radius: 4px; cursor: pointer;">Search</button>
            </div>
        `;
        
        modal.appendChild(dialog);
        document.body.appendChild(modal);
        
        const input = dialog.querySelector('#dialog-input');
        input.focus();
        
        return new Promise((resolve) => {
            const cleanup = () => document.body.removeChild(modal);
            
            dialog.querySelector('#dialog-ok').onclick = () => {
                const value = input.value;
                cleanup();
                resolve(value);
            };
            
            dialog.querySelector('#dialog-cancel').onclick = () => {
                cleanup();
                resolve(null);
            };
            
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    const value = input.value;
                    cleanup();
                    resolve(value);
                } else if (e.key === 'Escape') {
                    cleanup();
                    resolve(null);
                }
            };
        });
    }

    showAlert(message) {
        // Simple alert replacement
        const alert = document.createElement('div');
        alert.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: var(--bg-tertiary);
            color: var(--text-primary); padding: 12px 20px; border-radius: 6px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2); z-index: 10000;
            border-left: 4px solid var(--text-primary);
        `;
        alert.textContent = message;
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentNode) {
                document.body.removeChild(alert);
            }
        }, 3000);
    }

    async requestNetworkPrivileges() {
        try {
            this.showAlert('Requesting admin privileges for network process information...');
            
            // Request admin privileges through IPC
            const { ipcRenderer } = require('electron');
            const granted = await ipcRenderer.invoke('request-admin-privileges');
            
            if (granted) {
                this.showAlert('Admin privileges granted! Refreshing network data...');
                await this.refreshNetwork();
            } else {
                this.showAlert('Admin privileges denied. Network connections will show without process information.');
            }
        } catch (error) {
            console.error('Failed to request admin privileges:', error);
            this.showAlert('Failed to request admin privileges: ' + error.message);
        }
    }

    async exportSystemInfo() {
        try {
            const systemInfo = await this.systemInfoService.getSystemInfo();
            const exportData = {
                exportedAt: new Date().toISOString(),
                appName: 'macOS Gateway Monitor',
                appVersion: '0.0.1',
                systemInfo: systemInfo
            };
            
            const jsonString = JSON.stringify(exportData, null, 2);
            
            // Copy to clipboard
            await navigator.clipboard.writeText(jsonString);
            this.showAlert('System information exported to clipboard as JSON!');
            
        } catch (error) {
            console.error('Export failed:', error);
            this.showAlert('Export failed: ' + error.message);
        }
    }

    closeSystemInfo() {
        const modal = document.getElementById('system-info-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async performDetailedScan() {
        console.log('🔬 Detailed security scan started...');
        
        // Update status immediately
        const statusDiv = document.getElementById('security-status');
        if (statusDiv) {
            statusDiv.innerHTML = '<div>🔬 Performing detailed security analysis...</div>';
        }
        
        try {
            const results = await this.securityService.performDetailedScan();
            this.eventBus.emit(EVENTS.SECURITY_SCAN_COMPLETE, results);
            
            // Update security display with detailed results
            const detailsDiv = document.getElementById('security-details');
            
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div>✅ Detailed analysis completed at ${new Date().toLocaleTimeString()}</div>
                    <div style="color: #666; font-size: 10px;">Detailed view with expandable sections</div>
                `;
            }
            
            if (detailsDiv && results) {
                detailsDiv.innerHTML = this.renderSecurityResults(results);
            }
        } catch (error) {
            console.error('Detailed security scan failed:', error);
            if (statusDiv) {
                statusDiv.innerHTML = `<div>❌ Detailed analysis failed: ${error.message}</div>`;
            }
            this.eventBus.emit(EVENTS.ERROR_OCCURRED, { message: error.message });
        }
    }

    async performSecurityScan() {
        try {
            const results = await this.securityService.performScan();
            this.eventBus.emit(EVENTS.SECURITY_SCAN_COMPLETE, results);
            
            // Update security display
            const statusDiv = document.getElementById('security-status');
            const detailsDiv = document.getElementById('security-details');
            
            if (statusDiv) {
                statusDiv.innerHTML = `<div>✅ Security scan completed at ${new Date().toLocaleTimeString()}</div>`;
            }
            
            if (detailsDiv && results) {
                detailsDiv.innerHTML = this.renderSecurityResults(results);
            }
        } catch (error) {
            this.eventBus.emit(EVENTS.ERROR_OCCURRED, { message: error.message });
        }
    }

    renderSecurityResults(results) {
        return `
            <div class="dns-friendly-card clickable-row" onclick="showRowDetail('security', ${JSON.stringify({type: 'startup', data: results.startupItems}).replace(/"/g, '&quot;')})">
                <h4>🚀 STARTUP ITEMS</h4>
                <div class="dns-detail">
                    <span>System Daemons:</span>
                    <span>${results.startupItems?.systemDaemons?.length || 0}</span>
                </div>
                <div class="dns-detail">
                    <span>User Agents:</span>
                    <span>${results.startupItems?.userAgents?.length || 0}</span>
                </div>
                <div class="dns-detail">
                    <span>Login Items:</span>
                    <span>${results.startupItems?.loginItems?.length || 0}</span>
                </div>
                <div class="dns-explanation">
                    Programs that start automatically when your Mac boots or when you log in. Click to see detailed analysis and security recommendations.
                </div>
            </div>
            
            <div class="dns-friendly-card clickable-row" onclick="showRowDetail('security', ${JSON.stringify({type: 'gatekeeper', data: results.gatekeeper}).replace(/"/g, '&quot;')})">
                <h4>🛡️ GATEKEEPER</h4>
                <div class="dns-detail">
                    <span>Status:</span>
                    <span>${results.gatekeeper?.enabled ? '✅ ENABLED' : '❌ DISABLED'}</span>
                </div>
                <div class="dns-detail">
                    <span>Details:</span>
                    <span>${results.gatekeeper?.status || 'Unknown'}</span>
                </div>
                <div class="dns-explanation">
                    Apple's security feature that ensures only trusted software runs on your Mac. Click for detailed security analysis.
                </div>
            </div>
            
            <div class="dns-friendly-card clickable-row" onclick="showRowDetail('security', ${JSON.stringify({type: 'firewall', data: results.firewall}).replace(/"/g, '&quot;')})">
                <h4>🔥 FIREWALL</h4>
                <div class="dns-detail">
                    <span>Application Firewall:</span>
                    <span>${results.firewall?.applicationFirewall?.enabled ? '✅ ENABLED' : '❌ DISABLED'}</span>
                </div>
                <div class="dns-detail">
                    <span>State:</span>
                    <span>${results.firewall?.applicationFirewall?.state || 'Unknown'}</span>
                </div>
                <div class="dns-detail">
                    <span>Rules:</span>
                    <span>${results.firewall?.rules?.length || 0} configured</span>
                </div>
                <div class="dns-explanation">
                    Network protection that controls which applications can accept incoming connections. Click for firewall configuration details.
                </div>
            </div>
            
            <div class="dns-friendly-card clickable-row" onclick="showRowDetail('security', ${JSON.stringify({type: 'sip', data: results.sip}).replace(/"/g, '&quot;')})">
                <h4>🔒 SYSTEM INTEGRITY PROTECTION</h4>
                <div class="dns-detail">
                    <span>Status:</span>
                    <span>${results.sip?.enabled ? '✅ ENABLED' : '❌ DISABLED'}</span>
                </div>
                <div class="dns-detail">
                    <span>Details:</span>
                    <span>${results.sip?.status || 'Unknown'}</span>
                </div>
                <div class="dns-explanation">
                    Apple's security technology that protects system files and processes from modification. Click for detailed security impact.
                </div>
            </div>
            
            <div class="dns-friendly-card clickable-row" onclick="showRowDetail('security', ${JSON.stringify({type: 'kexts', data: results.kernelExtensions}).replace(/"/g, '&quot;')})">
                <h4>⚙️ KERNEL EXTENSIONS</h4>
                <div class="dns-detail">
                    <span>Loaded:</span>
                    <span>${Array.isArray(results.kernelExtensions) ? results.kernelExtensions.length : 
                        (results.kernelExtensions?.error ? `Error: ${results.kernelExtensions.error}` : '0')}</span>
                </div>
                <div class="dns-explanation">
                    Low-level system drivers and extensions that run with kernel privileges. Click to see which extensions are loaded and their security implications.
                </div>
            </div>

            ${results.policies ? `
            <div class="dns-friendly-card clickable-row" onclick="showRowDetail('security', ${JSON.stringify({type: 'policies', data: results.policies}).replace(/"/g, '&quot;')})">
                <h4>📋 SECURITY POLICIES</h4>
                <div class="dns-detail">
                    <span>Active Policies:</span>
                    <span>${Object.keys(results.policies).length}</span>
                </div>
                <div class="dns-detail">
                    <span>FileVault:</span>
                    <span>${results.policies.fileVault || 'Unknown'}</span>
                </div>
                <div class="dns-explanation">
                    System security policies and configurations that control Mac security behavior. Click for detailed policy analysis.
                </div>
            </div>
            ` : ''}

            ${results.applications ? `
            <div class="dns-friendly-card clickable-row" onclick="showRowDetail('security', ${JSON.stringify({type: 'applications', data: results.applications}).replace(/"/g, '&quot;')})">
                <h4>📱 INSTALLED APPLICATIONS</h4>
                <div class="dns-detail">
                    <span>Total Apps:</span>
                    <span>${results.applications.length || 0}</span>
                </div>
                <div class="dns-detail">
                    <span>System Apps:</span>
                    <span>${results.applications.filter(app => app.isSystem).length || 0}</span>
                </div>
                <div class="dns-detail">
                    <span>User Apps:</span>
                    <span>${results.applications.filter(app => !app.isSystem).length || 0}</span>
                </div>
                <div class="dns-explanation">
                    All applications installed on your Mac with security analysis. Click to see app permissions and security status.
                </div>
            </div>
            ` : ''}

            ${results.configurations ? `
            <div class="dns-friendly-card clickable-row" onclick="showRowDetail('security', ${JSON.stringify({type: 'configurations', data: results.configurations}).replace(/"/g, '&quot;')})">
                <h4>⚙️ SECURITY CONFIGURATIONS</h4>
                <div class="dns-detail">
                    <span>Config Files:</span>
                    <span>${results.configurations.files?.length || 0}</span>
                </div>
                <div class="dns-detail">
                    <span>Permissions:</span>
                    <span>${results.configurations.permissions || 'Standard'}</span>
                </div>
                <div class="dns-explanation">
                    System configuration files and settings that affect Mac security. Click for detailed configuration analysis.
                </div>
            </div>
            ` : ''}

            ${results.fileDescriptors ? `
            <div class="dns-friendly-card clickable-row" onclick="showRowDetail('security', ${JSON.stringify({type: 'fileDescriptors', data: results.fileDescriptors}).replace(/"/g, '&quot;')})">
                <h4>📁 FILE DESCRIPTORS</h4>
                <div class="dns-detail">
                    <span>Open Files:</span>
                    <span>${results.fileDescriptors.openFiles || 0}</span>
                </div>
                <div class="dns-detail">
                    <span>Network Sockets:</span>
                    <span>${results.fileDescriptors.networkSockets || 0}</span>
                </div>
                <div class="dns-explanation">
                    Currently open file handles and network connections by system processes. Click for detailed file access analysis.
                </div>
            </div>
            ` : ''}
        `;
    }

    showProcessTooltip(event, processData, networkData) {
        // Simple tooltip implementation - can be enhanced later
        console.log('Process tooltip for PID:', processData.pid);
    }

    hideProcessTooltip() {
        // Hide tooltip implementation
        const tooltip = document.getElementById('process-tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
    }

    showNetworkTooltip(event, connectionData) {
        // Simple network tooltip implementation
        console.log('Network tooltip for:', connectionData.proto);
    }

    hideNetworkTooltip() {
        // Hide network tooltip implementation
        const tooltip = document.getElementById('process-tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
    }

    toggleDnsView() {
        const friendly = document.getElementById('dns-friendly');
        const raw = document.getElementById('dns-list');
        
        if (friendly && raw) {
            if (friendly.style.display === 'none') {
                friendly.style.display = 'block';
                raw.style.display = 'none';
            } else {
                friendly.style.display = 'none';
                raw.style.display = 'block';
            }
        }
    }

    updateScanInterval() {
        const input = document.getElementById('scan-interval');
        if (input) {
            const newInterval = parseInt(input.value);
            if (this.securityService.setScanInterval(newInterval)) {
                console.log(`Scan interval updated to ${newInterval} seconds`);
            } else {
                alert('Invalid interval. Must be between 10 and 600 seconds.');
            }
        }
    }

    updateScanInterval() {
        const input = document.getElementById('scan-interval');
        if (input) {
            const newInterval = parseInt(input.value);
            if (this.securityService.setScanInterval(newInterval)) {
                console.log(`Scan interval updated to ${newInterval} seconds`);
            } else {
                alert('Invalid interval. Must be between 10 and 600 seconds.');
            }
        }
    }

    toggleRoutingView() {
        const friendly = document.getElementById('routing-friendly');
        const raw = document.getElementById('routing-list');
        
        if (friendly && raw) {
            if (friendly.style.display === 'none') {
                friendly.style.display = 'block';
                raw.style.display = 'none';
            } else {
                friendly.style.display = 'none';
                raw.style.display = 'block';
                this.loadRawRoutingData();
            }
        }
    }

    toggleInterfaceView() {
        const friendly = document.getElementById('interfaces-friendly');
        const raw = document.getElementById('interfaces-list');
        
        if (friendly && raw) {
            if (friendly.style.display === 'none') {
                friendly.style.display = 'block';
                raw.style.display = 'none';
            } else {
                friendly.style.display = 'none';
                raw.style.display = 'block';
                this.loadRawInterfaceData();
            }
        }
    }

    toggleArpView() {
        const friendly = document.getElementById('arp-friendly');
        const raw = document.getElementById('arp-list');
        
        if (friendly && raw) {
            if (friendly.style.display === 'none') {
                friendly.style.display = 'block';
                raw.style.display = 'none';
            } else {
                friendly.style.display = 'none';
                raw.style.display = 'block';
                this.loadRawArpData();
            }
        }
    }

    async loadRawRoutingData() {
        try {
            const routingData = await this.networkService.loadRoutingTable();
            const rawElement = document.getElementById('routing-list');
            if (rawElement) {
                rawElement.textContent = routingData;
            }
        } catch (error) {
            console.error('Failed to load raw routing data:', error);
        }
    }

    async loadRawInterfaceData() {
        try {
            const interfaceData = await this.networkService.loadInterfaces();
            const rawElement = document.getElementById('interfaces-list');
            if (rawElement) {
                rawElement.textContent = interfaceData;
            }
        } catch (error) {
            console.error('Failed to load raw interface data:', error);
        }
    }

    async loadRawArpData() {
        try {
            const arpData = await this.networkService.loadArpTable();
            const rawElement = document.getElementById('arp-list');
            if (rawElement) {
                rawElement.textContent = arpData;
            }
        } catch (error) {
            console.error('Failed to load raw ARP data:', error);
        }
    }

    toggleSecuritySection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            if (section.style.display === 'none') {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        }
    }

    updateTimestamp() {
        const timestampElement = document.getElementById('update-time');
        if (timestampElement) {
            timestampElement.textContent = new Date().toLocaleTimeString();
        }
    }

    loadPreferences() {
        // Load theme
        const savedTheme = localStorage.getItem('theme') || THEMES.DARK;
        document.body.setAttribute('data-theme', savedTheme);

        // Load scan interval
        const savedInterval = localStorage.getItem('securityScanInterval');
        if (savedInterval) {
            this.securityService.setScanInterval(parseInt(savedInterval));
        }
    }

    showError(message) {
        console.error('App Error:', message);
        // Could show toast notification or error modal here
    }

    destroy() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        this.tabManager.destroy();
        this.securityService.stopAutoScan();
    }
}

// Global function for file descriptor view toggle
function toggleFileView(viewType) {
    const filesView = document.getElementById('files-view');
    const socketsView = document.getElementById('sockets-view');
    const filesBtn = document.getElementById('files-btn');
    const socketsBtn = document.getElementById('sockets-btn');
    const filesExplanation = document.getElementById('files-explanation');
    const socketsExplanation = document.getElementById('sockets-explanation');
    
    if (viewType === 'files') {
        filesView.style.display = 'block';
        socketsView.style.display = 'none';
        filesBtn.style.background = 'var(--text-secondary)';
        filesBtn.style.color = 'var(--bg-primary)';
        socketsBtn.style.background = 'var(--bg-tertiary)';
        socketsBtn.style.color = 'var(--text-primary)';
        filesExplanation.style.display = 'block';
        socketsExplanation.style.display = 'none';
    } else {
        filesView.style.display = 'none';
        socketsView.style.display = 'block';
        filesBtn.style.background = 'var(--bg-tertiary)';
        filesBtn.style.color = 'var(--text-primary)';
        socketsBtn.style.background = 'var(--text-secondary)';
        socketsBtn.style.color = 'var(--bg-primary)';
        filesExplanation.style.display = 'none';
        socketsExplanation.style.display = 'block';
    }
}

// Initialize app when DOM is loaded (only in browser environment)
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        window.app = new App();
        await window.app.init();
    });
}

module.exports = App;
