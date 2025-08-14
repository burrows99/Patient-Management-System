#!/bin/bash

echo "🚀 Starting NHS MOA Triage System with Docker Compose..."

# Build and start services
docker-compose up --build -d

echo "✅ Services started!"
echo "📱 React Client: http://localhost:3000"
echo "🔐 OIDC Server: http://localhost:3001"
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"

# Show logs
docker-compose logs -f

