/**
 * SecurityService - Handles all security-related business logic
 */
class SecurityService {
    constructor() {
        this.lastScanTime = 0;
        this.scanInterval = 60; // seconds
        this.scanTimer = null;
    }

    async performScan() {
        const { ipcRenderer } = require('electron');
        try {
            const results = await ipcRenderer.invoke('security:perform-scan');
            this.lastScanTime = Date.now();
            return results;
        } catch (error) {
            throw new Error(`Security scan failed: ${error.message}`);
        }
    }

    async performDetailedScan() {
        const { ipcRenderer } = require('electron');
        try {
            const results = await ipcRenderer.invoke('security:perform-detailed-scan');
            this.lastScanTime = Date.now();
            return results;
        } catch (error) {
            throw new Error(`Detailed security scan failed: ${error.message}`);
        }
    }

    startAutoScan(callback) {
        this.stopAutoScan();
        this.scanTimer = setInterval(async () => {
            try {
                const results = await this.performScan();
                callback(results);
            } catch (error) {
                callback({ error: error.message });
            }
        }, this.scanInterval * 1000);
    }

    stopAutoScan() {
        if (this.scanTimer) {
            clearInterval(this.scanTimer);
            this.scanTimer = null;
        }
    }

    setScanInterval(seconds) {
        if (seconds >= 10 && seconds <= 600) {
            this.scanInterval = seconds;
            return true;
        }
        return false;
    }

    analyzeStartupItem(item) {
        const analysis = {
            riskLevel: 'Low',
            recommendations: [],
            explanation: ''
        };

        if (item.category === 'systemDaemons') {
            analysis.explanation = 'System daemons are background services essential for macOS operation.';
            if (item.flags?.includes('THIRD_PARTY')) {
                analysis.riskLevel = 'Medium';
                analysis.recommendations.push('Review third-party system daemons carefully');
            }
        } else if (item.category === 'userAgents') {
            analysis.explanation = 'User agents start automatically when you log in.';
            analysis.recommendations.push('Disable unused agents to improve performance');
        }

        return analysis;
    }

    getSecurityRecommendations(scanResults) {
        const recommendations = [];

        if (!scanResults.gatekeeper?.enabled) {
            recommendations.push({
                type: 'critical',
                message: 'Enable Gatekeeper for app verification',
                action: 'System Preferences > Security & Privacy'
            });
        }

        if (!scanResults.firewall?.applicationFirewall?.enabled) {
            recommendations.push({
                type: 'warning',
                message: 'Enable Application Firewall',
                action: 'System Preferences > Security & Privacy > Firewall'
            });
        }

        if (!scanResults.sip?.enabled) {
            recommendations.push({
                type: 'critical',
                message: 'System Integrity Protection is disabled',
                action: 'Requires recovery mode to enable'
            });
        }

        return recommendations;
    }
}

module.exports = SecurityService;
