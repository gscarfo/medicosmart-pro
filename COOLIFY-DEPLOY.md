# Deployment MedicoSmart su Coolify (VPS)

## Panoramica

Questa guida spiega come deployare **MedicoSmart Professional** sulla tua VPS con Coolify:
- **URL VPS**: https://parallela1.vps.webdock.cloud/
- **Stack**: Docker Compose con PostgreSQL, Backend API, Frontend

---

## Prerequisiti

1. ✅ VPS con Coolify installato
2. ✅ Accesso al pannello Coolify
3. ✅ Dominio configurato (parallela1.vps.webdock.cloud)

---

## Passo 1: Configura Coolify

### 1.1 Accedi a Coolify

1. Vai su https://parallela1.vps.webdock.cloud/
2. Accedi con le tue credenziali
3. Vedrai la dashboard principale

### 1.2 Crea un Nuovo Progetto

1. Clicca **"Create New Project"**
2. Inserisci i dettagli:
   - **Name**: `medicosmart`
   - **Description**: "Sistema gestione ricettario medico"
3. Clicca **"Create"**

---

## Passo 2: Configura il Database PostgreSQL

### 2.1 Crea il Servizio Database

1. Nel progetto, clicca **"Add Service"**
2. Seleziona **"PostgreSQL"**
3. Configura:
   ```
   Name: db
   Image: postgres:15-alpine
   ```

4. Clicca **"Add Environment Variables"** e aggiungi:
   ```
   POSTGRES_USER: medicosmart
   POSTGRES_PASSWORD: MedicosmartSecure2024!!
   POSTGRES_DB: medicosmart
   ```

5. Clicca **"Deploy"**
6. Aspetta che lo stato diventi **"running"** (verde)

### 2.2 Verifica Database

1. Clicca sul servizio `db`
2. Vai su **"Logs"** per verificare che PostgreSQL sia avviato

---

## Passo 3: Configura il Backend API

### 3.1 Crea il Servizio Backend

1. Nel progetto, clicca **"Add Service"**
2. Seleziona **"Custom Service"** o **"Docker Compose"**
3. Configura il nome: `api`

### 3.2 Dockerfile per Backend

Crea un file `backend/Dockerfile` nella cartella del progetto:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copia package files
COPY package*.json ./
COPY prisma ./prisma/

# Installa dipendenze
RUN npm ci

# Genera Prisma client
RUN npx prisma generate

# Copia sorgenti
COPY . .

# Build
RUN npm run build

# Stage produzione
FROM node:18-alpine AS production

WORKDIR /app

# Installa dipendenze produzione
COPY package*.json ./
RUN npm ci --only=production

# Copia Prisma
COPY prisma ./prisma/

# Copia file dalla build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src

# Crea directory
RUN mkdir -p ./uploads/pdfs ./logs

# Variabili d'ambiente
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "src/index.js"]
```

### 3.3 Configura Variabili d'Ambiente Backend

Nel pannello Coolify, aggiungi queste variabili:

```
# Server
NODE_ENV=production
PORT=3000

# Database (usa il servizio db creato prima)
DATABASE_URL=postgresql://medicosmart:MedicosmartSecure2024!!@db:5432/medicosmart?schema=public

# Sicurezza (GENERA CHIAVI UNICHE!)
JWT_SECRET=medicosmart-super-secret-jwt-key-32chars!!
JWT_REFRESH_SECRET=medicosmart-refresh-token-secret-32!!
ENCRYPTION_KEY=medicosmart-32-char-enc-key-2024!!
ENCRYPTION_IV=medicosmart-iv!!

# URLs
API_URL=https://api.parallela1.vps.webdock.cloud
FRONTEND_URL=https://medicosmart.parallela1.vps.webdock.cloud
```

### 3.4 Configura Health Check

```
Path: /api/health
Timeout: 30 seconds
Interval: 30 seconds
Retries: 3
```

### 3.5 Deploy Backend

1. Clicca **"Deploy"**
2. Aspetta che lo stato diventi **"running"**
3. Verifica con:
   ```
   https://api.parallela1.vps.webdock.cloud/api/health
   ```

Risposta attesa:
```json
{
  "success": true,
  "message": "MedicoSmart API funzionante",
  "timestamp": "2024-01-03T21:00:00.000Z",
  "version": "1.0.0"
}
```

---

## Passo 4: Configura il Frontend

### 4.1 Crea il Servizio Frontend

1. Nel progetto, clicca **"Add Service"**
2. Seleziona **"Custom Service"**
3. Configura il nome: `frontend`

### 4.2 Dockerfile per Frontend

Crea un file `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copia file
COPY package*.json ./
COPY . .

# Installa dipendenze
RUN npm ci

# Build produzione
RUN npm run build

# Stage produzione
FROM nginx:alpine AS production

# Copia configurazione nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copia file build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 4.3 Configurazione Nginx

Crea `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://api:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 4.4 Variabili d'Ambiente Frontend

```
VITE_API_URL=https://api.parallela1.vps.webdock.cloud
```

### 4.5 Deploy Frontend

1. Clicca **"Deploy"**
2. Aspetta che lo stato diventi **"running"**
3. Verifica l'accesso su:
   ```
   https://medicosmart.parallela1.vps.webdock.cloud
   ```

---

## Passo 5: Configura i Domini

### 5.1 Backend API

1. Vai nelle impostazioni del servizio `api`
2. Clicca **"Domains"**
3. Aggiungi: `api.parallela1.vps.webdock.cloud`
4. Coolify configurerà automaticamente SSL con Let's Encrypt

### 5.2 Frontend

1. Vai nelle impostazioni del servizio `frontend`
2. Clicca **"Domains"**
3. Aggiungi: `medicosmart.parallela1.vps.webdock.cloud
4. Coolify configurerà automaticamente SSL

---

## Passo 6: Inizializza il Database

### 6.1 Esegui lo Script di Setup

1. Crea un servizio temporaneo o usa un terminal:
2. Esegui:

```bash
# Connetti al container API
docker exec -it medicosmart-api sh

# Genera Prisma client
npx prisma generate

# Esegui setup database
node setup-db.js

# Esci
exit
```

### 6.2 Verifica Utenti Creati

Controlla che siano stati creati gli utenti demo:
- **Admin**: `admin` / `admin123`
- **Medico**: `medico` / `medioc123`

---

## Struttura Finale del Progetto Coolify

```
Coolify Project: medicosmart
├── Service: db (PostgreSQL 15)
│   ├── Status: Running
│   ├── Port: 5432
│   └── Volume: postgres_data
├── Service: api (Node.js Backend)
│   ├── Status: Running
│   ├── Domain: api.parallela1.vps.webdock.cloud
│   ├── Health: /api/health
│   └── Volume: pdf_uploads, api_logs
└── Service: frontend (React + Nginx)
    ├── Status: Running
    └── Domain: medicosmart.parallela1.vps.webdock.cloud
```

---

## Test del Sistema

### Test 1: Health Check Backend
```bash
curl https://api.parallela1.vps.webdock.cloud/api/health
```

### Test 2: Login Admin
```bash
curl -X POST https://api.parallela1.vps.webdock.cloud/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Test 3: Accesso Frontend
Apri nel browser:
```
https://medicosmart.parallela1.vps.webdock.cloud
```

---

## Risoluzione Problemi

### Problema: Database non raggiungibile
- Verifica che il servizio `db` sia in stato "running"
- Controlla i log del servizio db
- Verifica le credenziali nella connection string

### Problema: Backend non parte
- Controlla i log del servizio api
- Verifica tutte le variabili d'ambiente
- Assicurati che il database sia running prima del backend

### Problema: SSL non funziona
- Coolify gestisce automaticamente Let's Encrypt
- Assicurati che i domini puntino correttamente alla VPS
- Attendi qualche minuto per la propagazione dei certificati

### Problema: Frontend non chiama l'API
- Verifica la variabile `VITE_API_URL`
- Assicurati che l'URL sia accessibile pubblicamente

---

## Comandi Utili

### Vedere i log
```bash
# API
docker logs medicosmart-api -f

# Database
docker logs medicosmart-db -f

# Frontend
docker logs medicosmart-frontend -f
```

### Riavviare un servizio
```bash
docker restart medicosmart-api
docker restart medicosmart-frontend
```

### Entrare nel container
```bash
docker exec -it medicosmart-api sh
```

---

## Prossimi Passi

1. ✅ Configurazione Coolify completata
2. ⏳ Deploy servizi (db, api, frontend)
3. ⏳ Configurazione domini
4. ⏳ Inizializzazione database
5. ⏳ Test completo sistema

---

## Supporto

Per problemi:
1. Controlla i log in Coolify Dashboard
2. Verifica che tutti i servizi siano "running"
3. Testa la connessione al database
4. Controlla le variabili d'ambiente

**URL Utili:**
- Coolify: https://parallela1.vps.webdock.cloud/
- Documentazione Coolify: https://coolify.io/docs
