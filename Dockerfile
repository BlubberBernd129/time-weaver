# TimeTracker Dockerfile
# Multi-stage build für optimale Image-Größe

# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Kopiere Package-Dateien
COPY package*.json ./

# Installiere Dependencies
RUN npm ci

# Kopiere Source-Code
COPY . .

# Build für Production
RUN npm run build

# Production Stage
FROM nginx:alpine AS production

# Kopiere nginx Konfiguration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Kopiere Build-Output
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose Port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
