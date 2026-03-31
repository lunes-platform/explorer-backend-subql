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

### 5. Compilar SubQuery (OBRIGATÓRIO na primeira vez)

```bash
# Compila TypeScript → dist/ (necessário para o subquery-node)
docker compose run --rm subquery-build
```

> O `dist/` e `src/types` estão no git — em atualizações normais basta `git pull`.
> Rode `subquery-build` apenas quando houver mudanças nos handlers (`src/mappings/` ou `src/handlers/`).

### 6. Subir com Docker (Produção)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
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
    
    # Proxy para o Frontend Docker (Porta 80 — Nginx serve build estático)
    location / {
        limit_req zone=static_limit burst=100 nodelay;
        proxy_pass http://127.0.0.1:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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
    listen 443 ssl http2;
    server_name indexer.explorer.lunes.io;

    ssl_certificate /etc/letsencrypt/live/indexer.explorer.lunes.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/indexer.explorer.lunes.io/privkey.pem;

    location / {
        limit_req zone=api_limit burst=50 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name explorer.lunes.io api.explorer.lunes.io indexer.explorer.lunes.io;
    return 301 https://$host$request_uri;
}
```

Ativar:
```bash
sudo ln -s /etc/nginx/sites-available/explorer.lunes.io /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# SSL (incluir todos os subdomínios)
sudo certbot --nginx -d explorer.lunes.io -d api.explorer.lunes.io -d indexer.explorer.lunes.io
sudo certbot renew --dry-run
```

---

## 🔄 Atualizar em Produção

```bash
cd /opt/lunes-explorer
git pull origin main

# Se houve mudanças nos handlers (src/mappings/ ou src/handlers/):
docker compose run --rm subquery-build

# Rebuild e restart
docker compose -f docker-compose.prod.yml up --build -d
docker compose ps
```

---

## ⚡ Indexer — Performance e Monitoramento

### Configuração otimizada (docker-compose.prod.yml)

| Parâmetro | Valor | Motivo |
|-----------|-------|--------|
| `--batch-size` | 300 | Lotes maiores = menos overhead de rede |
| `--timeout` | 180000 | 3 min — endpoints Lunes são lentos |
| `--store-cache-threshold` | 5000 | Menos flushes ao DB = mais velocidade |
| `--store-flush-interval` | 15 | Flush a cada 15s |
| `--store-get-cache-size` | 1000 | Cache de entidades em memória |
| `--store-cache-async` | ✓ | Flush assíncrono |
| `--scale-batch-size` | ✓ | Ajuste dinâmico de batch |
| `--disable-historical` | ✓ | Sem rollback = mais rápido |

> ⚠️ **`--workers` NÃO funciona** com Lunes RPC — causa timeouts por rate-limit.
> Velocidade máxima comprovada: **~10-14 bl/s** em single-thread.

### Monitorar progresso

```bash
# Ver velocidade e ETA do indexer
docker compose logs --tail 5 subquery-node | grep benchmark

# Verificar bloco atual via GraphQL
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"query":"{ _metadata { lastProcessedHeight targetHeight } }"}' \
  http://localhost:3000

# Verificar erros
docker compose logs subquery-node --tail 50 | grep -i error
```

### Reiniciar apenas o indexer (preserva progresso)

```bash
docker compose stop subquery-node
docker compose rm -f subquery-node
docker compose up -d subquery-node
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

# Verificar dados indexados
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"query":"{ transfers(first:1,orderBy:BLOCK_NUMBER_DESC){nodes{id blockNumber}} }"}' \
  http://localhost:3000
```

---

## 🆘 Troubleshooting

| Problema | Solução |
|----------|---------|
| Container em restart loop | `docker compose logs <servico> --tail 50` |
| Porta já em uso | `docker compose down && docker compose up -d` |
| Sem espaço em disco | `docker system prune -a` |
| Erro no schema auth | Já corrigido no seed.py (cria automaticamente) |
| bcrypt incompatível | Já pinado em bcrypt==4.0.1 |
| Indexer travado em 0.00 bl/s | Reiniciar: `docker compose restart subquery-node` |
| "No response from RPC" | Endpoints rate-limited — aguardar ou reiniciar |
| Assets/Tokens vazios no GraphQL | Indexer ainda não chegou nos blocos de criação |
| Frontend sem tokens na conta | RPC fallback mostra dados em tempo real |

---

## 📝 Portas (Produção)

| Serviço | Porta | Bind | Acesso |
|---------|-------|------|--------|
| Frontend (Nginx) | 80 | `0.0.0.0` | Público (via reverse proxy SSL) |
| API Express | 4000 | `127.0.0.1` | Interno (via Nginx) |
| Backend Python | 8000 | `127.0.0.1` | Interno (via Nginx) |
| GraphQL Engine | 3000 | `127.0.0.1` | Interno |
| PostgreSQL | 5432 | — | Interno (sem porta exposta) |

> Em produção, apenas porta **80** é exposta. O Nginx reverse proxy do host faz SSL termination (443→80).
