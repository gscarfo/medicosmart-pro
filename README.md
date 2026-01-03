# MedicoSmart Professional

Applicazione web professionale per la gestione del ricettario medico digitale. Sviluppata con architettura full-stack moderna,Conforme alle normative GDPR per la gestione di dati sanitari.

## 🏗️ Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (React)                         │
│                    SPA con Routing                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                       │
│           SSL Termination • Rate Limiting • CORS            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js)                     │
│              Express.js • JWT Auth • Validation              │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│   PostgreSQL     │    │  File System     │
│   (Dati)         │    │  (PDFs)          │
└──────────────────┘    └──────────────────┘
```

## 🚀 Caratteristiche

### Autenticazione e Sicurezza
- **JWT Authentication** con token di refresh
- **Crittografia AES-256** per dati sensibili (codice fiscale, diagnosi)
- **Rate Limiting** per prevenire attacchi brute-force
- **Audit Logging** per conformità GDPR
- **Helmet** per sicurezza HTTP headers

### Gestione Pazienti
- CRUD completo con validazione
- Ricerca per nome, cognome, codice fiscale
- Soft delete per conservazione dati
- Consenso esplicito al trattamento dati

### Prescrizioni Mediche
- Editor intuitivo per compilazione ricette
- **Generazione PDF** professionale in formato A4
- **Invio Email** con allegato PDF (SendGrid/SMTP)
- **Invio SMS** con link al download (Twilio)
- Storico prescrizioni per paziente

### Amministrazione
- Dashboard con statistiche
- Gestione utenti medici
- Assegnazione ruoli (Admin/Doctor)
- Log attività per audit

## 📋 Prerequisiti

- Docker e Docker Compose v2.0+
- Node.js 18+ (per sviluppo locale)
- PostgreSQL 15+ (per sviluppo locale)

## 🛠️ Installazione

### 1. Clona il repository

```bash
git clone <repository-url>
cd medicosmart-pro
```

### 2. Configura le variabili d'ambiente

```bash
# Copia il file di esempio
cp backend/.env.example backend/.env

# Modifica le variabili
nano backend/.env
```

Variabili obbligatorie:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/medicosmart"
JWT_SECRET=your-super-secret-key-min-32-characters
ENCRYPTION_KEY=your-32-character-encryption-key!!
```

### 3. Avvia con Docker Compose

```bash
# Avvia tutti i servizi
docker-compose up -d

# Verifica stato servizi
docker-compose ps
```

### 4. Accesso all'applicazione

- **Frontend**: http://localhost
- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

## 🔧 Sviluppo Locale

### Backend

```bash
cd backend

# Installa dipendenze
npm install

# Setup database
npx prisma migrate dev
npx prisma generate

# Avvia server sviluppo
npm run dev
```

### Frontend

```bash
cd frontend

# Installa dipendenze
npm install

# Avvia server sviluppo
npm run dev
```

## 📁 Struttura Progetto

```
medicosmart-pro/
├── backend/
│   ├── src/
│   │   ├── config/          # Configurazione
│   │   ├── controllers/     # Logica applicativa
│   │   ├── middleware/      # Middleware Express
│   │   ├── models/          # Modelli Prisma
│   │   ├── routes/          # Route API
│   │   ├── services/        # Servizi business logic
│   │   ├── utils/           # Utility
│   │   └── index.js         # Entry point
│   ├── prisma/
│   │   └── schema.prisma    # Schema database
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # Componenti React
│   │   ├── pages/           # Pagine
│   │   ├── context/         # Context providers
│   │   └── utils/           # Utility
│   └── Dockerfile
├── nginx/
│   ├── nginx.conf           # Configurazione Nginx
│   └── ssl/                 # Certificati SSL
├── docker-compose.yml
└── README.md
```

## 📊 Schema Database

### Tabelle Principali

| Tabella | Descrizione |
|---------|-------------|
| `users` | Utenti del sistema (medici, admin) |
| `doctor_profiles` | Profili professionali dei medici |
| `patients` | Anagrafica pazienti |
| `prescriptions` | Prescrizioni mediche |
| `communications` | Log comunicazioni inviate |
| `audit_logs` | Log per compliance GDPR |

## 🔐 Sicurezza GDPR

### Misure Implementate

1. **Pseudonimizzazione**
   - Dati sensibili crittografati nel database
   - Chiavi di crittografia separate dalle dati

2. **Consenso**
   - Checkbox obbligatoria per trattamento dati
   - Data e ora del consenso registrata

3. **Diritto all'accesso**
   - Esportazione dati paziente in JSON

4. **Diritto all'oblio**
   - Soft delete con conservazione per legge
   - Anonimizzazione su richiesta

5. **Audit Trail**
   - Tracciamento accessi e modifiche
   - Conservazione log per 10 anni

## 📧 Configurazione Email

### SendGrid (Consigliato)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### SMTP Standard

```env
SMTP_HOST=smtp.tuodominio.it
SMTP_PORT=587
SMTP_USER=info@tuodominio.it
SMTP_PASS=password-smtp
```

## 📱 Configurazione SMS

### Twilio

```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## 🧪 Test

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📦 Deployment Produzione

### 1. Server con Docker

```bash
# Configura SSL con Let's Encrypt
./scripts/setup-ssl.sh tuodominio.it

# Avvia produzione
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Variabili d'ambiente produzione

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=super-secret-production-key
ENCRYPTION_KEY=production-encryption-key!!
FRONTEND_URL=https://tuodominio.it
```

## 📄 Licenza

Questo progetto è proprietario. Tutti i diritti riservati.

## 🆘 Supporto

Per supporto tecnico:
- Email: support@medicosmart.app
- Documentazione: /docs

---

Sviluppato con ❤️ per la sanità italiana
