/**
 * TabManager - Handles tab switching and content management
 */
class TabManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.currentTab = 'processes';
        this.tabs = ['processes', 'network', 'security', 'routing', 'interfaces', 'arp', 'dns'];
        this.refreshTimers = {};
    }

    init() {
        this.setupTabButtons();
        this.showTab('processes');
    }

    setupTabButtons() {
        const tabButtons = document.querySelectorAll('.tab');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = this.getTabNameFromButton(button);
                if (tabName) {
                    this.showTab(tabName);
                }
            });
        });
    }

    getTabNameFromButton(button) {
        const text = button.textContent.toLowerCase();
        return this.tabs.find(tab => text.includes(tab));
    }

    showTab(tabName) {
        if (!this.tabs.includes(tabName)) {
            console.error(`Invalid tab: ${tabName}`);
            return;
        }

        // Clear existing timers
        this.clearRefreshTimers();

        // Update tab buttons
        this.updateTabButtons(tabName);

        // Hide all content
        this.hideAllContent();

        // Show selected content
        this.showContent(tabName);

        // Update current tab
        this.currentTab = tabName;

        // Emit tab change event
        this.eventBus.emit('tab:changed', { tab: tabName });

        // Handle special tab logic
        this.handleTabSpecialLogic(tabName);
    }

    updateTabButtons(activeTab) {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
            const tabName = this.getTabNameFromButton(tab);
            if (tabName === activeTab) {
                tab.classList.add('active');
            }
        });
    }

    hideAllContent() {
        this.tabs.forEach(tab => {
            const content = document.getElementById(`${tab}-content`);
            if (content) {
                content.style.display = 'none';
            }
        });
    }

    showContent(tabName) {
        const content = document.getElementById(`${tabName}-content`);
        if (content) {
            content.style.display = 'block';
        }
    }

    handleTabSpecialLogic(tabName) {
        switch(tabName) {
            case 'security':
                this.eventBus.emit('security:tab:activated');
                break;
            case 'processes':
                this.eventBus.emit('processes:tab:activated');
                break;
            case 'network':
                this.eventBus.emit('network:tab:activated');
                break;
            default:
                this.eventBus.emit('generic:tab:activated', { tab: tabName });
        }
    }

    getCurrentTab() {
        return this.currentTab;
    }

    setRefreshTimer(tabName, callback, interval) {
        this.clearRefreshTimer(tabName);
        this.refreshTimers[tabName] = setInterval(callback, interval);
    }

    clearRefreshTimer(tabName) {
        if (this.refreshTimers[tabName]) {
            clearInterval(this.refreshTimers[tabName]);
            delete this.refreshTimers[tabName];
        }
    }

    clearRefreshTimers() {
        Object.keys(this.refreshTimers).forEach(tab => {
            this.clearRefreshTimer(tab);
        });
    }

    isTabActive(tabName) {
        return this.currentTab === tabName;
    }

    getTabInfo(tabName) {
        const tabInfo = {
            processes: {
                title: '📊 PROCESSES TAB',
                description: 'Real-time system process monitoring',
                tips: 'Green = System processes, Blue = User processes, Orange = High resource usage'
            },
            network: {
                title: '🌐 NETWORK TAB',
                description: 'Active network connections and sockets',
                tips: 'LISTEN = Service waiting for connections, ESTABLISHED = Active connection'
            },
            security: {
                title: '🔐 SECURITY TAB',
                description: 'System security analysis and configuration',
                tips: 'Green = Secure/Enabled, Red = Disabled/Risk, Orange = Third-party'
            },
            routing: {
                title: '🛣️ ROUTING TAB',
                description: 'Network routing table and gateway information',
                tips: 'Shows how your Mac routes network traffic to different destinations'
            },
            interfaces: {
                title: '🔌 INTERFACES TAB',
                description: 'Network interface configuration and status',
                tips: 'Green dot = Active, Red dot = Inactive, Shows all network adapters'
            },
            arp: {
                title: '🏠 ARP TAB',
                description: 'Address Resolution Protocol - local network neighbors',
                tips: 'Shows other devices on your local network'
            },
            dns: {
                title: '🌍 DNS TAB',
                description: 'Domain Name System configuration',
                tips: 'Shows how your Mac translates domain names to IP addresses'
            }
        };

        return tabInfo[tabName] || { title: 'Unknown Tab', description: '', tips: '' };
    }

    destroy() {
        this.clearRefreshTimers();
        this.eventBus.clear();
    }
}

module.exports = TabManager;
