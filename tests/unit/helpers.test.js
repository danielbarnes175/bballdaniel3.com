const { renderMarkdown } = require('../../app/helpers/sanitizeMarkdown');
const { logRequest, logError } = require('../../app/services/loggingService');
const axios = require('axios');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('Helper Functions', () => {
    describe('sanitizeMarkdown', () => {
        test('should render basic markdown correctly', () => {
            const input = '# Hello World\n\nThis is **bold** text with *italic* words.';
            const result = renderMarkdown(input);
            
            expect(result).toContain('<h1>Hello World</h1>');
            expect(result).toContain('<strong>bold</strong>');
            expect(result).toContain('<em>italic</em>');
        });

        test('should sanitize dangerous HTML', () => {
            const input = '<script>alert("xss")</script><p>Safe content</p>';
            const result = renderMarkdown(input);
            
            expect(result).not.toContain('<script>');
            expect(result).not.toContain('alert("xss")');
            expect(result).toContain('Safe content');
        });

        test('should handle empty input', () => {
            const result = renderMarkdown('');
            expect(result).toBe('');
        });

        test('should handle null/undefined input', () => {
            expect(renderMarkdown(null)).toBe('');
            expect(renderMarkdown(undefined)).toBe('');
        });
    });
});

describe('Logging Service', () => {
    beforeEach(() => {
        // Clear console.log mock and axios mock before each test
        jest.clearAllMocks();
        console.log = jest.fn();
        process.env.DISCORD_REQUESTS_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';
    });

    afterEach(() => {
        delete process.env.DISCORD_REQUESTS_WEBHOOK_URL;
    });

    describe('logRequest', () => {
        test('should log request to console', async () => {
            const mockReq = {
                method: 'GET',
                url: '/test',
                headers: {},
                ip: '127.0.0.1'
            };
            const mockRes = {
                statusCode: 200
            };

            await logRequest(mockReq, mockRes);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('(IP: 127.0.0.1): 200 GET /test')
            );
        });

        test('should send Discord webhook for non-health requests', async () => {
            const mockReq = {
                method: 'POST',
                url: '/games/story/create',
                headers: {},
                ip: '192.168.1.1'
            };
            const mockRes = {
                statusCode: 302
            };

            mockedAxios.post.mockResolvedValue({});

            await logRequest(mockReq, mockRes);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://discord.com/api/webhooks/test',
                expect.objectContaining({
                    embeds: expect.arrayContaining([
                        expect.objectContaining({
                            description: expect.stringContaining('302 POST /games/story/create'),
                            color: 15258703
                        })
                    ])
                })
            );
        });

        test('should not send Discord webhook for health check', async () => {
            const mockReq = {
                method: 'GET',
                url: '/health',
                headers: {},
                ip: '127.0.0.1'
            };
            const mockRes = {
                statusCode: 200
            };

            await logRequest(mockReq, mockRes);

            expect(mockedAxios.post).not.toHaveBeenCalled();
        });

        test('should handle Discord webhook errors gracefully', async () => {
            const mockReq = {
                method: 'GET',
                url: '/test',
                headers: {},
                ip: '127.0.0.1'
            };
            const mockRes = {
                statusCode: 200
            };

            mockedAxios.post.mockRejectedValue(new Error('Network error'));
            console.error = jest.fn();

            await logRequest(mockReq, mockRes);

            expect(console.error).toHaveBeenCalledWith(
                'Error exporting request log to Discord:',
                expect.any(Error)
            );
        });
    });

    describe('logError', () => {
        test('should send error to Discord webhook', async () => {
            const testError = new Error('Test error message');
            mockedAxios.post.mockResolvedValue({});

            await logError(testError);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://discord.com/api/webhooks/test',
                expect.objectContaining({
                    embeds: expect.arrayContaining([
                        expect.objectContaining({
                            title: 'Test error message',
                            description: expect.stringContaining('Error: Test error message'),
                            color: 16711680
                        })
                    ])
                })
            );
        });

        test('should handle Discord webhook errors when logging errors', async () => {
            const testError = new Error('Original error');
            mockedAxios.post.mockRejectedValue(new Error('Discord error'));
            console.error = jest.fn();

            await logError(testError);

            expect(console.error).toHaveBeenCalledWith(
                'Error exporting error log to Discord:',
                expect.any(Error)
            );
        });
    });
});