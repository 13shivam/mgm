/**
 * Validation utilities
 */

function isValidPid(pid) {
    return pid && /^\d+$/.test(pid.toString()) && parseInt(pid) > 0;
}

function isValidInterval(interval) {
    const num = parseInt(interval);
    return !isNaN(num) && num >= 10 && num <= 600;
}

function isValidFilter(filter) {
    return typeof filter === 'string' && filter.length <= 100;
}

function isValidSortBy(sortBy) {
    const validSorts = ['cpu', 'mem', 'pid', 'comm'];
    return validSorts.includes(sortBy);
}

function isValidTheme(theme) {
    return theme === 'light' || theme === 'dark';
}

function isValidIPAddress(ip) {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) return false;
    
    return ip.split('.').every(octet => {
        const num = parseInt(octet);
        return num >= 0 && num <= 255;
    });
}

function isValidMacAddress(mac) {
    const macRegex = /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i;
    return macRegex.test(mac);
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/[<>'"&]/g, '');
}

function validateProcessData(proc) {
    return proc && 
           isValidPid(proc.pid) &&
           typeof proc.comm === 'string' &&
           typeof proc.user === 'string' &&
           !isNaN(parseFloat(proc.cpu)) &&
           !isNaN(parseFloat(proc.mem));
}

function validateNetworkConnection(conn) {
    return conn &&
           typeof conn.proto === 'string' &&
           typeof conn.local === 'string' &&
           typeof conn.foreign === 'string' &&
           typeof conn.state === 'string';
}

module.exports = {
    isValidPid,
    isValidInterval,
    isValidFilter,
    isValidSortBy,
    isValidTheme,
    isValidIPAddress,
    isValidMacAddress,
    sanitizeInput,
    validateProcessData,
    validateNetworkConnection
};
