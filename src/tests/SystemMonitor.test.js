const SystemMonitor = require('../core/SystemMonitor');

describe('SystemMonitor', () => {
    let monitor;

    beforeEach(() => {
        monitor = new SystemMonitor();
    });

    describe('parseProcesses', () => {
        test('should parse process output correctly', () => {
            const mockOutput = `  PID  PPID  %CPU %MEM   RSS    VSZ     TIME USER     COMMAND
  123   456   1.5  2.3  8192  16384 00:01:23 user     /usr/bin/test arg1 arg2`;

            const result = monitor.parseProcesses(mockOutput);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                pid: '123',
                ppid: '456',
                cpu: 1.5,
                mem: 2.3,
                rss: 8192,
                vsz: 16384,
                time: '00:01:23',
                user: 'user',
                comm: '/usr/bin/test',
                args: 'arg1 arg2'
            });
        });

        test('should handle empty input', () => {
            const result = monitor.parseProcesses('');
            expect(result).toEqual([]);
        });
    });

    describe('parseNetworkConnections', () => {
        test('should parse network connections correctly', () => {
            const mockOutput = `Active Internet connections
Proto Recv-Q Send-Q  Local Address          Foreign Address        (state)
tcp4       0      0  127.0.0.1.8080         *.*                    LISTEN
tcp4       0      0  192.168.1.100.443      203.0.113.1.80         ESTABLISHED`;

            const result = monitor.parseNetworkConnections(mockOutput);

            expect(result).toHaveLength(2);
            expect(result[0].proto).toBe('tcp4');
            expect(result[0].state).toBe('LISTEN');
            expect(result[1].state).toBe('ESTABLISHED');
        });
    });

    describe('parseNetworkUsage', () => {
        test('should parse network usage correctly', () => {
            const mockOutput = `123 1024 2048 10 20 0 /usr/bin/test
456 512 1024 5 10 0 /usr/bin/another`;

            const result = monitor.parseNetworkUsage(mockOutput);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                pid: '123',
                bytes_in: '1024',
                bytes_out: '2048',
                packets_in: '10',
                packets_out: '20',
                cc: '0',
                process: '/usr/bin/test'
            });
        });
    });
});

module.exports = SystemMonitor;
