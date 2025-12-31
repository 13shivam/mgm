/**
 * DetailPanel Component - Handles detail panel display and interactions
 */
class DetailPanel {
    constructor() {
        this.panel = null;
        this.content = null;
        this.isVisible = false;
    }

    init() {
        this.panel = document.getElementById('detail-panel');
        this.content = document.getElementById('detail-content');
        
        if (!this.panel || !this.content) {
            throw new Error('Detail panel elements not found');
        }
    }

    show(type, data) {
        if (!this.panel || !this.content) return;
        
        this.panel.style.display = 'block';
        this.isVisible = true;
        
        // Single header with close button
        let content = `
            <div class="detail-header">
                <div class="detail-title">System Information</div>
                <button class="close-detail" onclick="closeDetail()">✕</button>
            </div>
        `;
        
        switch(type) {
            case 'process':
                content += this.renderProcessDetail(data);
                break;
            case 'network':
                content += this.renderNetworkDetail(data);
                break;
            case 'security':
                content += this.renderSecurityDetail(data);
                break;
            case 'routing':
                content += this.renderRoutingDetail(data);
                break;
            case 'interface':
                content += this.renderInterfaceDetail(data);
                break;
            case 'arp':
                content += this.renderArpDetail(data);
                break;
            case 'command':
                content += this.renderCommandDetail(data);
                break;
            case 'dns':
                content += this.renderDnsDetail(data);
                break;
            default:
                content += this.renderError('Unknown detail type');
        }
        
        this.content.innerHTML = content;
    }

    hide() {
        if (this.panel) {
            this.panel.style.display = 'none';
            this.isVisible = false;
        }
    }

    renderProcessDetail(data) {
        const { process: proc, connections, fileDescriptors } = data;
        
        return `
            <div class="detail-section">
                <h4>Process Information</h4>
                <div class="detail-row">
                    <span class="detail-label">Process Name:</span>
                    <span class="detail-value">${proc.comm}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Process ID (PID):</span>
                    <span class="detail-value">${proc.pid}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Owner:</span>
                    <span class="detail-value">${proc.user}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">CPU Usage:</span>
                    <span class="detail-value">${proc.cpu}%</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Memory Usage:</span>
                    <span class="detail-value">${proc.mem}%</span>
                </div>
                <div class="detail-explanation">
                    This process is ${proc.user === 'root' ? 'running with administrator privileges' : 'running as a regular user process'}. 
                    It's currently using ${proc.cpu}% of your Mac's processing power and ${proc.mem}% of available memory. 
                    ${proc.cpu > 50 ? 'High CPU usage may slow down your system.' : 'CPU usage is normal.'}
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Program Location</h4>
                <div class="detail-row">
                    <span class="detail-label">Full Path:</span>
                    <span class="detail-value" style="word-break: break-all;">${proc.args}</span>
                </div>
                <div class="detail-explanation">
                    This shows where the program is stored on your Mac and what parameters it was started with.
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Network Activity (${connections.length} connections)</h4>
                <div style="max-height: 150px; overflow-y: auto;">
                    ${connections.length > 0 ? 
                        connections.map(conn => `
                            <div class="network-item ${conn.type?.toLowerCase()}">
                                ${conn.type} connection to ${conn.name_addr}
                            </div>
                        `).join('') : 
                        '<div style="color: #666;">This process has no active network connections</div>'
                    }
                </div>
                <div class="detail-explanation">
                    Network connections show what servers or services this process is communicating with. 
                    ${connections.length > 0 ? 'Active connections indicate the process is sending or receiving data over the network.' : 'No connections means this process is not currently using the internet.'}
                </div>
            </div>
            
            <div class="detail-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4>File System Access</h4>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-sm" onclick="toggleFileView('files')" id="files-btn" style="background: var(--text-secondary); color: var(--bg-primary);">
                            📁 Files (${fileDescriptors.length})
                        </button>
                        <button class="btn-sm" onclick="toggleFileView('sockets')" id="sockets-btn" style="background: var(--bg-tertiary); color: var(--text-primary);">
                            🌐 Sockets (${connections.length})
                        </button>
                    </div>
                </div>
                
                <div id="files-view" style="max-height: 200px; overflow-y: auto;">
                    ${fileDescriptors.length > 0 ? 
                        fileDescriptors.map(fd => `
                            <div class="network-item">
                                <span style="color: var(--text-secondary); font-weight: bold;">${fd.type}:</span> ${fd.name}
                            </div>
                        `).join('') : 
                        '<div style="color: #666;">No open files detected</div>'
                    }
                </div>
                
                <div id="sockets-view" style="max-height: 200px; overflow-y: auto; display: none;">
                    ${connections.length > 0 ? 
                        connections.map(conn => `
                            <div class="network-item ${conn.type?.toLowerCase()}">
                                <span style="color: var(--text-secondary); font-weight: bold;">${conn.type}:</span> ${conn.name_addr}
                                ${conn.state ? `<span style="color: #888; margin-left: 8px;">[${conn.state}]</span>` : ''}
                            </div>
                        `).join('') : 
                        '<div style="color: #666;">No active network connections</div>'
                    }
                </div>
                
                <div class="detail-explanation" id="files-explanation">
                    Open files show what documents, logs, or system resources this process is currently accessing. 
                    ${fileDescriptors.length > 1000 ? `Showing ${fileDescriptors.length} files (increased limit for detailed analysis).` : ''}
                </div>
                
                <div class="detail-explanation" id="sockets-explanation" style="display: none;">
                    Network sockets show active connections this process has with servers or services. 
                    ${connections.length > 0 ? 'Active connections indicate network communication is happening.' : 'No connections means this process is not using the network.'}
                </div>
            </div>
        `;
    }

    renderNetworkDetail(conn) {
        const { connType, explanation, securityInfo } = this.getConnectionInfo(conn);
        
        return `
            <div class="detail-section">
                <h4>Network Connection Details</h4>
                <div class="detail-row">
                    <span class="detail-label">Connection Type:</span>
                    <span class="detail-value">${connType}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Protocol:</span>
                    <span class="detail-value">${conn.proto}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">${conn.state}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status Meaning:</span>
                    <span class="detail-value">${conn.stateDescription || this.getStateDescription(conn.state)}</span>
                </div>
                ${conn.process ? `
                <div class="detail-row">
                    <span class="detail-label">Process:</span>
                    <span class="detail-value">${conn.process} (PID: ${conn.pid || 'N/A'})</span>
                </div>
                ` : ''}
                ${conn.user ? `
                <div class="detail-row">
                    <span class="detail-label">User:</span>
                    <span class="detail-value">${conn.user}</span>
                </div>
                ` : ''}
                ${conn.fd ? `
                <div class="detail-row">
                    <span class="detail-label">File Descriptor:</span>
                    <span class="detail-value">${conn.fd}</span>
                </div>
                ` : ''}
                <div class="detail-explanation">${explanation}</div>
            </div>
            
            <div class="detail-section">
                <h4>Connection Endpoints</h4>
                <div class="detail-row">
                    <span class="detail-label">Your Mac:</span>
                    <span class="detail-value">${conn.local}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Remote Server:</span>
                    <span class="detail-value">${conn.foreign}</span>
                </div>
                <div class="detail-explanation">
                    Your Mac (${conn.local}) is ${conn.state === 'LISTEN' ? 'waiting for connections from' : 'connected to'} 
                    ${conn.foreign === '0.0.0.0:*' ? 'any external device' : 'the remote server at ' + conn.foreign}.
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Connection State Explanation</h4>
                <div class="detail-explanation">
                    <strong>${conn.state}:</strong> ${conn.stateDescription || this.getStateDescription(conn.state)}
                    <br><br>
                    ${this.getStateImplication(conn.state)}
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Security Information</h4>
                <div class="detail-row">
                    <span class="detail-label">Security Level:</span>
                    <span class="detail-value">${conn.proto.includes('tcp') ? 'Medium' : conn.proto.includes('unix') ? 'High' : 'Low'}</span>
                </div>
                <div class="detail-explanation">${securityInfo}</div>
            </div>
        `;
    }

    renderSecurityDetail(item) {
        let content = '';
        
        switch(item.type) {
            case 'startup':
                content = `
                    <div class="detail-section">
                        <h4>Startup Items - Programs That Auto-Start</h4>
                        <div class="detail-row">
                            <span class="detail-label">System Daemons:</span>
                            <span class="detail-value">${item.data?.systemDaemons?.length || 0}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">User Agents:</span>
                            <span class="detail-value">${item.data?.userAgents?.length || 0}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Login Items:</span>
                            <span class="detail-value">${item.data?.loginItems?.length || 0}</span>
                        </div>
                        <div class="detail-explanation">
                            <strong>What this means for your Mac:</strong><br>
                            System Daemons run in the background and handle essential system functions like networking and security. 
                            User Agents are programs that start when you log in, like menu bar apps and sync services. 
                            Login Items are applications that automatically open when you start your Mac.
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Security Impact</h4>
                        <div class="detail-explanation">
                            <strong>Performance:</strong> Too many startup items can slow down your Mac's boot time and use system resources.<br>
                            <strong>Security:</strong> Each startup item has access to your system. Review unfamiliar items regularly.<br>
                            <strong>Privacy:</strong> Some startup items may collect data or run in the background without your knowledge.
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Recommendations</h4>
                        <div class="detail-explanation">
                            • Review startup items in System Preferences > Users & Groups > Login Items<br>
                            • Disable unnecessary items to improve performance<br>
                            • Only allow trusted applications to start automatically<br>
                            • Regularly audit third-party startup items for security
                        </div>
                    </div>
                `;
                break;
                
            case 'gatekeeper':
                content = `
                    <div class="detail-section">
                        <h4>Gatekeeper - App Security Verification</h4>
                        <div class="detail-row">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value">${item.data?.enabled ? '✅ ENABLED' : '❌ DISABLED'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Details:</span>
                            <span class="detail-value">${item.data?.status || 'Unknown'}</span>
                        </div>
                        <div class="detail-explanation">
                            <strong>What Gatekeeper does:</strong><br>
                            Gatekeeper is Apple's security feature that ensures only trusted software runs on your Mac. 
                            It checks apps for malicious content and verifies they come from identified developers.
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>How This Protects Your Mac</h4>
                        <div class="detail-explanation">
                            <strong>Malware Protection:</strong> Blocks known malicious software from running<br>
                            <strong>Developer Verification:</strong> Ensures apps come from registered Apple developers<br>
                            <strong>Code Signing:</strong> Verifies apps haven't been tampered with after creation<br>
                            <strong>Quarantine:</strong> Safely examines downloaded apps before first run
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Security Recommendation</h4>
                        <div class="detail-explanation">
                            ${item.data?.enabled ? 
                                '✅ Gatekeeper is properly enabled and protecting your Mac from malicious software.' :
                                '⚠️ Gatekeeper is disabled, leaving your Mac vulnerable to malicious software. Enable it in System Preferences > Security & Privacy.'
                            }
                        </div>
                    </div>
                `;
                break;
                
            case 'firewall':
                content = `
                    <div class="detail-section">
                        <h4>Application Firewall - Network Protection</h4>
                        <div class="detail-row">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value">${item.data?.applicationFirewall?.enabled ? '✅ ENABLED' : '❌ DISABLED'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">State Level:</span>
                            <span class="detail-value">${item.data?.applicationFirewall?.state || 'Unknown'}</span>
                        </div>
                        <div class="detail-explanation">
                            <strong>What the Application Firewall does:</strong><br>
                            The firewall controls which applications on your Mac can accept incoming network connections from other devices. 
                            It acts as a barrier between your Mac and potentially harmful network traffic.
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Network Security Benefits</h4>
                        <div class="detail-explanation">
                            <strong>Incoming Connection Control:</strong> Blocks unauthorized access attempts to your Mac<br>
                            <strong>Application Monitoring:</strong> Tracks which apps are communicating over the network<br>
                            <strong>Stealth Mode:</strong> Can make your Mac invisible to network scans<br>
                            <strong>Custom Rules:</strong> Allows you to control network access per application
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Security Status</h4>
                        <div class="detail-explanation">
                            ${item.data?.applicationFirewall?.enabled ? 
                                '✅ Your firewall is active and protecting your Mac from unauthorized network access.' :
                                '⚠️ Your firewall is disabled, making your Mac more vulnerable to network attacks. Enable it in System Preferences > Security & Privacy > Firewall.'
                            }
                        </div>
                    </div>
                `;
                break;
                
            case 'sip':
                content = `
                    <div class="detail-section">
                        <h4>System Integrity Protection - Core System Security</h4>
                        <div class="detail-row">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value">${item.data?.enabled ? '✅ ENABLED' : '❌ DISABLED'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Details:</span>
                            <span class="detail-value">${item.data?.status || 'Unknown'}</span>
                        </div>
                        <div class="detail-explanation">
                            <strong>What SIP protects:</strong><br>
                            System Integrity Protection (SIP) is Apple's security technology that protects critical system files, 
                            directories, and processes from modification by malicious software or unauthorized users.
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>System Protection Features</h4>
                        <div class="detail-explanation">
                            <strong>System File Protection:</strong> Prevents modification of critical macOS files<br>
                            <strong>Process Protection:</strong> Blocks tampering with essential system processes<br>
                            <strong>Kernel Extension Control:</strong> Restricts loading of unauthorized kernel extensions<br>
                            <strong>Runtime Protection:</strong> Prevents code injection into system processes
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Security Assessment</h4>
                        <div class="detail-explanation">
                            ${item.data?.enabled ? 
                                '✅ SIP is enabled and providing maximum protection for your Mac\'s core system components.' :
                                '🚨 SIP is disabled, leaving your Mac\'s system files vulnerable to modification. This significantly reduces your Mac\'s security. SIP can only be re-enabled from Recovery Mode.'
                            }
                        </div>
                    </div>
                `;
                break;
                
            case 'kexts':
                const kextData = Array.isArray(item.data) ? item.data : [];
                const kextCount = kextData.length;
                const appleKexts = kextData.filter(k => k.bundle?.includes('com.apple.') || k.path?.includes('/System/'));
                const thirdPartyKexts = kextData.filter(k => !appleKexts.includes(k));
                const suspiciousKexts = thirdPartyKexts.filter(k => !k.bundle || k.bundle.includes('unknown'));
                
                content = `
                    <div class="detail-section">
                        <h4>⚙️ Kernel Extensions Security Analysis</h4>
                        <div class="detail-row">
                            <span class="detail-label">Total Loaded:</span>
                            <span class="detail-value">${kextCount}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Apple KEXTs:</span>
                            <span class="detail-value" style="color: #f59e0b;">${appleKexts.length}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Third-Party KEXTs:</span>
                            <span class="detail-value" style="color: #ffaa00;">${thirdPartyKexts.length}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Suspicious KEXTs:</span>
                            <span class="detail-value" style="color: #ff6b5a;">${suspiciousKexts.length}</span>
                        </div>
                        
                        <button class="expand-btn" onclick="toggleSecuritySection('all-kexts')" style="margin: 10px 0; padding: 8px 16px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                            🔍 Show All ${kextCount} Kernel Extensions
                        </button>
                        
                        <div id="all-kexts" class="expandable-section" style="display: none; max-height: 400px; overflow-y: auto; margin-top: 10px;">
                            ${suspiciousKexts.length > 0 ? `
                                <h5 style="color: #ff6b5a; margin: 15px 0 10px 0;">🚨 Suspicious KEXTs (${suspiciousKexts.length})</h5>
                                ${suspiciousKexts.map(kext => `
                                    <div style="margin: 6px 0; padding: 8px; background: rgba(255, 107, 90, 0.1); border-left: 3px solid #ff6b5a; border-radius: 4px;">
                                        <strong style="color: #ff6b5a;">${kext.bundle || 'Unknown Bundle'}</strong><br>
                                        <code style="font-size: 11px;">${kext.path || 'Unknown Path'}</code><br>
                                        <span style="font-size: 10px; color: #ff6b5a;">⚠️ Requires security review</span>
                                    </div>
                                `).join('')}
                            ` : ''}
                            
                            <h5 style="color: #ffaa00; margin: 15px 0 10px 0;">🔧 Third-Party KEXTs (${thirdPartyKexts.filter(k => !suspiciousKexts.includes(k)).length})</h5>
                            ${thirdPartyKexts.filter(k => !suspiciousKexts.includes(k)).map(kext => `
                                <div style="margin: 6px 0; padding: 8px; background: rgba(255, 170, 0, 0.1); border-left: 3px solid #ffaa00; border-radius: 4px;">
                                    <strong style="color: #ffaa00;">${kext.bundle || 'Unknown Bundle'}</strong><br>
                                    <code style="font-size: 11px;">${kext.path || 'Unknown Path'}</code><br>
                                    <span style="font-size: 10px; color: #ffaa00;">🔧 Third-party driver</span>
                                </div>
                            `).join('')}
                            
                            <h5 style="color: #f59e0b; margin: 15px 0 10px 0;">🍎 Apple KEXTs (${appleKexts.length})</h5>
                            ${appleKexts.map(kext => `
                                <div style="margin: 6px 0; padding: 8px; background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; border-radius: 4px;">
                                    <strong style="color: #f59e0b;">${kext.bundle || 'Apple System Extension'}</strong><br>
                                    <code style="font-size: 11px;">${kext.path || 'System Path'}</code><br>
                                    <span style="font-size: 10px; color: #f59e0b;">✅ Apple-signed system driver</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Security Assessment</h4>
                        <div class="detail-explanation">
                            <strong>Risk Level:</strong> ${suspiciousKexts.length > 0 ? '🚨 High' : thirdPartyKexts.length > 5 ? '⚠️ Medium' : '✅ Low'}<br>
                            <strong>Apple KEXTs:</strong> Generally safe, signed by Apple<br>
                            <strong>Third-Party KEXTs:</strong> Review vendor reputation and necessity<br>
                            <strong>Suspicious KEXTs:</strong> ${suspiciousKexts.length > 0 ? 'Immediate review recommended' : 'None detected'}<br><br>
                            <strong>Recommendation:</strong> ${suspiciousKexts.length > 0 ? 
                                'Review suspicious KEXTs immediately and remove if unnecessary.' :
                                'Monitor for new third-party KEXTs and verify their sources.'
                            }
                        </div>
                    </div>
                `;
                break;
                
            case 'policies':
                const criticalFiles = item.data.files?.filter(f => f.name.includes('Authorization') || f.name.includes('Security') || f.name.includes('FileVault')) || [];
                const configFiles = item.data.files?.filter(f => !criticalFiles.includes(f)) || [];
                
                content = `
                    <div class="detail-section">
                        <h4>🔒 Security Policy Analysis</h4>
                        <div class="detail-row">
                            <span class="detail-label">FileVault Status:</span>
                            <span class="detail-value" style="color: ${item.data.fileVault === 'Enabled' ? '#f59e0b' : '#ff6b5a'};">${item.data.fileVault || 'Unknown'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Secure Boot:</span>
                            <span class="detail-value" style="color: ${item.data.secureBoot === 'Enabled' ? '#f59e0b' : '#ff6b5a'};">${item.data.secureBoot || 'Unknown'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Critical Policy Files:</span>
                            <span class="detail-value" style="color: #ff6b5a;">${criticalFiles.length}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Configuration Files:</span>
                            <span class="detail-value" style="color: #ef4444;">${configFiles.length}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Security Endpoints:</span>
                            <span class="detail-value" style="color: #f59e0b;">${item.data.endpoints?.length || 0}</span>
                        </div>
                        
                        <button class="expand-btn" onclick="toggleSecuritySection('all-policies')" style="margin: 10px 0; padding: 8px 16px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                            🔐 Show All Security Policies & Files
                        </button>
                        
                        <div id="all-policies" class="expandable-section" style="display: none; max-height: 400px; overflow-y: auto; margin-top: 10px;">
                            <h5 style="color: #ff6b5a; margin: 15px 0 10px 0;">🚨 Critical Security Files (${criticalFiles.length})</h5>
                            ${criticalFiles.map(file => `
                                <div style="margin: 6px 0; padding: 8px; background: rgba(255, 107, 90, 0.1); border-left: 3px solid #ff6b5a; border-radius: 4px;">
                                    <strong style="color: #ff6b5a;">${file.name}</strong><br>
                                    <code style="font-size: 11px;">${file.path}</code><br>
                                    <span style="font-size: 10px; color: #ff6b5a;">🚨 ${file.description}</span>
                                </div>
                            `).join('')}
                            
                            <h5 style="color: #ef4444; margin: 15px 0 10px 0;">⚙️ Configuration Files (${configFiles.length})</h5>
                            ${configFiles.map(file => `
                                <div style="margin: 6px 0; padding: 8px; background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; border-radius: 4px;">
                                    <strong style="color: #ef4444;">${file.name}</strong><br>
                                    <code style="font-size: 11px;">${file.path}</code><br>
                                    <span style="font-size: 10px; color: #ef4444;">⚙️ ${file.description}</span>
                                </div>
                            `).join('')}
                            
                            <h5 style="color: #f59e0b; margin: 15px 0 10px 0;">🌐 Security Endpoints (${item.data.endpoints?.length || 0})</h5>
                            ${item.data.endpoints?.map(endpoint => `
                                <div style="margin: 6px 0; padding: 8px; background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; border-radius: 4px;">
                                    <strong style="color: #f59e0b;">${endpoint.name}</strong><br>
                                    <code style="font-size: 11px;">${endpoint.url}</code><br>
                                    <span style="font-size: 10px; color: #f59e0b;">🌐 ${endpoint.description}</span>
                                </div>
                            `).join('') || '<div>No endpoints configured</div>'}
                        </div>
                    </div>
                `;
                break;
                
            case 'fileDescriptors':
                const fdData = item.data;
                const systemFiles = fdData.fileList?.filter(f => f.type === 'file' && f.file.startsWith('/System/')) || [];
                const userFiles = fdData.fileList?.filter(f => f.type === 'file' && f.file.startsWith('/Users/')) || [];
                const suspiciousFiles = fdData.fileList?.filter(f => f.type === 'file' && (f.file.includes('/tmp/') || f.file.includes('/var/tmp/') || f.file.includes('/.') || f.file.includes('/private/'))) || [];
                const networkConns = fdData.fileList?.filter(f => f.type === 'network') || [];
                
                content = `
                    <div class="detail-section">
                        <h4>📁 File Descriptor Security Analysis</h4>
                        <div class="detail-row">
                            <span class="detail-label">Total Open Files:</span>
                            <span class="detail-value">${fdData.openFiles || 0}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Network Sockets:</span>
                            <span class="detail-value">${fdData.networkSockets || 0}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">System Files:</span>
                            <span class="detail-value" style="color: #f59e0b;">${systemFiles.length}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">User Files:</span>
                            <span class="detail-value" style="color: #ef4444;">${userFiles.length}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Suspicious Locations:</span>
                            <span class="detail-value" style="color: #ff6b5a;">${suspiciousFiles.length}</span>
                        </div>
                        
                        <button class="expand-btn" onclick="toggleSecuritySection('all-files')" style="margin: 10px 0; padding: 8px 16px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                            📂 Show All ${fdData.fileList?.length || 0} File Accesses
                        </button>
                        
                        <div id="all-files" class="expandable-section" style="display: none; max-height: 400px; overflow-y: auto; margin-top: 10px;">
                            <h5 style="color: #ff6b5a; margin: 15px 0 10px 0;">⚠️ Suspicious File Access (${suspiciousFiles.length})</h5>
                            ${suspiciousFiles.map(file => `
                                <div style="margin: 6px 0; padding: 8px; background: rgba(255, 107, 90, 0.1); border-left: 3px solid #ff6b5a; border-radius: 4px;">
                                    <strong style="color: #ff6b5a;">${file.process}</strong> (PID: ${file.pid})<br>
                                    <code style="font-size: 11px;">${file.file}</code><br>
                                    <span style="font-size: 10px; color: #ff6b5a;">⚠️ Temporary or hidden file access</span>
                                </div>
                            `).join('')}
                            
                            <h5 style="color: #ef4444; margin: 15px 0 10px 0;">👤 User File Access (${userFiles.length})</h5>
                            ${userFiles.map(file => `
                                <div style="margin: 6px 0; padding: 8px; background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; border-radius: 4px;">
                                    <strong style="color: #ef4444;">${file.process}</strong> (PID: ${file.pid})<br>
                                    <code style="font-size: 11px;">${file.file}</code>
                                </div>
                            `).join('')}
                            
                            <h5 style="color: #f59e0b; margin: 15px 0 10px 0;">🍎 System File Access (${systemFiles.length})</h5>
                            ${systemFiles.map(file => `
                                <div style="margin: 6px 0; padding: 8px; background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; border-radius: 4px;">
                                    <strong style="color: #f59e0b;">${file.process}</strong> (PID: ${file.pid})<br>
                                    <code style="font-size: 11px;">${file.file}</code>
                                </div>
                            `).join('')}
                            
                            <h5 style="color: #ffaa00; margin: 15px 0 10px 0;">🌐 Network Connections (${networkConns.length})</h5>
                            ${networkConns.map(conn => `
                                <div style="margin: 6px 0; padding: 8px; background: rgba(255, 170, 0, 0.1); border-left: 3px solid #ffaa00; border-radius: 4px;">
                                    <strong style="color: #ffaa00;">${conn.process}</strong> (PID: ${conn.pid})<br>
                                    <code style="font-size: 11px;">${conn.file}</code>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                break;
                
            case 'applications':
                const apps = item.data || [];
                const systemApps = apps.filter(app => app.isSystem);
                const userApps = apps.filter(app => !app.isSystem);
                const suspiciousApps = userApps.filter(app => !app.path.includes('/Applications/'));
                
                content = `
                    <div class="detail-section">
                        <h4>📱 Application Security Analysis</h4>
                        <div class="detail-row">
                            <span class="detail-label">Total Applications:</span>
                            <span class="detail-value">${apps.length}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">System Apps:</span>
                            <span class="detail-value" style="color: #f59e0b;">${systemApps.length}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">User Apps:</span>
                            <span class="detail-value" style="color: #ef4444;">${userApps.length}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Suspicious Locations:</span>
                            <span class="detail-value" style="color: #ff6b5a;">${suspiciousApps.length}</span>
                        </div>
                        
                        <button class="expand-btn" onclick="toggleSecuritySection('all-apps')" style="margin: 10px 0; padding: 8px 16px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                            📋 Show All ${apps.length} Applications
                        </button>
                        
                        <div id="all-apps" class="expandable-section" style="display: none; max-height: 400px; overflow-y: auto; margin-top: 10px;">
                            <h5 style="color: #ff6b5a; margin: 15px 0 10px 0;">⚠️ Suspicious Locations (${suspiciousApps.length})</h5>
                            ${suspiciousApps.map(app => `
                                <div style="margin: 6px 0; padding: 8px; background: rgba(255, 107, 90, 0.1); border-left: 3px solid #ff6b5a; border-radius: 4px;">
                                    <strong style="color: #ff6b5a;">${app.name}</strong><br>
                                    <code style="font-size: 11px;">${app.path}</code><br>
                                    <span style="font-size: 10px; color: #ff6b5a;">⚠️ Non-standard installation location</span>
                                </div>
                            `).join('')}
                            
                            <h5 style="color: #ef4444; margin: 15px 0 10px 0;">👤 User Applications (${userApps.filter(app => app.path.includes('/Applications/')).length})</h5>
                            ${userApps.filter(app => app.path.includes('/Applications/')).map(app => `
                                <div style="margin: 6px 0; padding: 8px; background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; border-radius: 4px;">
                                    <strong style="color: #ef4444;">${app.name}</strong><br>
                                    <code style="font-size: 11px;">${app.path}</code>
                                </div>
                            `).join('')}
                            
                            <h5 style="color: #f59e0b; margin: 15px 0 10px 0;">🍎 System Applications (${systemApps.length})</h5>
                            ${systemApps.map(app => `
                                <div style="margin: 6px 0; padding: 8px; background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; border-radius: 4px;">
                                    <strong style="color: #f59e0b;">${app.name}</strong><br>
                                    <code style="font-size: 11px;">${app.path}</code>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                break;
                
            case 'configurations':
                const configs = item.data || {};
                
                content = `
                    <div class="detail-section">
                        <h4>Security Configuration Files</h4>
                        <div class="detail-row">
                            <span class="detail-label">Configuration Files:</span>
                            <span class="detail-value">${configs.files?.length || 0}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Permissions Level:</span>
                            <span class="detail-value">${configs.permissions || 'Standard'}</span>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Important Security Configuration Files</h4>
                        <div class="detail-explanation" style="max-height: 300px; overflow-y: auto;">
                            ${configs.files && configs.files.length > 0 ? 
                                configs.files.map(file => `
                                    <div style="margin: 8px 0; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px; border-left: 3px solid #ff6b5a;">
                                        <strong>${file.path}</strong><br>
                                        <span style="color: #cccccc; font-size: 12px;">Size: ${file.size} bytes</span><br>
                                        <span style="color: #cccccc; font-size: 12px;">Modified: ${new Date(file.modified).toLocaleString()}</span><br>
                                        <span style="color: #f59e0b; font-size: 11px;">Security-critical system file</span>
                                    </div>
                                `).join('') : 
                                '<div>No configuration files found or access denied</div>'
                            }
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Configuration Security Notes</h4>
                        <div class="detail-explanation">
                            <strong>File Permissions:</strong> These files require admin access to modify<br>
                            <strong>Backup Importance:</strong> Changes to these files can affect system security<br>
                            <strong>Monitoring:</strong> Unexpected changes may indicate security compromise<br>
                            <strong>Recommendation:</strong> Only modify these files when necessary and with proper backups
                        </div>
                    </div>
                `;
                break;
                
            default:
                content = `
                    <div class="detail-section">
                        <h4>Security Information</h4>
                        <div class="detail-explanation">Security configuration details for your Mac.</div>
                    </div>
                `;
        }
        
        return content;
    }

    renderRoutingDetail(route) {
        return `
            <div class="detail-section">
                <h4>Network Route - Traffic Direction</h4>
                <div class="detail-row">
                    <span class="detail-label">Route Type:</span>
                    <span class="detail-value">${route.destination === 'default' ? 'Default Gateway' : 'Local Network Route'}</span>
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
                <div class="detail-explanation">
                    ${route.destination === 'default' ? 
                        'This is your default gateway - the router that handles all internet traffic and connections to other networks. All traffic that doesn\'t match specific routes goes through here.' :
                        'This route handles traffic to devices on your local network (like other computers, printers, or smart devices in your home or office).'
                    }
                </div>
            </div>
            
            <div class="detail-section">
                <h4>How This Affects Your Mac</h4>
                <div class="detail-explanation">
                    <strong>Traffic Flow:</strong> When your Mac needs to send data to ${route.destination === 'default' ? 'any internet address' : 'this specific network'}, 
                    it sends the data through ${route.gateway} using the ${route.interface} network interface.<br><br>
                    <strong>Performance Impact:</strong> ${route.destination === 'default' ? 
                        'Your default gateway\'s speed and reliability directly affects your internet performance.' :
                        'Local network routes are typically very fast since they don\'t go through the internet.'
                    }
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Technical Details</h4>
                <div class="detail-explanation">
                    <strong>Gateway Address:</strong> ${route.gateway} is the IP address of the router or device that forwards your traffic.<br>
                    <strong>Network Interface:</strong> ${route.interface} is the physical or virtual network adapter on your Mac handling this connection.<br>
                    <strong>Routing Priority:</strong> ${route.destination === 'default' ? 
                        'Default routes have the lowest priority and are used when no specific route matches.' :
                        'Specific routes have higher priority than the default route.'
                    }
                </div>
            </div>
        `;
    }

    renderInterfaceDetail(iface) {
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
        
        return `
            <div class="detail-section">
                <h4>Network Interface Details</h4>
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
                <h4>How This Affects Your Mac</h4>
                <div class="detail-explanation">
                    <strong>Connection Status:</strong> ${iface.status === 'UP' ? 
                        'This interface is active and can send/receive network traffic.' :
                        'This interface is inactive and not handling network traffic.'
                    }<br><br>
                    <strong>Network Performance:</strong> ${iface.name.includes('en') ? 
                        'This is your primary internet connection. Its speed and stability affect your browsing, downloads, and online activities.' :
                        iface.name.includes('lo') ?
                        'This loopback interface is essential for many applications to function properly on your Mac.' :
                        'This specialized interface provides specific networking functionality.'
                    }
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Technical Information</h4>
                <div class="detail-explanation">
                    <strong>MTU (Maximum Transmission Unit):</strong> ${iface.mtu || 'Unknown'} bytes is the largest packet size that can be sent through this interface. 
                    Larger MTU values can improve performance but may cause issues with some networks.<br><br>
                    <strong>IP Address:</strong> ${iface.ip ? 
                        `${iface.ip} is this interface's network address, used by other devices to communicate with your Mac.` :
                        'No IP address is assigned to this interface, so it cannot send or receive network traffic.'
                    }
                </div>
            </div>
        `;
    }

    renderArpDetail(arpEntry) {
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
        
        return `
            <div class="detail-section">
                <h4>Network Device Information</h4>
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
                <h4>What This Means for Your Mac</h4>
                <div class="detail-explanation">
                    <strong>Network Communication:</strong> Your Mac has recently communicated with this device, which is why it appears in the ARP table.<br><br>
                    <strong>Local Network:</strong> This device is on the same local network as your Mac, meaning they can communicate directly without going through the internet.<br><br>
                    <strong>Security Context:</strong> ${arpEntry.ip.endsWith('.1') ? 
                        'As your router/gateway, this device has significant control over your network traffic and internet access.' :
                        'This device can potentially communicate with your Mac if network security settings allow it.'
                    }
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Technical Details</h4>
                <div class="detail-explanation">
                    <strong>ARP (Address Resolution Protocol):</strong> This table shows the mapping between IP addresses (network addresses) 
                    and MAC addresses (hardware addresses) for devices your Mac has recently communicated with on the local network.<br><br>
                    <strong>MAC Address:</strong> ${arpEntry.mac} is the unique hardware identifier for this device's network card. 
                    It never changes and is used for local network communication.<br><br>
                    <strong>IP Address:</strong> ${arpEntry.ip} is the network address assigned to this device, which can change but is currently being used for communication.
                </div>
            </div>
        `;
    }

    renderError(message) {
        this.content.innerHTML = `
            <div class="detail-header">
                <div class="detail-title">❌ Error</div>
                <button class="close-detail" onclick="closeDetail()">✕</button>
            </div>
            <div class="detail-section">
                <div class="detail-explanation">${message}</div>
            </div>
        `;
    }

    renderDnsDetail(dnsData) {
        let content = '';
        
        switch(dnsData.type) {
            case 'nameservers':
                content = `
                    <div class="detail-section">
                        <h4>DNS Servers - Your Mac's Internet Directory</h4>
                        <div class="detail-explanation">
                            DNS (Domain Name System) servers are like the internet's phone book. When you type "google.com" in your browser, 
                            these servers tell your Mac the actual IP address (like 172.217.164.110) to connect to.
                        </div>
                    </div>
                    
                    ${dnsData.data.map(server => `
                        <div class="detail-section">
                            <div class="detail-row">
                                <span class="detail-label">Server Address:</span>
                                <span class="detail-value">${server.ip}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Provider:</span>
                                <span class="detail-value">${server.type}</span>
                            </div>
                            <div class="detail-explanation">
                                ${this.getDnsServerExplanation(server)}
                            </div>
                        </div>
                    `).join('')}
                    
                    <div class="detail-section">
                        <h4>How This Affects Your Mac</h4>
                        <div class="detail-explanation">
                            <strong>When you browse the web:</strong><br>
                            1. You type a website address in your browser<br>
                            2. Your Mac asks these DNS servers "What's the IP address for this website?"<br>
                            3. DNS server responds with the actual IP address<br>
                            4. Your Mac connects to that IP address to load the website<br><br>
                            <strong>Performance Impact:</strong> Faster DNS servers mean websites load quicker. Slower DNS can make your internet feel sluggish even with fast WiFi.
                        </div>
                    </div>
                `;
                break;
                
            case 'search':
                content = `
                    <div class="detail-section">
                        <h4>DNS Search Domains - Auto-Complete for Network Names</h4>
                        <div class="detail-explanation">
                            Search domains help your Mac automatically complete partial network names. This is especially useful in corporate or home networks.
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Your Configured Search Domains</h4>
                        ${dnsData.data.map(domain => `
                            <div class="detail-row">
                                <span class="detail-label">Search Domain:</span>
                                <span class="detail-value">${domain}</span>
                            </div>
                        `).join('')}
                        <div class="detail-explanation">
                            <strong>How this helps your Mac:</strong><br>
                            If you type just "server" in a browser or network connection, your Mac will automatically try:<br>
                            ${dnsData.data.map(domain => `• server.${domain}`).join('<br>')}<br><br>
                            This saves you from typing full domain names for local network resources.
                        </div>
                    </div>
                `;
                break;
                
            case 'resolver':
                content = `
                    <div class="detail-section">
                        <h4>DNS Resolver Configuration - How Your Mac Handles DNS</h4>
                        <div class="detail-explanation">
                            The DNS resolver controls the technical details of how your Mac processes DNS queries, including timeouts and retry behavior.
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Current Configuration</h4>
                        ${dnsData.data.map(config => `
                            <div class="detail-row">
                                <span class="detail-label">Setting:</span>
                                <span class="detail-value" style="word-break: break-all; font-size: 11px;">${config}</span>
                            </div>
                        `).join('')}
                        <div class="detail-explanation">
                            <strong>What this means for your Mac:</strong><br>
                            These settings determine how long your Mac waits for DNS responses and what to do if a DNS server doesn't respond. 
                            Proper configuration ensures reliable internet connectivity even when some DNS servers are slow or unavailable.
                        </div>
                    </div>
                `;
                break;
                
            default:
                content = `
                    <div class="detail-section">
                        <h4>DNS Configuration Information</h4>
                        <div class="detail-explanation">
                            This shows technical DNS configuration details for your Mac's network connection.
                        </div>
                    </div>
                `;
        }
        
        return content;
    }

    getDnsServerExplanation(server) {
        switch(server.type) {
            case 'Google DNS':
                return 'Google\'s public DNS service (8.8.8.8). Very fast and reliable worldwide, but Google may analyze queries for service improvement. Good choice for speed.';
            case 'Cloudflare DNS':
                return 'Cloudflare\'s privacy-focused DNS service (1.1.1.1). Extremely fast with a strong commitment to not log or sell your browsing data. Excellent for privacy.';
            case 'OpenDNS':
                return 'Cisco\'s DNS service with built-in security features. Can block malicious websites and offers parental controls. Good for families and security-conscious users.';
            case 'Quad9 DNS':
                return 'Security-focused DNS (9.9.9.9) that automatically blocks access to malicious domains and doesn\'t log personal data. Excellent for security without sacrificing privacy.';
            case 'Local Router/Gateway':
                return 'Your router\'s DNS service. Usually forwards requests to your ISP\'s DNS servers. Convenient but may be slower than public DNS services.';
            case 'ISP/Custom DNS':
                return 'DNS server provided by your Internet Service Provider or a custom service. Performance and privacy policies vary by provider.';
            case 'Local System':
                return 'Local DNS resolver running on this Mac. Often used for development work or special network configurations.';
            default:
                return 'This DNS server helps translate website names into IP addresses so your Mac can connect to them.';
        }
    }

    getConnectionInfo(conn) {
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
        
        return { connType, explanation, securityInfo };
    }

    getStateDescription(state) {
        const descriptions = {
            'LISTEN': 'Waiting for incoming connections',
            'ESTABLISHED': 'Active connection with data transfer',
            'TIME_WAIT': 'Connection closed, waiting for remote shutdown',
            'CLOSE_WAIT': 'Remote end closed, waiting for local close',
            'FIN_WAIT': 'Connection closing, waiting for remote close',
            'FIN_WAIT_1': 'Connection closing, sent close request',
            'FIN_WAIT_2': 'Connection closing, waiting for remote close',
            'SYN_SENT': 'Attempting to establish connection',
            'SYN_RECV': 'Connection request received, establishing',
            'CLOSED': 'Connection is closed',
            'CLOSING': 'Both sides closing simultaneously',
            'LAST_ACK': 'Waiting for final acknowledgment',
            'UNKNOWN': 'Connection state unknown'
        };
        return descriptions[state] || 'Unknown connection state';
    }

    getStateImplication(state) {
        const implications = {
            'LISTEN': 'Your Mac is offering a service that other devices can connect to. This is normal for servers, file sharing, or system services.',
            'ESTABLISHED': 'Your Mac has an active connection exchanging data. This could be web browsing, file downloads, or app communications.',
            'TIME_WAIT': 'A connection was recently closed and your Mac is ensuring all data was properly received before fully releasing the connection.',
            'CLOSE_WAIT': 'The remote server closed the connection, but your Mac hasn\'t finished cleaning up yet. This usually resolves quickly.',
            'FIN_WAIT': 'Your Mac initiated closing this connection and is waiting for the remote side to acknowledge and close their end.',
            'SYN_SENT': 'Your Mac is trying to connect to a remote server. If this persists, the server may be unreachable.',
            'SYN_RECV': 'Another device is trying to connect to a service on your Mac. The connection is being established.',
            'CLOSED': 'This connection is fully closed and no longer active.',
            'UNKNOWN': 'The connection state couldn\'t be determined. This may indicate a system issue or unsupported connection type.'
        };
        return implications[state] || 'This connection state requires further investigation.';
    }

    renderCommandDetail(cmd) {
        return `
            <div class="detail-section">
                <h4>Command Analysis</h4>
                <div class="detail-row">
                    <span class="detail-label">Executable:</span>
                    <span class="detail-value">${cmd.executable}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Full Path:</span>
                    <span class="detail-value">${cmd.path}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Arguments:</span>
                    <span class="detail-value">${cmd.arguments || 'None'}</span>
                </div>
                <div class="detail-explanation">
                    This command represents the executable and its arguments that the process is running.
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Full Command</h4>
                <div class="detail-explanation" style="font-family: monospace; background: var(--bg-tertiary); padding: 8px; border-radius: 4px; word-break: break-all;">
                    ${cmd.fullCommand}
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Search Actions</h4>
                <div class="detail-explanation">
                    • Use the filter box to find all processes running this executable<br>
                    • Copy the command to clipboard for further analysis<br>
                    • Check if this is a system process or user application
                </div>
            </div>
        `;
    }
}

module.exports = DetailPanel;
