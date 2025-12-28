# 🚀 Wasserzähler Tracker - Schnellstart

## Sofort starten (empfohlen)

Die App benötigt einen lokalen Webserver. Hier sind die einfachsten Optionen:

### Option 1: Python (meist vorinstalliert)
```bash
python3 -m http.server 8080
```

### Option 2: PHP (meist vorinstalliert auf Mac)
```bash
php -S localhost:8080
```

### Option 3: Mit Node.js
```bash
npm install
npm start
```

## App öffnen

Nach dem Start eines Servers:

1. Browser öffnen: **http://localhost:8080**
2. Für Kamera-Zugriff ist HTTPS erforderlich

## HTTPS für Kamera-Zugriff

Die Kamera funktioniert nur über HTTPS. Optionen:

### A) Localhost-Ausnahme (Chrome/Edge)
- `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
- Hinzufügen: `http://localhost:8080`
- Chrome neu starten

### B) ngrok (einfachste HTTPS-Lösung)
```bash
# ngrok installieren: https://ngrok.com/download
ngrok http 8080
```
Dann die HTTPS-URL von ngrok verwenden.

## Auf dem Smartphone testen

### Option 1: Mit ngrok (empfohlen)
1. `ngrok http 8080` starten
2. Die generierte HTTPS-URL (z.B. `https://abc123.ngrok.io`) auf dem Smartphone öffnen
3. App installieren über Browser-Menü "Zum Homescreen hinzufügen"

### Option 2: Im gleichen Netzwerk
1. Lokalen Server starten
2. Deine lokale IP-Adresse finden: `ifconfig | grep inet`
3. Auf Smartphone: `http://DEINE-IP:8080`
4. Kamera funktioniert nur mit HTTPS (siehe ngrok)

## Funktionen testen

1. **Kamera**: "Kamera starten" → Foto vom Wasserzähler machen
2. **OCR**: Automatische Erkennung der Ziffern
3. **Speichern**: Zählerstand wird lokal gespeichert
4. **Analyse**: Charts zeigen Verbrauchsmuster
5. **Offline**: Service Worker macht App offline-fähig

## Troubleshooting

**Kamera funktioniert nicht:**
- HTTPS erforderlich (nutze ngrok)
- Kamera-Berechtigung im Browser erlauben

**OCR erkennt nichts:**
- Bessere Beleuchtung
- Nahaufnahme der Ziffern
- Manuelle Eingabe nutzen

**App lädt nicht:**
- Service Worker Cache löschen: DevTools → Application → Clear Storage
- Hard Reload: Strg/Cmd + Shift + R

## Deployment

Für produktiven Einsatz siehe [README.md](README.md) - Empfehlung: GitHub Pages oder Netlify.
