# TimeTracker - Installationsanleitung

## 🚀 Schnellstart mit Docker

### Voraussetzungen
- Docker & Docker Compose installiert
- PocketBase Server (selbst gehostet oder Remote)
- Git (optional)

### Installation

```bash
# 1. Repository klonen oder Dateien herunterladen
git clone <your-repo-url>
cd timetracker

# 2. Konfigurationsdatei erstellen
cp .env.example .env

# 3. API URL konfigurieren
# Für lokalen PocketBase (intern, ohne Cloudflare):
#   VITE_API_URL=http://127.0.0.1:8090
# Für externen Zugriff (Standard):
#   VITE_API_URL=https://api.nick-cloud.org

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

# Update mit Neuaufbau
docker compose down && docker compose up -d --build
```

---

## 🗄️ PocketBase Setup

Die App verwendet PocketBase als Backend für persistente Datenspeicherung und Benutzerauthentifizierung.

### PocketBase Collections erstellen

Erstelle folgende Collections in deinem PocketBase Admin-Panel:

#### 1. `categories`
| Feld | Typ | Optionen |
|------|-----|----------|
| name | Text | Required |
| color | Text | Required |
| icon | Text | Optional |

#### 2. `subcategories`
| Feld | Typ | Optionen |
|------|-----|----------|
| category_id | Text | Required |
| name | Text | Required |

#### 3. `time_entries`
| Feld | Typ | Optionen |
|------|-----|----------|
| category_id | Text | Required |
| subcategory_id | Text | Optional |
| start_time | Text | Required |
| end_time | Text | Optional |
| duration | Number | Default: 0 |
| description | Text | Optional |
| is_running | Boolean | Default: false |
| is_pause | Boolean | Default: false |
| pause_periods | JSON | Optional |

**Wichtig für Realtime-Sync**: Laufende Timer werden als Einträge mit `is_running: true` und `end_time: null` gespeichert. Die App synchronisiert diese automatisch zwischen Geräten via PocketBase Realtime.

#### 4. `goals`
| Feld | Typ | Optionen |
|------|-----|----------|
| category_id | Text | Required |
| subcategory_id | Text | Optional |
| target_minutes | Number | Required |
| period | Text | Required (daily/weekly) |

### API Rules konfigurieren

Für jede Collection (außer `users`) setze folgende API Rules:

- **List/Search**: `@request.auth.id != ""`
- **View**: `@request.auth.id != ""`
- **Create**: `@request.auth.id != ""`
- **Update**: `@request.auth.id != ""`
- **Delete**: `@request.auth.id != ""`

Dies erlaubt allen eingeloggten Benutzern Zugriff auf die Daten.

### Benutzer anlegen

1. Öffne PocketBase Admin: `https://deine-url/_/`
2. Gehe zu **Collections** → **users**
3. Klicke **New record**
4. Trage E-Mail und Passwort ein

---

## 🔐 Authentifizierung

Die App verwendet PocketBase-Authentifizierung. Beim Starten der App erscheint ein Login-Screen.

### Login
- E-Mail und Passwort eingeben
- Klicke "Anmelden"

### Logout
- Klicke "Abmelden" in der Sidebar (Desktop) oder im Menü (Mobile)

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
4. Ein Eintrag mit `is_running: true` wird sofort in PocketBase erstellt

### Timer stoppen
- **"Timer stoppen"** klicken
- `end_time` wird gesetzt und `is_running` auf `false`
- Die Dauer wird berechnet (Endzeit - Startzeit - Pausen)

### Multi-Gerät Sync
- **Laufende Timer werden automatisch synchronisiert**
- Starte Timer auf Gerät A → erscheint auf Gerät B
- Pausieren/Fortsetzen wird ebenfalls synchronisiert
- Stoppen auf jedem Gerät möglich

### Manueller Eintrag
1. **"Manuell eintragen"** Button
2. Kategorie & Unterkategorie wählen
3. Datum, Start- und Endzeit eingeben
4. Optional: Beschreibung hinzufügen

### Pause-Funktion
- Während ein Timer läuft: **"Pause"** klicken
- Pausenzeiten werden als `pause_periods` JSON gespeichert
- Pausierte Zeit wird von der Gesamtzeit abgezogen

---

## 📊 Statistiken

- **Wochenansicht**: Gesamtzeit pro Kategorie mit Unterkategorien
- **Monatsansicht**: Überblick mit Wochenvergleich
- **Trend-Analyse**: 8-Wochen-Verlauf
- **Wochenvergleich**: Aktuelle vs. vorherige Woche
- Klicke auf eine Kategorie um Unterkategorien anzuzeigen

### Export
- CSV oder PDF Export für Berichte

---

## 📅 Kalender

- **Wochenansicht**: Detaillierte Tagesansicht
- **Monatsansicht**: Schnellübersicht aller Einträge
- Filter nach Kategorien möglich
- Einträge per Drag & Drop erstellen

---

## 🎯 Ziele setzen

1. Gehe zu **Kategorien**
2. Wähle eine Kategorie oder Unterkategorie
3. Setze **tägliche** oder **wöchentliche** Ziele
4. Fortschritt wird im Dashboard angezeigt

---

## 🔧 Konfiguration

### Umgebungsvariablen (.env)

| Variable | Beschreibung | Standard |
|----------|-------------|----------|
| `PORT` | Port für die App | 3000 |
| `VITE_API_URL` | PocketBase API URL | https://api.nick-cloud.org |

**Lokaler Server (ohne Cloudflare):**
```bash
VITE_API_URL=http://127.0.0.1:8090
```

**Externer Zugriff:**
```bash
VITE_API_URL=https://api.nick-cloud.org
```

### Datenpeicherung

- **Mit PocketBase**: Alle Daten werden bidirektional synchronisiert
- **Offline/Fallback**: Lokale Speicherung im Browser (localStorage)

---

## ❓ Hilfe & Support

Bei Fragen oder Problemen erstelle ein Issue im Repository.
