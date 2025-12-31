/**
 * ProcessService Unit Tests
 */
const ProcessService = require('../../renderer/services/ProcessService');

// Mock electron
jest.mock('electron', () => ({
    ipcRenderer: {
        invoke: jest.fn()
    }
}));

describe('ProcessService', () => {
    let processService;
    let mockIpcRenderer;

    beforeEach(() => {
        processService = new ProcessService();
        mockIpcRenderer = require('electron').ipcRenderer;
        jest.clearAllMocks();
    });

    describe('isSystemProcess', () => {
        test('should identify system processes correctly', () => {
            expect(processService.isSystemProcess('kernel_task', 'root')).toBe(true);
            expect(processService.isSystemProcess('launchd', 'root')).toBe(true);
            expect(processService.isSystemProcess('/System/Library/test', 'user')).toBe(true);
            expect(processService.isSystemProcess('chrome', 'user')).toBe(false);
        });

        test('should identify root processes as system', () => {
            expect(processService.isSystemProcess('custom_daemon', 'root')).toBe(true);
            expect(processService.isSystemProcess('user_app', '_system')).toBe(true);
        });
    });

    describe('loadProcesses', () => {
        test('should load processes and network usage successfully', async () => {
            const mockProcesses = [
                { pid: '1', comm: 'launchd', user: 'root', cpu: '0.1', mem: '0.2', args: '/sbin/launchd' }
            ];
            const mockNetworkUsage = [
                { pid: '1', bytes_in: '1024', bytes_out: '2048' }
            ];

            mockIpcRenderer.invoke
                .mockResolvedValueOnce(mockProcesses)
                .mockResolvedValueOnce(mockNetworkUsage);

            const result = await processService.loadProcesses();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-processes');
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-network-usage');
            expect(result.processes).toEqual(mockProcesses);
            expect(result.networkUsage).toEqual(mockNetworkUsage);
        });

        test('should handle load failure', async () => {
            mockIpcRenderer.invoke.mockRejectedValue(new Error('IPC Error'));

            await expect(processService.loadProcesses()).rejects.toThrow('Failed to load processes: IPC Error');
        });

        test('should filter invalid process data', async () => {
            const mockProcesses = [
                { pid: '1', comm: 'valid', user: 'root', cpu: '0.1', mem: '0.2', args: '/valid' },
                { pid: 'invalid', comm: 'invalid', user: 'root', cpu: 'NaN', mem: '0.2', args: '/invalid' },
                { pid: '2', comm: 'valid2', user: 'user', cpu: '1.0', mem: '1.5', args: '/valid2' }
            ];

            mockIpcRenderer.invoke
                .mockResolvedValueOnce(mockProcesses)
                .mockResolvedValueOnce([]);

            const result = await processService.loadProcesses();

            expect(result.processes).toHaveLength(2);
            expect(result.processes[0].pid).toBe('1');
            expect(result.processes[1].pid).toBe('2');
        });
    });

    describe('filterAndSortProcesses', () => {
        beforeEach(() => {
            processService.processes = [
                { pid: '1', comm: 'launchd', user: 'root', cpu: '0.1', mem: '0.2', args: '/sbin/launchd' },
                { pid: '2', comm: 'chrome', user: 'user', cpu: '5.0', mem: '10.0', args: '/Applications/Chrome.app' },
                { pid: '3', comm: 'finder', user: 'user', cpu: '1.0', mem: '2.0', args: '/System/Library/CoreServices/Finder.app' }
            ];
        });

        test('should filter processes by name', () => {
            const filtered = processService.filterAndSortProcesses('chrome');
            expect(filtered).toHaveLength(1);
            expect(filtered[0].comm).toBe('chrome');
        });

        test('should filter processes by PID', () => {
            const filtered = processService.filterAndSortProcesses('2');
            expect(filtered).toHaveLength(1);
            expect(filtered[0].pid).toBe('2');
        });

        test('should sort by CPU descending', () => {
            const sorted = processService.filterAndSortProcesses('', 'cpu');
            expect(sorted[0].cpu).toBe('5.0');
            expect(sorted[1].cpu).toBe('1.0');
            expect(sorted[2].cpu).toBe('0.1');
        });

        test('should sort by memory descending', () => {
            const sorted = processService.filterAndSortProcesses('', 'mem');
            expect(sorted[0].mem).toBe('10.0');
            expect(sorted[1].mem).toBe('2.0');
            expect(sorted[2].mem).toBe('0.2');
        });

        test('should sort by PID ascending', () => {
            const sorted = processService.filterAndSortProcesses('', 'pid');
            expect(sorted[0].pid).toBe('1');
            expect(sorted[1].pid).toBe('2');
            expect(sorted[2].pid).toBe('3');
        });

        test('should throw error for invalid parameters', () => {
            expect(() => processService.filterAndSortProcesses('x'.repeat(101))).toThrow();
            expect(() => processService.filterAndSortProcesses('', 'invalid')).toThrow();
        });
    });

    describe('getProcessNetworkUsage', () => {
        beforeEach(() => {
            processService.networkUsage = [
                { pid: '1', bytes_in: '1024', bytes_out: '2048' },
                { pid: '2', bytes_in: '512', bytes_out: '1024' }
            ];
        });

        test('should return network usage for existing PID', () => {
            const usage = processService.getProcessNetworkUsage('1');
            expect(usage.bytes_in).toBe('1024');
            expect(usage.bytes_out).toBe('2048');
        });

        test('should return default values for non-existing PID', () => {
            const usage = processService.getProcessNetworkUsage('999');
            expect(usage.bytes_in).toBe('0');
            expect(usage.bytes_out).toBe('0');
        });
    });

    describe('getProcessClassification', () => {
        test('should classify system process correctly', () => {
            const proc = { pid: '1', comm: 'launchd', user: 'root', cpu: '0.1', mem: '0.2', args: '/sbin/launchd' };
            const className = processService.getProcessClassification(proc);
            expect(className).toContain('system-proc');
        });

        test('should classify user process correctly', () => {
            const proc = { pid: '2', comm: 'chrome', user: 'user', cpu: '5.0', mem: '10.0', args: '/Applications/Chrome.app' };
            const className = processService.getProcessClassification(proc);
            expect(className).toContain('user-proc');
        });

        test('should identify high CPU usage', () => {
            const proc = { pid: '2', comm: 'test', user: 'user', cpu: '60.0', mem: '10.0', args: '/test' };
            const className = processService.getProcessClassification(proc);
            expect(className).toContain('high-cpu');
        });

        test('should identify high memory usage', () => {
            const proc = { pid: '2', comm: 'test', user: 'user', cpu: '5.0', mem: '25.0', args: '/test' };
            const className = processService.getProcessClassification(proc);
            expect(className).toContain('high-mem');
        });

        test('should identify Amazon Q process', () => {
            const proc = { pid: '2', comm: 'q', user: 'user', cpu: '5.0', mem: '10.0', args: '/usr/local/bin/q chat' };
            const className = processService.getProcessClassification(proc);
            expect(className).toContain('amazon-q');
        });

        test('should mark selected process', () => {
            processService.selectedPid = '2';
            const proc = { pid: '2', comm: 'test', user: 'user', cpu: '5.0', mem: '10.0', args: '/test' };
            const className = processService.getProcessClassification(proc);
            expect(className).toContain('selected');
        });
    });

    describe('selectProcess', () => {
        test('should select valid PID', () => {
            processService.selectProcess('123');
            expect(processService.selectedPid).toBe('123');
        });

        test('should not select invalid PID', () => {
            processService.selectProcess('invalid');
            expect(processService.selectedPid).toBeNull();
        });
    });

    describe('getProcessDetails', () => {
        beforeEach(() => {
            processService.processes = [
                { pid: '1', comm: 'test', user: 'user', cpu: '1.0', mem: '2.0', args: '/test' }
            ];
        });

        test('should get process details successfully', async () => {
            const mockConnections = [{ type: 'TCP', name_addr: '127.0.0.1:8080' }];
            const mockFds = [{ fd: '1', type: 'REG', name: '/tmp/test' }];

            mockIpcRenderer.invoke
                .mockResolvedValueOnce(mockConnections)
                .mockResolvedValueOnce(mockFds);

            const result = await processService.getProcessDetails('1');

            expect(result.process.pid).toBe('1');
            expect(result.connections).toEqual(mockConnections);
            expect(result.fileDescriptors).toEqual(mockFds);
        });

        test('should throw error for invalid PID', async () => {
            await expect(processService.getProcessDetails('invalid')).rejects.toThrow('Invalid process ID');
        });

        test('should handle IPC failure', async () => {
            mockIpcRenderer.invoke.mockRejectedValue(new Error('IPC Error'));

            await expect(processService.getProcessDetails('1')).rejects.toThrow('Failed to get process details: IPC Error');
        });
    });
});
