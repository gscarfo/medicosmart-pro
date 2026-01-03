# Deployment su Railway - Guida Completa

## Prerequisiti

1. **Account Railway**: https://railway.app
2. **Account Neon**: https://neon.tech (già configurato)
3. **Git** installato localmente

## Passo 1: Preparazione del Progetto

### Clona il repository (se non già fatto)
```bash
git clone <url-repository>
cd medicosmart-pro/backend
```

### Verifica la configurazione del database
Il file `.env` deve contenere il tuo URL Neon:

```env
DATABASE_URL=postgresql://neondb_owner:npg_Vudtqj73DPOA@ep-calm-cherry-ag1lugsx-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Passo 2: Deployment su Railway

### Opzione A: Deploy da GitHub (Consigliato)

1. **Carica il progetto su GitHub**
   ```bash
   cd /workspace/medicosmart-pro
   git init
   git add .
   git commit -m "Initial commit - MedicoSmart Backend"
   git remote add origin https://github.com/TUO-USERNAME/medicosmart-backend.git
   git push -u origin main
   ```

2. **Connetti a Railway**
   - Vai su https://railway.app/dashboard
   - Clicca "New Project"
   - Seleziona "Deploy from GitHub repo"
   - Scegli il repository `medicosmart-backend`

3. **Configura le variabili d'ambiente**
   - Clicca sul progetto appena creato
   - Vai alla scheda "Variables"
   - Aggiungi tutte le variabili dal file `.env`:
     ```
     DATABASE_URL=postgresql://neondb_owner:...
     JWT_SECRET=medicosmart-super-secret-jwt-key-32chars!!
     ENCRYPTION_KEY=medicosmart-32-char-enc-key-2024!!
     ENCRYPTION_IV=medicosmart-iv!!
     NODE_ENV=production
     ```

4. **Deploy Automatico**
   - Railway eseguirà automaticamente il build
   - Installerà le dipendenze
   - Genererà il client Prisma
   - Eseguirà le migrazioni database
   - Avvierà il server

### Opzione B: Deploy da CLI Railway

1. **Installa la CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Init progetto**
   ```bash
   railway init
   ```

4. **Deploy**
   ```bash
   railway up
   ```

## Passo 3: Configurazione Dominio (Opzionale)

1. Nel dashboard Railway, vai su "Settings" → "Domains"
2. Aggiungi un dominio personalizzato o usa il default `.up.railway.app`
3. Esempio: `api.medicosmart.app`

## Passo 4: Verifica il Deployment

### Health Check
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

### Verifica Database
```bash
curl https://medicosmart-api.up.railway.app/api/auth/me \
  -H "Authorization: Bearer <token>"
```

## Passo 5: Aggiornare il Frontend

Dopo il deploy del backend, aggiorna il frontend per usare il nuovo API URL:

1. Modifica `frontend/.env`:
   ```env
   VITE_API_URL=https://medicosmart-api.up.railway.app
   ```

2. Ridploy del frontend su Netlify

## Risoluzione Problemi comuni

### Errore: "Prisma Client not generated"
```bash
# Eseguire localmente
npx prisma generate

# O aggiungere al package.json
"postinstall": "prisma generate"
```

### Errore: "Connection refused" al database
- Verifica che l'URL Neon sia corretto
- Controlla che il database Neon sia attivo (dashboard Neon)
- Assicurati che il pooler Neon sia abilitato

### Errore: "jwt must be provided"
- Verifica che `JWT_SECRET` sia impostato nelle variabili d'ambiente Railway

## Comandi Utili

### Eseguire migrazioni manualmente
```bash
npx prisma migrate deploy
```

### Aprire Prisma Studio
```bash
npx prisma studio
```

### Vedere i log
```bash
railway logs
```

## Variabili d'Amiente Richieste

| Variabile | Descrizione | Obbligatorio |
|-----------|-------------|--------------|
| `DATABASE_URL` | Connection string PostgreSQL Neon | ✅ |
| `JWT_SECRET` | Chiave segreta JWT (min 32 caratteri) | ✅ |
| `JWT_REFRESH_SECRET` | Chiave segreta refresh token | ✅ |
| `ENCRYPTION_KEY` | Chiave crittografia AES-256 (32 caratteri) | ✅ |
| `ENCRYPTION_IV` | IV crittografia (16 caratteri) | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `FRONTEND_URL` | URL del frontend | ❌ |
| `SMTP_*` | Configurazione email | ❌ |
| `TWILIO_*` | Configurazione SMS | ❌ |

## Supporto

Per problemi:
1. Controlla i log su Railway Dashboard
2. Verifica le variabili d'ambiente
3. Controlla la connessione al database Neon
