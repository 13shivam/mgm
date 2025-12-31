/**
 * Formatters Unit Tests
 */
const {
    formatBytes,
    formatUptime,
    formatMemory,
    formatPercentage,
    formatTimestamp,
    sanitizeForHTML,
    truncateText
} = require('../../renderer/utils/formatters');

describe('formatters', () => {
    describe('formatBytes', () => {
        test('should format bytes correctly', () => {
            expect(formatBytes('0')).toBe('0B');
            expect(formatBytes('1024')).toBe('1KB');
            expect(formatBytes('1048576')).toBe('1MB');
            expect(formatBytes('1073741824')).toBe('1GB');
        });

        test('should handle edge cases', () => {
            expect(formatBytes('')).toBe('0B');
            expect(formatBytes(null)).toBe('0B');
            expect(formatBytes(undefined)).toBe('0B');
        });

        test('should format decimal values', () => {
            expect(formatBytes('1536')).toBe('1.5KB');
            expect(formatBytes('1572864')).toBe('1.5MB');
        });
    });

    describe('formatUptime', () => {
        test('should format uptime correctly', () => {
            expect(formatUptime(0)).toBe('0d 0h 0m');
            expect(formatUptime(3661)).toBe('0d 1h 1m'); // 1 hour 1 minute 1 second
            expect(formatUptime(90061)).toBe('1d 1h 1m'); // 1 day 1 hour 1 minute 1 second
        });

        test('should handle large values', () => {
            expect(formatUptime(31536000)).toBe('365d 0h 0m'); // 1 year
        });
    });

    describe('formatMemory', () => {
        test('should format memory in GB', () => {
            expect(formatMemory(1073741824)).toBe('1.00 GB'); // 1GB
            expect(formatMemory(2147483648)).toBe('2.00 GB'); // 2GB
            expect(formatMemory(1610612736)).toBe('1.50 GB'); // 1.5GB
        });

        test('should handle small values', () => {
            expect(formatMemory(536870912)).toBe('0.50 GB'); // 0.5GB
        });
    });

    describe('formatPercentage', () => {
        test('should format percentages with default decimals', () => {
            expect(formatPercentage(50)).toBe('50.0%');
            expect(formatPercentage(33.333)).toBe('33.3%');
        });

        test('should format percentages with custom decimals', () => {
            expect(formatPercentage(33.333, 2)).toBe('33.33%');
            expect(formatPercentage(50, 0)).toBe('50%');
        });
    });

    describe('formatTimestamp', () => {
        test('should format timestamp correctly', () => {
            const timestamp = new Date('2023-01-01T12:00:00Z').getTime();
            const formatted = formatTimestamp(timestamp);
            expect(formatted).toContain('2023');
            expect(typeof formatted).toBe('string');
        });
    });

    describe('sanitizeForHTML', () => {
        test('should sanitize HTML characters', () => {
            expect(sanitizeForHTML('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
            expect(sanitizeForHTML('test & "quote" \'single\'')).toBe('test &amp; &quot;quote&quot; &#39;single&#39;');
        });

        test('should handle empty strings', () => {
            expect(sanitizeForHTML('')).toBe('');
        });

        test('should handle normal text', () => {
            expect(sanitizeForHTML('normal text')).toBe('normal text');
        });
    });

    describe('truncateText', () => {
        test('should truncate long text', () => {
            const longText = 'This is a very long text that should be truncated';
            expect(truncateText(longText, 20)).toBe('This is a very long ...');
        });

        test('should not truncate short text', () => {
            const shortText = 'Short text';
            expect(truncateText(shortText, 20)).toBe('Short text');
        });

        test('should use default max length', () => {
            const text = 'a'.repeat(60);
            const truncated = truncateText(text);
            expect(truncated).toHaveLength(53); // 50 + '...'
        });
    });
});
