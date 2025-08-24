const storyGameController = require('../../app/controllers/storyGame');
const { renderMarkdown } = require('../../app/helpers/sanitizeMarkdown');

// Mock the renderMarkdown function
jest.mock('../../app/helpers/sanitizeMarkdown', () => ({
    renderMarkdown: jest.fn((content) => `<p>${content}</p>`)
}));

// Helper to get the rooms object from the module
const getModuleRooms = () => {
    // Access the private rooms object by requiring the module
    delete require.cache[require.resolve('../../app/controllers/storyGame')];
    const controller = require('../../app/controllers/storyGame');
    return controller;
};

describe('Story Game Controller', () => {
    let mockReq, mockRes, mockIo, controller;

    beforeEach(() => {
        // Clear the module cache to get fresh instances
        delete require.cache[require.resolve('../../app/controllers/storyGame')];
        controller = require('../../app/controllers/storyGame');
        
        mockReq = {
            query: {},
            params: {},
            body: {},
            app: {
                get: jest.fn()
            },
            protocol: 'http',
            get: jest.fn(() => 'localhost:1234')
        };
        
        mockRes = {
            render: jest.fn(),
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };

        mockIo = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn()
        };

        mockReq.app.get.mockReturnValue(mockIo);
    });

    afterEach(() => {
        // Clear any pending timeouts
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    describe('createRoom', () => {
        test('should render enterName page when no username provided', () => {
            controller.createRoom(mockReq, mockRes);
            
            expect(mockRes.render).toHaveBeenCalledWith('storyGame/enterName', { startGame: true });
        });

        test('should create room and redirect when username provided', () => {
            mockReq.query.username = 'TestHost';
            
            controller.createRoom(mockReq, mockRes);
            
            expect(mockRes.redirect).toHaveBeenCalled();
            const redirectCall = mockRes.redirect.mock.calls[0][0];
            expect(redirectCall).toMatch(/\/games\/story\/[A-Z0-9]{4}\?username=TestHost/);
        });
    });

    describe('joinRoom', () => {
        test('should return 404 for non-existent room', () => {
            mockReq.params.code = 'FAKE';
            
            controller.joinRoom(mockReq, mockRes);
            
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.render).toHaveBeenCalledWith('404');
        });

        test('should render enterName when no username provided for existing room', () => {
            // First create a room
            mockReq.query.username = 'TestHost';
            controller.createRoom(mockReq, mockRes);
            
            // Extract the room code from the redirect call
            const redirectUrl = mockRes.redirect.mock.calls[0][0];
            const roomCode = redirectUrl.match(/\/games\/story\/([A-Z0-9]{4})/)[1];
            
            // Reset mocks and try to join without username
            mockRes.render.mockClear();
            mockReq.params.code = roomCode;
            mockReq.query.username = null;
            
            controller.joinRoom(mockReq, mockRes);
            
            expect(mockRes.render).toHaveBeenCalledWith('storyGame/enterName', { code: roomCode });
        });
    });

    describe('startGame', () => {
        let roomCode;
        
        beforeEach(() => {
            jest.useFakeTimers();
            
            // Create a room first
            mockReq.query.username = 'TestHost';
            controller.createRoom(mockReq, mockRes);
            
            const redirectUrl = mockRes.redirect.mock.calls[0][0];
            roomCode = redirectUrl.match(/\/games\/story\/([A-Z0-9]{4})/)[1];
            
            // Add some players
            mockReq.params.code = roomCode;
            mockReq.query.username = 'Player1';
            controller.joinRoom(mockReq, mockRes);
            
            mockReq.query.username = 'Player2';
            controller.joinRoom(mockReq, mockRes);
        });

        test('should return 404 for non-existent room', () => {
            mockReq.params.code = 'FAKE';
            mockRes.status.mockClear();
            mockRes.render.mockClear();
            
            controller.startGame(mockReq, mockRes);
            
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.render).toHaveBeenCalledWith('404');
        });

        test('should initialize game state correctly', () => {
            mockReq.body = {
                keepHistory: true,
                turnTime: '120'
            };
            mockRes.redirect.mockClear();
            
            controller.startGame(mockReq, mockRes);
            
            expect(mockRes.redirect).toHaveBeenCalled();
            
            // Fast-forward timers to trigger the turn start
            jest.advanceTimersByTime(1000);
            
            expect(mockIo.to).toHaveBeenCalledWith(roomCode);
            expect(mockIo.emit).toHaveBeenCalledWith('start-turn', expect.objectContaining({
                turn: 0,
                endsIn: 120
            }));
        });
    });

    describe('submitTurn', () => {
        test('should return 404 for non-existent room', () => {
            mockReq.body = {
                code: 'FAKE',
                turn: '0',
                username: 'TestUser',
                content: 'Test content'
            };
            
            controller.submitTurn(mockReq, mockRes);
            
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.render).toHaveBeenCalledWith('404');
        });

        test('should accept valid turn submission', () => {
            // Create and start a game first
            jest.useFakeTimers();
            
            mockReq.query.username = 'TestHost';
            controller.createRoom(mockReq, mockRes);
            
            const redirectUrl = mockRes.redirect.mock.calls[0][0];
            const roomCode = redirectUrl.match(/\/games\/story\/([A-Z0-9]{4})/)[1];
            
            // Add players and start game
            mockReq.params.code = roomCode;
            mockReq.query.username = 'Player1';
            controller.joinRoom(mockReq, mockRes);
            
            mockReq.body = { keepHistory: false, turnTime: '60' };
            controller.startGame(mockReq, mockRes);
            
            // Advance timer to start the turn
            jest.advanceTimersByTime(1000);
            
            // Now submit a turn
            mockReq.body = {
                code: roomCode,
                turn: '0', // Current turn is 0
                username: 'Player1',
                content: 'Test content'
            };
            mockRes.render.mockClear();
            
            controller.submitTurn(mockReq, mockRes);
            
            expect(mockRes.render).toHaveBeenCalledWith('storyGame/wait', expect.objectContaining({
                code: roomCode,
                turn: 0,
                username: 'Player1',
                message: 'Waiting for other players...'
            }));
        });
    });
});