# Lunes Explorer — Guia de Deploy em Produção

## 📐 Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        SERVIDOR (VPS)                           │
│                                                                 │
│  ┌──────────┐    ┌───────────────┐    ┌──────────────────────┐  │
│  │  Nginx   │───▶│  Frontend     │    │  SubQuery Node       │  │
│  │  :80/:443│    │  (dist/)      │    │  :3000 (GraphQL)     │  │
│  │          │───▶│               │    └──────────────────────┘  │
│  │          │    ├───────────────┤              ▲               │
│  │          │───▶│  API Express  │──────────────┘               │
│  │          │    │  :4000        │──────────────┐               │
│  └──────────┘    ├───────────────┤    ┌─────────▼────────────┐  │
│                  │  Backend Py   │    │  PostgreSQL          │  │
│                  │  :8000        │───▶│  :5432               │  │
│                  └──────────────┘    └──────────────────────┘  │
│                         │                                       │
│                         ▼                                       │
│              ┌──────────────────┐                               │
│              │  Lunes Blockchain│                               │
│              │  wss://ws.lunes  │                               │
│              └──────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🐳 Deploy com Docker

### Pré-requisitos

```bash
# Instalar Docker e Docker Compose (Ubuntu)
sudo apt update
sudo apt install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER
newgrp docker

# Verificar
docker --version
docker compose version

# Instalar Nginx e Certbot
sudo apt install -y nginx certbot python3-certbot-nginx git
```

### 1. Clonar e Configurar

```bash
sudo mkdir -p /opt/lunes-explorer
sudo chown $USER:$USER /opt/lunes-explorer
cd /opt/lunes-explorer
git clone https://github.com/lunes-platform/explorer-backend-subql.git .
git checkout main
```

### 2. Gerar Segredos

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # ADMIN_SALT
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # ADMIN_TOKEN_SECRET  
python3 -c "import secrets; print(secrets.token_hex(32))"                  # SECRET_KEY
openssl rand -base64 24                                                   # DB_PASSWORD
openssl rand -base64 18                                                   # ADMIN_PASSWORD
```

> Anote todos os valores gerados!

### 3. Configurar .env Files

**api/.env:**
```env
API_PORT=4000
CORS_ORIGINS=https://explorer.lunes.io
RPC_URL=wss://ws.lunes.io
INDEXER_URL=http://graphql-engine:3000
API_PUBLIC_URL=https://api.explorer.lunes.io
APP_PUBLIC_URL=https://explorer.lunes.io
ADMIN_SALT=<valor_gerado>
ADMIN_TOKEN_SECRET=<valor_gerado>
ADMIN_DEFAULT_PASSWORD=<senha_gerada>
```

**backend-py/.env:**
```env
DATABASE_URL=postgresql://postgres:<SENHA>@postgres:5432/postgres
DB_PASSWORD=<SENHA>
SECRET_KEY=<valor_gerado>
ADMIN_DEFAULT_PASSWORD=<senha_gerada>
```

**frontend/.env:**
```env
VITE_API_URL=https://api.explorer.lunes.io
VITE_GRAPHQL_URL=https://indexer.explorer.lunes.io
VITE_WS_ENDPOINTS=wss://ws-archive.lunes.io,wss://ws-lunes-main-02.lunes.io,wss://ws-lunes-main-01.lunes.io
```

**.env (raiz):**
```env
DB_PASSWORD=<SENHA>
```

Proteger:
```bash
chmod 600 api/.env backend-py/.env frontend/.env .env
```

### 4. Build do Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

### 5. Subir com Docker

```bash
docker compose up --build -d
```

Verificar:
```bash
docker compose ps
curl http://localhost:4000/api/health
curl http://localhost:8000/docs
```

### 6. Configurar Nginx + SSL

```bash
sudo nano /etc/nginx/sites-available/explorer.lunes.io
```

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=static_limit:10m rate=50r/s;

server {
    listen 443 ssl http2;
    server_name explorer.lunes.io;
    
    ssl_certificate /etc/letsencrypt/live/explorer.lunes.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/explorer.lunes.io/privkey.pem;
    
    root /opt/lunes-explorer/frontend/dist;
    index index.html;
    
    location / {
        limit_req zone=static_limit burst=100 nodelay;
        try_files $uri $uri/ /index.html;
    }
    
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}

server {
    listen 443 ssl http2;
    server_name api.explorer.lunes.io;
    
    ssl_certificate /etc/letsencrypt/live/api.explorer.lunes.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.explorer.lunes.io/privkey.pem;
    
    location / {
        limit_req zone=api_limit burst=50 nodelay;
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }
}

server {
    listen 80;
    server_name explorer.lunes.io api.explorer.lunes.io;
    return 301 https://$host$request_uri;
}
```

Ativar:
```bash
sudo ln -s /etc/nginx/sites-available/explorer.lunes.io /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# SSL
sudo certbot --nginx -d explorer.lunes.io -d api.explorer.lunes.io
sudo certbot renew --dry-run
```

---

## 🔄 Atualizar em Produção

```bash
cd /opt/lunes-explorer
git pull origin main
cd frontend && npm install && npm run build && cd ..
docker compose up --build -d
docker compose ps
```

---

## 📊 Comandos Úteis

```bash
# Status
docker compose ps

# Logs
docker compose logs -f
docker compose logs api --tail 50

# Reiniciar serviço
docker compose restart api

# Rebuild sem cache
docker compose build --no-cache && docker compose up -d

# Parar tudo
docker compose down

# Acessar banco
docker compose exec postgres psql -U postgres

# Limpar imagens antigas
docker system prune -a
```

---

## 🆘 Troubleshooting

| Problema | Solução |
|----------|---------|
| Container em restart loop | docker compose logs <servico> --tail 50 |
| Porta já em uso | docker compose down && docker compose up -d |
| Sem espaço em disco | docker system prune -a |
| Erro no schema auth | Já corrigido no seed.py (cria automaticamente) |
| bcrypt incompatível | Já pinado em bcrypt==4.0.1 |

---

## 📝 Portas

| Serviço | Porta | Acesso |
|---------|-------|--------|
| Frontend (Nginx) | 80/443 | Público |
| API Express | 4000 | Via Nginx |
| Backend Python | 8000 | Interno |
| GraphQL Engine | 3000 | Interno |
| PostgreSQL | 5432 | Interno |

> Apenas 80/443 são acessíveis externamente.
