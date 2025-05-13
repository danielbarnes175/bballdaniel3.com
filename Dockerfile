FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the app
COPY app /app

# Expose the port the app runs on
EXPOSE 1234

# Start the application
CMD ["node", "server.js"]
