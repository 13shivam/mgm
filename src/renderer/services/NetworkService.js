/**
 * NetworkService - Handles all network-related business logic
 */
class NetworkService {
    constructor() {
        this.connections = [];
        this.routingData = null;
        this.interfaceData = null;
        this.arpData = null;
        this.dnsData = null;
    }

    async loadNetworkConnections() {
        const { ipcRenderer } = require('electron');
        try {
            this.connections = await ipcRenderer.invoke('get-network');
            return this.connections;
        } catch (error) {
            throw new Error(`Failed to load network connections: ${error.message}`);
        }
    }

    async loadRoutingTable() {
        const { ipcRenderer } = require('electron');
        try {
            this.routingData = await ipcRenderer.invoke('get-routing');
            return this.routingData;
        } catch (error) {
            throw new Error(`Failed to load routing table: ${error.message}`);
        }
    }

    async loadInterfaces() {
        const { ipcRenderer } = require('electron');
        try {
            this.interfaceData = await ipcRenderer.invoke('get-interfaces');
            return this.interfaceData;
        } catch (error) {
            throw new Error(`Failed to load interfaces: ${error.message}`);
        }
    }

    async loadArpTable() {
        const { ipcRenderer } = require('electron');
        try {
            this.arpData = await ipcRenderer.invoke('get-arp');
            return this.arpData;
        } catch (error) {
            throw new Error(`Failed to load ARP table: ${error.message}`);
        }
    }

    async loadDnsInfo() {
        const { ipcRenderer } = require('electron');
        try {
            this.dnsData = await ipcRenderer.invoke('get-dns');
            return this.dnsData;
        } catch (error) {
            throw new Error(`Failed to load DNS info: ${error.message}`);
        }
    }

    parseRoutingTable(output) {
        const lines = output.split('\n');
        const routes = [];
        
        lines.forEach(line => {
            if (line.includes('default') || line.includes('0.0.0.0')) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 2) {
                    routes.push({
                        type: 'default',
                        destination: 'default',
                        gateway: parts[1],
                        interface: parts[parts.length - 1]
                    });
                }
            } else if (line.includes('192.168') || line.includes('10.') || line.includes('172.')) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 2) {
                    routes.push({
                        type: 'local',
                        destination: parts[0],
                        gateway: parts[1],
                        interface: parts[parts.length - 1]
                    });
                }
            }
        });
        
        return routes;
    }

    parseInterfaces(output) {
        const interfaces = output.split(/^(\w+\d*): /m).filter(Boolean);
        const parsedInterfaces = [];
        
        for (let i = 0; i < interfaces.length; i += 2) {
            const name = interfaces[i];
            const details = interfaces[i + 1] || '';
            
            if (!name || !details) continue;
            
            const isUp = details.includes('UP');
            const isLoopback = details.includes('LOOPBACK');
            const ipMatch = details.match(/inet (\d+\.\d+\.\d+\.\d+)/);
            const mtuMatch = details.match(/mtu (\d+)/);
            
            let interfaceType = '🔌 Network';
            if (isLoopback) interfaceType = '🔄 Loopback';
            else if (name.includes('en')) interfaceType = '📡 Ethernet/WiFi';
            else if (name.includes('utun')) interfaceType = '🔒 VPN Tunnel';
            
            parsedInterfaces.push({
                name: name,
                type: interfaceType,
                status: isUp ? 'UP' : 'DOWN',
                ip: ipMatch ? ipMatch[1] : null,
                mtu: mtuMatch ? mtuMatch[1] : null,
                isUp: isUp
            });
        }
        
        return parsedInterfaces;
    }

    parseArpTable(output) {
        const lines = output.split('\n');
        const arpEntries = [];
        
        lines.forEach(line => {
            const match = line.match(/\((\d+\.\d+\.\d+\.\d+)\) at ([a-f0-9:]+)/);
            if (match) {
                const ip = match[1];
                const mac = match[2];
                let deviceType = '💻 Device';
                
                if (ip.endsWith('.1')) deviceType = '🌐 Router/Gateway';
                else if (ip.includes('192.168.1.')) deviceType = '🏠 Local Device';
                
                arpEntries.push({
                    ip: ip,
                    mac: mac,
                    deviceType: deviceType
                });
            }
        });
        
        return arpEntries;
    }

    parseDnsInfo(output) {
        const lines = output.split('\n');
        const dnsInfo = {
            nameservers: [],
            searchDomains: [],
            resolverConfig: [],
            other: []
        };
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;
            
            if (trimmed.startsWith('nameserver')) {
                const server = trimmed.split(/\s+/)[1];
                if (server) {
                    dnsInfo.nameservers.push({
                        ip: server,
                        type: this.getDnsServerType(server)
                    });
                }
            } else if (trimmed.startsWith('search') || trimmed.startsWith('domain')) {
                const domains = trimmed.split(/\s+/).slice(1);
                dnsInfo.searchDomains.push(...domains);
            } else if (trimmed.includes('resolver') || trimmed.includes('config')) {
                dnsInfo.resolverConfig.push(trimmed);
            } else {
                dnsInfo.other.push(trimmed);
            }
        });
        
        return dnsInfo;
    }

    getDnsServerType(ip) {
        // Common DNS server identification
        const knownServers = {
            '8.8.8.8': 'Google DNS',
            '8.8.4.4': 'Google DNS',
            '1.1.1.1': 'Cloudflare DNS',
            '1.0.0.1': 'Cloudflare DNS',
            '208.67.222.222': 'OpenDNS',
            '208.67.220.220': 'OpenDNS',
            '9.9.9.9': 'Quad9 DNS',
            '149.112.112.112': 'Quad9 DNS'
        };
        
        if (knownServers[ip]) {
            return knownServers[ip];
        }
        
        // Check for common patterns
        if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
            return 'Local Router/Gateway';
        }
        
        if (ip.startsWith('127.')) {
            return 'Local System';
        }
        
        return 'ISP/Custom DNS';
    }

    renderDnsFriendlyView(dnsInfo) {
        let html = '<h3>DNS Configuration</h3>';
        
        // DNS Servers
        if (dnsInfo.nameservers.length > 0) {
            html += `
                <div class="dns-friendly-card clickable-row" onclick="showRowDetail('dns', ${JSON.stringify({type: 'nameservers', data: dnsInfo.nameservers}).replace(/"/g, '&quot;')})">
                    <h4>DNS Servers (${dnsInfo.nameservers.length})</h4>
                    ${dnsInfo.nameservers.map(server => `
                        <div class="dns-detail">
                            <span>Server:</span>
                            <span>${server.ip}</span>
                        </div>
                        <div class="dns-detail">
                            <span>Provider:</span>
                            <span>${server.type}</span>
                        </div>
                    `).join('')}
                    <div class="dns-explanation">
                        DNS servers translate domain names (like google.com) into IP addresses. Your system queries these servers to resolve web addresses.
                    </div>
                </div>
            `;
        }
        
        // Search Domains
        if (dnsInfo.searchDomains.length > 0) {
            html += `
                <div class="dns-friendly-card clickable-row" onclick="showRowDetail('dns', ${JSON.stringify({type: 'search', data: dnsInfo.searchDomains}).replace(/"/g, '&quot;')})">
                    <h4>Search Domains (${dnsInfo.searchDomains.length})</h4>
                    ${dnsInfo.searchDomains.map(domain => `
                        <div class="dns-detail">
                            <span>Domain:</span>
                            <span>${domain}</span>
                        </div>
                    `).join('')}
                    <div class="dns-explanation">
                        Search domains are automatically appended to incomplete hostnames. For example, typing "server" becomes "server.${dnsInfo.searchDomains[0] || 'domain.com'}".
                    </div>
                </div>
            `;
        }
        
        // Resolver Configuration
        if (dnsInfo.resolverConfig.length > 0) {
            html += `
                <div class="dns-friendly-card clickable-row" onclick="showRowDetail('dns', ${JSON.stringify({type: 'resolver', data: dnsInfo.resolverConfig}).replace(/"/g, '&quot;')})">
                    <h4>Resolver Configuration</h4>
                    ${dnsInfo.resolverConfig.slice(0, 3).map(config => `
                        <div class="dns-detail">
                            <span>Config:</span>
                            <span>${config.length > 40 ? config.substring(0, 40) + '...' : config}</span>
                        </div>
                    `).join('')}
                    <div class="dns-explanation">
                        Resolver configuration controls how DNS queries are processed, including timeouts, retry attempts, and query methods.
                    </div>
                </div>
            `;
        }
        
        // DNS Performance Info
        html += `
            <div class="dns-friendly-card">
                <h4>DNS Performance Tips</h4>
                <div class="dns-explanation">
                    <strong>Fast DNS Servers:</strong> Google (8.8.8.8), Cloudflare (1.1.1.1), Quad9 (9.9.9.9)<br>
                    <strong>Privacy-Focused:</strong> Quad9 blocks malicious domains, Cloudflare doesn't log queries<br>
                    <strong>Local Cache:</strong> Your system caches DNS responses to improve performance
                </div>
            </div>
        `;
        
        return html || '<div>No DNS configuration found</div>';
    }
}

module.exports = NetworkService;
