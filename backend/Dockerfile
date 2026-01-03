# Dockerfile per MedicoSmart Backend
# Basato su Node.js 18 Alpine

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

# ========== STAGE DI PRODUZIONE ==========
FROM node:18-alpine AS production

WORKDIR /alla soloapp

# Inst dipendenze di produzione
COPY package*.json ./
RUN npm ci --only=production && npm ci --omit=dev

# Copia Prisma schema e client generato
COPY prisma ./prisma/

# Copia file dalla build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src

# Crea directory per upload
RUN mkdir -p ./uploads/pdfs ./logs

# Variabili d'ambiente (da configurare in produzione)
ENV NODE_ENV=production
ENV PORT=3000

# Esposizione porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Avvio applicazione
CMD ["node", "src/index.js"]
