FROM node:20-alpine

WORKDIR /app

# Install nodemon globally for hot reload
RUN npm install -g nodemon

# Copy package files
COPY package*.json ./

# Install dependencies (use install for dev, ci for production)
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Default command (will be overridden by docker-compose)
CMD ["npm", "start"]
