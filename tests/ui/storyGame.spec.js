const { test, expect } = require('@playwright/test');

// Configure Playwright to use a test server
test.describe.configure({ mode: 'serial' });

test.describe('Story Game UI Tests', () => {
    let baseURL = 'http://localhost:1234';

    test.beforeAll(async () => {
        // Note: These tests assume the server is running on localhost:1234
        // In a real CI environment, you'd start the server programmatically
    });

    test('should create a story game room', async ({ page }) => {
        // Navigate to create game page
        await page.goto(`${baseURL}/games/story/create`);
        
        // Should show name entry form
        await expect(page).toHaveTitle(/bballdaniel3\.com/);
        
        // Enter username and create room
        await page.fill('input[name="username"]', 'TestHost');
        await page.click('button[type="submit"]');
        
        // Should redirect to game lobby with room code
        await expect(page.url()).toMatch(/\/games\/story\/[A-Z0-9]{4}\?username=TestHost/);
        
        // Should show lobby page
        await expect(page.locator('h1')).toContainText('Game Lobby');
    });

    test('should join an existing room', async ({ page, context }) => {
        // First create a room
        await page.goto(`${baseURL}/games/story/create?username=HostPlayer`);
        const roomUrl = page.url();
        const roomCode = roomUrl.match(/\/games\/story\/([A-Z0-9]{4})/)[1];
        
        // Open a new page for a second player
        const playerPage = await context.newPage();
        
        // Join the room without username first (should show name entry)
        await playerPage.goto(`${baseURL}/games/story/${roomCode}`);
        await expect(playerPage.locator('input[name="username"]')).toBeVisible();
        
        // Enter username and join
        await playerPage.fill('input[name="username"]', 'JoiningPlayer');
        await playerPage.click('button[type="submit"]');
        
        // Should be in the lobby
        await expect(playerPage.locator('h1')).toContainText('Game Lobby');
        await expect(playerPage.locator('text=JoiningPlayer')).toBeVisible();
        
        await playerPage.close();
    });

    test('should handle game start flow', async ({ page, context }) => {
        // Create room as host
        await page.goto(`${baseURL}/games/story/create?username=GameHost`);
        const roomUrl = page.url();
        const roomCode = roomUrl.match(/\/games\/story\/([A-Z0-9]{4})/)[1];
        
        // Add a second player
        const player2Page = await context.newPage();
        await player2Page.goto(`${baseURL}/games/story/${roomCode}?username=Player2`);
        
        // Wait for both players to be in lobby
        await expect(page.locator('text=Player2')).toBeVisible();
        await expect(player2Page.locator('text=GameHost')).toBeVisible();
        
        // Start game as host
        await page.selectOption('select[name="turnTime"]', '30'); // 30 seconds for faster testing
        await page.click('button[type="submit"]');
        
        // Both players should be redirected to the active game
        await expect(page.url()).toBe(`${baseURL}/games/story/${roomCode}?username=GameHost`);
        
        await player2Page.close();
    });

    test('should show 404 for non-existent room', async ({ page }) => {
        await page.goto(`${baseURL}/games/story/FAKE`);
        
        await expect(page.locator('h1')).toContainText('404');
    });

    test('should navigate basic site pages', async ({ page }) => {
        // Test home page
        await page.goto(`${baseURL}/`);
        await expect(page).toHaveTitle(/bballdaniel3\.com/);
        
        // Test about page
        await page.goto(`${baseURL}/about`);
        await expect(page.locator('h1')).toBeVisible();
        
        // Test games page
        await page.goto(`${baseURL}/games`);
        await expect(page.locator('h1')).toContainText('Games');
        
        // Test health endpoint
        const response = await page.goto(`${baseURL}/health`);
        expect(response.status()).toBe(200);
        const text = await response.text();
        expect(text).toBe('OK');
    });

    test('should handle guestbook page', async ({ page }) => {
        await page.goto(`${baseURL}/guestbook`);
        
        // Should show guestbook form
        await expect(page.locator('form')).toBeVisible();
        await expect(page.locator('input[name="name"]')).toBeVisible();
        await expect(page.locator('textarea[name="message"]')).toBeVisible();
        
        // Note: We don't actually submit the form as it requires valid reCAPTCHA
    });
});
