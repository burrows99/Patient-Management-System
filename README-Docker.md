# NHS MOA Triage System - Docker Development Setup

This setup provides hot reload for both the React client and OIDC server using Docker Compose.

## Quick Start

```bash
# Start everything with hot reload
./start-dev.sh

# Or manually:
docker compose up --build
```

## Services

### React Client (Port 3000)
- Hot reload enabled with `CHOKIDAR_USEPOLLING=true`
- Source code mounted as volume for instant updates
- Environment variables configured for OIDC

### OIDC Server (Port 3001)
- Hot reload with nodemon
- Source code mounted as volume for instant updates
- Pre-configured client for the React app

### API Server (Port 4001)
- Express server that proxies HRDC and serves the triage simulator

## Development Workflow

1. **Start services**: `./start-dev.sh`
2. **Make changes** to any source files
3. **See changes instantly** - no need to restart containers
4. **View logs**: `docker compose logs -f`
5. **Stop services**: `docker compose down`

## Hot Reload Features

- **React Client**: File changes trigger automatic browser refresh
- **OIDC Server**: Code changes restart the server automatically
- **Environment**: All env vars loaded from the root `./.env` by `docker-compose.yml`
- **Networking**: Services can communicate via internal network

## Environment

- Single source of truth: root `./.env`.
- Do not keep per-service `.env` files; Compose injects the root file into all services.
- Client variables must be prefixed `REACT_APP_` to be available in the browser.

## Troubleshooting

- **Port conflicts**: Ensure ports 3000 and 3001 are free
- **Build issues**: Run `docker-compose build --no-cache`
- **Permission issues**: Check file ownership and Docker permissions

## Commands

```bash
# Start services
docker compose up

# Start in background
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild and start
docker compose up --build

# Clean up everything
docker compose down -v --remove-orphans
