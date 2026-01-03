# Deployment MedicoSmart Professional

## Panoramica

Questa guida spiega come deployare **MedicoSmart Professional** con:
- **Backend**: Deploy su Railway (Node.js + Express + PostgreSQL)
- **Database**: Neon PostgreSQL (già configurato)
- **Frontend**: Deploy su Netlify (già disponibile)

---

## Database Neon (Già Configurato)

```
Connection URL:
postgresql://neondb_owner:npg_Vudtqj73DPOA@ep-calm-cherry-ag1lugsx-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

Questo database è già stato configurato e pronto per l'uso.

---

## Deployment Backend su Railway

### Opzione 1: Deploy Automatico (Consigliato)

#### Passo 1: Carica il progetto su GitHub

```bash
cd /workspace/medicosmart-pro

# Inizializza git se non già fatto
git init
git add .
git commit -m "MedicoSmart Professional - Backend ready for deployment"

# Crea repository su GitHub e collega
git remote add origin https://github.com/TUO-USERNAME/medicosmart-backend.git
git push -u origin main
```

#### Passo 2: Connetti a Railway

1. Vai su https://railway.app/dashboard
2. Clicca **"New Project"**
3. Seleziona **"Deploy from GitHub repo"**
4. Scegli il repository `medicosmart-backend`

#### Passo 3: Configura Variabili d'Ambiente

Nel Railway Dashboard → Variables, aggiungi:

```
DATABASE_URL=postgresql://neondb_owner:npg_Vudtqj73DPOA@ep-calm-cherry-ag1lugsx-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

JWT_SECRET=medicosmart-super-secret-jwt-key-32chars!!
JWT_REFRESH_SECRET=medicosmart-refresh-token-secret-32!!
ENCRYPTION_KEY=medicosmart-32-char-enc-key-2024!!
ENCRYPTION_IV=medicosmart-iv!!

NODE_ENV=production
FRONTEND_URL=https://medicosmart-i0qj4bke436o.space.minimax.io
```

#### Passo 4: Deploy Automatico

Railway eseguirà automaticamente:
1. `npm install`
2. `npx prisma generate`
3. `npx prisma migrate deploy`
4. `npm start`

#### Passo 5: Ottieni l'URL del Backend

Dopo il deployment, Railway mostrerà un URL come:
```
https://medicosmart-api.up.railway.app
```

Annota questo URL!

### Opzione 2: Deploy da CLI

```bash
# Installa Railway CLI
npm install -g @railway/cli

# Login
railway login

# Init progetto
cd /workspace/medicosmart-pro/backend
railway init

# Configura variabili
railway variable set DATABASE_URL="postgresql://..."

# Deploy
railway up
```

---

## Aggiornamento Frontend

Dopo aver deployato il backend, aggiorna il frontend per usare il nuovo API URL:

### Passo 1: Aggiorna la variabile d'ambiente

Crea un file `.env` nella cartella `frontend`:

```env
VITE_API_URL=https://medicosmart-api.up.railway.app
```

### Passo 2: Deploy Frontend su Netlify

Il frontend è già deployato su:
```
https://medicosmart-i0qj4bke436o.space.minimax.io
```

Per aggiornarlo con il nuovo backend:

```bash
cd /workspace/medicosmart-pro/frontend

# Crea file .env
echo "VITE_API_URL=https://medicosmart-api.up.railway.app" > .env

# Build e deploy
npm install
npm run build

# Connetti a Netlify (se non già fatto)
ntl init
ntl deploy --prod --dir=dist
```

---

## Inizializzazione Database

Dopo il primo deployment, esegui lo script di setup per creare gli utenti demo:

```bash
cd /workspace/medicosmart-pro/backend

# Genera Prisma client
npx prisma generate

# Esegui setup
node setup-db.js
```

Questo creerà:
- Utente admin: `admin` / `admin123`
- Utente medico: `medico` / `medioc123`

---

## Verifica del Deployment

### Test Health Check
```bash
curl https://medicosmart-api.up.railway.app/api/health
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

### Test Login
```bash
curl -X POST https://medicosmart-api.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

---

## Risoluzione Problemi

### Problema: Prisma Client not generated
```bash
# In Railway, assicurati che il postinstall script sia eseguito
# Oppure esegui manualmente:
npx prisma generate
```

### Problema: Cannot connect to database
1. Verifica che il database Neon sia attivo
2. Controlla l'URL nel formato corretto
3. Assicurati che il pooler Neon sia abilitato

### Problema: JWT errors
Assicurati che tutte le variabili JWT siano configurate:
- JWT_SECRET (min 32 caratteri)
- JWT_REFRESH_SECRET (min 32 caratteri)
- ENCRYPTION_KEY (esattamente 32 caratteri)
- ENCRYPTION_IV (esattamente 16 caratteri)

---

## File Creati

```
medicosmart-pro/
├── backend/
│   ├── .env                    # Configurazione (da completare)
│   ├── Procfile               # Per Railway
│   ├── railway.json           # Configurazione Railway
│   ├── DEPLOY.md             # Guida dettagliata
│   ├── setup-db.js           # Script setup database
│   └── src/                  # Codice sorgente
├── frontend/
│   ├── .env.example          # Template variabili ambiente
│   └── src/api/             # Integrazione API
└── deploy.sh                # Script deployment automatico
```

---

## Prossimi Passi

1. ✅ Backend configurato con database Neon
2. ⏳ Deploy backend su Railway
3. ⏳ Aggiornare frontend con nuovo API URL
4. ⏳ Test completo dell'applicazione

---

## Supporto

Per problemi:
1. Controlla i log su Railway Dashboard
2. Verifica le variabili d'ambiente
3. Testa la connessione al database Neon
4. Controlla i log Prisma per errori database

**URL Importanti:**
- Railway Dashboard: https://railway.app/dashboard
- Neon Dashboard: https://neon.tech/dashboard
- Netlify Dashboard: https://app.netlify.com
