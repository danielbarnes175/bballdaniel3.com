const { renderMarkdown } = require('../../app/helpers/sanitizeMarkdown');
const { logRequest, logError } = require('../../app/services/loggingService');
const { sendToDiscord } = require('../../app/helpers/sendToDiscord');
const { nameToColor } = require('../../app/helpers/nameToColor');
const { getBlogList } = require('../../app/helpers/getBlogList');
const axios = require('axios');
const fs = require('fs').promises;

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock fs promises
jest.mock('fs', () => ({
    promises: {
        readdir: jest.fn(),
        readFile: jest.fn()
    }
}));

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

        test('should handle missing Discord webhook URL', async () => {
            delete process.env.DISCORD_REQUESTS_WEBHOOK_URL;
            const testError = new Error('Test error');
            
            await logError(testError);
            
            // Should not call axios.post when webhook URL is missing
            expect(mockedAxios.post).not.toHaveBeenCalled();
        });
    });

    describe('IP address extraction', () => {
        test('should extract IP from x-forwarded-for header', async () => {
            const mockReq = {
                method: 'GET',
                url: '/test',
                headers: {
                    'x-forwarded-for': '192.168.1.100, 10.0.0.1'
                },
                ip: '127.0.0.1'
            };
            const mockRes = {
                statusCode: 200
            };

            await logRequest(mockReq, mockRes);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('(IP: 192.168.1.100): 200 GET /test')
            );
        });

        test('should fallback to connection.remoteAddress when no other IP available', async () => {
            const mockReq = {
                method: 'GET',
                url: '/test',
                headers: {},
                connection: {
                    remoteAddress: '10.0.0.50'
                }
            };
            const mockRes = {
                statusCode: 200
            };

            await logRequest(mockReq, mockRes);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('(IP: 10.0.0.50): 200 GET /test')
            );
        });
    });
});

describe('SendToDiscord Helper', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.error = jest.fn();
    });

    afterEach(() => {
        delete process.env.DISCORD_WEBHOOK_URL;
    });

    test('should send guestbook entry to Discord', async () => {
        process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/guestbook';
        mockedAxios.post.mockResolvedValue({});

        const entry = {
            name: 'Test User',
            date: '2023-01-01 12:00:00',
            message: 'Test message'
        };

        await sendToDiscord(entry);

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://discord.com/api/webhooks/guestbook',
            expect.objectContaining({
                content: expect.stringContaining('**New Guestbook Entry**')
            })
        );
    });

    test('should throw error when Discord webhook URL is not set', async () => {
        delete process.env.DISCORD_WEBHOOK_URL;
        
        const entry = {
            name: 'Test User',
            date: '2023-01-01 12:00:00',
            message: 'Test message'
        };

        await expect(sendToDiscord(entry)).rejects.toThrow('Discord webhook URL is not set.');
    });

    test('should handle Discord API errors gracefully', async () => {
        process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/guestbook';
        mockedAxios.post.mockRejectedValue(new Error('Discord API error'));

        const entry = {
            name: 'Test User',
            date: '2023-01-01 12:00:00',
            message: 'Test message'
        };

        // Should not throw, but should log error
        await sendToDiscord(entry);

        expect(console.error).toHaveBeenCalledWith(
            'Failed to send to Discord:',
            'Discord API error'
        );
    });
});

describe('NameToColor Helper', () => {
    test('should return consistent color for same name', () => {
        const color1 = nameToColor('TestUser');
        const color2 = nameToColor('TestUser');
        
        expect(color1).toBe(color2);
        expect(typeof color1).toBe('string');
        expect(color1).toMatch(/^hsl\(\d+, 60%, 55%\)$/);
    });

    test('should return different colors for different names', () => {
        const color1 = nameToColor('User1');
        const color2 = nameToColor('User2');
        
        expect(color1).not.toBe(color2);
    });

    test('should handle empty string', () => {
        const color = nameToColor('');
        expect(typeof color).toBe('string');
        expect(color).toMatch(/^hsl\(\d+, 60%, 55%\)$/);
    });
});

describe('GetBlogList Helper', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.error = jest.fn();
    });

    test('should return blog posts and tag counts', async () => {
        const mockFiles = ['post1.md', 'post2.md', 'not-md.txt'];
        const mockPost1 = `---
title: Test Post 1
date: 2023-01-01
tags: [javascript, node]
---
This is the first post content.`;
        
        const mockPost2 = `---
title: Test Post 2
date: 2023-01-02
tags: [javascript, testing]
---
This is the second post content.`;

        fs.readdir.mockResolvedValue(mockFiles);
        fs.readFile
            .mockResolvedValueOnce(mockPost1)
            .mockResolvedValueOnce(mockPost2);

        const { posts, tagCounts } = await getBlogList();

        expect(posts).toHaveLength(2);
        expect(posts[0].title).toBe('Test Post 2'); // Should be sorted by date desc
        expect(posts[1].title).toBe('Test Post 1');
        
        expect(tagCounts).toEqual({
            javascript: 2,
            node: 1,
            testing: 1
        });
    });

    test('should handle posts without frontmatter', async () => {
        const mockFiles = ['plain.md'];
        const mockContent = 'Just plain content without frontmatter.';

        fs.readdir.mockResolvedValue(mockFiles);
        fs.readFile.mockResolvedValue(mockContent);

        const { posts, tagCounts } = await getBlogList();

        expect(posts).toHaveLength(1);
        expect(posts[0].title).toBe('plain');
        expect(posts[0].tags).toEqual([]);
        expect(tagCounts).toEqual({});
    });

    test('should handle missing date gracefully', async () => {
        const mockFiles = ['nodate.md'];
        const mockContent = `---
title: No Date Post
tags: [test]
---
Content without date.`;

        fs.readdir.mockResolvedValue(mockFiles);
        fs.readFile.mockResolvedValue(mockContent);

        const { posts } = await getBlogList();

        expect(posts[0].date).toEqual(new Date(0));
        expect(posts[0].formattedDate).toBe('Unknown date');
    });

    test('should return empty arrays on file system error', async () => {
        fs.readdir.mockRejectedValue(new Error('File system error'));

        const { posts, tagCounts } = await getBlogList();

        expect(posts).toEqual([]);
        expect(tagCounts).toEqual({});
        expect(console.error).toHaveBeenCalledWith(
            'Error loading posts:',
            expect.any(Error)
        );
    });

    test('should handle empty posts directory', async () => {
        fs.readdir.mockResolvedValue([]);

        const { posts, tagCounts } = await getBlogList();

        expect(posts).toEqual([]);
        expect(tagCounts).toEqual({});
    });

    test('should generate excerpt from content', async () => {
        const mockFiles = ['excerpt-test.md'];
        const mockContent = `---
title: Excerpt Test
---

# This is a heading

This is the first paragraph that should be used for the excerpt.

This is a second paragraph.`;

        fs.readdir.mockResolvedValue(mockFiles);
        fs.readFile.mockResolvedValue(mockContent);

        const { posts } = await getBlogList();

        // The function extracts the first non-empty line after removing markdown markers
        expect(posts[0].excerpt).toBe(' This is a heading');
    });

    test('should truncate long excerpts', async () => {
        const mockFiles = ['long-excerpt.md'];
        const longText = 'A'.repeat(250);
        const mockContent = `---
title: Long Excerpt
---
${longText}`;

        fs.readdir.mockResolvedValue(mockFiles);
        fs.readFile.mockResolvedValue(mockContent);

        const { posts } = await getBlogList();

        expect(posts[0].excerpt).toHaveLength(203); // 200 + '...'
        expect(posts[0].excerpt).toMatch(/\.\.\.$/); // Should end with '...'
    });
});
