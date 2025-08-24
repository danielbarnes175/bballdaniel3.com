const request = require('supertest');
const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const routes = require('../../app/routes/index');
const helpers = require('../../app/helpers/handlebars.js');

// Mock Discord webhook
jest.mock('../../app/helpers/sendToDiscord.js', () => ({
    sendToDiscord: jest.fn().mockResolvedValue(true)
}));

describe('API Integration Tests', () => {
    let app;

    beforeEach(() => {
        // Set up test environment variables
        process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/test';
        process.env.RECAPTCHA_SECRET_KEY = 'test_secret';
        
        // Create a test Express app
        app = express();
        
        // Set up minimal Express configuration for testing
        const viewsPath = path.join(__dirname, '../../app/views');
        app.engine("hbs", engine({
            extname: ".hbs",
            defaultLayout: "main",
            layoutsDir: path.join(viewsPath, "layouts"),
            partialsDir: path.join(viewsPath, "partials"),
            helpers
        }));
        app.set("view engine", "hbs");
        app.set("views", viewsPath);
        
        // Mock socket.io
        app.set('io', {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn()
        });

        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(express.static(path.join(__dirname, '../../app/public')));

        // Apply routes
        routes(app);
    });

    afterEach(() => {
        // Clean up environment variables
        delete process.env.DISCORD_WEBHOOK_URL;
        delete process.env.RECAPTCHA_SECRET_KEY;
    });

    describe('Basic Routes', () => {
        test('GET / should return home page', async () => {
            const res = await request(app)
                .get('/')
                .expect(200);
            
            expect(res.text).toContain('html'); // Basic check that HTML is returned
        });

        test('GET /about should return about page', async () => {
            const res = await request(app)
                .get('/about')
                .expect(200);
            
            expect(res.text).toContain('html');
        });

        test('GET /games should return games page', async () => {
            const res = await request(app)
                .get('/games')
                .expect(200);
            
            expect(res.text).toContain('html');
        });

        test('GET /health should return OK', async () => {
            const res = await request(app)
                .get('/health')
                .expect(200);
            
            expect(res.text).toBe('OK');
        });

        test('GET /nonexistent should return 404', async () => {
            await request(app)
                .get('/nonexistent')
                .expect(404);
        });
    });

    describe('Story Game Routes', () => {
        test('GET /games/story/create should redirect to game room when username provided', async () => {
            const res = await request(app)
                .get('/games/story/create?username=TestHost')
                .expect(302);
            
            expect(res.headers.location).toMatch(/\/games\/story\/[A-Z0-9]{4}\?username=TestHost/);
        });

        test('GET /games/story/create without username should show name entry', async () => {
            const res = await request(app)
                .get('/games/story/create')
                .expect(200);
            
            expect(res.text).toContain('html');
        });

        test('GET /games/story/FAKE should return 404 for non-existent room', async () => {
            await request(app)
                .get('/games/story/FAKE')
                .expect(404);
        });

        test('POST /games/story/FAKE/start should return 404 for non-existent room', async () => {
            await request(app)
                .post('/games/story/FAKE/start')
                .send({ turnTime: '60', keepHistory: false })
                .expect(404);
        });

        test('should create room, join, and start game flow', async () => {
            // Step 1: Create room
            const createRes = await request(app)
                .get('/games/story/create?username=TestHost')
                .expect(302);
            
            const roomUrl = createRes.headers.location;
            const roomCode = roomUrl.match(/\/games\/story\/([A-Z0-9]{4})/)[1];
            
            // Step 2: Join room (should show lobby)
            const joinRes = await request(app)
                .get(`/games/story/${roomCode}?username=TestHost`)
                .expect(200);
            
            expect(joinRes.text).toContain('html');
            
            // Step 3: Add another player
            await request(app)
                .get(`/games/story/${roomCode}?username=Player2`)
                .expect(200);
            
            // Step 4: Start game
            const startRes = await request(app)
                .post(`/games/story/${roomCode}/start`)
                .send({
                    turnTime: '60',
                    keepHistory: 'on'
                })
                .expect(302);
            
            expect(startRes.headers.location).toBe(`/games/story/${roomCode}?username=TestHost`);
        });
    });

    describe('Guestbook Routes', () => {
        test('GET /guestbook should return guestbook page', async () => {
            const res = await request(app)
                .get('/guestbook')
                .expect(200);
            
            expect(res.text).toContain('html');
        });

        test('POST /guestbook should handle validation failure gracefully', async () => {
            // Mock axios for reCAPTCHA validation
            const axios = require('axios');
            jest.spyOn(axios, 'post').mockResolvedValue({
                data: { success: false }
            });
            
            const res = await request(app)
                .post('/guestbook')
                .send({
                    name: 'Test User',
                    message: 'Test message',
                    'g-recaptcha-response': 'fake-token'
                });
                
            // Should redirect back to guestbook (validation failed)
            expect([200, 302].includes(res.status)).toBe(true);
        });
    });
});
