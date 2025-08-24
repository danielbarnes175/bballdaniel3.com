# Copilot Instructions for bballdaniel3.com

## Project Overview

This is Daniel's personal website (bballdaniel3.com) - a Node.js/Express web application that serves as a personal portfolio, blog, and interactive fiction platform. The site features:

- **Personal homepage** with introduction and navigation
- **Blog system** with markdown posts
- **Interactive fiction games** (text-based adventure games)
- **Guestbook** for visitor messages
- **Project showcase** and portfolio
- **Real-time features** using Socket.IO

## Technology Stack

- **Backend**: Node.js with Express.js framework
- **Template Engine**: Handlebars (express-handlebars)
- **Real-time Communication**: Socket.IO
- **Containerization**: Docker with docker-compose
- **Security**: Helmet.js for security headers
- **Content**: Markdown files for blog posts
- **Styling**: Custom CSS with some external libraries
- **Development**: nodemon for auto-reloading

## Project Structure

```
/app/
├── server.js              # Main application entry point
├── controllers/           # Route controllers
├── routes/                # Express route definitions
├── views/                 # Handlebars templates
│   ├── layouts/           # Page layouts
│   ├── partials/          # Reusable components
│   ├── posts/             # Blog post templates
│   └── storyGame/         # Interactive fiction game templates
├── helpers/               # Handlebars helpers and utilities
├── services/              # Business logic and services
├── public/                # Static assets (CSS, JS, images)
└── data/                  # Application data and content
```

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Run with nodemon for development
npm run nodemon

# Or use Docker Compose
npm run build  # docker-compose build
npm run start  # docker-compose up -d
npm run restart # docker-compose down && docker-compose up --build -d
```

### Testing
- Currently no automated tests are configured
- Manual testing through browser interaction

### Deployment
- Automated deployment via GitHub Actions on push to `main`
- Uses Tailscale for secure server access
- Deploys to a remote server using SSH and Docker

## Key Files and Conventions

### Server Configuration
- **server.js**: Main Express app setup with middleware, routes, and Socket.IO
- **docker-compose.yml**: Development and production container configuration
- **Dockerfile**: Node.js Alpine-based container

### Routes and Controllers
- **routes/index.js**: Defines all HTTP routes
- **controllers/**: Contains logic for handling requests
- Follow RESTful conventions where applicable
- Use descriptive route names matching the site structure

### Templates and Views
- **Handlebars templates** in `/views/`
- **Layouts** for consistent page structure
- **Partials** for reusable components
- Custom Handlebars helpers in `/helpers/`

### Content Management
- **Blog posts**: Stored as markdown files, processed server-side
- **Interactive fiction**: Custom game engine with state management
- **Guestbook**: Persistent visitor message system

## Coding Standards

### JavaScript
- Use ES6+ features where supported
- Follow Node.js conventions
- Use `const` and `let` appropriately
- Consistent indentation (appears to use 4 spaces)
- Follow consistent code style and best practices
- Consider setting up linting tools (ESLint, Prettier) for code quality
- Never use emojis in code, comments, or commit messages
- Avoid excessive comments that explain basic or obvious functionality
- Only add comments for complex logic or non-obvious implementation details

### Templates
- Use semantic HTML
- Keep templates focused and single-purpose
- Leverage Handlebars helpers for complex logic

### Security
- Helmet.js configured for security headers (currently commented out)
- Input sanitization for user-generated content
- CSP policies should be implemented for production

## Common Tasks

### Adding New Pages
1. Add route to `routes/index.js`
2. Create controller method in `controllers/`
3. Create Handlebars template in `views/`
4. Add navigation links as needed

### Blog Management
- Add markdown files to appropriate directory
- Ensure proper frontmatter for metadata
- Use existing markdown processing pipeline

### Interactive Fiction Games
- Extend existing game engine in `storyGame/` directory
- Follow established pattern for game state management
- Use Socket.IO for real-time interactions

### Deployment
- Push to `main` branch triggers automatic deployment
- Monitor GitHub Actions for deployment status
- Check server logs if deployment issues occur

## Environment Configuration

- Uses `.env` file for environment variables
- Production vs development configuration in docker-compose
- Port 1234 for the web server

## Dependencies

Key dependencies include:
- express, express-handlebars
- socket.io for real-time features
- helmet for security
- marked for markdown processing
- dotenv for environment management
- nodemon for development

When adding new dependencies, consider security, bundle size, and maintenance status.