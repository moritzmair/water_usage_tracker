# 💧 Wasserzähler Tracker PWA

Progressive Web App zum automatischen Ablesen von Wasserzählerständen mit OCR-Technologie und intelligenter Verbrauchsanalyse.

## Features

- 📷 **Kamera-Integration**: Nutzt die Smartphone-Kamera zum Fotografieren des Wasserzählers
- 🔍 **OCR-Erkennung**: Automatisches Ablesen des Zählerstands mittels Tesseract.js (offline)
- 💾 **Lokale Speicherung**: Alle Daten werden lokal in IndexedDB gespeichert
- 📊 **Visualisierung**: Interaktive Diagramme zur Analyse des Wasserverbrauchs
- ⏰ **Zeitbasierte Analyse**: Verbrauch aufgeteilt nach Stunden und Wochentagen
- 📱 **Mobile-First**: Optimiert für Smartphones
- 🔒 **Offline-Fähig**: Funktioniert komplett offline durch Service Worker
- 🚀 **Installierbar**: Als App auf dem Smartphone installierbar

## Installation

1. Dependencies installieren:
```bash
npm install
```

2. Icons generieren:
```bash
npm run generate-icons
```

3. Entwicklungsserver starten:
```bash
npm start
```

4. Browser öffnen: `http://localhost:8080`

## Deployment

Für die Nutzung als PWA muss die App über HTTPS bereitgestellt werden:

### Option 1: GitHub Pages
1. Repository auf GitHub hochladen
2. GitHub Pages in den Repository-Einstellungen aktivieren
3. Die App ist dann unter `https://username.github.io/repository-name` erreichbar

### Option 2: Netlify / Vercel
1. Repository mit Netlify oder Vercel verbinden
2. Automatisches Deployment wird eingerichtet

### Option 3: Lokaler Server mit HTTPS
```bash
npx http-server -p 8080 -S -C cert.pem -K key.pem
```

## Verwendung

### Zählerstand erfassen

1. **Mit Kamera**:
   - "Kamera starten" drücken
   - Wasserzähler fotografieren
   - OCR erkennt automatisch den Zählerstand
   - Wert überprüfen und speichern

2. **Manuell**:
   - Zählerstand direkt eingeben
   - Speichern

### Verbrauchsanalyse

Die App bietet drei Visualisierungsmodi:

- **Heute (Std.)**: Stündlicher Verbrauch des aktuellen Tages
- **Woche (Tage)**: Täglicher Verbrauch der letzten 7 Tage
- **Woche (Std./Tag)**: Durchschnittlicher Verbrauch pro Wochentag

### Optimierung der Zirkulationspumpe

Die Visualisierung zeigt genau, wann am meisten Wasser verbraucht wird. Diese Informationen können zur optimalen Einstellung der Heizungs-Zirkulationspumpe verwendet werden:

1. Daten über mehrere Wochen sammeln
2. Analyse der Wochentags-Darstellung
3. Pumpe nur zu Spitzenzeiten laufen lassen
4. Energieersparnis durch bedarfsgerechten Betrieb

## Technologie-Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **PWA**: Service Worker, Web App Manifest
- **OCR**: Tesseract.js 5.0
- **Charts**: Chart.js 4.4
- **Storage**: IndexedDB
- **Camera**: MediaDevices API
- **Styling**: CSS3 mit Custom Properties

## Browser-Kompatibilität

- Chrome/Edge (Android/Desktop): ✅ Volle Unterstützung
- Safari (iOS): ✅ Volle Unterstützung mit PWA-Installation
- Firefox: ✅ Funktioniert, eingeschränkte PWA-Features

## Datenschutz

- Alle Daten bleiben lokal auf dem Gerät
- Keine Server-Kommunikation
- Keine Tracking-Technologien
- Offline-First Architektur

## Tipps für beste OCR-Ergebnisse

- Wasserzähler gut beleuchten
- Kamera parallel zum Zähler halten
- Nahaufnahme der Ziffern
- Bei schlechter Erkennung: Manuelle Eingabe nutzen

## Lizenz

MIT
