# TimeTracker Dockerfile
# Multi-stage build für optimale Image-Größe
# 
# ============================================================================
# UI OVERHAUL v3.1 - Pausen-Anzeige, Kalender-Scroll, Mitternacht-Stopp
# ============================================================================
#
# ÄNDERUNGEN v3.1:
#   - Pausen werden in abgeschlossenen Einträgen angezeigt (Dashboard + Kalender)
#   - Kalender: 24h-Ansicht mit Auto-Scroll zu 7 Uhr
#   - Kalender: Pausen sind sichtbar + im Dialog bearbeitbar
#   - Mitternacht: Timer wird um 23:59:45 gestoppt (kein Split mehr)
#   - Browser-Tab blinkt bei Auto-Stopp
#   - Auto-Refresh: Wochenziele + Stats alle 5 Minuten
#   - KW-Vergleich: Unterschiedliche Farben (Blau + Grün)
#
# FEATURES v3.0:
#   - Reine Wochenbetrachtung (Statistik)
#   - 8-Wochen-Benchmark mit historischem Durchschnitt
#   - Manueller KW-Vergleich
#   - Stacked Bar Charts + Area Charts
#   - Live-Timeline mit Pausen-Editing
#   - Progress Rings für Wochenziele
#   - Glassmorphism-Design
#
# ============================================================================
# SYNC-FIX (v2.1): Timer-Status wird NUR aus der Datenbank geladen!
# ============================================================================
#
# API-Routing (dynamisch basierend auf Browser-Hostname):
# - Lokal (192.168.178.43/localhost): http://192.168.178.43:8090
# - Strato-Relay (rtracker.nick-cloud.org): https://rapi.nick-cloud.org
# - Remote (Cloudflare): https://api.nick-cloud.org

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

# Build-Argumente für Umgebungsvariablen (API-URL wird jetzt dynamisch im Browser ermittelt)
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
