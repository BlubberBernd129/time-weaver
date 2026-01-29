# TimeTracker Dockerfile
# Multi-stage build für optimale Image-Größe
# 
# ============================================================================
# UI OVERHAUL v3.0 - Statistik, Kalender, Dashboard, Ziele
# ============================================================================
#
# STATISTIK:
#   - Reine Wochenbetrachtung (Kalenderwochen)
#   - Dynamische Anzeige "Stand Dienstag" für laufende Woche
#   - Benchmark: Vergleich mit historischem 8-Wochen-Durchschnitt
#   - Manueller KW-Vergleich (2 Wochen + Gesamtdurchschnitt)
#   - Nur Hauptkategorien (Unterkategorien ausgeblendet)
#   - Stacked Bar Charts + Area Charts
#
# KALENDER:
#   - Visuelle Skalierung: Eintrags-Länge = Dauer
#   - 16-Stunden-Raster (6:00-22:00)
#   - 1 Stunde = 1/16 der Bildschirmhöhe
#   - Vollflächige Kategorie-Farben
#
# DASHBOARD:
#   - Live-Timeline mit Pausen-Segmenten (schraffiert)
#   - On-the-fly Pause-Editing (klicken, ändern, löschen)
#   - Glassmorphism-Design
#
# ZIELE:
#   - Nur Wochenziele (tägliche Ziele entfernt)
#   - Progress Circles/Rings für Fortschritt
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
