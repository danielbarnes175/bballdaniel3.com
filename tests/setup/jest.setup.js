// Global Jest setup
jest.setTimeout(10000);

// Mock console.log and console.error to reduce noise in tests
global.console = {
    ...console,
    // Uncomment the line below if you want to suppress console.log in tests
    // log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
};

// Mock process.env for tests
process.env.NODE_ENV = 'test';
