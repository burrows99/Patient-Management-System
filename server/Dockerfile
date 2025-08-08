# server/Dockerfile

FROM node:18-alpine AS build
WORKDIR /app

# Import package files from server/
COPY server/package*.json ./
RUN npm install

# Import rest of server source
COPY server/ ./

# You can add build steps if needed here...

FROM node:18-alpine
WORKDIR /app

COPY --from=build /app ./

ENV NODE_ENV=development
ENV PORT=4000
ENV DOCKER=true
ENV JWT_SECRET=your-super-secret-jwt-key
ENV SMTP_HOST=mailhog
ENV SMTP_PORT=1025
ENV SMTP_FROM=no-reply@nhs.local

EXPOSE 4000
CMD ["npm", "start"]

# # Use a lightweight Node.js image
# FROM node:18-alpine

# # Set work directory
# WORKDIR /app

# # Install dependencies
# COPY package*.json ./
# RUN npm install

# # Copy source code
# COPY . .

# # Set environment variables
# ENV NODE_ENV=development
# ENV PORT=4000
# ENV DOCKER=true
# ENV JWT_SECRET=your-super-secret-jwt-key
# ENV SMTP_HOST=mailhog
# ENV SMTP_PORT=1025
# ENV SMTP_FROM=no-reply@nhs.local

# # Expose the app port and debug port
# EXPOSE 4000
# EXPOSE 9229

# # Start the server in debug mode
# CMD ["node", "--inspect=0.0.0.0:9229", "src/index.js"]
