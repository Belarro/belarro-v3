# Deployment Guide - Belarro v3

## Infrastructure Requirements

**Recommended Stack:**
- **VPS:** EC2 t3.medium or Railway
- **Database:** PostgreSQL 14+
- **Node.js:** v18+
- **Package Manager:** npm or yarn
- **Reverse Proxy:** Nginx
- **SSL:** Let's Encrypt (automatic with Certbot)

## Pre-Deployment Checklist

- [x] Code reviewed and committed
- [x] All tests passing (unit, integration, e2e)
- [x] Security audit completed
- [x] Performance testing done
- [x] Environment variables documented
- [ ] Database backup plan
- [ ] Monitoring/alerting configured
- [ ] CI/CD pipeline set up

## Environment Variables

**.env.production**
```bash
# Backend
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@host:5432/belarro_prod
LOG_LEVEL=info

# Frontend
NEXT_PUBLIC_API_URL=https://api.belarro.farm/api
NEXT_PUBLIC_APP_ENV=production
```

## Database Setup

### 1. Create PostgreSQL Database

```bash
# On PostgreSQL server
psql -U postgres -c "CREATE DATABASE belarro_prod;"
psql -U postgres -d belarro_prod -c "CREATE USER belarro WITH PASSWORD 'secure_password';"
psql -U postgres -d belarro_prod -c "ALTER ROLE belarro WITH CREATEDB;"
psql -U postgres -d belarro_prod -c "GRANT ALL PRIVILEGES ON DATABASE belarro_prod TO belarro;"
```

### 2. Run Migrations

```bash
cd /app
npx prisma migrate deploy --skip-generate
npx prisma generate
```

### 3. Seed Initial Data (Optional)

```bash
npx prisma db seed
```

## Backend Deployment (Node.js)

### Option A: Railway

```bash
# 1. Connect Git repo
railway link

# 2. Set environment variables in Railway dashboard
# 3. Railway auto-detects Node.js and runs: npm install && npm start
```

### Option B: VPS (EC2/Linode)

```bash
# 1. SSH into server
ssh ubuntu@your-server.com

# 2. Install dependencies
sudo apt update && sudo apt install -y nodejs npm postgresql-client git

# 3. Clone and install
git clone <your-repo> /app
cd /app
npm ci
npm run build

# 4. Create systemd service
sudo tee /etc/systemd/system/belarro-backend.service << EOF
[Unit]
Description=Belarro Backend
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/app
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 5. Start service
sudo systemctl daemon-reload
sudo systemctl enable belarro-backend
sudo systemctl start belarro-backend
```

### Option C: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build
COPY . .
RUN npm run build && npm run db:generate

# Run
EXPOSE 3001
CMD ["npm", "start"]
```

## Frontend Deployment (Next.js)

### Option A: Vercel

```bash
# 1. Connect GitHub repo to Vercel
# 2. Set environment variable: NEXT_PUBLIC_API_URL=https://api.belarro.farm/api
# 3. Vercel auto-deploys on git push
```

### Option B: VPS

```bash
# 1. Build frontend
cd frontend
npm ci
npm run build

# 2. Create systemd service
sudo tee /etc/systemd/system/belarro-frontend.service << EOF
[Unit]
Description=Belarro Frontend
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/app/frontend
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment="NEXT_PUBLIC_API_URL=https://api.belarro.farm/api"

[Install]
WantedBy=multi-user.target
EOF

# 3. Start
sudo systemctl daemon-reload
sudo systemctl enable belarro-frontend
sudo systemctl start belarro-frontend
```

## Nginx Configuration

**nginx.conf**
```nginx
upstream backend {
  server localhost:3001;
}

upstream frontend {
  server localhost:3000;
}

server {
  listen 80;
  server_name belarro.farm;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name belarro.farm;

  ssl_certificate /etc/letsencrypt/live/belarro.farm/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/belarro.farm/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;

  # Frontend
  location / {
    proxy_pass http://frontend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # API
  location /api/ {
    proxy_pass http://backend/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
  }
}
```

## SSL Certificate

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d belarro.farm -d api.belarro.farm

# Auto-renew
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## Database Backups

**Daily Backups via Cron**
```bash
# /etc/cron.d/belarro-backup
0 2 * * * root pg_dump belarro_prod | gzip > /backups/belarro_$(date +\%Y\%m\%d).sql.gz

# Cleanup old backups (keep 30 days)
0 3 * * * root find /backups -name "belarro_*.sql.gz" -mtime +30 -delete
```

## Monitoring & Alerts

### Health Check

```typescript
// Backend already has /health endpoint
GET https://api.belarro.farm/api/health
Expected: { success: true, message: 'API is running' }
```

### Prometheus Metrics

```bash
npm install prom-client
```

### Log Aggregation

Send logs to:
- **Sentry** (error tracking)
- **DataDog** (APM)
- **Grafana Loki** (log aggregation)

## Post-Deployment Verification

1. **Health Checks**
   ```bash
   curl https://api.belarro.farm/api/health
   curl https://belarro.farm/
   ```

2. **Database Connection**
   ```bash
   curl https://api.belarro.farm/api/crops -H "Content-Type: application/json"
   ```

3. **Frontend Load**
   ```bash
   curl https://belarro.farm/ | grep "Belarro"
   ```

4. **SSL Certificate**
   ```bash
   curl -I https://belarro.farm/
   # Check for "HTTP/2 200"
   ```

## Rollback Plan

If deployment fails:

```bash
# 1. Revert to previous commit
git revert HEAD

# 2. Rebuild and restart
npm run build
pm2 restart all

# 3. Run migration rollback (if needed)
npx prisma migrate resolve --rolled-back [migration_name]
```

## Scaling Plan

**Phase 1 (Current - Single Instance):**
- Single VPS or Railway
- Centralized PostgreSQL
- Capacity: 100-500 concurrent users

**Phase 2 (Growth - Multiple Instances):**
- Load balancer (HAProxy/AWS ALB)
- 2-3 backend instances
- Separate database server
- Redis for caching
- Capacity: 500-2000 concurrent users

**Phase 3 (Enterprise - Distributed):**
- Kubernetes for orchestration
- Database cluster (read replicas)
- Global CDN for static assets
- Message queue (RabbitMQ) for async jobs
- Capacity: 2000+ concurrent users

## Maintenance & Operations

**Weekly Tasks:**
- Check logs for errors
- Monitor CPU/memory usage
- Verify backup completion

**Monthly Tasks:**
- Run security scan
- Update dependencies
- Review performance metrics

**Quarterly Tasks:**
- Load test with 2x capacity
- Disaster recovery drill
- Architecture review

## Support & Emergency Contacts

- **On-call:** [Configure on-call rotation]
- **Escalation:** [Technical lead contact]
- **Incident Response:** [Define SLA]

## Deployment Checklist - Final

- [ ] Environment variables set correctly
- [ ] Database migrated and tested
- [ ] SSL certificate installed
- [ ] Nginx configured and tested
- [ ] Services started and healthy
- [ ] Backups configured
- [ ] Monitoring/alerting enabled
- [ ] Health checks passing
- [ ] Load balancer configured (if multiple instances)
- [ ] DNS pointing to correct IPs
- [ ] Incident response plan documented
