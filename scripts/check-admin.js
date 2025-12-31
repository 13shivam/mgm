#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');

function checkAdminRights() {
    console.log('🔐 Checking admin privileges...');
    
    try {
        // Check if we can run sudo commands
        execSync('sudo -n true', { stdio: 'ignore' });
        console.log('✅ Admin privileges confirmed');
        return true;
    } catch (error) {
        console.log('❌ Admin privileges required');
        console.log('Please run: sudo npm install');
        console.log('Or configure passwordless sudo for this app');
        return false;
    }
}

function checkMacOSVersion() {
    const version = os.release();
    const major = parseInt(version.split('.')[0]);
    
    console.log(`🍎 macOS version detected: ${version}`);
    
    if (major < 19) { // macOS 10.15+
        console.log('⚠️  Warning: macOS 10.15+ recommended for full features');
    } else {
        console.log('✅ macOS version supported');
    }
}

if (require.main === module) {
    checkMacOSVersion();
    checkAdminRights();
}

module.exports = { checkAdminRights, checkMacOSVersion };
