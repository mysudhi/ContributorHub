# Container Guide

This guide explains how to build, run, and manage ContributorHub using Docker containers. Containerization packages the entire application and its dependencies into portable images that run consistently on any machine.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start (Recommended)](#quick-start-recommended)
4. [Architecture](#architecture)
5. [Building Images](#building-images)
6. [Running with Docker Compose](#running-with-docker-compose)
7. [Running Without Docker Compose](#running-without-docker-compose)
8. [Development with Docker](#development-with-docker)
9. [Configuration](#configuration)
10. [Data Persistence](#data-persistence)
11. [Networking](#networking)
12. [Stopping and Cleanup](#stopping-and-cleanup)
13. [Troubleshooting](#troubleshooting)
14. [Production Deployment Tips](#production-deployment-tips)

---

## Overview

ContributorHub is containerized using a multi-stage Dockerfile that produces two optimized images:

| Image | Base | Size | Purpose |
|-------|------|------|---------|
| `contributorhub-server` | `node:20-alpine` | ~180 MB | Express API + Prisma ORM |
| `contributorhub-client` | `nginx:alpine` | ~25 MB | Static React frontend + reverse proxy |

Docker Compose orchestrates these with a PostgreSQL 16 database, giving you a complete production-ready stack with a single command.

---

## Prerequisites

### Install Docker

**Linux (Ubuntu/Debian):**

```bash
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
# Log out and back in for group change to take effect
```

Full instructions: https://docs.docker.com/engine/install/ubuntu/

**macOS:**

Download and install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/).

```bash
# Verify installation
docker --version
docker compose version
```

**Windows:**

1. Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
2. Enable WSL 2 backend when prompted (recommended)
3. Open Docker Desktop and wait for it to start

```powershell
# Verify installation
docker --version
docker compose version
```

### Verify Docker is running

```bash
docker info
```

If you get a "Cannot connect to the Docker daemon" error, start Docker:
- **Linux:** `sudo systemctl start docker`
- **macOS/Windows:** Open the Docker Desktop application

---

## Quick Start (Recommended)

The fastest way to run ContributorHub in containers:

```bash
# 1. Clone the repository
git clone https://github.com/mysudhi/ContributorHub.git
cd ContributorHub

# 2. Build and start all services
docker compose up -d

# 3. Wait ~10 seconds for services to initialize, then verify
docker compose ps
```

**Access the application:**

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | ContributorHub web application |
| API (direct) | http://localhost:4000/health | Express API health check |
| API (via proxy) | http://localhost:3000/health | API through nginx reverse proxy |

**Stop everything:**

```bash
docker compose down
```

That's it! The rest of this guide covers details, customization, and troubleshooting.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                            │
│                                                             │
│  ┌──────────────────┐                                      │
│  │   client (nginx)  │ ← Port 3000 (public)                │
│  │  Serves React app │                                      │
│  │  Proxies /api →   │───────┐                             │
│  │  Proxies /health →│       │                             │
│  └──────────────────┘       │                             │
│                              ▼                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  server (Node.js) │  │    db (Postgres)  │               │
│  │  Express API      │──│  contributorhub DB  │               │
│  │  Port 4000        │  │  Port 5432        │               │
│  └──────────────────┘  └──────────────────┘               │
│       ↑ Port 4000 (public)    ↑ Port 5432 (public)         │
└─────────────────────────────────────────────────────────────┘
```

**Service roles:**

- **db** — PostgreSQL 16 database storing all application data
- **server** — Express.js API that handles business logic and connects to PostgreSQL via Prisma
- **client** — nginx serving the compiled React frontend and reverse-proxying API requests to the server

---

## Building Images

### Build all images

```bash
docker compose build
```

### Build individual images

```bash
# Build only the server
docker compose build server

# Build only the client
docker compose build client
```

### Build with no cache (fresh build)

```bash
docker compose build --no-cache
```

### Build the server image standalone

```bash
docker build --target server -t contributorhub-server .
```

### Build the client image standalone

```bash
docker build --target client -t contributorhub-client .
```

---

## Running with Docker Compose

### Start all services (detached)

```bash
docker compose up -d
```

### Start with build (rebuild images first)

```bash
docker compose up -d --build
```

### View logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f server
docker compose logs -f client
docker compose logs -f db
```

### Check service status

```bash
docker compose ps
```

### Restart a service

```bash
docker compose restart server
```

### Scale (if needed)

```bash
docker compose up -d --scale server=2
```

---

## Running Without Docker Compose

If you prefer to run containers manually or use an external PostgreSQL database:

### 1. Create a Docker network

```bash
docker network create contributorhub-net
```

### 2. Start PostgreSQL

```bash
docker run -d \
  --name contributorhub-db \
  --network contributorhub-net \
  -e POSTGRES_USER=contributorhub \
  -e POSTGRES_PASSWORD=contributorhub \
  -e POSTGRES_DB=contributorhub \
  -p 5432:5432 \
  -v contributorhub-pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

### 3. Build and start the API server

```bash
docker build --target server -t contributorhub-server .

docker run -d \
  --name contributorhub-server \
  --network contributorhub-net \
  -e DATABASE_URL="postgresql://contributorhub:contributorhub@contributorhub-db:5432/contributorhub" \
  -e DIRECT_URL="postgresql://contributorhub:contributorhub@contributorhub-db:5432/contributorhub" \
  -e DB_HOST=contributorhub-db \
  -e DB_PORT=5432 \
  -e DB_USER=contributorhub \
  -e NODE_ENV=production \
  -e PORT=4000 \
  -p 4000:4000 \
  contributorhub-server
```

### 4. Build and start the frontend

```bash
docker build --target client -t contributorhub-client .

docker run -d \
  --name contributorhub-client \
  --network contributorhub-net \
  -p 3000:80 \
  contributorhub-client
```

### Using an external PostgreSQL database

If you have an existing PostgreSQL server, skip step 2 and adjust the `DATABASE_URL` in step 3:

```bash
docker run -d \
  --name contributorhub-server \
  -e DATABASE_URL="postgresql://user:password@your-db-host:5432/contributorhub" \
  -e DIRECT_URL="postgresql://user:password@your-db-host:5432/contributorhub" \
  -e DB_HOST=your-db-host \
  -e DB_PORT=5432 \
  -e DB_USER=user \
  -p 4000:4000 \
  contributorhub-server
```

---

## Development with Docker

For local development, you may want to run only PostgreSQL in Docker while running the frontend and backend natively (with hot reload):

### Start only the database

```bash
docker compose -f docker-compose.dev.yml up -d
```

This starts PostgreSQL on port 5432 with the standard credentials.

### Configure your local `.env`

```env
DATABASE_URL="postgresql://contributorhub:contributorhub@localhost:5432/contributorhub"
DIRECT_URL="postgresql://contributorhub:contributorhub@localhost:5432/contributorhub"
```

### Run the app locally

```bash
# Generate Prisma client and run migrations
npx prisma generate --schema prisma/schema.prisma
npx prisma migrate dev --schema prisma/schema.prisma

# Start the backend (in one terminal)
DATABASE_URL="postgresql://contributorhub:contributorhub@localhost:5432/contributorhub" \
DIRECT_URL="postgresql://contributorhub:contributorhub@localhost:5432/contributorhub" \
npm run dev -w server

# Start the frontend (in another terminal)
npm run dev -w client
```

### Stop the dev database

```bash
docker compose -f docker-compose.dev.yml down
```

To also delete the data volume:

```bash
docker compose -f docker-compose.dev.yml down -v
```

---

## Configuration

### Environment Variables

The server container accepts these environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (pooled) |
| `DIRECT_URL` | Yes | — | PostgreSQL direct connection string |
| `DB_HOST` | Yes | — | PostgreSQL hostname (for health check) |
| `DB_PORT` | Yes | — | PostgreSQL port (for health check) |
| `DB_USER` | Yes | — | PostgreSQL username (for health check) |
| `NODE_ENV` | No | `production` | Node.js environment |
| `PORT` | No | `4000` | API server port |
| `JWT_SECRET` | No | `dev-secret-...` | Secret key for JWT token signing |
| `FRONTEND_URL` | No | `http://localhost:5173` | Frontend URL for OAuth redirects |
| `SMTP_HOST` | No | — | SMTP server hostname (enables email notifications) |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_SECURE` | No | `false` | Use SSL/TLS for SMTP connection |
| `SMTP_USER` | No | — | SMTP authentication username |
| `SMTP_PASS` | No | — | SMTP authentication password |
| `SMTP_FROM` | No | `ContributorHub <noreply@contributorhub.org>` | Sender address for notification emails |

### Customizing ports

Edit `docker-compose.yml` to change exposed ports:

```yaml
services:
  client:
    ports:
      - "8080:80"    # Change 3000 to 8080
  server:
    ports:
      - "8000:4000"  # Change 4000 to 8000
```

### Customizing database credentials

```yaml
services:
  db:
    environment:
      POSTGRES_USER: myuser
      POSTGRES_PASSWORD: mysecretpassword
      POSTGRES_DB: mydb
  server:
    environment:
      DATABASE_URL: postgresql://myuser:mysecretpassword@db:5432/mydb
      DIRECT_URL: postgresql://myuser:mysecretpassword@db:5432/mydb
      DB_USER: myuser
```

---

## Data Persistence

### Database data

PostgreSQL data is stored in a Docker named volume (`pgdata`). This means:

- Data **persists** across `docker compose down` and `docker compose up`
- Data is **deleted** when you run `docker compose down -v` (the `-v` flag removes volumes)

### Backing up the database

```bash
# Create a backup
docker compose exec db pg_dump -U contributorhub contributorhub > backup.sql

# Restore from backup
docker compose exec -T db psql -U contributorhub contributorhub < backup.sql
```

### Resetting the database

```bash
# Remove containers and volumes (deletes all data)
docker compose down -v

# Restart fresh
docker compose up -d
```

---

## Networking

### Internal communication

Containers communicate using Docker's internal DNS:
- The server connects to PostgreSQL at `db:5432`
- The client (nginx) proxies to the server at `server:4000`

### External access

| Port | Service | Access from host |
|------|---------|-----------------|
| 3000 | nginx (frontend + proxy) | http://localhost:3000 |
| 4000 | Express API (direct) | http://localhost:4000 |
| 5432 | PostgreSQL (direct) | `psql -h localhost -U contributorhub` |

### Limiting external access

If you only want the frontend accessible externally (not the API or database directly), remove the port mappings for `server` and `db` in `docker-compose.yml`:

```yaml
services:
  db:
    # ports:             # Remove this section
    #   - "5432:5432"
  server:
    # ports:             # Remove this section
    #   - "4000:4000"
```

The services will still communicate internally via the Docker network.

---

## Stopping and Cleanup

### Stop services (keep data)

```bash
docker compose down
```

### Stop services and delete data

```bash
docker compose down -v
```

### Remove built images

```bash
docker compose down --rmi all
```

### Full cleanup (everything)

```bash
docker compose down -v --rmi all
docker system prune -f
```

### Remove individual containers (manual setup)

```bash
docker stop contributorhub-client contributorhub-server contributorhub-db
docker rm contributorhub-client contributorhub-server contributorhub-db
docker network rm contributorhub-net
docker volume rm contributorhub-pgdata
```

---

## Troubleshooting

### Containers won't start

**Check logs:**
```bash
docker compose logs
```

**Common causes:**
- Port conflict: Another service is using port 3000, 4000, or 5432
- Docker not running: Start Docker Desktop or the daemon
- Build failed: Run `docker compose build` to see build errors

---

### "port is already allocated"

**Symptom:** `Error: Bind for 0.0.0.0:5432 failed: port is already allocated`

**Fix:** Stop the conflicting service:

**Linux:**
```bash
sudo lsof -i :5432
sudo systemctl stop postgresql
```

**macOS:**
```bash
brew services stop postgresql@16
```

**Windows (PowerShell):**
```powershell
netstat -ano | findstr :5432
Stop-Service -Name "postgresql-x64-16"
```

Or change the port mapping in `docker-compose.yml`.

---

### Server exits immediately

**Check logs:**
```bash
docker compose logs server
```

**Common causes:**

1. **Database not ready:** The server waits for PostgreSQL but may timeout. Restart:
   ```bash
   docker compose restart server
   ```

2. **Migration error:** Check if the database migration failed in the logs. You may need to reset:
   ```bash
   docker compose down -v
   docker compose up -d
   ```

---

### Frontend shows "502 Bad Gateway"

**Cause:** nginx cannot reach the server container.

**Fix:**
1. Check that the server is running: `docker compose ps`
2. Check server logs: `docker compose logs server`
3. Restart: `docker compose restart server`

---

### Database connection refused

**Symptom:** Server logs show `connection refused` to PostgreSQL.

**Fixes:**
1. Ensure the `db` service is healthy: `docker compose ps`
2. Wait longer — PostgreSQL can take a few seconds to initialize on first run
3. Restart: `docker compose down && docker compose up -d`

---

### Build fails with "no space left on device"

**Fix:** Clean up Docker resources:

```bash
docker system prune -a --volumes
```

> **Warning:** This removes ALL unused Docker data including volumes from other projects.

---

### Changes not reflected after rebuild

Docker caches build layers aggressively. Force a clean rebuild:

```bash
docker compose build --no-cache
docker compose up -d
```

---

### Permission denied on `docker-entrypoint.sh`

**Symptom:** `exec: permission denied` or similar errors.

**Fix:** Ensure the entrypoint script is executable:

```bash
chmod +x docker/docker-entrypoint.sh
docker compose build --no-cache server
docker compose up -d
```

---

## Production Deployment Tips

### Use environment-specific compose files

```bash
# Development
docker compose -f docker-compose.dev.yml up -d

# Production
docker compose -f docker-compose.yml up -d
```

### Security checklist

- [ ] Change default database passwords
- [ ] Remove port exposure for `db` and `server` (access through nginx only)
- [ ] Set `NODE_ENV=production`
- [ ] Add rate limiting to nginx
- [ ] Enable HTTPS (add SSL certificates to nginx)
- [ ] Use Docker secrets for sensitive environment variables
- [ ] Set resource limits on containers

### Adding HTTPS

Add an SSL certificate to the nginx container. Modify `docker/nginx.conf`:

```nginx
server {
    listen 443 ssl;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    # ... rest of config
}

server {
    listen 80;
    return 301 https://$host$request_uri;
}
```

Mount certificates in `docker-compose.yml`:

```yaml
services:
  client:
    volumes:
      - ./certs:/etc/nginx/ssl:ro
    ports:
      - "443:443"
      - "80:80"
```

### Health checks

The `db` service has a built-in health check. You can add one for the server:

```yaml
services:
  server:
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:4000/health"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### Resource limits

```yaml
services:
  server:
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
  db:
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 256M
```

---

## File Reference

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build (server + client targets) |
| `docker-compose.yml` | Production orchestration (db + server + client) |
| `docker-compose.dev.yml` | Development PostgreSQL only |
| `docker/nginx.conf` | nginx config (frontend serving + API proxy) |
| `docker/docker-entrypoint.sh` | Server startup script (waits for DB, runs migrations) |
| `.dockerignore` | Excludes files from Docker build context |
