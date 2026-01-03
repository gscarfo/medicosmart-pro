# 🚀 Quick Start - MedicoSmart su Coolify

## Deploy in 5 Minuti

### Passo 1: Accedi a Coolify

1. Apri: https://parallela1.vps.webdock.cloud/
2. Accedi con le tue credenziali

### Passo 2: Crea il Progetto

1. Clicca **"Create New Project"**
2. Inserisci:
   - **Name**: `medicosmart`
   - **Description**: Sistema gestione ricettario medico
3. Clicca **"Create"**

### Passo 3: Configura il Database

1. Clicca **"Add Service"**
2. Seleziona **"PostgreSQL"**
3. Configura:
   ```
   Image: postgres:15-alpine
   POSTGRES_USER: medicosmart
   POSTGRES_PASSWORD: MedicosmartSecure2024!!
   POSTGRES_DB: medicosmart
   ```
4. Clicca **"Deploy"**
5. Aspetta lo stato ✅ "running"

### Passo 4: Configura il Backend

1. Clicca **"Add Service"**
2. Seleziona **"Custom Service"**
3. Configura:
   ```
   Name: api
   DockerHub URL: (usa il Dockerfile che ti fornirò)
   ```
4. Aggiungi variabili d'ambiente:
   ```
   DATABASE_URL=postgresql://medicosmart:MedicosmartSecure2024!!@db:5432/medicosmart?schema=public
   JWT_SECRET=medicosmart-super-secret-jwt-key-32chars!!
   JWT_REFRESH_SECRET=medicosmart-refresh-token-secret-32!!
   ENCRYPTION_KEY=medicosmart-32-char-enc-key-2024!!
   ENCRYPTION_IV=medicosmart-iv!!
   NODE_ENV=production
   ```
5. Aggiungi dominio: `api.parallela1.vps.webdock.cloud`
6. Clicca **"Deploy"**

### Passo 5: Configura il Frontend

1. Clicca **"Add Service"**
2. Seleziona **"Custom Service"**
3. Configura:
   ```
   Name: frontend
   DockerHub URL: (usa il Dockerfile che ti fornirò)
   ```
4. Aggiungi variabile d'ambiente:
   ```
   VITE_API_URL=https://api.parallela1.vps.webdock.cloud
   ```
5. Aggiungi dominio: `medicosmart.parallela1.vps.webdock.cloud`
6. Clicca **"Deploy"**

### Passo 6: Inizializza il Database

1. Nel servizio `api`, apri **"Exec"** o **"Terminal"**
2. Esegui:
   ```bash
   npx prisma generate
   node setup-db.js
   ```

---

## ✅ Verifica Installazione

| Servizio | URL | Status |
|----------|-----|--------|
| API Health | https://api.parallela1.vps.webdock.cloud/api/health | |
| Frontend | https://medicosmart.parallela1.vps.webdock.cloud | |

---

## 🔑 Credenziali di Accesso

| Ruolo | Username | Password |
|-------|----------|----------|
| Admin | admin | admin123 |
| Medico | medico | medico123 |

---

## 🔧 Troubleshooting

### Database non parte
```bash
# Verifica log
docker logs medicosmart-db -f

# Riavvia
docker restart medicosmart-db
```

### Backend non parte
```bash
# Verifica log
docker logs medicosmart-api -f

# Verifica connessione database
docker exec -it medicosmart-api sh
# Poi: npx prisma migrate deploy
```

### Frontend non carica
```bash
# Verifica log
docker logs medicosmart-frontend -f
```

---

## 📁 File da Caricare su GitHub

Per il deployment su Coolify, carica questa struttura su GitHub:

```
medicosmart-pro/
├── backend/
│   ├── Dockerfile.coolify  ✅
│   ├── setup-db.js         ✅
│   └── src/                ✅
├── frontend/
│   ├── Dockerfile.coolify  ✅
│   ├── nginx.coolify.conf  ✅
│   └── src/                ✅
├── docker-compose.yml      ✅
├── .env                    ❌ (non caricare!)
└── README.md
```

---

## 🎯 Prossimi Passi

1. ✅ Prepara file (completato)
2. ⏳ Carica su GitHub
3. ⏳ Deploy su Coolify
4. ⏳ Configura domini
5. ⏳ Test sistema

Hai bisogno di aiuto con qualche passaggio specifico?
