/**
 * Utility functions for formatting data
 */

function formatBytes(bytes) {
    if (!bytes || bytes === '0') return '0B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(parseInt(bytes)) / Math.log(k));
    return parseFloat((parseInt(bytes) / Math.pow(k, i)).toFixed(1)) + sizes[i];
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
}

function formatMemory(memoryBytes) {
    return (memoryBytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

function formatPercentage(value, decimals = 1) {
    return parseFloat(value).toFixed(decimals) + '%';
}

function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
}

function sanitizeForHTML(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
}

function truncateText(text, maxLength = 50) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

module.exports = {
    formatBytes,
    formatUptime,
    formatMemory,
    formatPercentage,
    formatTimestamp,
    sanitizeForHTML,
    truncateText
};
