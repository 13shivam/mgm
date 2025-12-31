/**
 * Application Configuration
 */

const config = {
    // Application metadata
    app: {
        name: 'macOS Gateway Monitor',
        version: '0.0.1',
        description: 'Enterprise macOS Security & Network Gateway Monitor'
    },

    // Refresh intervals (milliseconds)
    refresh: {
        fast: 1000,
        normal: 2000,
        slow: 5000,
        default: 2000
    },

    // Process monitoring limits
    processes: {
        maxDisplay: 100,
        maxConnections: 100,
        maxFileDescriptors: 20,
        highCpuThreshold: 50,
        highMemoryThreshold: 20
    },

    // Security scanning configuration
    security: {
        minScanInterval: 10,
        maxScanInterval: 600,
        defaultScanInterval: 60,
        autoScanEnabled: true
    },

    // Network monitoring settings
    network: {
        maxConnections: 100,
        connectionTimeout: 5000,
        retryAttempts: 3
    },

    // UI configuration
    ui: {
        defaultTheme: 'dark',
        animationDuration: 200,
        tooltipDelay: 500,
        detailPanelWidth: 400
    },

    // System information caching
    systemInfo: {
        cacheExpiry: 5 * 60 * 1000, // 5 minutes
        refreshOnTabSwitch: false
    },

    // Error handling
    errors: {
        maxRetries: 3,
        retryDelay: 1000,
        showErrorToasts: true,
        logErrors: true
    },

    // Performance settings
    performance: {
        enableVirtualScrolling: false,
        maxTooltips: 10,
        debounceDelay: 300
    },

    // Development settings
    development: {
        enableDebugLogs: false,
        mockData: false,
        skipAdminCheck: false
    }
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'development') {
    config.development.enableDebugLogs = true;
    config.refresh.default = 5000; // Slower refresh in development
}

if (process.env.NODE_ENV === 'test') {
    config.development.mockData = true;
    config.development.skipAdminCheck = true;
    config.errors.showErrorToasts = false;
}

// Validation
function validateConfig() {
    const errors = [];

    if (config.refresh.default < 1000) {
        errors.push('Refresh interval too low (minimum 1000ms)');
    }

    if (config.security.defaultScanInterval < config.security.minScanInterval) {
        errors.push('Default scan interval below minimum');
    }

    if (config.processes.maxDisplay > 1000) {
        errors.push('Max display processes too high (maximum 1000)');
    }

    if (errors.length > 0) {
        throw new Error('Configuration validation failed: ' + errors.join(', '));
    }
}

// Validate on load
validateConfig();

module.exports = config;
