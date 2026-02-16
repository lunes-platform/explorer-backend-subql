# Lunes Explorer — Production Deployment Guide

## 📋 Prerequisites

- **Node.js** v18+ (recommended v20 LTS)
- **PostgreSQL** 14+ (for backend-py)
- **SubQuery Node** running and synced
- A VPS or cloud server (e.g., DigitalOcean, AWS, Hetzner)
- A domain pointing to your server (e.g., `explorer.lunes.io`)
- **Nginx** or **Caddy** as reverse proxy
- **PM2** for process management (`npm i -g pm2`)

---

## 🔐 1. Security Checklist (BEFORE deploying)

### 1.1 Verify `.gitignore` blocks secrets

```bash
# These must ALL be ignored:
git check-ignore api/.env backend-py/.env frontend/.env
# Expected: all 3 files listed
```

### 1.2 Verify NO secrets in git history

```bash
git log --all -p -S "ADMIN_SALT" -- "*.js" "*.ts" "*.json" | head -5
# Expected: empty output
```

### 1.3 Generate fresh production secrets

```bash
# Generate ADMIN_SALT
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate ADMIN_TOKEN_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate SECRET_KEY (for backend-py)
python3 -c "import secrets; print(secrets.token_hex(32))"
```

> ⚠️ **NEVER reuse development secrets in production!**

---

## 🗂️ 2. Environment Variables Setup

### 2.1 API Backend (`api/.env`)

```env
# Server
API_PORT=4000

# CORS — use your actual production frontend URL
CORS_ORIGINS=https://explorer.lunes.io

# RPC Connection
RPC_URL=wss://ws.lunes.io

# SubQuery Indexer GraphQL URL
INDEXER_URL=http://localhost:3000

# Public API URL (your domain)
API_PUBLIC_URL=https://api.explorer.lunes.io

# Public App URL (used as HTTP-Referer for AI provider)
APP_PUBLIC_URL=https://explorer.lunes.io

# Admin Security — USE FRESH VALUES (see section 1.3)
ADMIN_SALT=<generated-hex-string>
ADMIN_TOKEN_SECRET=<generated-hex-string>
ADMIN_DEFAULT_PASSWORD=<strong-unique-password>
```

### 2.2 Frontend (`frontend/.env`)

```env
# REST API URL (your production API domain)
VITE_API_URL=https://api.explorer.lunes.io

# SubQuery Indexer GraphQL URL (if exposed publicly, otherwise keep internal)
VITE_GRAPHQL_URL=https://indexer.explorer.lunes.io

# WebSocket RPC endpoints
VITE_WS_ENDPOINTS=wss://ws-archive.lunes.io,wss://ws-lunes-main-02.lunes.io,wss://ws-lunes-main-01.lunes.io
```

### 2.3 Python Backend (`backend-py/.env`)

```env
# Database
DATABASE_URL=postgresql://postgres:<STRONG_PASSWORD>@localhost:5432/lunes_explorer
DB_PASSWORD=<STRONG_PASSWORD>

# Auth Security — USE FRESH VALUES
SECRET_KEY=<generated-hex-string>
ADMIN_DEFAULT_PASSWORD=<strong-unique-password>
```

---

## 🏗️ 3. Build & Deploy Steps

### 3.1 Clone and install

```bash
git clone <your-repo-url> /opt/lunes-explorer
cd /opt/lunes-explorer

# Install API dependencies
cd api && npm install --production && cd ..

# Install and build frontend
cd frontend && npm install && npm run build && cd ..

# Install Python backend (optional)
cd backend-py && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && cd ..
```

### 3.2 Create `.env` files

```bash
# Copy examples and fill with production values
cp api/.env.example api/.env
cp frontend/.env.example frontend/.env
cp backend-py/.env.example backend-py/.env

# Edit each with production values (see section 2)
nano api/.env
nano frontend/.env
nano backend-py/.env
```

### 3.3 Build frontend for production

```bash
cd frontend
npm run build
# Output goes to frontend/dist/
```

### 3.4 Start services with PM2

```bash
# API Backend (Express)
pm2 start api/server.js --name "lunes-api" --env production

# Python Backend (if used)
pm2 start backend-py/main.py --name "lunes-py" --interpreter python3

# Save PM2 config for auto-restart
pm2 save
pm2 startup
```

---

## 🌐 4. Nginx Reverse Proxy Configuration

```nginx
# /etc/nginx/sites-available/explorer.lunes.io

# Frontend (static files)
server {
    listen 443 ssl http2;
    server_name explorer.lunes.io;

    ssl_certificate     /etc/letsencrypt/live/explorer.lunes.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/explorer.lunes.io/privkey.pem;

    root /opt/lunes-explorer/frontend/dist;
    index index.html;

    # SPA — all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}

# API Backend
server {
    listen 443 ssl http2;
    server_name api.explorer.lunes.io;

    ssl_certificate     /etc/letsencrypt/live/api.explorer.lunes.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.explorer.lunes.io/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Upload size limit
        client_max_body_size 10M;
    }
}

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name explorer.lunes.io api.explorer.lunes.io;
    return 301 https://$host$request_uri;
}
```

```bash
# Enable and test
sudo ln -s /etc/nginx/sites-available/explorer.lunes.io /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL with Let's Encrypt

```bash
sudo certbot --nginx -d explorer.lunes.io -d api.explorer.lunes.io
```

---

## 🔄 5. Updating in Production

```bash
cd /opt/lunes-explorer

# Pull latest code
git pull origin main

# Rebuild frontend
cd frontend && npm install && npm run build && cd ..

# Update API dependencies
cd api && npm install --production && cd ..

# Restart services
pm2 restart lunes-api
```

---

## 🛡️ 6. Security Hardening

### 6.1 File permissions

```bash
# Protect .env files
chmod 600 api/.env backend-py/.env frontend/.env

# Protect data directory
chmod 700 data/
```

### 6.2 Firewall (UFW)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (redirect)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Do NOT expose ports 3000, 4000 directly — use Nginx proxy
```

### 6.3 Rate limiting

The API already has built-in rate limiting:
- **Read endpoints**: 120 requests/min per IP
- **Write endpoints**: 30 requests/min per IP

For extra protection, add Nginx rate limiting:

```nginx
# In http block of /etc/nginx/nginx.conf
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;

# In API server block
location / {
    limit_req zone=api burst=50 nodelay;
    proxy_pass http://127.0.0.1:4000;
    ...
}
```

---

## 📊 7. Monitoring

```bash
# Check service status
pm2 status
pm2 logs lunes-api --lines 50

# Check disk and memory
df -h
free -m

# Check Nginx access/error logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Frontend shows blank page | Check `frontend/.env` has correct `VITE_API_URL` and rebuild |
| API returns CORS errors | Verify `CORS_ORIGINS` in `api/.env` matches your frontend domain |
| Admin login fails | Check `ADMIN_SALT` and `ADMIN_TOKEN_SECRET` are set, restart API |
| WebSocket connection fails | Verify `VITE_WS_ENDPOINTS` has valid `wss://` URLs |
| Upload URLs broken | Set `API_PUBLIC_URL` to your public API domain |
| SubQuery data missing | Ensure `INDEXER_URL` points to a running SubQuery node |
