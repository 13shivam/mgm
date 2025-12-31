// Import constants for centralized limit management
const { PROCESS_LIMITS } = require('./utils/constants');

// Row detail functions
window.showRowDetail = function(type, data) {
    const detailPanel = document.getElementById('detail-panel');
    const detailContent = document.getElementById('detail-content');
    
    if (!detailPanel || !detailContent) return;
    
    detailPanel.style.display = 'block';
    
    switch(type) {
        case 'network':
            showNetworkRowDetail(data, detailContent);
            break;
        case 'security':
            showSecurityRowDetail(data, detailContent);
            break;
        case 'routing':
            showRoutingRowDetail(data, detailContent);
            break;
        case 'interface':
            showInterfaceRowDetail(data, detailContent);
            break;
        case 'arp':
            showArpRowDetail(data, detailContent);
            break;
        default:
            detailContent.innerHTML = '<div>No details available</div>';
    }
};

function showNetworkRowDetail(conn, container) {
    let connType = 'Unknown Connection';
    let explanation = '';
    let securityInfo = '';
    
    if (conn.proto.includes('tcp')) {
        connType = 'TCP Connection';
        explanation = 'TCP (Transmission Control Protocol) is a reliable, connection-oriented protocol. It ensures data arrives in order and without errors. Commonly used for web browsing, email, file transfers, and most internet applications.';
        securityInfo = 'TCP connections are generally secure for encrypted protocols (HTTPS, FTPS). Unencrypted TCP can be intercepted.';
    } else if (conn.proto.includes('udp')) {
        connType = 'UDP Connection';
        explanation = 'UDP (User Datagram Protocol) is a fast, connectionless protocol. It sends data without guaranteeing delivery or order. Used for streaming, gaming, DNS queries, and real-time applications where speed matters more than reliability.';
        securityInfo = 'UDP is faster but less secure than TCP. Often used for internal network communication and time-sensitive applications.';
    } else if (conn.proto.includes('unix')) {
        connType = 'Unix Socket';
        explanation = 'Unix sockets enable communication between processes on the same machine. They are faster than network sockets and commonly used by system services and applications for inter-process communication.';
        securityInfo = 'Unix sockets are generally secure as they only work locally on your machine and respect file system permissions.';
    }
    
    let stateExplanation = '';
    switch(conn.state) {
        case 'LISTEN':
            stateExplanation = 'This service is waiting for incoming connections. Your computer is offering a service that other devices can connect to.';
            break;
        case 'ESTABLISHED':
            stateExplanation = 'This is an active, working connection between your computer and another device or service.';
            break;
        case 'CLOSE_WAIT':
            stateExplanation = 'The connection is being closed. One side has finished sending data and is waiting for the other side to close.';
            break;
        case 'TIME_WAIT':
            stateExplanation = 'The connection has been closed but the system is waiting to ensure all data was received.';
            break;
        default:
            stateExplanation = 'The connection is in a transitional state.';
    }
    
    container.innerHTML = `
        <div class="detail-header">
            <div class="detail-title">🌐 Network Connection Details</div>
            <button class="close-detail" onclick="closeDetail()">✕</button>
        </div>
        
        <div class="detail-section">
            <div class="detail-row">
                <span class="detail-label">Connection Type:</span>
                <span class="detail-value">${connType}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Protocol:</span>
                <span class="detail-value">${conn.proto}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">State:</span>
                <span class="detail-value">${conn.state}</span>
            </div>
            <div class="detail-explanation">${explanation}</div>
        </div>
        
        <div class="detail-section">
            <div class="detail-row">
                <span class="detail-label">Local Address:</span>
                <span class="detail-value">${conn.local}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Remote Address:</span>
                <span class="detail-value">${conn.foreign}</span>
            </div>
            <div class="detail-explanation">Local address is your machine. Remote address is the other endpoint you're communicating with.</div>
        </div>
        
        <div class="detail-section">
            <div class="detail-row">
                <span class="detail-label">Connection State:</span>
                <span class="detail-value">${conn.state}</span>
            </div>
            <div class="detail-explanation">${stateExplanation}</div>
        </div>
        
        <div class="detail-section">
            <div class="detail-row">
                <span class="detail-label">Security Level:</span>
                <span class="detail-value">${conn.proto.includes('tcp') ? 'Medium' : conn.proto.includes('unix') ? 'High' : 'Low'}</span>
            </div>
            <div class="detail-explanation">${securityInfo}</div>
        </div>
    `;
}

function showSecurityRowDetail(item, container) {
    let explanation = '';
    let securityLevel = 'Medium';
    let recommendations = '';
    
    if (item.category === 'systemDaemons') {
        explanation = 'System daemons are background services that start automatically when your Mac boots. They handle essential system functions like networking, security, and hardware management.';
        securityLevel = item.flags?.includes('THIRD_PARTY') ? 'Low' : 'High';
        recommendations = item.flags?.includes('THIRD_PARTY') ? 
            'Third-party system daemons should be reviewed carefully. Only install from trusted sources.' :
            'System daemons are generally safe and necessary for proper macOS operation.';
    } else if (item.category === 'userAgents') {
        explanation = 'User agents are programs that start automatically when you log in. They typically provide user-facing services like menu bar apps, background sync, or system utilities.';
        securityLevel = item.flags?.includes('THIRD_PARTY') ? 'Medium' : 'High';
        recommendations = 'Review user agents periodically. Disable any you don\'t recognize or need to improve startup performance and security.';
    }
    
    container.innerHTML = `
        <div class="detail-header">
            <div class="detail-title">🔐 Startup Item Details</div>
            <button class="close-detail" onclick="closeDetail()">✕</button>
        </div>
        
        <div class="detail-section">
            <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${item.name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Category:</span>
                <span class="detail-value">${item.category === 'systemDaemons' ? 'System Daemon' : 'User Agent'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${item.running ? '🟢 Running' : '⚫ Not Running'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Security Level:</span>
                <span class="detail-value">${securityLevel}</span>
            </div>
            <div class="detail-explanation">${explanation}</div>
        </div>
        
        <div class="detail-section">
            <div class="detail-row">
                <span class="detail-label">Path:</span>
                <span class="detail-value" style="word-break: break-all;">${item.path}</span>
            </div>
            <div class="detail-explanation">This is the location of the program file on your system.</div>
        </div>
        
        ${item.flags?.length > 0 ? `
        <div class="detail-section">
            <div class="detail-row">
                <span class="detail-label">Security Flags:</span>
                <span class="detail-value">${item.flags.join(', ')}</span>
            </div>
            <div class="detail-explanation">
                ${item.flags.includes('THIRD_PARTY') ? 
                    'THIRD_PARTY indicates this is not an Apple-provided component.' : 
                    'These flags indicate the security characteristics of this item.'}
            </div>
        </div>
        ` : ''}
        
        <div class="detail-section">
            <div class="detail-row">
                <span class="detail-label">Recommendations:</span>
            </div>
            <div class="detail-explanation">${recommendations}</div>
        </div>
    `;
}

function showRoutingRowDetail(route, container) {
    let routeType = 'Network Route';
    let explanation = '';
    
    if (route.destination === 'default' || route.destination === '0.0.0.0') {
        routeType = 'Default Gateway';
        explanation = 'This is your default gateway - the router that handles internet traffic and connections to other networks. All traffic that doesn\'t match specific routes goes through here.';
    } else if (route.destination.includes('192.168') || route.destination.includes('10.') || route.destination.includes('172.')) {
        routeType = 'Local Network Route';
        explanation = 'This route handles traffic to devices on your local network (like other computers, printers, or smart devices in your home or office).';
    } else {
        routeType = 'Specific Route';
        explanation = 'This is a specific route for particular network destinations, often used for VPNs or special network configurations.';
    }
    
    container.innerHTML = `
        <div class="detail-header">
            <div class="detail-title">🛣️ Network Route Details</div>
            <button class="close-detail" onclick="closeDetail()">✕</button>
        </div>
        
        <div class="detail-section">
            <div class="detail-row">
                <span class="detail-label">Route Type:</span>
                <span class="detail-value">${routeType}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Destination:</span>
                <span class="detail-value">${route.destination || 'Unknown'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Gateway:</span>
                <span class="detail-value">${route.gateway || 'Unknown'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Interface:</span>
                <span class="detail-value">${route.interface || 'Unknown'}</span>
            </div>
            <div class="detail-explanation">${explanation}</div>
        </div>
        
        <div class="detail-section">
            <div class="detail-explanation">
                <strong>How it works:</strong> When your computer needs to send data to ${route.destination === 'default' ? 'any internet address' : 'this specific network'}, 
                it sends the data through ${route.gateway} using the ${route.interface} network interface.
            </div>
        </div>
    `;
}

function showInterfaceRowDetail(iface, container) {
    let interfaceType = 'Network Interface';
    let explanation = '';
    
    if (iface.name.includes('en')) {
        interfaceType = 'Ethernet/WiFi Interface';
        explanation = 'This is a physical network connection - either wired Ethernet or wireless WiFi. It connects your Mac to your local network and the internet.';
    } else if (iface.name.includes('lo')) {
        interfaceType = 'Loopback Interface';
        explanation = 'This is a virtual interface that allows your computer to communicate with itself. It\'s used by applications and services running on your Mac.';
    } else if (iface.name.includes('utun')) {
        interfaceType = 'VPN Tunnel';
        explanation = 'This is a VPN (Virtual Private Network) connection that creates a secure tunnel to another network, often used for remote work or privacy.';
    } else if (iface.name.includes('bridge')) {
        interfaceType = 'Network Bridge';
        explanation = 'This interface bridges multiple network connections together, often used for virtualization or sharing network connections.';
    }
    
    container.innerHTML = `
        <div class="detail-header">
            <div class="detail-title">🔌 Network Interface Details</div>
            <button class="close-detail" onclick="closeDetail()">✕</button>
        </div>
        
        <div class="detail-section">
            <div class="detail-row">
                <span class="detail-label">Interface Type:</span>
                <span class="detail-value">${interfaceType}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${iface.name || 'Unknown'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${iface.status || 'Unknown'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">IP Address:</span>
                <span class="detail-value">${iface.ip || 'Not assigned'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">MTU:</span>
                <span class="detail-value">${iface.mtu || 'Unknown'} bytes</span>
            </div>
            <div class="detail-explanation">${explanation}</div>
        </div>
        
        <div class="detail-section">
            <div class="detail-explanation">
                <strong>MTU (Maximum Transmission Unit):</strong> This is the largest packet size that can be sent through this interface. 
                Larger MTU values can improve performance but may cause issues with some networks.
            </div>
        </div>
    `;
}

function showArpRowDetail(arpEntry, container) {
    let deviceType = 'Network Device';
    let explanation = '';
    
    if (arpEntry.ip.endsWith('.1')) {
        deviceType = 'Router/Gateway';
        explanation = 'This is likely your router or gateway device that provides internet access and manages your local network.';
    } else if (arpEntry.mac.startsWith('00:50:56') || arpEntry.mac.startsWith('00:0c:29')) {
        deviceType = 'Virtual Machine';
        explanation = 'This appears to be a virtual machine running on your network, possibly for development or testing purposes.';
    } else {
        deviceType = 'Network Device';
        explanation = 'This is another device on your local network that your Mac has recently communicated with.';
    }
    
    container.innerHTML = `
        <div class="detail-header">
            <div class="detail-title">🏠 Network Device Details</div>
            <button class="close-detail" onclick="closeDetail()">✕</button>
        </div>
        
        <div class="detail-section">
            <div class="detail-row">
                <span class="detail-label">Device Type:</span>
                <span class="detail-value">${deviceType}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">IP Address:</span>
                <span class="detail-value">${arpEntry.ip || 'Unknown'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">MAC Address:</span>
                <span class="detail-value">${arpEntry.mac || 'Unknown'}</span>
            </div>
            <div class="detail-explanation">${explanation}</div>
        </div>
        
        <div class="detail-section">
            <div class="detail-explanation">
                <strong>ARP (Address Resolution Protocol):</strong> This table shows the mapping between IP addresses (network addresses) 
                and MAC addresses (hardware addresses) for devices your Mac has recently communicated with on the local network.
            </div>
        </div>
        
        <div class="detail-section">
            <div class="detail-explanation">
                <strong>MAC Address:</strong> This is the unique hardware identifier for the device's network card. 
                It never changes and is used for local network communication.
            </div>
        </div>
    `;
}
window.showSystemInfo = async function() {
    console.log('🔍 System info button clicked');
    
    let modal = document.getElementById('system-info-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'system-info-modal';
        modal.className = 'system-info-modal';
        modal.innerHTML = `
            <div class="system-info-content">
                <div class="system-info-header">
                    <h2>🍎 About This Mac</h2>
                    <button class="exit-btn" onclick="closeSystemInfo()">✕</button>
                </div>
                <div id="system-info-details">Loading system information...</div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    const details = document.getElementById('system-info-details');
    modal.style.display = 'block';
    details.innerHTML = 'Loading system information...';
    
    try {
        const { ipcRenderer } = require('electron');
        const systemInfo = await ipcRenderer.invoke('system:get-info');
        
        if (systemInfo.error) {
            throw new Error(systemInfo.error);
        }
        
        // Simple system info display
        details.innerHTML = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.6; color: var(--text-primary);">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px;">
                    <div style="background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary)); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <h3 style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">🖥️ Hardware</h3>
                        <div style="display: grid; gap: 10px;">
                            <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span style="color: var(--text-secondary); font-weight: 500;">Model:</span><span style="font-weight: 600;">${systemInfo.modelName || 'Unknown'}</span></div>
                            <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span style="color: var(--text-secondary); font-weight: 500;">Processor:</span><span style="font-weight: 600;">${systemInfo.processorName || 'Unknown'}</span></div>
                            <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span style="color: var(--text-secondary); font-weight: 500;">CPU Cores:</span><span style="font-weight: 600; color: var(--text-primary);">${systemInfo.cpuCount}</span></div>
                            <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span style="color: var(--text-secondary); font-weight: 500;">Memory:</span><span style="font-weight: 600; color: var(--text-primary);">${(systemInfo.totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB</span></div>
                        </div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary)); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <h3 style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">🍎 macOS</h3>
                        <div style="display: grid; gap: 10px;">
                            <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span style="color: var(--text-secondary); font-weight: 500;">Version:</span><span style="font-weight: 600;">${systemInfo.macOSVersion || 'Unknown'}</span></div>
                            <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span style="color: var(--text-secondary); font-weight: 500;">Build:</span><span style="font-weight: 600;">${systemInfo.buildVersion || 'Unknown'}</span></div>
                            <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span style="color: var(--text-secondary); font-weight: 500;">Uptime:</span><span style="font-weight: 600; color: var(--text-primary);">${Math.floor(systemInfo.uptime / 86400)}d ${Math.floor((systemInfo.uptime % 86400) / 3600)}h</span></div>
                            <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span style="color: var(--text-secondary); font-weight: 500;">Architecture:</span><span style="font-weight: 600;">${systemInfo.arch}</span></div>
                        </div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                    <div style="background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary)); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <h3 style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">👤 User</h3>
                        <div style="display: grid; gap: 10px;">
                            <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span style="color: var(--text-secondary); font-weight: 500;">Current User:</span><span style="font-weight: 600;">${systemInfo.currentUser}</span></div>
                            <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span style="color: var(--text-secondary); font-weight: 500;">Home:</span><span style="font-family: 'SF Mono', Monaco, monospace; font-size: 11px; background: var(--bg-primary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-color);">${systemInfo.homeDirectory}</span></div>
                            <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span style="color: var(--text-secondary); font-weight: 500;">Shell:</span><span style="font-weight: 600;">${systemInfo.shell}</span></div>
                        </div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary)); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <h3 style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">💻 System</h3>
                        <div style="display: grid; gap: 10px;">
                            <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span style="color: var(--text-secondary); font-weight: 500;">Hostname:</span><span style="font-weight: 600;">${systemInfo.hostname}</span></div>
                            <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span style="color: var(--text-secondary); font-weight: 500;">Node.js:</span><span style="font-weight: 600;">${systemInfo.nodeVersion}</span></div>
                            <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span style="color: var(--text-secondary); font-weight: 500;">Platform:</span><span style="font-weight: 600;">${systemInfo.platform}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        details.innerHTML = `<div>Error: ${error.message}</div>`;
    }
};

window.closeSystemInfo = function() {
    const modal = document.getElementById('system-info-modal');
    if (modal) modal.style.display = 'none';
};

window.exitApp = function() { window.close(); };

window.toggleTheme = function() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
};

window.showProcessTooltip = function(event, processData, networkData) {
    // Simple tooltip implementation
    console.log('Process tooltip:', processData);
};

window.hideProcessTooltip = function() {
    const tooltip = document.getElementById('process-tooltip');
    if (tooltip) tooltip.classList.remove('visible');
};

window.showNetworkTooltip = function(event, connectionData) {
    console.log('Network tooltip:', connectionData);
};

window.hideNetworkTooltip = function() {
    const tooltip = document.getElementById('process-tooltip');
    if (tooltip) tooltip.classList.remove('visible');
};

window.showTabInfo = function(tabName, event) {
    event.stopPropagation();
    console.log('Tab info for:', tabName);
};

window.showTab = function(tabName) {
    // Clear existing security timer
    if (typeof securityScanTimer !== 'undefined' && securityScanTimer) {
        clearInterval(securityScanTimer);
        securityScanTimer = null;
    }
    
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Hide all content
    ['processes', 'network', 'security', 'routing', 'interfaces', 'arp', 'dns'].forEach(tab => {
        const content = document.getElementById(`${tab}-content`);
        if (content) content.style.display = 'none';
    });
    
    // Show selected content
    const selectedContent = document.getElementById(`${tabName}-content`);
    if (selectedContent) selectedContent.style.display = 'block';
    
    // Set current tab
    if (typeof currentTab !== 'undefined') {
        currentTab = tabName;
    }
    
    console.log('Switched to tab:', tabName);
};

window.performDetailedScan = async function() {
    const statusDiv = document.getElementById('security-status');
    const detailsDiv = document.getElementById('security-details');
    
    if (!statusDiv || !detailsDiv) return;
    
    statusDiv.innerHTML = '<div>🔬 Performing detailed security analysis...</div>';
    detailsDiv.innerHTML = '';
    
    try {
        const { ipcRenderer } = require('electron');
        const results = await ipcRenderer.invoke('security:perform-detailed-scan');
        
        if (results.error) {
            throw new Error(results.error);
        }
        
        statusDiv.innerHTML = `
            <div>✅ Detailed analysis completed at ${new Date(results.timestamp).toLocaleTimeString()}</div>
            <div style="color: #666; font-size: 10px;">Detailed view with expandable sections</div>
        `;
        
        // Simple results display
        detailsDiv.innerHTML = `
            <div style="margin: 10px 0; padding: 10px; background: var(--bg-secondary); border-radius: 4px;">
                <h4>🚀 STARTUP ITEMS</h4>
                <div>System Daemons: ${results.startupItems.systemDaemons?.length || 0}</div>
                <div>User Agents: ${results.startupItems.userAgents?.length || 0}</div>
                <div>Login Items: ${results.startupItems.loginItems?.length || 0}</div>
            </div>
            
            <div style="margin: 10px 0; padding: 10px; background: var(--bg-secondary); border-radius: 4px;">
                <h4>🛡️ GATEKEEPER</h4>
                <div>Status: ${results.gatekeeper.enabled ? '✅ ENABLED' : '❌ DISABLED'}</div>
                <div>${results.gatekeeper.status || results.gatekeeper.error}</div>
            </div>
            
            <div style="margin: 10px 0; padding: 10px; background: var(--bg-secondary); border-radius: 4px;">
                <h4>🔥 FIREWALL</h4>
                <div>Application Firewall: ${results.firewall.applicationFirewall?.enabled ? '✅ ENABLED' : '❌ DISABLED'}</div>
                <div>State: ${results.firewall.applicationFirewall?.state || 'Unknown'}</div>
            </div>
            
            <div style="margin: 10px 0; padding: 10px; background: var(--bg-secondary); border-radius: 4px;">
                <h4>🔒 SYSTEM INTEGRITY PROTECTION</h4>
                <div>Status: ${results.sip.enabled ? '✅ ENABLED' : '❌ DISABLED'}</div>
                <div>${results.sip.status || results.sip.error}</div>
            </div>
            
            <div style="margin: 10px 0; padding: 10px; background: var(--bg-secondary); border-radius: 4px;">
                <h4>⚙️ KERNEL EXTENSIONS</h4>
                <div>Loaded: ${Array.isArray(results.kernelExtensions) ? results.kernelExtensions.length : 
                    (results.kernelExtensions.error ? `Error: ${results.kernelExtensions.error}` : '0')}</div>
            </div>
        `;
        
    } catch (error) {
        statusDiv.innerHTML = `<div>❌ Detailed analysis failed: ${error.message}</div>`;
    }
};

window.updateScanInterval = function() {
    const input = document.getElementById('scan-interval');
    if (!input) return;
    
    const newInterval = parseInt(input.value);
    
    if (newInterval >= 10 && newInterval <= 600) {
        if (typeof securityScanIntervalSeconds !== 'undefined') {
            securityScanIntervalSeconds = newInterval;
        }
        localStorage.setItem('securityScanInterval', newInterval);
        console.log(`Security scan interval updated to ${newInterval} seconds`);
    } else {
        alert('Interval must be between 10 and 600 seconds');
        input.value = 60;
    }
};

window.selectProcess = async function(pid) {
    console.log('Selected process:', pid);
    
    const detailPanel = document.getElementById('detail-panel');
    const detailContent = document.getElementById('detail-content');
    
    if (!detailPanel || !detailContent) return;
    
    detailPanel.style.display = 'block';
    detailContent.innerHTML = `
        <h3>PROCESS ${pid} DETAILS</h3>
        <div>Loading process information...</div>
    `;
    
    try {
        const { ipcRenderer } = require('electron');
        
        // Find the process in our current list
        let proc = null;
        if (typeof processes !== 'undefined' && processes.length > 0) {
            proc = processes.find(p => p.pid === pid);
        }
        
        if (!proc) {
            detailContent.innerHTML = `
                <h3>PROCESS ${pid} DETAILS</h3>
                <div>❌ Process not found in current list</div>
                <div style="margin-top: 10px;">
                    <button onclick="closeDetail()" style="padding: 5px 10px; background: var(--text-danger); color: white; border: none; cursor: pointer;">
                        Close
                    </button>
                </div>
            `;
            return;
        }
        
        // Try to get additional details
        let connections = [];
        let fds = [];
        
        try {
            connections = await ipcRenderer.invoke('get-process-connections', pid);
            fds = await ipcRenderer.invoke('get-process-fds', pid);
        } catch (error) {
            console.warn('Could not get detailed process info:', error.message);
        }
        
        detailContent.innerHTML = `
            <h3>PROCESS ${pid} DETAILS</h3>
            <div style="margin: 5px 0;"><strong>Command:</strong> ${proc.comm}</div>
            <div style="margin: 5px 0; word-break: break-all;"><strong>Full Path:</strong> ${proc.args}</div>
            <div style="margin: 5px 0;"><strong>User:</strong> ${proc.user}</div>
            <div style="margin: 5px 0;"><strong>CPU:</strong> ${proc.cpu}%</div>
            <div style="margin: 5px 0;"><strong>Memory:</strong> ${proc.mem}%</div>
            <div style="margin: 5px 0;"><strong>Runtime:</strong> ${proc.time}</div>
            <div style="margin: 5px 0;"><strong>Parent PID:</strong> ${proc.ppid}</div>
            
            <h4 style="margin-top: 15px;">NETWORK CONNECTIONS</h4>
            <div style="max-height: 150px; overflow-y: auto; font-size: 10px;">
                ${connections.length > 0 ? 
                    connections.map(conn => `
                        <div style="margin: 2px 0; padding: 4px; background: var(--bg-secondary); border-radius: 2px;">
                            ${conn.type || 'NET'} ${conn.name_addr || conn.local || 'N/A'}
                        </div>
                    `).join('') : 
                    '<div style="color: #666;">No active network connections</div>'
                }
            </div>
            
            <h4 style="margin-top: 15px;">FILE DESCRIPTORS</h4>
            <div style="max-height: 150px; overflow-y: auto; font-size: 10px;">
                ${fds.length > 0 ? 
                    fds.slice(0, PROCESS_LIMITS.MAX_FILE_DESCRIPTORS).map(fd => `
                        <div style="margin: 2px 0; padding: 4px; background: var(--bg-secondary); border-radius: 2px;">
                            ${fd.fd} ${fd.type} ${fd.name || 'N/A'}
                        </div>
                    `).join('') : 
                    '<div style="color: #666;">No file descriptors available</div>'
                }
            </div>
            
            <div style="margin-top: 15px;">
                <button onclick="closeDetail()" style="padding: 5px 10px; background: var(--text-danger); color: white; border: none; cursor: pointer; border-radius: 3px;">
                    Close Details
                </button>
            </div>
        `;
        
    } catch (error) {
        detailContent.innerHTML = `
            <h3>PROCESS ${pid} DETAILS</h3>
            <div>❌ Error loading details: ${error.message}</div>
            <div style="margin-top: 10px;">
                <button onclick="closeDetail()" style="padding: 5px 10px; background: var(--text-danger); color: white; border: none; cursor: pointer;">
                    Close
                </button>
            </div>
        `;
    }
};

window.showProcessTooltip = function(event, processData, networkData) {
    console.log('Process tooltip for PID:', processData.pid);
    // Tooltip functionality can be added later
};

window.showNetworkTooltip = function(event, connectionData) {
    console.log('Network tooltip for:', connectionData.proto);
    // Tooltip functionality can be added later
};

window.showTabInfo = function(tabName, event) {
    event.stopPropagation();
    
    const infoText = {
        processes: 'Real-time system process monitoring with CPU, memory, and network usage',
        network: 'Active network connections and socket information',
        security: 'System security analysis including startup items, firewall, and Gatekeeper',
        routing: 'Network routing table and gateway configuration',
        interfaces: 'Network interface status and configuration',
        arp: 'Address Resolution Protocol table showing local network neighbors',
        dns: 'Domain Name System configuration and servers'
    };
    
    alert(`${tabName.toUpperCase()} TAB\n\n${infoText[tabName] || 'Tab information'}`);
};

const { ipcRenderer } = require('electron');

let currentTab = 'processes';
let processes = [];
let networkUsage = [];
let selectedPid = null;
let autoRefresh = true;
let refreshInterval = 2000;
let securityScanTimer = null;
let lastSecurityScan = 0;

// Unix system processes
const systemProcesses = [
    'kernel_task', 'launchd', 'UserEventAgent', 'loginwindow', 'SystemUIServer',
    'Dock', 'Finder', 'WindowServer', 'cfprefsd', 'distnoted', 'syslogd',
    'kextd', 'mds', 'mdworker', 'coreaudiod', 'bluetoothd', 'WiFiAgent',
    'networkd', 'configd', 'powerd', 'securityd', 'trustd'
];

function isSystemProcess(comm, user) {
    return systemProcesses.some(sys => comm.includes(sys)) || 
           comm.startsWith('/System/') || 
           user === 'root' || user === '_system';
}

function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Clear existing security timer
    if (securityScanTimer) {
        clearInterval(securityScanTimer);
        securityScanTimer = null;
    }
    
    // Hide all content
    ['processes', 'network', 'security', 'routing', 'interfaces', 'arp', 'dns'].forEach(tab => {
        document.getElementById(`${tab}-content`).style.display = 'none';
    });
    
    // Show selected content
    document.getElementById(`${tabName}-content`).style.display = 'block';
    
    currentTab = tabName;
    
    // Special handling for security tab
    if (tabName === 'security') {
        const now = Date.now();
        if (now - lastSecurityScan > (securityScanIntervalSeconds * 1000)) {
            performSecurityScan();
        }
        
        // Set up timer with editable interval
        securityScanTimer = setInterval(() => {
            if (currentTab === 'security') {
                performSecurityScan();
            }
        }, securityScanIntervalSeconds * 1000);
    } else {
        refreshData();
    }
}

async function performSecurityScan() {
    const statusDiv = document.getElementById('security-status');
    const detailsDiv = document.getElementById('security-details');
    
    statusDiv.innerHTML = '<div>🔍 Performing comprehensive security scan...</div>';
    detailsDiv.innerHTML = '';
    
    try {
        const results = await ipcRenderer.invoke('security:perform-scan');
        
        if (results.error) {
            throw new Error(results.error);
        }
        
        statusDiv.innerHTML = `<div>✅ Security scan completed at ${new Date(results.timestamp).toLocaleString()}</div>`;
        
        detailsDiv.innerHTML = `
            <div class="security-section">
                <h4>🚀 STARTUP ITEMS</h4>
                <div>System Daemons: ${results.startupItems.systemDaemons?.length || 0}</div>
                <div>User Agents: ${results.startupItems.userAgents?.length || 0}</div>
                <div>Login Items: ${results.startupItems.loginItems?.length || 0}</div>
            </div>
            
            <div class="security-section">
                <h4>🛡️ GATEKEEPER</h4>
                <div>Status: ${results.gatekeeper.enabled ? '✅ ENABLED' : '❌ DISABLED'}</div>
                <div>${results.gatekeeper.status || results.gatekeeper.error}</div>
            </div>
            
            <div class="security-section">
                <h4>🔥 FIREWALL</h4>
                <div>Application Firewall: ${results.firewall.applicationFirewall?.enabled ? '✅ ENABLED' : '❌ DISABLED'}</div>
                <div>State: ${results.firewall.applicationFirewall?.state || 'Unknown'}</div>
            </div>
            
            <div class="security-section">
                <h4>🔒 SYSTEM INTEGRITY PROTECTION</h4>
                <div>Status: ${results.sip.enabled ? '✅ ENABLED' : '❌ DISABLED'}</div>
                <div>${results.sip.status || results.sip.error}</div>
            </div>
            
            <div class="security-section">
                <h4>⚙️ KERNEL EXTENSIONS</h4>
                <div>Loaded: ${Array.isArray(results.kernelExtensions) ? results.kernelExtensions.length : 
                    (results.kernelExtensions.error ? `Error: ${results.kernelExtensions.error}` : '0')}</div>
            </div>
        `;
        
    } catch (error) {
        statusDiv.innerHTML = `<div>❌ Security scan failed: ${error.message}</div>`;
    }
}

async function loadRouting() {
    try {
        const output = await ipcRenderer.invoke('get-netstat');
        document.getElementById('routing-list').textContent = output;
    } catch (error) {
        document.getElementById('routing-list').textContent = `ERROR: ${error.message}`;
    }
}

async function loadInterfaces() {
    try {
        const output = await ipcRenderer.invoke('get-ifconfig');
        document.getElementById('interfaces-list').textContent = output;
    } catch (error) {
        document.getElementById('interfaces-list').textContent = `ERROR: ${error.message}`;
    }
}

async function loadArp() {
    try {
        const output = await ipcRenderer.invoke('get-arp');
        document.getElementById('arp-list').textContent = output;
    } catch (error) {
        document.getElementById('arp-list').textContent = `ERROR: ${error.message}`;
    }
}

async function loadDns() {
    try {
        const output = await ipcRenderer.invoke('get-dns');
        document.getElementById('dns-list').textContent = output;
    } catch (error) {
        document.getElementById('dns-list').textContent = `ERROR: ${error.message}`;
    }
}

async function loadProcesses() {
    try {
        const [processData, netData] = await Promise.all([
            ipcRenderer.invoke('get-processes'),
            ipcRenderer.invoke('get-network-usage')
        ]);
        
        processes = processData;
        networkUsage = netData;
        renderProcesses();
    } catch (error) {
        document.getElementById('processes-list').innerHTML = `<div>ERROR: ${error.message}</div>`;
    }
}

function renderProcesses() {
    const filter = document.getElementById('filter').value.toLowerCase();
    const sortBy = document.getElementById('sort-by').value;
    
    let filtered = processes.filter(proc => 
        !filter || 
        proc.comm.toLowerCase().includes(filter) || 
        proc.pid.includes(filter) ||
        proc.args.toLowerCase().includes(filter)
    );
    
    filtered.sort((a, b) => {
        switch(sortBy) {
            case 'cpu': return parseFloat(b.cpu) - parseFloat(a.cpu);
            case 'mem': return parseFloat(b.mem) - parseFloat(a.mem);
            case 'pid': return parseInt(a.pid) - parseInt(b.pid);
            case 'comm': return a.comm.localeCompare(b.comm);
            default: return 0;
        }
    });
    
    const processList = document.getElementById('processes-list');
    processList.innerHTML = filtered.slice(0, 100).map(proc => {
        const isSystem = isSystemProcess(proc.comm, proc.user);
        const cpu = parseFloat(proc.cpu);
        const mem = parseFloat(proc.mem);
        
        // Find network usage for this process
        const netUsage = networkUsage.find(net => net.pid === proc.pid) || 
                        { bytes_in: '0', bytes_out: '0' };
        
        let className = 'process-row';
        if (isSystem) className += ' system-proc';
        else className += ' user-proc';
        if (cpu > 50) className += ' high-cpu';
        if (mem > 20) className += ' high-mem';
        if (proc.pid === selectedPid) className += ' selected';
        
        // Highlight Amazon Q process
        if (proc.args.toLowerCase().includes('amazon') || 
            proc.args.toLowerCase().includes(' q ') ||
            proc.comm.toLowerCase().includes('q') ||
            proc.args.toLowerCase().includes('q chat') ||
            proc.args.toLowerCase().includes('q-cli')) {
            className += ' amazon-q';
        }
        
        // Display full path without truncation
        const displayPath = proc.args;
        
        // Safely stringify data for tooltip
        const procData = {
            pid: proc.pid,
            ppid: proc.ppid,
            cpu: proc.cpu,
            mem: proc.mem,
            user: proc.user,
            time: proc.time,
            comm: proc.comm,
            args: proc.args
        };
        
        const netData = {
            bytes_in: netUsage.bytes_in || '0',
            bytes_out: netUsage.bytes_out || '0'
        };
        
        return `
            <div class="${className}" onclick="selectProcess('${proc.pid}')" 
                 onmouseenter="showProcessTooltip(event, ${JSON.stringify(procData).replace(/"/g, '&quot;')}, ${JSON.stringify(netData).replace(/"/g, '&quot;')})"
                 onmouseleave="hideProcessTooltip()">
                <div class="process-cell">${proc.pid}</div>
                <div class="process-cell">${proc.ppid}</div>
                <div class="process-cell">${proc.cpu}</div>
                <div class="process-cell">${proc.mem}</div>
                <div class="process-cell">${proc.user}</div>
                <div class="process-cell">${formatBytes(netUsage.bytes_in)}</div>
                <div class="process-cell">${formatBytes(netUsage.bytes_out)}</div>
                <div class="process-cell">${proc.time}</div>
                <div class="command-cell" title="${proc.args}">${displayPath}</div>
            </div>
        `;
    }).join('');
}

function formatBytes(bytes) {
    if (!bytes || bytes === '0') return '0B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(parseInt(bytes)) / Math.log(k));
    return parseFloat((parseInt(bytes) / Math.pow(k, i)).toFixed(1)) + sizes[i];
}

async function selectProcess(pid) {
    selectedPid = pid;
    renderProcesses();
    
    const detailPanel = document.getElementById('detail-panel');
    const detailContent = document.getElementById('detail-content');
    
    detailPanel.style.display = 'block';
    detailContent.innerHTML = '<div>Loading process details...</div>';
    
    try {
        const [connections, fds] = await Promise.all([
            ipcRenderer.invoke('get-process-connections', pid),
            ipcRenderer.invoke('get-process-fds', pid)
        ]);
        
        const proc = processes.find(p => p.pid === pid);
        
        detailContent.innerHTML = `
            <h3>PROCESS ${pid} DETAILS</h3>
            <div><strong>Command:</strong> ${proc.comm}</div>
            <div><strong>Full Path:</strong> ${proc.args}</div>
            <div><strong>User:</strong> ${proc.user}</div>
            <div><strong>CPU:</strong> ${proc.cpu}%</div>
            <div><strong>Memory:</strong> ${proc.mem}% (${proc.rss}KB RSS, ${proc.vsz}KB VSZ)</div>
            <div><strong>Runtime:</strong> ${proc.time}</div>
            <div><strong>Parent PID:</strong> ${proc.ppid}</div>
            
            <h4>NETWORK CONNECTIONS</h4>
            ${connections.map(conn => `
                <div class="network-item ${conn.type.toLowerCase()}">
                    ${conn.type} ${conn.name_addr} [${conn.fd}]
                </div>
            `).join('') || '<div>No network connections</div>'}
            
            <h4>FILE DESCRIPTORS</h4>
            <div style="max-height: 200px; overflow-y: auto;">
                ${fds.slice(0, PROCESS_LIMITS.MAX_FILE_DESCRIPTORS).map(fd => `
                    <div class="network-item">
                        ${fd.fd} ${fd.type} ${fd.name}
                    </div>
                `).join('') || '<div>No file descriptors</div>'}
            </div>
        `;
    } catch (error) {
        detailContent.innerHTML = `<div>Error loading details: ${error.message}</div>`;
    }
}

async function loadNetwork() {
    try {
        const connections = await ipcRenderer.invoke('get-network');
        const networkList = document.getElementById('network-list');
        
        networkList.innerHTML = `
            <div class="network-header-row">
                <div class="resizable-header tooltip" data-tooltip="Protocol - TCP/UDP/UNIX socket type">PROTO</div>
                <div class="resizable-header tooltip" data-tooltip="Local Address - Your machine's IP and port">LOCAL ADDRESS</div>
                <div class="resizable-header tooltip" data-tooltip="Foreign Address - Remote connection endpoint">FOREIGN ADDRESS</div>
                <div class="resizable-header tooltip" data-tooltip="Connection State - LISTEN/ESTABLISHED/CLOSED etc">STATE</div>
            </div>
            ${connections.slice(0, 100).map(conn => {
                const stateClass = conn.state === 'ESTABLISHED' ? 'tcp' : 
                                 conn.state === 'LISTEN' ? 'udp' : 'unix';
                
                return `
                    <div class="network-row clickable-row ${stateClass}" 
                         onclick="showRowDetail('network', ${JSON.stringify(conn).replace(/"/g, '&quot;')})"
                         onmouseenter="showNetworkTooltip(event, ${JSON.stringify(conn).replace(/"/g, '&quot;')})"
                         onmouseleave="hideNetworkTooltip()">
                        <div class="network-cell">${conn.proto}</div>
                        <div class="network-cell">${conn.local}</div>
                        <div class="network-cell">${conn.foreign}</div>
                        <div class="network-cell">${conn.state}</div>
                    </div>
                `;
            }).join('')}
        `;
        
        // Initialize column resizing for network tab
        setTimeout(() => initNetworkColumnResizing(), 100);
        
    } catch (error) {
        document.getElementById('network-list').innerHTML = `<div>ERROR: ${error.message}</div>`;
    }
}

function showNetworkTooltip(event, connectionData) {
    const tooltip = document.getElementById('process-tooltip');
    const conn = connectionData;
    
    // Determine connection type and status
    let connType = 'Unknown';
    let connStatus = 'Unknown';
    let explanation = '';
    
    if (conn.proto.includes('tcp')) {
        connType = 'TCP Connection';
        explanation = 'Reliable, connection-oriented protocol for web traffic, file transfers, etc.';
    } else if (conn.proto.includes('udp')) {
        connType = 'UDP Connection';
        explanation = 'Fast, connectionless protocol for streaming, gaming, DNS queries, etc.';
    } else if (conn.proto.includes('unix')) {
        connType = 'Unix Socket';
        explanation = 'Local inter-process communication on this machine.';
    }
    
    if (conn.state === 'LISTEN') {
        connStatus = 'Listening';
        explanation += ' This service is waiting for incoming connections.';
    } else if (conn.state === 'ESTABLISHED') {
        connStatus = 'Active Connection';
        explanation += ' This is an active, established connection.';
    } else if (conn.state === 'CLOSE_WAIT') {
        connStatus = 'Closing';
        explanation += ' This connection is in the process of closing.';
    }
    
    tooltip.innerHTML = `
        <div class="tooltip-section">
            <div class="tooltip-header">🌐 Network Connection</div>
            <div class="tooltip-row">
                <span class="tooltip-label">Type:</span>
                <span class="tooltip-value">${connType}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Status:</span>
                <span class="tooltip-value">${connStatus}</span>
            </div>
            <div class="tooltip-explanation">${explanation}</div>
        </div>
        
        <div class="tooltip-section">
            <div class="tooltip-header">📡 Connection Details</div>
            <div class="tooltip-row">
                <span class="tooltip-label">Protocol:</span>
                <span class="tooltip-value">${conn.proto}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Local:</span>
                <span class="tooltip-value">${conn.local}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Remote:</span>
                <span class="tooltip-value">${conn.foreign}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">State:</span>
                <span class="tooltip-value">${conn.state}</span>
            </div>
            <div class="tooltip-explanation">
                Local address is your machine. Remote address is the other endpoint.
            </div>
        </div>
        
        <div class="tooltip-section">
            <div class="tooltip-header">🔍 What This Means</div>
            <div class="tooltip-explanation">
                ${conn.state === 'LISTEN' ? 
                    'Your machine is offering a service on this port. Other computers can connect to it.' :
                conn.state === 'ESTABLISHED' ?
                    'Your machine has an active connection to another computer or service.' :
                    'This connection is in a transitional state.'}
            </div>
        </div>
    `;
    
    // Position tooltip
    const headerHeight = 100;
    const tooltipX = event.pageX + 15;
    const tooltipY = Math.max(event.pageY - 10, headerHeight);
    
    tooltip.style.left = tooltipX + 'px';
    tooltip.style.top = tooltipY + 'px';
    
    setTimeout(() => {
        const rect = tooltip.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            tooltip.style.left = (event.pageX - rect.width - 15) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            tooltip.style.top = Math.max((event.pageY - rect.height + 10), headerHeight) + 'px';
        }
        if (rect.top < headerHeight) {
            tooltip.style.top = headerHeight + 'px';
        }
    }, 10);
    
    tooltip.classList.add('visible');
}

function hideNetworkTooltip() {
    const tooltip = document.getElementById('process-tooltip');
    tooltip.classList.remove('visible');
}

function initNetworkColumnResizing() {
    const headers = document.querySelectorAll('.network-header-row .resizable-header');
    
    headers.forEach((header, index) => {
        header.addEventListener('mousedown', (e) => {
            const rect = header.getBoundingClientRect();
            const isNearRightEdge = e.clientX > rect.right - 10;
            
            if (isNearRightEdge) {
                isResizing = true;
                currentColumn = index;
                startX = e.clientX;
                startWidth = rect.width;
                
                document.addEventListener('mousemove', handleNetworkColumnResize);
                document.addEventListener('mouseup', stopNetworkColumnResize);
                
                e.preventDefault();
            }
        });
        
        header.addEventListener('mousemove', (e) => {
            const rect = header.getBoundingClientRect();
            const isNearRightEdge = e.clientX > rect.right - 10;
            
            header.style.cursor = isNearRightEdge ? 'col-resize' : 'default';
        });
    });
}

function handleNetworkColumnResize(e) {
    if (!isResizing) return;
    
    const diff = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + diff);
    
    const networkRows = document.querySelectorAll('.network-row, .network-header-row');
    networkRows.forEach(row => {
        const currentTemplate = row.style.gridTemplateColumns || '80px 200px 200px 100px';
        const columns = currentTemplate.split(' ');
        columns[currentColumn] = newWidth + 'px';
        row.style.gridTemplateColumns = columns.join(' ');
    });
}

function exitApp() {
    window.close();
}

async function selectProcess(pid) {
    selectedPid = pid;
    renderProcesses();
    
    const detailPanel = document.getElementById('detail-panel');
    const detailContent = document.getElementById('detail-content');
    
    detailPanel.style.display = 'block';
    detailContent.innerHTML = '<div>Loading process details...</div>';
    
    try {
        const [connections, fds] = await Promise.all([
            ipcRenderer.invoke('get-process-connections', pid),
            ipcRenderer.invoke('get-process-fds', pid)
        ]);
        
        const proc = processes.find(p => p.pid === pid);
        
        detailContent.innerHTML = `
            <h3>PROCESS ${pid} DETAILS</h3>
            <div><strong>Command:</strong> ${proc.comm}</div>
            <div><strong>Full Path:</strong> ${proc.args}</div>
            <div><strong>User:</strong> ${proc.user}</div>
            <div><strong>CPU:</strong> ${proc.cpu}%</div>
            <div><strong>Memory:</strong> ${proc.mem}% (${proc.rss}KB RSS, ${proc.vsz}KB VSZ)</div>
            <div><strong>Runtime:</strong> ${proc.time}</div>
            <div><strong>Parent PID:</strong> ${proc.ppid}</div>
            
            <h4>NETWORK CONNECTIONS</h4>
            ${connections.map(conn => `
                <div class="network-item ${conn.type?.toLowerCase()}">
                    ${conn.type} ${conn.name_addr} [${conn.fd}]
                </div>
            `).join('') || '<div>No network connections</div>'}
            
            <h4>FILE DESCRIPTORS</h4>
            <div style="max-height: 200px; overflow-y: auto;">
                ${fds.slice(0, PROCESS_LIMITS.MAX_FILE_DESCRIPTORS).map(fd => `
                    <div class="network-item">
                        ${fd.fd} ${fd.type} ${fd.name}
                    </div>
                `).join('') || '<div>No file descriptors</div>'}
            </div>
        `;
    } catch (error) {
        detailContent.innerHTML = `<div>Error loading details: ${error.message}</div>`;
    }
}

function exitApp() {
    window.close();
}

function showTabInfo(tabName, event) {
    event.stopPropagation(); // Prevent tab switching
    
    const tooltip = document.getElementById('process-tooltip');
    
    const tabInfo = {
        processes: {
            title: '📊 PROCESSES TAB',
            description: 'Real-time system process monitoring',
            columns: [
                'PID: Unique process identifier number',
                'PPID: Parent process that started this one',
                'CPU%: Processor usage percentage',
                'MEM%: Memory (RAM) usage percentage', 
                'USER: Process owner (root = admin)',
                'NET_IN: Network data received',
                'NET_OUT: Network data sent',
                'TIME: How long process has been running',
                'COMMAND: Full program path and arguments'
            ],
            tips: 'Green = System processes, Blue = User processes, Orange = High resource usage'
        },
        network: {
            title: '🌐 NETWORK TAB',
            description: 'Active network connections and sockets',
            columns: [
                'PROTO: Protocol type (TCP/UDP/Unix)',
                'LOCAL ADDRESS: Your machine IP:port',
                'FOREIGN ADDRESS: Remote endpoint',
                'STATE: Connection status (LISTEN/ESTABLISHED/etc)'
            ],
            tips: 'LISTEN = Service waiting for connections, ESTABLISHED = Active connection'
        },
        security: {
            title: '🔐 SECURITY TAB',
            description: 'System security analysis and configuration',
            columns: [
                'Startup Items: Programs that auto-start',
                'Gatekeeper: App verification system',
                'Firewall: Network protection status',
                'SIP: System Integrity Protection',
                'Kernel Extensions: Low-level system drivers'
            ],
            tips: 'Green = Secure/Enabled, Red = Disabled/Risk, Orange = Third-party'
        },
        routing: {
            title: '🛣️ ROUTING TAB',
            description: 'Network routing table and gateway information',
            columns: [
                'Default Gateway: Your router/internet connection',
                'Local Networks: Internal network routes',
                'Interface: Network adapter used',
                'Destination: Where traffic is directed'
            ],
            tips: 'Shows how your Mac routes network traffic to different destinations'
        },
        interfaces: {
            title: '🔌 INTERFACES TAB',
            description: 'Network interface configuration and status',
            columns: [
                'Interface Name: en0=Ethernet, en1=WiFi, etc',
                'Status: UP/DOWN connection state',
                'IP Address: Your machine address',
                'MTU: Maximum transmission unit size'
            ],
            tips: 'Green dot = Active, Red dot = Inactive, Shows all network adapters'
        },
        arp: {
            title: '🏠 ARP TAB',
            description: 'Address Resolution Protocol - local network neighbors',
            columns: [
                'IP Address: Network address of device',
                'MAC Address: Hardware identifier',
                'Device Type: Router/Computer/etc (estimated)',
                'Status: Reachable/Stale/etc'
            ],
            tips: 'Shows other devices on your local network that your Mac has communicated with'
        },
        dns: {
            title: '🌍 DNS TAB',
            description: 'Domain Name System configuration',
            columns: [
                'DNS Servers: Name resolution servers',
                'Search Domains: Default domain suffixes',
                'Resolver: DNS resolution configuration',
                'Cache: DNS lookup cache status'
            ],
            tips: 'Shows how your Mac translates domain names (google.com) to IP addresses'
        }
    };
    
    const info = tabInfo[tabName];
    if (!info) return;
    
    tooltip.innerHTML = `
        <div class="tooltip-section">
            <div class="tooltip-header">${info.title}</div>
            <div class="tooltip-explanation">${info.description}</div>
        </div>
        
        <div class="tooltip-section">
            <div class="tooltip-header">📋 Column Meanings</div>
            ${info.columns.map(col => `
                <div style="margin: 3px 0; font-size: 9px;">• ${col}</div>
            `).join('')}
        </div>
        
        <div class="tooltip-section">
            <div class="tooltip-header">💡 Tips</div>
            <div class="tooltip-explanation">${info.tips}</div>
        </div>
    `;
    
    // Position tooltip near the tab
    tooltip.style.left = (event.pageX - 200) + 'px';
    tooltip.style.top = (event.pageY + 20) + 'px';
    
    tooltip.classList.add('visible');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        tooltip.classList.remove('visible');
    }, 5000);
}

function stopNetworkColumnResize() {
    isResizing = false;
    currentColumn = null;
    document.removeEventListener('mousemove', handleNetworkColumnResize);
    document.removeEventListener('mouseup', stopNetworkColumnResize);
}

function closeDetail() {
    document.getElementById('detail-panel').style.display = 'none';
    selectedPid = null;
    renderProcesses();
}

function refreshData() {
    document.getElementById('update-time').textContent = new Date().toLocaleTimeString();
    
    switch(currentTab) {
        case 'processes': loadProcesses(); break;
        case 'network': loadNetwork(); break;
        case 'security': 
            // Don't auto-run, handled by showTab
            break;
        case 'routing': loadRouting(); break;
        case 'interfaces': loadInterfaces(); break;
        case 'arp': loadArp(); break;
        case 'dns': loadDns(); break;
    }
}

function exitApp() {
    window.close();
}

// Event listeners
document.getElementById('auto-refresh').addEventListener('change', (e) => {
    autoRefresh = e.target.checked;
});

document.getElementById('refresh-interval').addEventListener('change', (e) => {
    refreshInterval = parseInt(e.target.value);
});

document.getElementById('filter').addEventListener('input', renderProcesses);
document.getElementById('sort-by').addEventListener('change', renderProcesses);

// Auto-refresh
setInterval(() => {
    if (autoRefresh) refreshData();
}, refreshInterval);

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

let routingViewMode = 'friendly';
let interfaceViewMode = 'friendly';
let arpViewMode = 'friendly';

async function loadRouting() {
    try {
        const result = await ipcRenderer.invoke('get-netstat');
        const output = result.stdout || result.error || result;
        
        // Store raw output
        document.getElementById('routing-list').textContent = output;
        
        // Parse and display friendly view
        const friendlyDiv = document.getElementById('routing-friendly');
        friendlyDiv.innerHTML = parseRoutingTable(output);
        
    } catch (error) {
        document.getElementById('routing-list').textContent = `ERROR: ${error.message}`;
        document.getElementById('routing-friendly').innerHTML = `<div>ERROR: ${error.message}</div>`;
    }
}

function parseRoutingTable(output) {
    const lines = output.split('\n');
    let html = '<h3>🛣️ Network Routes</h3>';
    
    lines.forEach(line => {
        if (line.includes('default') || line.includes('0.0.0.0')) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 2) {
                const routeData = {
                    destination: 'default',
                    gateway: parts[1],
                    interface: parts[parts.length - 1]
                };
                html += `
                    <div class="network-card clickable-row" onclick="showRowDetail('routing', ${JSON.stringify(routeData).replace(/"/g, '&quot;')})">
                        <h4>🌐 Default Gateway</h4>
                        <div class="network-detail">
                            <span>Gateway:</span>
                            <span>${parts[1]}</span>
                        </div>
                        <div class="network-detail">
                            <span>Interface:</span>
                            <span>${parts[parts.length - 1]}</span>
                        </div>
                    </div>
                `;
            }
        } else if (line.includes('192.168') || line.includes('10.') || line.includes('172.')) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 2) {
                const routeData = {
                    destination: parts[0],
                    gateway: parts[1],
                    interface: parts[parts.length - 1]
                };
                html += `
                    <div class="network-card clickable-row" onclick="showRowDetail('routing', ${JSON.stringify(routeData).replace(/"/g, '&quot;')})">
                        <h4>🏠 Local Network</h4>
                        <div class="network-detail">
                            <span>Network:</span>
                            <span>${parts[0]}</span>
                        </div>
                        <div class="network-detail">
                            <span>Gateway:</span>
                            <span>${parts[1]}</span>
                        </div>
                    </div>
                `;
            }
        }
    });
    
    return html || '<div>No routing information found</div>';
}

async function loadInterfaces() {
    try {
        const output = await ipcRenderer.invoke('get-ifconfig');
        const rawOutput = output.error || output;
        
        // Store raw output
        document.getElementById('interfaces-list').textContent = rawOutput;
        
        // Parse and display friendly view
        const friendlyDiv = document.getElementById('interfaces-friendly');
        friendlyDiv.innerHTML = parseInterfaces(rawOutput);
        
    } catch (error) {
        document.getElementById('interfaces-list').textContent = `ERROR: ${error.message}`;
        document.getElementById('interfaces-friendly').innerHTML = `<div>ERROR: ${error.message}</div>`;
    }
}

function parseInterfaces(output) {
    const interfaces = output.split(/^(\w+\d*): /m).filter(Boolean);
    let html = '<h3>🔌 Network Interfaces</h3>';
    
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
        
        const ifaceData = {
            name: name,
            status: isUp ? 'UP' : 'DOWN',
            ip: ipMatch ? ipMatch[1] : null,
            mtu: mtuMatch ? mtuMatch[1] : null,
            type: interfaceType
        };
        
        html += `
            <div class="network-card clickable-row" onclick="showRowDetail('interface', ${JSON.stringify(ifaceData).replace(/"/g, '&quot;')})">
                <h4>${interfaceType} - ${name}</h4>
                <div class="network-detail">
                    <span>Status:</span>
                    <span>
                        <span class="status-indicator ${isUp ? 'status-up' : 'status-down'}"></span>
                        ${isUp ? 'UP' : 'DOWN'}
                    </span>
                </div>
                ${ipMatch ? `
                    <div class="network-detail">
                        <span>IP Address:</span>
                        <span>${ipMatch[1]}</span>
                    </div>
                ` : ''}
                ${mtuMatch ? `
                    <div class="network-detail">
                        <span>MTU:</span>
                        <span>${mtuMatch[1]} bytes</span>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    return html || '<div>No network interfaces found</div>';
}

async function loadArp() {
    try {
        const output = await ipcRenderer.invoke('get-arp');
        const rawOutput = output.error || output;
        
        // Store raw output
        document.getElementById('arp-list').textContent = rawOutput;
        
        // Parse and display friendly view
        const friendlyDiv = document.getElementById('arp-friendly');
        friendlyDiv.innerHTML = parseArpTable(rawOutput);
        
    } catch (error) {
        document.getElementById('arp-list').textContent = `ERROR: ${error.message}`;
        document.getElementById('arp-friendly').innerHTML = `<div>ERROR: ${error.message}</div>`;
    }
}

function parseArpTable(output) {
    const lines = output.split('\n');
    let html = '<h3>🏠 Network Neighbors (ARP Table)</h3>';
    
    lines.forEach(line => {
        const match = line.match(/\((\d+\.\d+\.\d+\.\d+)\) at ([a-f0-9:]+)/);
        if (match) {
            const ip = match[1];
            const mac = match[2];
            let deviceType = '💻 Device';
            
            // Guess device type from IP
            if (ip.endsWith('.1')) deviceType = '🌐 Router/Gateway';
            else if (ip.includes('192.168.1.')) deviceType = '🏠 Local Device';
            
            const arpData = {
                ip: ip,
                mac: mac,
                deviceType: deviceType
            };
            
            html += `
                <div class="network-card clickable-row" onclick="showRowDetail('arp', ${JSON.stringify(arpData).replace(/"/g, '&quot;')})">
                    <h4>${deviceType}</h4>
                    <div class="network-detail">
                        <span>IP Address:</span>
                        <span>${ip}</span>
                    </div>
                    <div class="network-detail">
                        <span>MAC Address:</span>
                        <span>${mac}</span>
                    </div>
                </div>
            `;
        }
    });
    
    return html || '<div>No ARP entries found</div>';
}

function toggleRoutingView() {
    const friendly = document.getElementById('routing-friendly');
    const raw = document.getElementById('routing-list');
    
    if (friendly.style.display === 'none') {
        friendly.style.display = 'block';
        raw.style.display = 'none';
    } else {
        friendly.style.display = 'none';
        raw.style.display = 'block';
    }
}

function toggleInterfaceView() {
    const friendly = document.getElementById('interfaces-friendly');
    const raw = document.getElementById('interfaces-list');
    
    if (friendly.style.display === 'none') {
        friendly.style.display = 'block';
        raw.style.display = 'none';
    } else {
        friendly.style.display = 'none';
        raw.style.display = 'block';
    }
}

function toggleArpView() {
    const friendly = document.getElementById('arp-friendly');
    const raw = document.getElementById('arp-list');
    
    if (friendly.style.display === 'none') {
        friendly.style.display = 'block';
        raw.style.display = 'none';
    } else {
        friendly.style.display = 'none';
        raw.style.display = 'block';
    }
}

let editMode = false;
let securityScanIntervalSeconds = 60;

function updateScanInterval() {
    const input = document.getElementById('scan-interval');
    const newInterval = parseInt(input.value);
    
    if (newInterval >= 10 && newInterval <= 600) {
        securityScanIntervalSeconds = newInterval;
        localStorage.setItem('securityScanInterval', newInterval);
        
        // Clear existing timer and restart with new interval
        if (securityScanTimer) {
            clearInterval(securityScanTimer);
            securityScanTimer = setInterval(() => {
                if (currentTab === 'security') {
                    performSecurityScan();
                }
            }, securityScanIntervalSeconds * 1000);
        }
        
        console.log(`Security scan interval updated to ${newInterval} seconds`);
    } else {
        alert('Interval must be between 10 and 600 seconds');
        input.value = securityScanIntervalSeconds;
    }
}

async function performDetailedScan() {
    const statusDiv = document.getElementById('security-status');
    const detailsDiv = document.getElementById('security-details');
    
    lastSecurityScan = Date.now();
    statusDiv.innerHTML = '<div>🔬 Performing detailed security analysis...</div>';
    detailsDiv.innerHTML = '';
    
    try {
        const results = await ipcRenderer.invoke('security:perform-detailed-scan');
        
        if (results.error) {
            throw new Error(results.error);
        }
        
        statusDiv.innerHTML = `
            <div>✅ Detailed analysis completed at ${new Date(results.timestamp).toLocaleTimeString()}</div>
            <div style="color: #666; font-size: 10px;">Detailed view with expandable sections</div>
        `;
        
        renderDetailedSecurityResults(results, detailsDiv);
        
    } catch (error) {
        statusDiv.innerHTML = `<div>❌ Detailed analysis failed: ${error.message}</div>`;
    }
}

function renderDetailedSecurityResults(results, container) {
    let html = '';
    
    // Startup Items - Detailed
    html += `
        <div class="security-section">
            <div class="security-header" onclick="toggleSection('startup')">
                <h4>🚀 STARTUP ITEMS (${(results.startupItems.systemDaemons?.length || 0) + (results.startupItems.userAgents?.length || 0)})</h4>
                <span class="expand-icon">▶</span>
            </div>
            <div class="security-body" id="startup-body">
                ${renderStartupDetails(results.startupItems)}
            </div>
        </div>
    `;
    
    // Firewall - Detailed
    html += `
        <div class="security-section">
            <div class="security-header" onclick="toggleSection('firewall')">
                <h4>🔥 FIREWALL ${results.firewall.applicationFirewall?.enabled ? '✅' : '❌'}</h4>
                <span class="expand-icon">▶</span>
            </div>
            <div class="security-body" id="firewall-body">
                ${renderFirewallDetails(results.firewall)}
            </div>
        </div>
    `;
    
    // Kernel Extensions - Detailed
    html += `
        <div class="security-section">
            <div class="security-header" onclick="toggleSection('kexts')">
                <h4>⚙️ KERNEL EXTENSIONS (${Array.isArray(results.kernelExtensions) ? results.kernelExtensions.length : 0})</h4>
                <span class="expand-icon">▶</span>
            </div>
            <div class="security-body" id="kexts-body">
                ${renderKextDetails(results.kernelExtensions)}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function renderStartupDetails(startupItems) {
    let html = '';
    
    ['systemDaemons', 'userAgents'].forEach(category => {
        const items = startupItems[category] || [];
        html += `<h5>${category.toUpperCase()} (${items.length})</h5>`;
        
        items.slice(0, 20).forEach(item => {
            const flags = item.securityFlags || [];
            const flagsHtml = flags.map(flag => 
                `<span class="security-flag ${flag.includes('THIRD_PARTY') ? 'warning' : ''}">${flag}</span>`
            ).join('');
            
            const itemData = {
                name: item.name,
                path: item.path,
                category: category,
                flags: flags,
                running: !!item.runningProcess
            };
            
            html += `
                <div class="security-item clickable-row" onclick="showRowDetail('security', ${JSON.stringify(itemData).replace(/"/g, '&quot;')})">
                    <div><strong>${item.name}</strong> ${flagsHtml}</div>
                    <div style="font-size: 9px; color: #666;">${item.path}</div>
                    ${item.details?.Program ? `<div>Program: ${item.details.Program}</div>` : ''}
                    ${item.runningProcess ? `<div>🟢 Running (PID: ${item.runningProcess.pid})</div>` : '<div>⚫ Not Running</div>'}
                </div>
            `;
        });
    });
    
    return html;
}

function renderFirewallDetails(firewall) {
    let html = `
        <div class="security-item">
            <div>Application Firewall: ${firewall.applicationFirewall?.enabled ? '✅ ENABLED' : '❌ DISABLED'}</div>
            <div>State Level: ${firewall.applicationFirewall?.state}</div>
        </div>
    `;
    
    if (firewall.detailed) {
        html += `
            <div class="security-item">
                <div>Logging: ${firewall.detailed.logging ? '✅ Enabled' : '❌ Disabled'}</div>
                <div>Stealth Mode: ${firewall.detailed.stealth ? '✅ Enabled' : '❌ Disabled'}</div>
            </div>
        `;
        
        if (firewall.detailed.exceptions?.length > 0) {
            html += `
                <div class="security-item">
                    <div><strong>Exceptions (${firewall.detailed.exceptions.length})</strong></div>
                    ${firewall.detailed.exceptions.slice(0, 10).map(exc => 
                        `<div style="font-size: 9px;">${exc}</div>`
                    ).join('')}
                </div>
            `;
        }
    }
    
    return html;
}

function renderKextDetails(kexts) {
    if (!Array.isArray(kexts)) {
        return '<div>Error loading kernel extensions</div>';
    }
    
    let html = '';
    
    kexts.slice(0, 30).forEach(kext => {
        const flags = kext.securityFlags || [];
        const flagsHtml = flags.map(flag => 
            `<span class="security-flag ${flag === 'THIRD_PARTY' ? 'warning' : ''}">${flag}</span>`
        ).join('');
        
        html += `
            <div class="security-item">
                <div><strong>${kext.name}</strong> ${flagsHtml}</div>
                <div>Size: ${kext.size} | Refs: ${kext.refs} | Address: ${kext.address}</div>
                ${kext.version ? `<div>Version: ${kext.version}</div>` : ''}
            </div>
        `;
    });
    
    return html;
}

function toggleSection(sectionId) {
    const body = document.getElementById(`${sectionId}-body`);
    const icon = body.previousElementSibling.querySelector('.expand-icon');
    
    if (body.classList.contains('expanded')) {
        body.classList.remove('expanded');
        icon.classList.remove('expanded');
    } else {
        body.classList.add('expanded');
        icon.classList.add('expanded');
    }
}

function toggleEditMode() {
    editMode = !editMode;
    const button = event.target;
    
    if (editMode) {
        button.textContent = '💾 SAVE';
        button.style.background = '#34c759';
        makeElementsEditable();
    } else {
        button.textContent = '✏️ EDIT MODE';
        button.style.background = 'var(--border-color)';
        saveEditableContent();
    }
}

function makeElementsEditable() {
    const items = document.querySelectorAll('.security-item div');
    items.forEach(item => {
        if (!item.querySelector('.security-flag')) {
            item.contentEditable = true;
            item.classList.add('editable');
        }
    });
}

function saveEditableContent() {
    const items = document.querySelectorAll('.editable');
    items.forEach(item => {
        item.contentEditable = false;
        item.classList.remove('editable');
    });
    
async function showSystemInfo() {
    console.log('🔍 System info button clicked');
    
    // Check if modal exists, if not create it
    let modal = document.getElementById('system-info-modal');
    if (!modal) {
        console.log('Creating system info modal...');
        modal = document.createElement('div');
        modal.id = 'system-info-modal';
        modal.className = 'system-info-modal';
        modal.innerHTML = `
            <div class="system-info-content">
                <div class="system-info-header">
                    <h2>🍎 About This Mac</h2>
                    <button class="exit-btn" onclick="closeSystemInfo()">✕</button>
                </div>
                <div id="system-info-details">Loading system information...</div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    const details = document.getElementById('system-info-details');
    
    console.log('Modal element:', modal);
    console.log('Details element:', details);
    
    if (!modal || !details) {
        console.error('System info modal elements not found');
        alert('System info modal not found. Please refresh the page.');
        return;
    }
    
    modal.style.display = 'block';
    details.innerHTML = 'Loading system information...';
    
    try {
        console.log('Requesting system info...');
        const systemInfo = await ipcRenderer.invoke('system:get-info');
        
        if (systemInfo.error) {
            throw new Error(systemInfo.error);
        }
        
        console.log('System info received, rendering...');
        details.innerHTML = renderSystemInfo(systemInfo);
    } catch (error) {
        console.error('System info error:', error);
        details.innerHTML = `<div>Error loading system info: ${error.message}</div>`;
    }
}

function renderSystemInfo(info) {
    const uptimeDays = Math.floor(info.uptime / 86400);
    const uptimeHours = Math.floor((info.uptime % 86400) / 3600);
    const uptimeMinutes = Math.floor((info.uptime % 3600) / 60);
    
    const memoryUsed = ((info.totalMemory - info.freeMemory) / 1024 / 1024 / 1024).toFixed(2);
    const memoryTotal = (info.totalMemory / 1024 / 1024 / 1024).toFixed(2);
    const memoryFree = (info.freeMemory / 1024 / 1024 / 1024).toFixed(2);
    
    return `
        <div class="system-info-section">
            <h3>🖥️ Hardware Information</h3>
            <div class="system-info-row">
                <span class="system-info-label">Model:</span>
                <span>${info.modelName || 'Unknown'}</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">Model Identifier:</span>
                <span>${info.modelIdentifier || 'Unknown'}</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">Processor:</span>
                <span>${info.processorName || info.cpus[0]?.model || 'Unknown'}</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">Processor Speed:</span>
                <span>${info.processorSpeed || 'Unknown'}</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">CPU Cores:</span>
                <span>${info.cpus.length} cores @ ${info.cpus[0]?.speed || 'Unknown'} MHz</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">Architecture:</span>
                <span>${info.arch}</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">Serial Number:</span>
                <span>${info.serialNumber || 'Not available'}</span>
            </div>
        </div>
        
        <div class="system-info-section">
            <h3>🍎 macOS Information</h3>
            <div class="system-info-row">
                <span class="system-info-label">macOS Version:</span>
                <span>${info.macOSVersion || 'Unknown'}</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">Build Version:</span>
                <span>${info.buildVersion || 'Unknown'}</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">Kernel Version:</span>
                <span>${info.release}</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">Computer Name:</span>
                <span>${info.hostname}</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">Boot Time:</span>
                <span>${info.bootTime || 'Unknown'}</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">Uptime:</span>
                <span>${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">Load Average:</span>
                <span>${info.loadAverage?.map(l => l.toFixed(2)).join(', ') || 'Unknown'}</span>
            </div>
        </div>
        
        <div class="system-info-section">
            <h3>💾 Memory & Storage</h3>
            <div class="system-info-row">
                <span class="system-info-label">Total Memory:</span>
                <span>${memoryTotal} GB</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">Used Memory:</span>
                <span>${memoryUsed} GB (${((memoryUsed / memoryTotal) * 100).toFixed(1)}%)</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">Free Memory:</span>
                <span>${memoryFree} GB</span>
            </div>
            ${info.diskUsage?.total ? `
            <div class="system-info-row">
                <span class="system-info-label">Disk Usage:</span>
                <span>${info.diskUsage.used} / ${info.diskUsage.total} (${info.diskUsage.percentage})</span>
            </div>
            ` : ''}
            ${info.memorySlots?.length > 0 ? `
            <div class="system-info-row">
                <span class="system-info-label">Memory Slots:</span>
                <span>${info.memorySlots.length} slots installed</span>
            </div>
            ` : ''}
        </div>
        
        <div class="system-info-section">
            <h3>🔐 Security & Permissions</h3>
            <div class="system-info-row">
                <span class="system-info-label">FileVault:</span>
                <span>${info.fileVault || 'Unknown'}</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">Gatekeeper:</span>
                <span>${info.gatekeeperStatus || 'Unknown'}</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">SIP Status:</span>
                <span>${info.sipStatus || 'Unknown'}</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">Admin Access:</span>
                <span>${adminManager?.hasAdminPrivileges() ? '✅ Available' : '❌ Limited'}</span>
            </div>
        </div>
        
        <div class="system-info-section">
            <h3>👤 User Information</h3>
            <div class="system-info-row">
                <span class="system-info-label">Current User:</span>
                <span>${info.currentUser}</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">User ID:</span>
                <span>${info.userInfo.uid}</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">Group ID:</span>
                <span>${info.userInfo.gid}</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">Home Directory:</span>
                <span>${info.homeDirectory}</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">Shell:</span>
                <span>${info.shell}</span>
            </div>
        </div>
        
        <div class="system-info-section">
            <h3>🔧 Developer Tools</h3>
            <div class="system-info-row">
                <span class="system-info-label">Node.js:</span>
                <span>${info.nodeVersion}</span>
            </div>
            ${info.xcodeVersion ? `
            <div class="system-info-row">
                <span class="system-info-label">Xcode:</span>
                <span>${info.xcodeVersion}</span>
            </div>
            ` : ''}
            ${info.pythonVersion ? `
            <div class="system-info-row">
                <span class="system-info-label">Python:</span>
                <span>${info.pythonVersion}</span>
            </div>
            ` : ''}
            ${info.gitVersion ? `
            <div class="system-info-row">
                <span class="system-info-label">Git:</span>
                <span>${info.gitVersion}</span>
            </div>
            ` : ''}
            ${info.brewPackages?.length > 0 ? `
            <div class="system-info-row">
                <span class="system-info-label">Homebrew Packages:</span>
                <span>${info.brewPackages.length} installed (${info.brewPackages.slice(0, 5).join(', ')}...)</span>
            </div>
            ` : ''}
        </div>
        
        ${info.graphicsCards?.length > 0 ? `
        <div class="system-info-section">
            <h3>🎮 Graphics</h3>
            ${info.graphicsCards.map(gpu => `
                <div class="system-info-row">
                    <span class="system-info-label">GPU:</span>
                    <span>${gpu._name || 'Unknown GPU'}</span>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${info.installedApplications?.length > 0 ? `
        <div class="system-info-section">
            <h3>📱 Applications (Sample)</h3>
            <div style="font-size: 9px; line-height: 1.3;">
                ${info.installedApplications.slice(0, 10).join(', ')}
                ${info.installedApplications.length > 10 ? `... and ${info.installedApplications.length - 10} more` : ''}
            </div>
        </div>
        ` : ''}
        
        ${info.systemExtensions?.length > 0 ? `
        <div class="system-info-section">
            <h3>⚙️ System Extensions (Sample)</h3>
            <div style="font-size: 9px; line-height: 1.3; max-height: 100px; overflow-y: auto;">
                ${info.systemExtensions.slice(0, 8).join('<br>')}
            </div>
        </div>
        ` : ''}
        
        <div class="system-info-section">
            <h3>📊 App Information</h3>
            <div class="system-info-row">
                <span class="system-info-label">App Version:</span>
                <span>macOS Gateway Monitor v0.0.1</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">Electron Version:</span>
                <span>${process.versions.electron || 'Unknown'}</span>
            </div>
            <div class="system-info-row">
                <span class="system-info-label">Chrome Version:</span>
                <span>${process.versions.chrome || 'Unknown'}</span>
            </div>
        </div>
    `;
}

function showProcessTooltip(event, processData, networkData) {
    const tooltip = document.getElementById('process-tooltip');
    const proc = processData;
    const net = networkData;
    
    // Determine process type and priority
    const isSystem = isSystemProcess(proc.comm, proc.user);
    const cpuLevel = parseFloat(proc.cpu);
    const memLevel = parseFloat(proc.mem);
    
    let processType = isSystem ? 'System Process' : 'User Process';
    let cpuStatus = cpuLevel > 50 ? 'High' : cpuLevel > 10 ? 'Moderate' : 'Low';
    let memStatus = memLevel > 20 ? 'High' : memLevel > 5 ? 'Moderate' : 'Low';
    
    // Calculate memory in MB
    const totalMemGB = (os.totalmem ? os.totalmem() / 1024 / 1024 / 1024 : 16); // fallback to 16GB
    const memoryMB = ((memLevel / 100) * totalMemGB * 1024).toFixed(1);
    
    // Network activity level
    const bytesIn = parseInt(net.bytes_in) || 0;
    const bytesOut = parseInt(net.bytes_out) || 0;
    const networkActivity = (bytesIn + bytesOut) > 1024 * 1024 ? 'High' : 
                           (bytesIn + bytesOut) > 1024 ? 'Moderate' : 'Low';
    
    tooltip.innerHTML = `
        <div class="tooltip-section">
            <div class="tooltip-header">📊 Process Overview</div>
            <div class="tooltip-row">
                <span class="tooltip-label">Name:</span>
                <span class="tooltip-value">${proc.comm}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Type:</span>
                <span class="tooltip-value">${processType}</span>
            </div>
            <div class="tooltip-explanation">
                ${isSystem ? 'System processes are essential for macOS operation' : 'User processes are applications and services you run'}
            </div>
        </div>
        
        <div class="tooltip-section">
            <div class="tooltip-header">🔢 Process Identifiers</div>
            <div class="tooltip-row">
                <span class="tooltip-label">PID:</span>
                <span class="tooltip-value">${proc.pid}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Parent PID:</span>
                <span class="tooltip-value">${proc.ppid}</span>
            </div>
            <div class="tooltip-explanation">
                PID is unique process identifier. Parent PID shows which process started this one.
            </div>
        </div>
        
        <div class="tooltip-section">
            <div class="tooltip-header">⚡ Performance Metrics</div>
            <div class="tooltip-row">
                <span class="tooltip-label">CPU Usage:</span>
                <span class="tooltip-value">${proc.cpu}% (${cpuStatus})</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Memory:</span>
                <span class="tooltip-value">${proc.mem}% (~${memoryMB}MB)</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Runtime:</span>
                <span class="tooltip-value">${proc.time}</span>
            </div>
            <div class="tooltip-explanation">
                CPU shows processor usage. Memory shows RAM consumption. Runtime is how long it's been running.
            </div>
        </div>
        
        <div class="tooltip-section">
            <div class="tooltip-header">🌐 Network Activity</div>
            <div class="tooltip-row">
                <span class="tooltip-label">Data In:</span>
                <span class="tooltip-value">${formatBytes(net.bytes_in)}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Data Out:</span>
                <span class="tooltip-value">${formatBytes(net.bytes_out)}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Activity:</span>
                <span class="tooltip-value">${networkActivity}</span>
            </div>
            <div class="tooltip-explanation">
                Shows real-time network data transfer. High activity may indicate downloads, uploads, or network services.
            </div>
        </div>
        
        <div class="tooltip-section">
            <div class="tooltip-header">👤 Security Context</div>
            <div class="tooltip-row">
                <span class="tooltip-label">Owner:</span>
                <span class="tooltip-value">${proc.user}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Privileges:</span>
                <span class="tooltip-value">${proc.user === 'root' ? 'Administrator' : 'Standard User'}</span>
            </div>
            <div class="tooltip-explanation">
                Process owner determines security permissions. Root processes have full system access.
            </div>
        </div>
        
        <div class="tooltip-section">
            <div class="tooltip-header">📁 Command Details</div>
            <div style="word-break: break-all; font-size: 9px; color: var(--text-primary);">
                ${proc.args}
            </div>
            <div class="tooltip-explanation">
                Full command path and arguments used to start this process.
            </div>
        </div>
    `;
    
    // Position tooltip near mouse but avoid header overlap
    const headerHeight = 100; // Approximate header + controls height
    const tooltipX = event.pageX + 15;
    const tooltipY = Math.max(event.pageY - 10, headerHeight);
    
    tooltip.style.left = tooltipX + 'px';
    tooltip.style.top = tooltipY + 'px';
    
    // Adjust if tooltip goes off screen
    setTimeout(() => {
        const rect = tooltip.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            tooltip.style.left = (event.pageX - rect.width - 15) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            tooltip.style.top = Math.max((event.pageY - rect.height + 10), headerHeight) + 'px';
        }
        if (rect.top < headerHeight) {
            tooltip.style.top = headerHeight + 'px';
        }
    }, 10);
    
    tooltip.classList.add('visible');
}

    console.log('Security report edits saved');
}

function hideProcessTooltip() {
    const tooltip = document.getElementById('process-tooltip');
    tooltip.classList.remove('visible');
}

function closeSystemInfo() {
    document.getElementById('system-info-modal').style.display = 'none';
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('system-info-modal');
    if (e.target === modal) {
        closeSystemInfo();
    }
});

// Column resizing functionality
let isResizing = false;
let currentColumn = null;
let startX = 0;
let startWidth = 0;

function initColumnResizing() {
    const headers = document.querySelectorAll('.resizable-header');
    
    headers.forEach((header, index) => {
        header.addEventListener('mousedown', (e) => {
            // Only start resizing if clicking near the right edge
            const rect = header.getBoundingClientRect();
            const isNearRightEdge = e.clientX > rect.right - 10;
            
            if (isNearRightEdge || index === headers.length - 1) {
                isResizing = true;
                currentColumn = index;
                startX = e.clientX;
                startWidth = rect.width;
                
                document.addEventListener('mousemove', handleColumnResize);
                document.addEventListener('mouseup', stopColumnResize);
                
                e.preventDefault();
            }
        });
        
        // Change cursor when near resize area
        header.addEventListener('mousemove', (e) => {
            const rect = header.getBoundingClientRect();
            const isNearRightEdge = e.clientX > rect.right - 10;
            
            if (isNearRightEdge || index === headers.length - 1) {
                header.style.cursor = 'col-resize';
            } else {
                header.style.cursor = 'default';
            }
        });
    });
}

function handleColumnResize(e) {
    if (!isResizing) return;
    
    const diff = e.clientX - startX;
    const newWidth = Math.max(30, startWidth + diff); // Minimum 30px width
    
    // Update grid template for all rows
    const processRows = document.querySelectorAll('.process-row, .header-row');
    processRows.forEach(row => {
        const currentTemplate = row.style.gridTemplateColumns || 
            '60px 60px 50px 50px 80px 80px 80px 120px 1fr';
        const columns = currentTemplate.split(' ');
        
        if (currentColumn < columns.length - 1) {
            columns[currentColumn] = newWidth + 'px';
        } else {
            // Last column (command) - make it flexible
            columns[currentColumn] = Math.max(200, newWidth) + 'px';
        }
        
        row.style.gridTemplateColumns = columns.join(' ');
    });
}

function stopColumnResize() {
    isResizing = false;
    currentColumn = null;
    document.removeEventListener('mousemove', handleColumnResize);
    document.removeEventListener('mouseup', stopColumnResize);
}

// Make functions globally available
window.showSystemInfo = showSystemInfo;
window.closeSystemInfo = closeSystemInfo;
window.showTabInfo = showTabInfo;
window.toggleTheme = toggleTheme;
window.exitApp = exitApp;
window.showTab = showTab;
window.performDetailedScan = performDetailedScan;
window.updateScanInterval = updateScanInterval;
window.toggleEditMode = toggleEditMode;
window.selectProcess = selectProcess;
window.closeDetail = closeDetail;
window.showProcessTooltip = showProcessTooltip;
window.hideProcessTooltip = hideProcessTooltip;
window.showNetworkTooltip = showNetworkTooltip;
window.hideNetworkTooltip = hideNetworkTooltip;
window.toggleRoutingView = toggleRoutingView;
window.toggleInterfaceView = toggleInterfaceView;
window.toggleArpView = toggleArpView;
window.showRowDetail = showRowDetail;

// Initialize column resizing when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    
    // Load saved scan interval
    const savedInterval = localStorage.getItem('securityScanInterval');
    if (savedInterval) {
        securityScanIntervalSeconds = parseInt(savedInterval);
        const input = document.getElementById('scan-interval');
        if (input) input.value = securityScanIntervalSeconds;
    }
    
    // Initialize column resizing
    setTimeout(initColumnResizing, 100);
    
    refreshData();
});
