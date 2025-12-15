# TimeTracker - Installationsanleitung

## 🚀 Schnellstart mit Docker

### Voraussetzungen
- Docker & Docker Compose installiert
- Git (optional)

### Installation

```bash
# 1. Repository klonen oder Dateien herunterladen
git clone <your-repo-url>
cd timetracker

# 2. Konfigurationsdatei erstellen
cp .env.example .env

# 3. Optional: Passwort setzen für Zugangsschutz
# Bearbeite .env und setze VITE_APP_PASSWORD=dein-sicheres-passwort

# 4. Container starten
docker compose up -d --build

# 5. App öffnen
# Öffne http://localhost:3000 im Browser
```

### Container verwalten

```bash
# Logs anzeigen
docker compose logs -f

# Stoppen
docker compose down

# Neustarten
docker compose restart
```

---

## 🔐 Passwortschutz

Die App kann mit einem Passwort geschützt werden, um unbefugten Zugriff zu verhindern.

### Passwort setzen

1. Bearbeite die `.env` Datei
2. Setze `VITE_APP_PASSWORD=dein-sicheres-passwort`
3. Starte den Container neu: `docker compose down && docker compose up -d --build`

```bash
# Beispiel .env
VITE_APP_PASSWORD=MeinGeheimesPasswort123
```

### Passwort deaktivieren

Entferne den Wert oder lass das Feld leer:

```bash
VITE_APP_PASSWORD=
```

**Hinweis:** Das Passwort wird zur Build-Zeit in die App kompiliert. Bei Änderungen muss der Container neu gebaut werden.

---

## 💻 Lokale Entwicklung

### Voraussetzungen
- Node.js 18+ 
- npm oder bun

### Installation

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Öffne http://localhost:8080
```

### Build erstellen

```bash
npm run build
```

---

## 📁 Kategorien & Unterkategorien anlegen

### Über die Benutzeroberfläche

1. **Kategorien** im Seitenmenü öffnen
2. **"Neue Kategorie"** klicken
3. Namen eingeben und Farbe wählen
4. Auf die Kategorie klicken, um sie zu erweitern
5. **"Unterkategorie hinzufügen"** wählen
6. Namen eingeben und Enter drücken

### Beispiel-Struktur

```
📁 Arbeit (teal)
   └── Stückliste
   └── Reports
   └── Tickets
   └── Meetings

📁 Uni (lila)
   └── Vorlesung
   └── Lernen
   └── Seminar
   └── Hausarbeit

📁 Haushalt (orange)
   └── Kochen
   └── Putzen
   └── Einkaufen

📁 Fitness (grün)
   └── Krafttraining
   └── Cardio
   └── Stretching
```

---

## ⏱️ Timer verwenden

### Timer starten
1. Im **Dashboard** Kategorie auswählen
2. Unterkategorie auswählen
3. **"Timer starten"** klicken

### Timer stoppen
- **"Timer stoppen"** klicken
- Der Zeiteintrag wird automatisch gespeichert

### Manueller Eintrag
1. **"Manuell eintragen"** Button
2. Kategorie & Unterkategorie wählen
3. Datum, Start- und Endzeit eingeben
4. Optional: Beschreibung hinzufügen

---

## 📊 Statistiken

- **Wochenansicht**: Gesamtzeit pro Kategorie mit Unterkategorien
- **Monatsansicht**: Überblick mit Wochenvergleich
- Klicke auf eine Kategorie um Unterkategorien anzuzeigen

---

## 📅 Kalender

- **Wochenansicht**: Detaillierte Tagesansicht
- **Monatsansicht**: Schnellübersicht aller Einträge
- Filter nach Kategorien möglich

---

## 🔧 Konfiguration

Die App speichert alle Daten lokal im Browser (localStorage).

### Für persistente Speicherung (zukünftig)
Aktiviere PostgreSQL in der `docker-compose.yml`:

```yaml
postgres:
  image: postgres:15-alpine
  environment:
    POSTGRES_USER: timetracker
    POSTGRES_PASSWORD: dein-sicheres-passwort
    POSTGRES_DB: timetracker
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

---

## 🔌 API (geplant)

Die REST API wird in einer zukünftigen Version verfügbar sein:

```
GET    /api/categories
POST   /api/categories
GET    /api/categories/:id/subcategories
POST   /api/categories/:id/subcategories
GET    /api/entries
POST   /api/entries
DELETE /api/entries/:id
GET    /api/stats/weekly
GET    /api/stats/monthly
```

---

## ❓ Hilfe & Support

Bei Fragen oder Problemen erstelle ein Issue im Repository.
