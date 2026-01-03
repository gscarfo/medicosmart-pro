#!/bin/bash

# ============================================
# MedicoSmart Professional - Deployment Script
# ============================================

set -e  # Exit on error

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║         MedicoSmart Professional - Deployment               ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Funzioni
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verifica prerequisiti
check_prerequisites() {
    log_info "Verifica prerequisiti..."

    command -v git >/dev/null 2>&1 || {
        log_error "Git non trovato. Installa Git prima di continuare."
        exit 1
    }

    command -v node >/dev/null 2>&1 || {
        log_error "Node.js non trovato. Installa Node.js 18+ prima di continuare."
        exit 1
    }

    command -v npm >/dev/null 2>&1 || {
        log_error "npm non trovato. Installa Node.js prima di continuare."
        exit 1
    }

    log_success "Tutti i prerequisiti sono soddisfatti"
}

# Setup backend
setup_backend() {
    log_info "Setup Backend..."

    cd backend

    # Installa dipendenze
    log_info "Installazione dipendenze backend..."
    npm install

    # Genera Prisma client
    log_info "Generazione Prisma client..."
    npx prisma generate

    # Verifica connessione database
    log_info "Verifica connessione database..."
    node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.\$connect().then(() => {
            console.log('Database connesso!');
            process.exit(0);
        }).catch(e => {
            console.error('Errore connessione:', e.message);
            process.exit(1);
        });
    "

    cd ..
    log_success "Backend configurato"
}

# Deploy Backend su Railway
deploy_backend_railway() {
    log_info "Deploy Backend su Railway..."

    # Verifica se la CLI è installata
    if ! command -v railway &> /dev/null; then
        log_warning "Railway CLI non trovata. Installazione..."
        npm install -g @railway/cli
    fi

    # Login
    log_info "Effettua il login su Railway:"
    railway login

    # Init progetto
    log_info "Inizializzazione progetto..."
    railway init

    # Configura variabili d'ambiente
    log_info "Configurazione variabili d'ambiente..."
    railway variable set DATABASE_URL="$DATABASE_URL"
    railway variable set JWT_SECRET="$JWT_SECRET"
    railway variable set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
    railway variable set ENCRYPTION_KEY="$ENCRYPTION_KEY"
    railway variable set ENCRYPTION_IV="$ENCRYPTION_IV"
    railway variable set NODE_ENV=production

    # Deploy
    log_info "Deploy in corso..."
    railway up

    # Ottieni URL
    API_URL=$(railway domain)
    log_success "Backend deployato! URL: https://$API_URL"

    echo "$API_URL"
}

# Deploy Frontend su Netlify
deploy_frontend_netlify() {
    log_info "Deploy Frontend su Netlify..."

    cd frontend

    # Crea file .env
    cat > .env << EOF
VITE_API_URL=https://$API_URL
EOF

    # Build
    log_info "Build frontend..."
    npm install
    npm run build

    # Deploy su Netlify
    log_info "Deploy su Netlify..."

    # Verifica se la CLI Netlify è installata
    if ! command -v netlify &> /dev/null; then
        log_warning "Netlify CLI non trovata. Installazione..."
        npm install -g netlify-cli
    fi

    netlify deploy --prod --dir=dist

    cd ..
    log_success "Frontend deployato!"
}

# Main
main() {
    echo ""
    log_info "Questo script deploya MedicoSmart Professional su Railway e Netlify"
    echo ""

    # Seleziona opzione
    echo "Scegli cosa deployare:"
    echo "1) Solo Backend (Railway)"
    echo "2) Solo Frontend (Netlify)"
    echo "3) Tutto (Backend + Frontend)"
    echo "4) Solo Setup Database"
    echo ""

    read -p "Scelta (1-4): " choice
    echo ""

    case $choice in
        1)
            check_prerequisites
            setup_backend
            deploy_backend_railway
            ;;
        2)
            if [ -z "$API_URL" ]; then
                log_error "Devi prima deployare il backend!"
                exit 1
            fi
            deploy_frontend_netlify
            ;;
        3)
            check_prerequisites
            setup_backend
            API_URL=$(deploy_backend_railway)
            deploy_frontend_netlify
            ;;
        4)
            check_prerequisites
            setup_backend
            cd backend
            node setup-db.js
            cd ..
            ;;
        *)
            log_error "Scelta non valida"
            exit 1
            ;;
    esac

    echo ""
    log_success "Deployment completato!"
    echo ""
}

# Esegui main
main "$@"
