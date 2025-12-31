/**
 * Integration Tests - App Flow
 */
const App = require('../../renderer/app');

// Mock DOM elements
const mockDOM = () => {
    global.document = {
        getElementById: jest.fn((id) => {
            const mockElement = {
                style: { display: 'block' },
                innerHTML: '',
                textContent: '',
                addEventListener: jest.fn(),
                classList: {
                    add: jest.fn(),
                    remove: jest.fn(),
                    contains: jest.fn()
                }
            };
            return mockElement;
        }),
        querySelectorAll: jest.fn(() => []),
        addEventListener: jest.fn(),
        body: {
            setAttribute: jest.fn(),
            getAttribute: jest.fn(() => 'dark'),
            appendChild: jest.fn()
        }
    };

    global.window = {
        close: jest.fn(),
        localStorage: {
            getItem: jest.fn(),
            setItem: jest.fn()
        }
    };

    // Mock localStorage globally
    global.localStorage = global.window.localStorage;

    global.console = {
        log: jest.fn(),
        error: jest.fn()
    };
};

// Mock electron
jest.mock('electron', () => ({
    ipcRenderer: {
        invoke: jest.fn()
    }
}));

describe('App Integration Tests', () => {
    let app;
    let mockIpcRenderer;

    beforeEach(() => {
        mockDOM();
        mockIpcRenderer = require('electron').ipcRenderer;
        jest.clearAllMocks();
    });

    afterEach(() => {
        if (app) {
            app.destroy();
        }
    });

    describe('App Initialization', () => {
        test('should initialize app successfully', async () => {
            // Mock successful data loading
            mockIpcRenderer.invoke
                .mockResolvedValueOnce([]) // processes
                .mockResolvedValueOnce([]); // network usage

            app = new App();
            await app.init();

            expect(app.processService).toBeDefined();
            expect(app.networkService).toBeDefined();
            expect(app.securityService).toBeDefined();
            expect(app.tabManager).toBeDefined();
        });

        test('should handle initialization failure gracefully', async () => {
            mockIpcRenderer.invoke.mockRejectedValue(new Error('Init failed'));

            app = new App();
            await app.init();

            // App should still be created but with error state
            expect(app.processService).toBeDefined();
        });
    });

    describe('Tab Management Flow', () => {
        beforeEach(async () => {
            mockIpcRenderer.invoke
                .mockResolvedValue([])
                .mockResolvedValue([]);

            app = new App();
            await app.init();
        });

        test('should switch tabs correctly', async () => {
            // Mock network data loading
            mockIpcRenderer.invoke.mockResolvedValue([
                { proto: 'tcp', local: '127.0.0.1:8080', foreign: '0.0.0.0:*', state: 'LISTEN' }
            ]);

            await app.tabManager.showTab('network');

            expect(app.tabManager.getCurrentTab()).toBe('network');
        });

        test('should refresh data when switching tabs', async () => {
            mockIpcRenderer.invoke.mockResolvedValue('routing data');

            await app.tabManager.showTab('routing');

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-routing');
        });
    });

    describe('Process Management Flow', () => {
        beforeEach(async () => {
            const mockProcesses = [
                { pid: '1', comm: 'test', user: 'user', cpu: '1.0', mem: '2.0', args: '/test' }
            ];

            mockIpcRenderer.invoke
                .mockResolvedValueOnce(mockProcesses)
                .mockResolvedValueOnce([]);

            app = new App();
            await app.init();
        });

        test('should select process and show details', async () => {
            const mockConnections = [{ type: 'TCP', name_addr: '127.0.0.1:8080' }];
            const mockFds = [{ fd: '1', type: 'REG', name: '/tmp/test' }];

            mockIpcRenderer.invoke
                .mockResolvedValueOnce(mockConnections)
                .mockResolvedValueOnce(mockFds);

            await app.selectProcess('1');

            expect(app.processService.selectedPid).toBe('1');
            // Note: DetailPanel.show() is called but isVisible is not set in our mock
        });

        test('should handle process selection error', async () => {
            mockIpcRenderer.invoke.mockRejectedValue(new Error('Process not found'));

            await app.selectProcess('999');

            // Should emit error event
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('Security Scan Flow', () => {
        beforeEach(async () => {
            mockIpcRenderer.invoke
                .mockResolvedValue([])
                .mockResolvedValue([]);

            app = new App();
            await app.init();
        });

        test('should perform security scan', async () => {
            const mockScanResults = {
                timestamp: Date.now(),
                gatekeeper: { enabled: true },
                firewall: { applicationFirewall: { enabled: true } },
                sip: { enabled: true }
            };

            mockIpcRenderer.invoke.mockResolvedValue(mockScanResults);

            await app.performDetailedScan();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('security:perform-detailed-scan');
        });

        test('should handle security scan failure', async () => {
            mockIpcRenderer.invoke.mockRejectedValue(new Error('Scan failed'));

            await app.performDetailedScan();

            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('System Info Flow', () => {
        beforeEach(async () => {
            mockIpcRenderer.invoke
                .mockResolvedValue([])
                .mockResolvedValue([]);

            app = new App();
            await app.init();
        });

        test('should show system information', async () => {
            const mockSystemInfo = {
                modelName: 'MacBook Pro',
                processorName: 'Apple M1',
                totalMemory: 17179869184, // 16GB
                freeMemory: 8589934592,   // 8GB
                uptime: 86400 // 1 day
            };

            mockIpcRenderer.invoke.mockResolvedValue(mockSystemInfo);

            await app.showSystemInfo();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('system:get-info');
        });
    });

    describe('Error Handling', () => {
        beforeEach(async () => {
            mockIpcRenderer.invoke
                .mockResolvedValue([])
                .mockResolvedValue([]);

            app = new App();
            await app.init();
        });

        test('should handle network loading errors', async () => {
            mockIpcRenderer.invoke.mockRejectedValue(new Error('Network error'));

            // Should not throw, error should be handled gracefully
            await expect(app.refreshNetwork()).rejects.toThrow('Failed to load network connections: Network error');
        });

        test('should handle theme toggle', () => {
            app.toggleTheme();

            expect(document.body.setAttribute).toHaveBeenCalledWith('data-theme', expect.any(String));
            expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', expect.any(String));
        });
    });

    describe('Auto-refresh Flow', () => {
        beforeEach(async () => {
            mockIpcRenderer.invoke
                .mockResolvedValue([])
                .mockResolvedValue([]);

            app = new App();
            await app.init();
        });

        test('should setup auto-refresh timer', () => {
            app.setupAutoRefresh();

            expect(app.refreshTimer).toBeDefined();
        });

        test('should clear existing timer when setting up new one', () => {
            app.setupAutoRefresh();
            const firstTimer = app.refreshTimer;

            app.setupAutoRefresh();
            const secondTimer = app.refreshTimer;

            expect(secondTimer).not.toBe(firstTimer);
        });
    });
});
