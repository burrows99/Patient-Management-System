FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use install for dev to avoid lockfile mismatch after adding deps)
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Default command (will be overridden by docker-compose)
CMD ["npm", "start"]
