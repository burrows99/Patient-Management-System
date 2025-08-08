# Build stage
FROM node:18-alpine as build
WORKDIR /app

# Use root context to copy client files
COPY client/package*.json ./
RUN npm install
COPY client/ ./

ENV REACT_APP_DOCKER=true
RUN npm run build:docker

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html

# Correct nginx.conf path from client folder
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

ENV REACT_APP_API_URL=https://nhs-server-98t2.onrender.com

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


# # Build stage
# FROM node:18-alpine as build

# WORKDIR /app

# # Copy package files
# COPY package*.json ./

# # Install dependencies
# RUN npm install

# # Copy the rest of the application
# COPY . .

# # Set environment variables for Docker build
# ENV REACT_APP_DOCKER=true

# # Build the app with production settings
# RUN npm run build:docker

# # Production stage
# FROM nginx:stable-alpine

# # Copy the build output to replace the default nginx contents
# COPY --from=build /app/build /usr/share/nginx/html

# # Copy the nginx configuration
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# # Expose port 80
# EXPOSE 80

# # Start nginx
# CMD ["nginx", "-g", "daemon off;"]
