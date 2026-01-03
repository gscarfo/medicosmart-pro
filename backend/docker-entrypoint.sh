#!/bin/bash
# MedicoSmart - Docker Entrypoint Script
# =======================================
# Questo script viene eseguito all'avvio del container API

set -e

echo "=============================================="
echo "  MedicoSmart - Avvio Container"
echo "=============================================="
echo ""

# Attendi che il database sia pronto
echo "📡 Attesa connessione database..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if pg_isready -h db -p 5432 -U medicosmart -q 2>/dev/null; then
        echo "✅ Database pronto!"
        break
    fi

    attempt=$((attempt + 1))
    echo "   Tentativo $attempt/$max_attempts..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Database non disponibile dopo $max_attempts tentativi"
    echo "   Il container rimarrà in esecuzione per permettere il debug"
    echo "   Puoi accedere con: docker exec -it medicosmart-api sh"
    # Non uscire, lascia il container in esecuzione
fi

# Esegui migrazioni Prisma
echo ""
echo "📊 Esecuzione migrazioni database..."
npx prisma migrate deploy || {
    echo "⚠️  Migrazione non riuscita, potrebbe già essere aggiornato"
}

# Verifica/trova utenti iniziali
echo ""
echo "👤 Verifica utenti iniziali..."

# Controlla se esiste già un utente admin
admin_exists=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
await prisma.\$connect();
const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
console.log(admin ? 'yes' : 'no');
process.exit(0);
" 2>/dev/null || echo "no")

if [ "$admin_exists" != "yes" ]; then
    echo "   Creazione utenti iniziali..."
    node setup-db.js || echo "⚠️  Setup database non riuscito"
else
    echo "   Utenti già presenti, skip creazione"
fi

echo ""
echo "=============================================="
echo "  Container pronto! Avvio server..."
echo "=============================================="

# Avvio del server
exec "$@"
