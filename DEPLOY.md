# Lunes Explorer — Guia de Deploy em Produção

## 📐 Arquitetura do Projeto

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
│                  └───────────────┘    └──────────────────────┘  │
│                         │                                       │
│                         ▼                                       │
│              ┌──────────────────┐                               │
│              │  Lunes Blockchain│                               │
│              │  wss://ws.lunes  │                               │
│              └──────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

**Componentes:**

- **Frontend (React/Vite)** — SPA estática servida pelo Nginx
- **API Express** (porta 4000) — Backend principal (admin, rewards, ads, AI)
- **Backend Python** (porta 8000) — Serviços auxiliares (market data)
- **SubQuery Node** (porta 3000) — Indexador GraphQL da blockchain
- **PostgreSQL** — Banco de dados do backend Python
- **Nginx** — Reverse proxy com SSL

---

## 📋 Passo 0 — Pré-requisitos

### No servidor (Ubuntu 22.04 LTS recomendado):

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Python 3.11+
sudo apt install -y python3 python3-pip python3-venv

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar Nginx
sudo apt install -y nginx

# Instalar Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx

# Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2

# Instalar Git
sudo apt install -y git
```

### Verificar versões:

```bash
node -v       # v20.x.x
npm -v        # 10.x.x
python3 -V    # 3.11+
psql --version # 14+
nginx -v      # 1.18+
pm2 -v        # 5.x.x
```

---

## 🔐 Passo 1 — Segurança (ANTES de tudo)

### 1.1 Criar usuário dedicado (não usar root)

```bash
sudo adduser lunes
sudo usermod -aG sudo lunes
su - lunes
```

### 1.2 Configurar firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (redirect para HTTPS)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status

# IMPORTANTE: NÃO abrir portas 3000, 4000, 8000 — só Nginx acessa
```

### 1.3 Gerar segredos de produção

Execute estes comandos e **anote os resultados** (vai precisar nos `.env`):

```bash
# 1) ADMIN_SALT (copie o resultado)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2) ADMIN_TOKEN_SECRET (copie o resultado)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3) SECRET_KEY para Python (copie o resultado)
python3 -c "import secrets; print(secrets.token_hex(32))"

# 4) Senha do PostgreSQL (copie o resultado)
openssl rand -base64 24

# 5) Senha forte do admin (copie o resultado)
openssl rand -base64 18
```

> ⚠️ **NUNCA reutilize segredos de desenvolvimento em produção!**
> ⚠️ **Guarde esses valores — você não poderá recuperá-los depois.**

---

## 🗄️ Passo 2 — Configurar PostgreSQL

```bash
# Acessar o PostgreSQL
sudo -u postgres psql

# Dentro do psql, execute:
CREATE DATABASE lunes_explorer;
CREATE USER lunes WITH ENCRYPTED PASSWORD 'COLE_A_SENHA_DO_PASSO_1.4';
GRANT ALL PRIVILEGES ON DATABASE lunes_explorer TO lunes;
\q
```

### Testar conexão:

```bash
psql -U lunes -d lunes_explorer -h localhost
# Se pedir senha, use a que criou acima
# Se conectar, digite \q para sair
```

---

## 📥 Passo 3 — Clonar e Instalar o Projeto

```bash
# Criar diretório
sudo mkdir -p /opt/lunes-explorer
sudo chown lunes:lunes /opt/lunes-explorer

# Clonar repositório
cd /opt/lunes-explorer
git clone https://github.com/lunes-platform/explorer-backend-subql.git .

# Verificar que está na branch correta
git checkout main   # ou a branch de produção
```

### 3.1 Instalar dependências da API

```bash
cd /opt/lunes-explorer/api
npm install --production
```

### 3.2 Instalar dependências do Frontend

```bash
cd /opt/lunes-explorer/frontend
npm install
```

### 3.3 Instalar dependências do Backend Python

```bash
cd /opt/lunes-explorer/backend-py
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
deactivate
```

---

## 🗂️ Passo 4 — Configurar Variáveis de Ambiente

### 4.1 API Backend (`api/.env`)

```bash
cp api/.env.example api/.env
nano api/.env
```

Cole o seguinte (substituindo os valores `<...>`):

```env
# Servidor
API_PORT=4000

# CORS — URL do seu frontend em produção
CORS_ORIGINS=https://explorer.lunes.io

# Conexão RPC com a blockchain
RPC_URL=wss://ws.lunes.io

# URL do indexador SubQuery (local no mesmo servidor)
INDEXER_URL=http://localhost:3000

# URL pública da API (usada para URLs de upload)
API_PUBLIC_URL=https://api.explorer.lunes.io

# URL pública do app (usada como HTTP-Referer para IA)
APP_PUBLIC_URL=https://explorer.lunes.io

# Segurança Admin — COLE OS VALORES GERADOS NO PASSO 1.3
ADMIN_SALT=<cole_o_valor_gerado_1>
ADMIN_TOKEN_SECRET=<cole_o_valor_gerado_2>
ADMIN_DEFAULT_PASSWORD=<cole_a_senha_gerada_5>
```

### 4.2 Frontend (`frontend/.env`)

```bash
cp frontend/.env.example frontend/.env
nano frontend/.env
```

Cole:

```env
# URL da API em produção
VITE_API_URL=https://api.explorer.lunes.io

# URL do indexador GraphQL (se exposto publicamente)
VITE_GRAPHQL_URL=https://indexer.explorer.lunes.io

# Endpoints WebSocket RPC
VITE_WS_ENDPOINTS=wss://ws-archive.lunes.io,wss://ws-lunes-main-02.lunes.io,wss://ws-lunes-main-01.lunes.io
```

### 4.3 Backend Python (`backend-py/.env`)

```bash
cp backend-py/.env.example backend-py/.env
nano backend-py/.env
```

Cole:

```env
# Banco de dados — use a senha criada no Passo 2
DATABASE_URL=postgresql://lunes:<SENHA_DO_POSTGRES>@localhost:5432/lunes_explorer
DB_PASSWORD=<SENHA_DO_POSTGRES>

# Segurança — COLE OS VALORES GERADOS NO PASSO 1.3
SECRET_KEY=<cole_o_valor_gerado_3>
ADMIN_DEFAULT_PASSWORD=<cole_a_senha_gerada_5>
```

### 4.4 Proteger os arquivos .env

```bash
chmod 600 /opt/lunes-explorer/api/.env
chmod 600 /opt/lunes-explorer/frontend/.env
chmod 600 /opt/lunes-explorer/backend-py/.env
```

---

## 🏗️ Passo 5 — Build do Frontend

```bash
cd /opt/lunes-explorer/frontend
npm run build
```

Resultado esperado: pasta `frontend/dist/` criada com `index.html` e `assets/`.

```bash
# Verificar
ls -la dist/
# Deve ter: index.html, assets/ (com .js e .css)
```

---

## 🌐 Passo 6 — Configurar Nginx

### 6.1 Criar arquivo de configuração

```bash
sudo nano /etc/nginx/sites-available/explorer.lunes.io
```

Cole o conteúdo completo:

```nginx
# ============================================
# Lunes Explorer — Configuração Nginx
# ============================================

# Rate limiting global
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=static_limit:10m rate=50r/s;

# ── Frontend (SPA estática) ──
server {
    listen 443 ssl http2;
    server_name explorer.lunes.io;

    # SSL (será preenchido pelo Certbot)
    ssl_certificate     /etc/letsencrypt/live/explorer.lunes.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/explorer.lunes.io/privkey.pem;

    # Diretório do build
    root /opt/lunes-explorer/frontend/dist;
    index index.html;

    # SPA — todas as rotas servem index.html
    location / {
        limit_req zone=static_limit burst=100 nodelay;
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets estáticos (JS, CSS, imagens)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 256;
}

# ── API Express (porta 4000) ──
server {
    listen 443 ssl http2;
    server_name api.explorer.lunes.io;

    ssl_certificate     /etc/letsencrypt/live/api.explorer.lunes.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.explorer.lunes.io/privkey.pem;

    location / {
        limit_req zone=api_limit burst=50 nodelay;

        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Limite de upload (para banners, logos)
        client_max_body_size 10M;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Endpoint de uploads (cache de imagens)
    location /api/uploads/ {
        proxy_pass http://127.0.0.1:4000;
        expires 30d;
        add_header Cache-Control "public";
    }
}

# ── Redirect HTTP → HTTPS ──
server {
    listen 80;
    server_name explorer.lunes.io api.explorer.lunes.io;
    return 301 https://$host$request_uri;
}
```

### 6.2 Ativar o site

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/explorer.lunes.io /etc/nginx/sites-enabled/

# Remover default (se existir)
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Se aparecer "syntax is ok" e "test is successful":
sudo systemctl reload nginx
```

### 6.3 Certificado SSL (Let's Encrypt)

**Primeiro, comente as linhas `ssl_certificate` no Nginx** (pois ainda não existem):

```bash
# Obter certificados
sudo certbot --nginx -d explorer.lunes.io -d api.explorer.lunes.io

# Testar renovação automática
sudo certbot renew --dry-run
```

O Certbot vai atualizar automaticamente o Nginx com os certificados.

---

## 🚀 Passo 7 — Iniciar os Serviços com PM2

### 7.1 Criar arquivo de configuração PM2

```bash
nano /opt/lunes-explorer/ecosystem.config.js
```

Cole:

```js
module.exports = {
  apps: [
    {
      name: 'lunes-api',
      script: './api/server.js',
      cwd: '/opt/lunes-explorer',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '/opt/lunes-explorer/logs/api-error.log',
      out_file: '/opt/lunes-explorer/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'lunes-python',
      script: './backend-py/main.py',
      cwd: '/opt/lunes-explorer',
      interpreter: '/opt/lunes-explorer/backend-py/.venv/bin/python3',
      env: {
        PYTHONUNBUFFERED: '1',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      error_file: '/opt/lunes-explorer/logs/python-error.log',
      out_file: '/opt/lunes-explorer/logs/python-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
```

### 7.2 Criar pasta de logs e iniciar

```bash
mkdir -p /opt/lunes-explorer/logs

# Iniciar todos os serviços
cd /opt/lunes-explorer
pm2 start ecosystem.config.js

# Verificar status
pm2 status

# Resultado esperado:
# ┌─────────────────┬────┬──────┬───────┬────────┐
# │ name            │ id │ mode │ status│ cpu    │
# ├─────────────────┼────┼──────┼───────┼────────┤
# │ lunes-api       │ 0  │ fork │ online│ 0%     │
# │ lunes-python    │ 1  │ fork │ online│ 0%     │
# └─────────────────┴────┴──────┴───────┴────────┘
```

### 7.3 Configurar auto-start no boot

```bash
pm2 save
pm2 startup

# O PM2 vai mostrar um comando sudo — EXECUTE-O:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u lunes --hp /home/lunes
```

---

## ✅ Passo 8 — Verificação Final

### 8.1 Testar cada componente

```bash
# 1) API respondendo?
curl -s http://localhost:4000/api/health | head -1
# Esperado: {"status":"ok"} ou similar

# 2) Frontend acessível?
curl -s -o /dev/null -w "%{http_code}" https://explorer.lunes.io
# Esperado: 200

# 3) API via domínio?
curl -s -o /dev/null -w "%{http_code}" https://api.explorer.lunes.io/api/health
# Esperado: 200

# 4) SSL válido?
curl -vI https://explorer.lunes.io 2>&1 | grep "SSL certificate verify ok"
# Esperado: "SSL certificate verify ok"

# 5) Logs sem erros?
pm2 logs --lines 20
```

### 8.2 Checklist de segurança final

```bash
# Portas abertas (deve ser APENAS 22, 80, 443)
sudo ufw status

# Arquivos .env protegidos
ls -la /opt/lunes-explorer/api/.env
# Esperado: -rw------- (600)

# Nenhum .env no git
cd /opt/lunes-explorer
git status | grep ".env"
# Esperado: nenhum resultado

# Nginx não expõe portas internas
curl -s http://explorer.lunes.io:4000 2>&1
# Esperado: conexão recusada
```

---

## 🔄 Passo 9 — Como Atualizar em Produção

Sempre que fizer `git push` no repositório:

```bash
cd /opt/lunes-explorer

# 1) Baixar código novo
git pull origin main

# 2) Atualizar dependências da API (se package.json mudou)
cd api && npm install --production && cd ..

# 3) Rebuild do frontend (se código do frontend mudou)
cd frontend && npm install && npm run build && cd ..

# 4) Reiniciar serviços
pm2 restart all

# 5) Verificar
pm2 status
pm2 logs --lines 10
```

### Script de deploy rápido (opcional)

```bash
nano /opt/lunes-explorer/deploy.sh
```

```bash
#!/bin/bash
set -e
echo "🚀 Deploying Lunes Explorer..."

cd /opt/lunes-explorer
git pull origin main

echo "📦 Installing API deps..."
cd api && npm install --production && cd ..

echo "🏗️ Building frontend..."
cd frontend && npm install && npm run build && cd ..

echo "♻️ Restarting services..."
pm2 restart all

echo "✅ Deploy complete!"
pm2 status
```

```bash
chmod +x /opt/lunes-explorer/deploy.sh

# Para usar:
/opt/lunes-explorer/deploy.sh
```

---

## 📊 Passo 10 — Monitoramento

### Comandos úteis do dia a dia

```bash
# Status dos serviços
pm2 status

# Logs em tempo real
pm2 logs

# Logs só da API
pm2 logs lunes-api --lines 50

# Métricas (CPU, memória)
pm2 monit

# Reiniciar um serviço
pm2 restart lunes-api

# Reiniciar todos
pm2 restart all

# Disco e memória do servidor
df -h
free -m

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🆘 Resolução de Problemas

| Problema | Causa provável | Solução |
| --- | --- | --- |
| Tela branca no frontend | `VITE_API_URL` errado ou build desatualizado | Corrija `frontend/.env` e execute `npm run build` |
| Erro de CORS na API | `CORS_ORIGINS` não inclui o domínio do frontend | Corrija `api/.env` e `pm2 restart lunes-api` |
| Login admin não funciona | Segredos inválidos | Verifique `ADMIN_SALT` e `ADMIN_TOKEN_SECRET`, reinicie a API |
| WebSocket não conecta | Endpoints inválidos ou bloqueados | Verifique `VITE_WS_ENDPOINTS` e rebuild o frontend |
| URLs de upload quebradas | `API_PUBLIC_URL` incorreta | Corrija em `api/.env` e reinicie |
| Dados do indexador faltando | SubQuery Node parado ou `INDEXER_URL` errado | Verifique se porta 3000 está ativa |
| Erro 502 Bad Gateway | Serviço não está rodando | Execute `pm2 status` e `pm2 restart all` |
| Certificado SSL expirado | Certbot não renovou | Execute `sudo certbot renew` |
| Servidor lento | Memória insuficiente | Verifique `free -m`, considere upgrade do VPS |

---

## 📝 Resumo dos Domínios e Portas

| Serviço | Porta interna | Domínio público | Acesso externo |
| --- | --- | --- | --- |
| Frontend (Nginx) | — | `explorer.lunes.io` | ✅ HTTPS |
| API Express | 4000 | `api.explorer.lunes.io` | ✅ via Nginx |
| Backend Python | 8000 | — | ❌ interno |
| SubQuery Node | 3000 | — | ❌ interno |
| PostgreSQL | 5432 | — | ❌ interno |

> Apenas as portas 80 e 443 devem ser acessíveis externamente.
> Todos os outros serviços rodam apenas em `localhost`.
