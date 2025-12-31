const { spawn } = require('child_process');
const AdminManager = require('./AdminManager');

class SystemMonitor {
    constructor() {
        if (SystemMonitor.instance) {
            return SystemMonitor.instance;
        }
        this.adminManager = new AdminManager();
        this.networkUsageCache = null;
        this.networkUsageCacheTime = 0;
        this.networkWarningLogged = false;
        this.networkErrorLogged = false;
        SystemMonitor.instance = this;
    }

    // Execute regular command
    async exec(command, args = []) {
        return new Promise((resolve, reject) => {
            const proc = spawn(command, args);
            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (data) => stdout += data.toString());
            proc.stderr.on('data', (data) => stderr += data.toString());
            
            proc.on('close', (code) => {
                if (code === 0) resolve({ stdout, stderr });
                else reject(new Error(`Command failed: ${stderr}`));
            });
        });
    }

    // Get detailed process information
    async getProcesses() {
        try {
            const { stdout } = await this.exec('ps', ['-eo', 'pid,ppid,pcpu,pmem,rss,vsz,time,user,comm,args']);
            return this.parseProcesses(stdout);
        } catch (error) {
            throw new Error(`Failed to get processes: ${error.message}`);
        }
    }

    parseProcesses(output) {
        const lines = output.split('\n').slice(1);
        return lines.map(line => {
            if (line.trim()) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 10) {
                    return {
                        pid: parts[0],
                        ppid: parts[1],
                        cpu: parseFloat(parts[2]),
                        mem: parseFloat(parts[3]),
                        rss: parseInt(parts[4]),
                        vsz: parseInt(parts[5]),
                        time: parts[6],
                        user: parts[7],
                        comm: parts[8],
                        args: parts.slice(9).join(' ') || parts[8]
                    };
                }
            }
        }).filter(Boolean);
    }

    // Get network connections with sudo
    async getNetworkConnections() {
        try {
            // Try to get admin privileges if not already available
            if (!this.adminManager.hasAdminPrivileges()) {
                console.log('🔐 Requesting admin privileges for network process information...');
                try {
                    await this.adminManager.requestAdminPrivileges();
                } catch (error) {
                    console.log('❌ Admin privileges denied, using basic netstat');
                }
            }

            if (this.adminManager.hasAdminPrivileges()) {
                // Use lsof to get process information with connections
                const { stdout } = await this.adminManager.execWithPrivileges('lsof', ['-i', '-n', '-P']);
                console.log('🔍 lsof output sample:', stdout.split('\n').slice(0, 10).join('\n'));
                const result = this.parseNetworkConnectionsWithProcess(stdout);
                console.log('🔍 Parsed connections sample:', result.slice(0, 3));
                return result;
            } else {
                console.log('No admin privileges, using netstat fallback');
                // Fallback to netstat without process info
                const { stdout } = await this.exec('netstat', ['-an']);
                return this.parseNetworkConnections(stdout);
            }
        } catch (error) {
            console.log('lsof failed, using netstat fallback:', error.message);
            // Final fallback to basic netstat
            const { stdout } = await this.exec('netstat', ['-an']);
            return this.parseNetworkConnections(stdout);
        }
    }

    parseNetworkConnectionsWithProcess(output) {
        const lines = output.split('\n').slice(1);
        return lines.map(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 8) {
                // lsof format: COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME
                const command = parts[0];
                const pid = parts[1];
                const user = parts[2];
                const fd = parts[3];
                const type = parts[4];
                const name = parts[parts.length - 1]; // Last column is NAME (connection info)
                
                // Parse connection info from NAME field
                let local = '', foreign = '', state = 'UNKNOWN', proto = type;
                
                if (name && name.includes(':')) {
                    if (name.includes('->')) {
                        // TCP connection: local->foreign (STATE)
                        const connParts = name.split('->');
                        local = connParts[0];
                        const foreignAndState = connParts[1];
                        if (foreignAndState.includes(' (')) {
                            foreign = foreignAndState.split(' (')[0];
                            state = foreignAndState.split(' (')[1].replace(')', '');
                        } else {
                            foreign = foreignAndState;
                            state = 'ESTABLISHED';
                        }
                        proto = 'TCP';
                    } else if (name.includes('*:')) {
                        // Listening socket
                        local = name;
                        foreign = '*:*';
                        state = 'LISTEN';
                        proto = type.includes('6') ? 'TCP6' : 'TCP';
                    } else {
                        // UDP or other
                        local = name;
                        foreign = '*:*';
                        state = 'UDP';
                        proto = 'UDP';
                    }
                }
                
                return {
                    proto: proto,
                    local: local,
                    foreign: foreign,
                    state: this.normalizeConnectionState(state),
                    process: command || 'unknown',
                    pid: pid || 'unknown',
                    user: user || 'unknown',
                    fd: fd || 'unknown',
                    stateDescription: this.getStateDescription(this.normalizeConnectionState(state))
                };
            }
        }).filter(Boolean);
    }

    normalizeConnectionState(state) {
        if (!state || state === 'unknown') return 'UNKNOWN';
        if (state.includes('LISTEN')) return 'LISTEN';
        if (state.includes('ESTABLISHED')) return 'ESTABLISHED';
        if (state.includes('TIME_WAIT')) return 'TIME_WAIT';
        if (state.includes('CLOSE_WAIT')) return 'CLOSE_WAIT';
        if (state.includes('FIN_WAIT')) return 'FIN_WAIT';
        if (state.includes('SYN_SENT')) return 'SYN_SENT';
        if (state.includes('SYN_RECV')) return 'SYN_RECV';
        return state.toUpperCase();
    }

    getStateDescription(state) {
        const descriptions = {
            'LISTEN': 'Waiting for incoming connections',
            'ESTABLISHED': 'Active connection with data transfer',
            'TIME_WAIT': 'Connection closed, waiting for remote shutdown',
            'CLOSE_WAIT': 'Remote end closed, waiting for local close',
            'FIN_WAIT': 'Connection closing, waiting for remote close',
            'SYN_SENT': 'Attempting to establish connection',
            'SYN_RECV': 'Connection request received, establishing',
            'CLOSED': 'Connection is closed',
            'UNKNOWN': 'Connection state unknown'
        };
        return descriptions[state] || 'Unknown connection state';
    }

    parseNetworkConnections(output) {
        const lines = output.split('\n').slice(2);
        return lines.map(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 6) {
                return {
                    proto: parts[0],
                    recv: parts[1],
                    send: parts[2],
                    local: parts[3],
                    foreign: parts[4],
                    state: this.normalizeConnectionState(parts[5]),
                    process: 'unknown',
                    pid: 'unknown',
                    user: 'unknown',
                    fd: 'unknown',
                    stateDescription: this.getStateDescription(this.normalizeConnectionState(parts[5]))
                };
            }
        }).filter(Boolean);
    }

    // Get process network usage with caching
    async getProcessNetworkUsage() {
        const now = Date.now();
        if (this.networkUsageCache && (now - this.networkUsageCacheTime) < 5000) {
            return this.networkUsageCache;
        }

        try {
            if (this.adminManager.hasAdminPrivileges()) {
                // Use adminManager for consistent privilege handling
                const { stdout } = await this.adminManager.execWithPrivileges('nettop', ['-P', '-l', '1', '-t', 'wifi,wired']);
                this.networkUsageCache = this.parseNetworkUsage(stdout);
                this.networkUsageCacheTime = now;
                return this.networkUsageCache;
            } else {
                // Only log warning once
                if (!this.networkWarningLogged) {
                    try {
                        console.info('ℹ️ Network usage monitoring requires admin privileges for detailed process information');
                    } catch (e) {
                        // Ignore console write errors
                    }
                    this.networkWarningLogged = true;
                }
                return this.networkUsageCache || [];
            }
        } catch (error) {
            if (!this.networkErrorLogged) {
                try {
                    console.info('ℹ️ Network usage monitoring unavailable - admin privileges required');
                } catch (e) {
                    // Ignore console write errors
                }
                this.networkErrorLogged = true;
            }
            return this.networkUsageCache || [];
        }
    }

    // Get process network connections
    async getProcessConnections(pid) {
        try {
            const { stdout } = await this.exec('lsof', ['-Pan', '-p', pid, '-i']);
            const lines = stdout.split('\n').slice(1);
            return lines.map(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 9) {
                    return {
                        name: parts[0],
                        pid: parts[1],
                        user: parts[2],
                        fd: parts[3],
                        type: parts[4],
                        device: parts[5],
                        size: parts[6],
                        node: parts[7],
                        name_addr: parts[8]
                    };
                }
            }).filter(Boolean);
        } catch (error) {
            return [];
        }
    }

    // Get process file descriptors
    async getProcessFileDescriptors(pid) {
        try {
            const { stdout } = await this.exec('lsof', ['-p', pid]);
            const lines = stdout.split('\n').slice(1);
            return lines.map(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 9) {
                    return {
                        command: parts[0],
                        pid: parts[1],
                        user: parts[2],
                        fd: parts[3],
                        type: parts[4],
                        device: parts[5],
                        size: parts[6],
                        node: parts[7],
                        name: parts.slice(8).join(' ')
                    };
                }
            }).filter(Boolean);
        } catch (error) {
            return [];
        }
    }

    parseNetworkUsage(output) {
        const lines = output.split('\n');
        const processes = [];
        
        lines.forEach(line => {
            const match = line.match(/(\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.+)/);
            if (match) {
                processes.push({
                    pid: match[1],
                    bytes_in: match[2],
                    bytes_out: match[3],
                    packets_in: match[4],
                    packets_out: match[5],
                    cc: match[6],
                    process: match[7]
                });
            }
        });
        
        return processes;
    }
}

module.exports = SystemMonitor;
