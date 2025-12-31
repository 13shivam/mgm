/**
 * ProcessTable Component - Handles process table rendering and interactions
 */
class ProcessTable {
    constructor(processService, formatters) {
        this.processService = processService;
        this.formatters = formatters;
        this.container = null;
    }

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container ${containerId} not found`);
        }
    }

    render(filter = '', sortBy = 'cpu') {
        if (!this.container) return;

        const filtered = this.processService.filterAndSortProcesses(filter, sortBy);
        
        this.container.innerHTML = filtered.map(proc => {
            const className = this.processService.getProcessClassification(proc);
            const netUsage = this.processService.getProcessNetworkUsage(proc.pid);
            
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
                     onmouseenter="showProcessTooltip(event, ${this.formatters.sanitizeForHTML(JSON.stringify(procData))}, ${this.formatters.sanitizeForHTML(JSON.stringify(netData))})"
                     onmouseleave="hideProcessTooltip()">
                    <div class="process-cell">${proc.pid}</div>
                    <div class="process-cell">${proc.ppid}</div>
                    <div class="process-cell">${proc.cpu}</div>
                    <div class="process-cell">${proc.mem}</div>
                    <div class="process-cell">${proc.user}</div>
                    <div class="process-cell">${netUsage.bytes_in ? this.formatters.formatBytes(netUsage.bytes_in) : '-'}</div>
                    <div class="process-cell">${netUsage.bytes_out ? this.formatters.formatBytes(netUsage.bytes_out) : '-'}</div>
                    <div class="process-cell">${proc.time}</div>
                    <div class="command-cell" title="${proc.args}">${proc.args}</div>
                </div>
            `;
        }).join('');
    }

    renderSearchResults(searchResults, filter, sortBy) {
        if (!this.container) return;

        // Sort the search results using the existing method
        const sorted = this.sortSearchResults(searchResults, sortBy);
        
        this.container.innerHTML = sorted.map(proc => {
            const className = this.processService.getProcessClassification(proc);
            const netUsage = this.processService.getProcessNetworkUsage(proc.pid);
            
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
                <div class="${className} search-result" onclick="selectProcess('${proc.pid}')" 
                     onmouseenter="showProcessTooltip(event, ${this.formatters.sanitizeForHTML(JSON.stringify(procData))}, ${this.formatters.sanitizeForHTML(JSON.stringify(netData))})"
                     onmouseleave="hideProcessTooltip()">
                    <div class="process-cell">${proc.pid}</div>
                    <div class="process-cell">${proc.ppid}</div>
                    <div class="process-cell">${proc.cpu}</div>
                    <div class="process-cell">${proc.mem}</div>
                    <div class="process-cell">${proc.user}</div>
                    <div class="process-cell">${netUsage.bytes_in ? this.formatters.formatBytes(netUsage.bytes_in) : '-'}</div>
                    <div class="process-cell">${netUsage.bytes_out ? this.formatters.formatBytes(netUsage.bytes_out) : '-'}</div>
                    <div class="process-cell">${proc.time}</div>
                    <div class="command-cell" title="${proc.args}">${this.highlightSearchTerm(proc.args, filter)}</div>
                </div>
            `;
        }).join('');
    }

    sortSearchResults(processes, sortBy) {
        return [...processes].sort((a, b) => {
            switch (sortBy) {
                case 'cpu':
                    return parseFloat(b.cpu) - parseFloat(a.cpu);
                case 'mem':
                    return parseFloat(b.mem) - parseFloat(a.mem);
                case 'pid':
                    return parseInt(a.pid) - parseInt(b.pid);
                case 'comm':
                    return a.comm.localeCompare(b.comm);
                default:
                    return parseFloat(b.cpu) - parseFloat(a.cpu);
            }
        });
    }

    highlightSearchTerm(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark style="background: #f59e0b; color: #000;">$1</mark>');
    }

    async refresh(filter, sortBy) {
        try {
            await this.processService.loadProcesses();
            this.render(filter, sortBy);
        } catch (error) {
            this.container.innerHTML = `<div class="error">ERROR: ${error.message}</div>`;
        }
    }

    getSelectedProcess() {
        return this.processService.selectedPid;
    }
}

module.exports = ProcessTable;
