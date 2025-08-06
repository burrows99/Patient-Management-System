# Use a lightweight Node.js image
FROM node:18-alpine

# Set work directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV PORT=4000
ENV BASE_URL=http://localhost:4000
ENV PUBLIC_URL=http://localhost:4000
ENV FRONTEND_URL=http://localhost:3000
ENV DOCKER=true
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_NAME=postgres
ENV DB_USER=postgres
ENV DB_PASSWORD=postgres_password
ENV JWT_SECRET=your-super-secret-jwt-key
ENV SMTP_HOST=mailhog
ENV SMTP_PORT=1025
ENV SMTP_FROM=no-reply@nhs.local

# Expose the app port and debug port
EXPOSE 4000
EXPOSE 9229

# Start the server in debug mode
CMD ["node", "--inspect=0.0.0.0:9229", "src/index.js"]