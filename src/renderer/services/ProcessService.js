/**
 * ProcessService - Handles all process-related business logic
 */
const { SYSTEM_PROCESSES, PROCESS_LIMITS, CSS_CLASSES, THRESHOLDS } = require('../utils/constants');
const { isValidPid, isValidFilter, isValidSortBy, validateProcessData } = require('../utils/validators');

class ProcessService {
    constructor() {
        this.processes = [];
        this.networkUsage = [];
        this.selectedPid = null;
    }

    isSystemProcess(comm, user) {
        return SYSTEM_PROCESSES.some(sys => comm.includes(sys)) || 
               comm.startsWith('/System/') || 
               user === 'root' || user === '_system';
    }

    async loadProcesses() {
        const { ipcRenderer } = require('electron');
        try {
            const [processData, netData] = await Promise.all([
                ipcRenderer.invoke('get-processes'),
                ipcRenderer.invoke('get-network-usage')
            ]);
            
            // Validate data
            this.processes = processData.filter(validateProcessData);
            this.networkUsage = netData || [];
            
            return { processes: this.processes, networkUsage: this.networkUsage };
        } catch (error) {
            throw new Error(`Failed to load processes: ${error.message}`);
        }
    }

    filterAndSortProcesses(filter = '', sortBy = 'cpu') {
        if (!isValidFilter(filter) || !isValidSortBy(sortBy)) {
            throw new Error('Invalid filter or sort parameters');
        }

        let filtered = this.processes.filter(proc => 
            !filter || 
            proc.comm.toLowerCase().includes(filter.toLowerCase()) || 
            proc.pid.includes(filter) ||
            proc.args.toLowerCase().includes(filter.toLowerCase())
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
        
        return filtered.slice(0, PROCESS_LIMITS.MAX_DISPLAY);
    }

    getProcessNetworkUsage(pid) {
        return this.networkUsage.find(net => net.pid === pid) || 
               { bytes_in: '0', bytes_out: '0' };
    }

    getProcessClassification(proc) {
        const isSystem = this.isSystemProcess(proc.comm, proc.user);
        const cpu = parseFloat(proc.cpu);
        const mem = parseFloat(proc.mem);
        
        let className = 'process-row';
        if (isSystem) className += ` ${CSS_CLASSES.PROCESS.SYSTEM}`;
        else className += ` ${CSS_CLASSES.PROCESS.USER}`;
        if (cpu > THRESHOLDS.CPU.HIGH) className += ` ${CSS_CLASSES.PROCESS.HIGH_CPU}`;
        if (mem > THRESHOLDS.MEMORY.HIGH) className += ` ${CSS_CLASSES.PROCESS.HIGH_MEM}`;
        if (proc.pid === this.selectedPid) className += ` ${CSS_CLASSES.PROCESS.SELECTED}`;
        
        if (proc.args.toLowerCase().includes('amazon') ||
            proc.args.toLowerCase().includes(' q ') ||
            proc.comm.toLowerCase().includes('q') ||
            proc.args.toLowerCase().includes('q chat') ||
            proc.args.toLowerCase().includes('q-cli')) {
            className += ` ${CSS_CLASSES.PROCESS.AMAZON_Q}`;
        }
        
        return className;
    }

    async getProcessDetails(pid) {
        if (!isValidPid(pid)) {
            throw new Error('Invalid process ID');
        }

        const { ipcRenderer } = require('electron');
        try {
            const [connections, fds] = await Promise.all([
                ipcRenderer.invoke('get-process-connections', pid),
                ipcRenderer.invoke('get-process-fds', pid)
            ]);
            
            const proc = this.processes.find(p => p.pid === pid);
            return { 
                process: proc, 
                connections: connections.slice(0, PROCESS_LIMITS.MAX_CONNECTIONS), 
                fileDescriptors: fds.slice(0, PROCESS_LIMITS.MAX_FILE_DESCRIPTORS) 
            };
        } catch (error) {
            throw new Error(`Failed to get process details: ${error.message}`);
        }
    }

    selectProcess(pid) {
        if (isValidPid(pid)) {
            this.selectedPid = pid;
        }
    }

    clearSelection() {
        this.selectedPid = null;
    }
}

module.exports = ProcessService;
