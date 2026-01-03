# Dockerfile per MedicoSmart Frontend
# Build React app con Nginx per produzione

FROM node:18-alpine AS builder

WORKDIR /app

# Copia package files
COPY package*.json ./

# Installa dipendenze
RUN npm ci

# Copia sorgenti
COPY . .

# Build produzione
RUN npm run build

# ========== STAGE PRODUZIONE ==========
FROM nginx:alpine AS production

# Copia configurazione nginx personalizzata
COPY nginx.conf /etc/nginx/nginx.conf

# Copia file build
COPY --from=builder /app/dist /usr/share/nginx/html

# Espone porta
EXPOSE 80

# Avvio nginx
CMD ["nginx", "-g", "daemon off;"]
