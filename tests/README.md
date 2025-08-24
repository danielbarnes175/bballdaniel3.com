# Tests

This directory contains comprehensive test coverage for bballdaniel3.com, including unit tests, integration tests, and UI tests.

## Test Structure

```
tests/
├── unit/           # Unit tests for individual functions and modules
├── integration/    # Integration tests for API endpoints
├── ui/            # End-to-end UI tests using Playwright
└── setup/         # Test configuration and setup files
```

## Running Tests

### All Tests
```bash
npm test           # Run unit and integration tests
npm run test:all   # Run all tests including UI tests
```

### Specific Test Types
```bash
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only  
npm run test:ui          # Run UI tests only
```

### Development
```bash
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## Test Coverage

The tests cover:

### Unit Tests (`tests/unit/`)
- **Story Game Logic** (`storyGame.test.js`): Tests the core story game functionality including room creation, player management, turn progression, and game state management
- **Helper Functions** (`helpers.test.js`): Tests utility functions like markdown rendering and sanitization, logging service

### Integration Tests (`tests/integration/`)
- **API Endpoints** (`api.test.js`): Tests all HTTP routes including story game endpoints, basic pages, and error handling

### UI Tests (`tests/ui/`)
- **Story Game Workflows** (`storyGame.spec.js`): End-to-end tests of the complete story game user experience including room creation, joining, and game play
- **Basic Site Navigation**: Tests for core site functionality and pages

## Key Features Tested

### Story Game
- ✅ Room creation with unique codes
- ✅ Player joining and validation
- ✅ Game state management
- ✅ Turn-based progression
- ✅ Real-time communication
- ✅ Error handling for invalid rooms/turns
- ✅ Complete user workflows

### Core Functionality
- ✅ Request/response logging
- ✅ Markdown rendering and sanitization
- ✅ Route handling and error pages
- ✅ Basic site navigation

## Configuration

- **Jest**: Configured in `jest.config.json` for unit and integration tests
- **Playwright**: Configured in `playwright.config.js` for UI tests
- **Coverage**: Reports generated in `tests/coverage/`

## Notes

- UI tests expect the server to be running on `localhost:1234`
- Tests use mocking for external dependencies (Discord webhooks, etc.)
- Coverage reports exclude views, public assets, and the main server file
- Tests are designed to run independently without side effects