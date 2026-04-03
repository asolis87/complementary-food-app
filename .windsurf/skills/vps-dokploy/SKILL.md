---
name: vps-dokploy
description: >
  VPS deployment conventions for Vera Sesiom using Dokploy as PaaS layer. Self-hosted alternative to AWS for simpler projects.
  Trigger: When deploying to a VPS, configuring Dokploy, setting up Docker-based deployments, or choosing a simpler hosting strategy.
license: proprietary
metadata:
  author: vera-sesiom
  version: "1.0"
---

## When to Use

- Deploying a project to a VPS (DigitalOcean, Hetzner, Contabo, etc.)
- Setting up Dokploy for application management
- Configuring Docker-based deployments without AWS complexity
- MVPs, internal tools, or projects with predictable traffic
- Projects where cost predictability is a priority

---

## Critical Rules

1. **Dokploy as PaaS layer** — no manual Docker management on the VPS
2. **Docker Compose for all services** — app, database, cache, everything containerized
3. **Traefik as reverse proxy** (managed by Dokploy) — automatic SSL, routing
4. **Environment variables through Dokploy UI or `.env` files** — NEVER hardcoded
5. **Automated backups for databases** — daily minimum, tested monthly
6. **Monitoring MUST be configured** — at minimum uptime checks + resource alerts
7. **SSH access restricted** — key-based only, no password auth, non-standard port

---

## When VPS + Dokploy vs AWS

See [Infrastructure Decision Criteria](../_shared/conventions.md#infraestructura---criterio-de-decision) for the full decision framework.

**Quick reference:**

| Choose VPS + Dokploy | Choose AWS |
|----------------------|------------|
| Predictable traffic | Spiky/unpredictable traffic |
| Fixed monthly budget | Pay-as-you-go acceptable |
| Simple architecture (web + API + DB) | Complex event-driven needs |
| Small team, no DevOps dedicated | DevOps capacity available |
| MVP or internal tool | Enterprise product |
| Fast time-to-deploy | Advanced services needed (ML, queues, etc.) |

---

## Recommended VPS Providers

| Provider | Best For | Starting Price |
|----------|---------|---------------|
| **Hetzner** | Best price/performance in EU | ~$4/mo |
| **DigitalOcean** | Simple UX, good docs | ~$6/mo |
| **Contabo** | Raw power for the price | ~$5/mo |
| **Vultr** | Global presence, good API | ~$6/mo |

### Minimum Specs for Typical Project

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Storage | 80 GB SSD | 160 GB NVMe |
| Bandwidth | 20 TB/mo | Unlimited |

---

## Dokploy Setup

### Initial Server Setup

```bash
# 1. Update system
apt update && apt upgrade -y

# 2. Install Dokploy (one command)
curl -sSL https://dokploy.com/install.sh | sh

# 3. Access Dokploy panel
# https://your-server-ip:3000 (first time setup)
```

### Dokploy Project Structure

```
Dokploy Dashboard
├── Projects
│   ├── myapp-production
│   │   ├── web          (Vue frontend — static/Nginx)
│   │   ├── api          (Node.js backend)
│   │   ├── postgres     (PostgreSQL database)
│   │   └── redis        (Redis cache — if needed)
│   └── myapp-staging
│       ├── web
│       ├── api
│       ├── postgres
│       └── redis
```

---

## Application Deployment

### Frontend (Vue — Static Build)

Dokploy configuration:

| Setting | Value |
|---------|-------|
| Source | GitHub repo |
| Build method | Nixpacks or Dockerfile |
| Build command | `pnpm --filter @vera-sesiom/web build` |
| Publish directory | `apps/web/dist` |
| Domain | `app.myproject.com` |

**Dockerfile (if not using Nixpacks):**

```dockerfile
# Build stage
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @vera-sesiom/web build

# Serve stage
FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Backend (Node.js)

Dokploy configuration:

| Setting | Value |
|---------|-------|
| Source | GitHub repo |
| Build method | Dockerfile |
| Port | 3000 |
| Health check | `GET /api/v1/health` |
| Domain | `api.myproject.com` |

**Dockerfile:**

```dockerfile
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @vera-sesiom/api build

FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### Database (PostgreSQL)

Use Dokploy's built-in database service:

| Setting | Value |
|---------|-------|
| Type | PostgreSQL |
| Version | 16 |
| Volume | `/data/postgres/myapp` (persistent) |
| Backup | Daily automated via Dokploy |

**NEVER expose the database port publicly.** Connect via Docker internal network.

---

## Docker Compose (Alternative to Dokploy UI)

For projects that prefer config-as-code:

```yaml
# docker-compose.yml (deployed via Dokploy Compose feature)
version: "3.8"

services:
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=Host(`app.myproject.com`)"
      - "traefik.http.routers.web.tls.certresolver=letsencrypt"
    depends_on:
      - api

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/myapp
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.myproject.com`)"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=myapp

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## Environment Strategy

| Environment | Server | Domain | Deploy Trigger |
|------------|--------|--------|---------------|
| `staging` | Same VPS (separate Dokploy project) | `staging.myproject.com` | Push to `develop` |
| `production` | Same or dedicated VPS | `app.myproject.com` | Push to `main` (manual approve) |

For small projects, **staging and production can live on the same VPS** as separate Dokploy projects. For production-critical apps, use separate servers.

---

## CI/CD with GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via Dokploy webhook
        run: |
          curl -X POST "${{ secrets.DOKPLOY_WEBHOOK_URL }}" \
            -H "Content-Type: application/json"
```

Dokploy supports webhook-based deployments — push to branch triggers rebuild automatically.

---

## Security Hardening

### Server Level

```bash
# 1. SSH hardening
# /etc/ssh/sshd_config
Port 2222                     # Non-standard port
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

# 2. Firewall (UFW)
ufw default deny incoming
ufw default allow outgoing
ufw allow 2222/tcp            # SSH (custom port)
ufw allow 80/tcp              # HTTP (for Let's Encrypt)
ufw allow 443/tcp             # HTTPS
ufw enable

# 3. Fail2ban
apt install fail2ban -y
systemctl enable fail2ban

# 4. Automatic security updates
apt install unattended-upgrades -y
dpkg-reconfigure -plow unattended-upgrades
```

### Application Level

- All traffic through HTTPS (Traefik + Let's Encrypt — automatic with Dokploy)
- Database not exposed to internet (Docker internal network only)
- Environment variables through Dokploy — never in code
- Regular OS and Docker image updates

---

## Backups

### Database Backups

```bash
# Automated via cron (or Dokploy backup feature)
# Daily backup at 3 AM
0 3 * * * docker exec postgres pg_dump -U user myapp | gzip > /backups/myapp-$(date +\%Y\%m\%d).sql.gz

# Keep last 30 days
find /backups -name "*.sql.gz" -mtime +30 -delete
```

### Off-site Backup (MUST for production)

```bash
# Sync to S3-compatible storage (Backblaze B2, Wasabi, etc.)
# Much cheaper than AWS S3 for backups
rclone sync /backups remote:myapp-backups --max-age 30d
```

---

## Monitoring

### Minimum Required

| What | Tool | Why |
|------|------|-----|
| Uptime | UptimeRobot / Betterstack (free tier) | Know when it's down |
| Resources | Dokploy dashboard / Netdata | CPU, RAM, disk usage |
| Logs | Dokploy logs / Dozzle | Application error tracking |
| Alerts | Telegram/Slack bot | Immediate notification |

### Health Check Endpoint

```typescript
// MUST exist in every backend
router.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || 'unknown',
  })
})
```

---

## Scaling Strategy

When the VPS approach hits its limits:

1. **Vertical scaling first** — upgrade VPS specs (easy with most providers)
2. **Add a second VPS** — separate database server from application
3. **Load balancer** — multiple app instances behind a load balancer
4. **Migrate to AWS** — when you need auto-scaling, managed services, or global presence

The **hexagonal architecture** makes this migration painless — your domain logic doesn't care where it runs.

---

## Naming Convention

### Dokploy Projects

```
{project}-{environment}
```

Examples: `myapp-production`, `myapp-staging`

### Dokploy Services

```
{service-type}
```

Examples: `web`, `api`, `postgres`, `redis`, `worker`

### Domains

```
app.{project}.com         # Frontend
api.{project}.com         # Backend API
staging.{project}.com     # Staging frontend
api-staging.{project}.com # Staging API
```

---

## Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Running without reverse proxy | Always use Traefik (Dokploy handles this) |
| Database exposed to internet | Docker internal network only |
| No backups | Automated daily + off-site |
| SSH with password | Key-based auth only |
| Manual deployments via SSH | Use Dokploy webhooks + GitHub Actions |
| No monitoring | At minimum uptime checks + resource alerts |
| Running everything as root | Use non-root users in Docker and on the VPS |
| No firewall | UFW with explicit allow rules |

---

## Commands

```bash
# Server management
ssh -p 2222 deploy@your-server.com    # Connect to server

# Dokploy
dokploy deploy                         # Manual deploy trigger
dokploy logs api                       # View service logs

# Docker (on server)
docker ps                              # Running containers
docker logs myapp-api --tail 100 -f   # Follow logs
docker stats                           # Resource usage

# Database
docker exec -it postgres psql -U user myapp  # Database shell

# Backups
pg_dump -U user myapp | gzip > backup.sql.gz  # Manual backup
```
