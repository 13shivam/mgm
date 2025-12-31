/**
 * Application constants and configuration
 */

const REFRESH_INTERVALS = {
    FAST: 1000,
    NORMAL: 2000,
    SLOW: 5000
};

// Process and File Descriptor Display Limits
// Centralized management for easy adjustment
const PROCESS_LIMITS = {
    MAX_DISPLAY: 100,                    // Maximum processes shown in main table
    MAX_CONNECTIONS: 500,                // Maximum network connections per process
    MAX_FILE_DESCRIPTORS: 1000,          // Maximum file descriptors per process
    MAX_SECURITY_FILE_LIST: 1000         // Maximum files shown in security scan
};

const SECURITY_SCAN = {
    MIN_INTERVAL: 10,
    MAX_INTERVAL: 600,
    DEFAULT_INTERVAL: 60
};

const THEMES = {
    DARK: 'dark',
    LIGHT: 'light'
};

const SYSTEM_PROCESSES = [
    'kernel_task', 'launchd', 'UserEventAgent', 'loginwindow', 'SystemUIServer',
    'Dock', 'Finder', 'WindowServer', 'cfprefsd', 'distnoted', 'syslogd',
    'kextd', 'mds', 'mdworker', 'coreaudiod', 'bluetoothd', 'WiFiAgent',
    'networkd', 'configd', 'powerd', 'securityd', 'trustd'
];

const NETWORK_PROTOCOLS = {
    TCP: 'tcp',
    UDP: 'udp',
    UNIX: 'unix'
};

const CONNECTION_STATES = {
    LISTEN: 'LISTEN',
    ESTABLISHED: 'ESTABLISHED',
    CLOSE_WAIT: 'CLOSE_WAIT',
    TIME_WAIT: 'TIME_WAIT'
};

const INTERFACE_TYPES = {
    ETHERNET: 'en',
    LOOPBACK: 'lo',
    VPN: 'utun',
    BRIDGE: 'bridge'
};

const CSS_CLASSES = {
    PROCESS: {
        SYSTEM: 'system-proc',
        USER: 'user-proc',
        HIGH_CPU: 'high-cpu',
        HIGH_MEM: 'high-mem',
        AMAZON_Q: 'amazon-q',
        SELECTED: 'selected'
    },
    NETWORK: {
        TCP: 'tcp',
        UDP: 'udp',
        UNIX: 'unix'
    },
    STATUS: {
        UP: 'status-up',
        DOWN: 'status-down',
        UNKNOWN: 'status-unknown'
    }
};

const THRESHOLDS = {
    CPU: {
        HIGH: 50,
        MODERATE: 10
    },
    MEMORY: {
        HIGH: 20,
        MODERATE: 5
    },
    NETWORK: {
        HIGH: 1024 * 1024, // 1MB
        MODERATE: 1024     // 1KB
    }
};

const ERROR_MESSAGES = {
    NETWORK_LOAD_FAILED: 'Failed to load network data',
    PROCESS_LOAD_FAILED: 'Failed to load process data',
    SECURITY_SCAN_FAILED: 'Security scan failed',
    SYSTEM_INFO_FAILED: 'Failed to get system information',
    ADMIN_REQUIRED: 'Administrator privileges required'
};

module.exports = {
    REFRESH_INTERVALS,
    PROCESS_LIMITS,
    SECURITY_SCAN,
    THEMES,
    SYSTEM_PROCESSES,
    NETWORK_PROTOCOLS,
    CONNECTION_STATES,
    INTERFACE_TYPES,
    CSS_CLASSES,
    THRESHOLDS,
    ERROR_MESSAGES
};
