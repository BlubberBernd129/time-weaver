# TimeTracker Dockerfile
# Multi-stage build für optimale Image-Größe

# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Kopiere Package-Dateien zuerst für besseres Caching
COPY package*.json ./
COPY bun.lockb* ./

# Installiere Dependencies
RUN npm ci --legacy-peer-deps

# Kopiere Source-Code
COPY . .

# Build-Argumente für Umgebungsvariablen (optional)
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_PUBLISHABLE_KEY=""
ARG VITE_SUPABASE_PROJECT_ID=""

# Setze Umgebungsvariablen für Build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

# Build für Production
RUN npm run build

# Production Stage
FROM nginx:alpine AS production

# Installiere curl für Healthcheck
RUN apk add --no-cache curl

# Kopiere nginx Konfiguration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Kopiere Build-Output
COPY --from=builder /app/dist /usr/share/nginx/html

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Expose Port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
