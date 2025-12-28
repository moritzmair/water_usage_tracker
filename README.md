# 💧 Wasserzähler Tracker PWA - Automatische Dauererfassung

Progressive Web App zur vollautomatischen Erfassung von Wasserzählerständen über 1-2 Monate mit Montage über dem Zähler.

## Features

- 🔄 **Vollautomatische Erfassung**: Smartphone wird über dem Zähler montiert und erfasst automatisch im eingestellten Intervall
- 📷 **Dauerhafte Kamera-Nutzung**: Kamera bleibt permanent aktiv für kontinuierliche Überwachung
- 🔍 **OCR-Erkennung**: Automatisches Ablesen mittels Tesseract.js (komplett offline)
- ⏰ **Flexible Intervalle**: Wählbar von 5 Minuten bis 6 Stunden
- 🔋 **Energieverwaltung**: Wake Lock API hält Display aktiv, Battery-Monitoring
- 💾 **Lokale Speicherung**: Alle Daten in IndexedDB (keine Cloud)
- 📊 **Intelligente Analyse**: Verbrauchsmuster nach Stunden und Wochentagen
- 📱 **Mobile-First**: Optimiert für Dauerbetrieb auf Smartphones
- 🔒 **Offline-Fähig**: Komplett ohne Internetverbindung nutzbar
- 🚀 **PWA**: Als native App installierbar

## Verwendungsszenario

Das Smartphone wird für 1-2 Monate fest über dem Wasserzähler montiert:

1. **Montage**: Smartphone mit Halterung über dem Zähler positionieren
2. **Netzteil**: Dauerhaft an Stromversorgung anschließen
3. **App starten**: Automatischen Modus aktivieren
4. **Datensammlung**: App erfasst automatisch alle X Minuten den Zählerstand
5. **Analyse**: Nach 1-2 Monaten detaillierte Verbrauchsmuster auswerten
6. **Optimierung**: Zirkulationspumpe basierend auf den Daten optimal einstellen

## Installation & Setup

### 1. App bereitstellen

```bash
# Server starten
python3 -m http.server 8080

# Für HTTPS (erforderlich für Kamera)
ngrok http 8080
```

### 2. Auf Smartphone installieren

1. HTTPS-URL im Browser öffnen
2. "Zum Homescreen hinzufügen" (iOS) / "App installieren" (Android)
3. App öffnet sich nun als Vollbild-Anwendung

### 3. Smartphone vorbereiten

**WICHTIG für Dauerbetrieb:**

#### iOS:
- Einstellungen → Anzeige & Helligkeit → Automatische Sperre: "Nie"
- Einstellungen → Batterie → Stromsparmodus: Aus
- Geführter Zugriff aktivieren (optional): Einstellungen → Bedienungshilfen → Geführter Zugriff

#### Android:
- Einstellungen → Display → Bildschirm-Timeout: "30 Minuten" oder höher
- Developer Options → Stay awake (when charging): Ein
- Einstellungen → Akku → Akku-Optimierung: App ausschließen
- Display-Helligkeit auf Minimum (wenn möglich)

### 4. Automatik starten

1. App öffnen
2. Erfassungsintervall wählen (empfohlen: 1 Stunde)
3. "Automatik starten" drücken
4. Kamera-Berechtigung erteilen
5. Wake Lock-Berechtigung erteilen (falls gefragt)
6. Smartphone an Netzteil anschließen

## Einstellungen

### Erfassungsintervalle

- **5 Minuten**: Nur zum Testen (hoher Batterieverbrauch)
- **15 Minuten**: Sehr detaillierte Daten
- **30 Minuten**: Gute Balance
- **1 Stunde** ⭐ Empfohlen: Optimale Balance zwischen Genauigkeit und Ressourcen
- **2 Stunden**: Weniger Daten, schont Ressourcen
- **6 Stunden**: Minimaler Verbrauch

### Optionen

- **Display immer eingeschaltet**: Nutzt Wake Lock API (empfohlen: An)
- **Ton bei Erfassung**: Akustisches Feedback (empfohlen: Aus für Dauerbetrieb)
- **Visueller Indikator**: Blinkendes Symbol bei Erfassung (empfohlen: An)

## Montage-Tipps

### Smartphone-Positionierung

1. **Abstand**: 15-25 cm vom Zähler entfernt
2. **Ausrichtung**: Kamera direkt auf Ziffernwerk gerichtet
3. **Parallel**: Smartphone parallel zur Zähleroberfläche
4. **Beleuchtung**: Gleichmäßiges Licht auf den Zähler (keine Schatten)
5. **Stabilität**: Feste Montage ohne Wackeln

### Halterung

- Smartphone-Halterung mit flexiblem Arm
- Saugnapf oder Klebebefestigung
- Alternativ: 3D-gedruckte Halterung
- Wichtig: Zugang zum Ladeanschluss

### Stromversorgung

- Netzteil dauerhaft angeschlossen
- Kabel sicher verlegen
- Bei langen Kabeln: Kabelbinder für Ordnung
- Optional: Powerbank als Backup

## Datenauswertung

### Nach 1-2 Monaten

Die App zeigt detaillierte Verbrauchsmuster:

1. **Tagesansicht**: Stündlicher Verbrauch heute
2. **Wochenansicht**: Verbrauch der letzten 7 Tage
3. **Wochentags-Analyse**: Durchschnittlicher Verbrauch pro Wochentag

### Zirkulationspumpen-Optimierung

Basierend auf den gesammelten Daten:

1. **Schwachzeiten identifizieren**: Wann wird kein/wenig Wasser benötigt?
2. **Spitzenzeiten erkennen**: Wann ist der Bedarf am höchsten?
3. **Pumpe programmieren**: Nur zu Bedarfszeiten aktivieren
4. **Energie sparen**: Bis zu 70% Energieeinsparung möglich

**Beispiel:**
- Montag-Freitag: 06:00-08:00 und 18:00-22:00
- Samstag-Sonntag: 08:00-22:00
- Nachtabschaltung: 22:00-06:00 (größtes Sparpotential)

## Technologie

- **Frontend**: Vanilla JavaScript (ES6+)
- **PWA**: Service Worker, Web App Manifest
- **OCR**: Tesseract.js 5.0 (offline)
- **Charts**: Chart.js 4.4
- **Storage**: IndexedDB
- **Camera**: MediaDevices API
- **Wake Lock**: Screen Wake Lock API
- **Battery**: Battery Status API

## Troubleshooting

### Kamera funktioniert nicht
- HTTPS erforderlich → ngrok verwenden
- Kamera-Berechtigung prüfen
- Andere Apps schließen, die Kamera nutzen
- Smartphone neu starten

### OCR erkennt Zählerstand nicht
- Beleuchtung verbessern (gleichmäßig, nicht zu hell)
- Abstand anpassen (15-25 cm optimal)
- Zähler reinigen (Staub/Schmutz entfernen)
- Kamera-Ausrichtung korrigieren

### Display schaltet sich aus
- Wake Lock in Einstellungen aktivieren
- System-Einstellungen prüfen (Display-Timeout)
- App im Vordergrund lassen
- Entwickleroptionen: "Stay awake" aktivieren (Android)

### Batterie entlädt sich
- Netzteil anschließen (zwingend erforderlich!)
- Akku-Optimierung für App deaktivieren
- Display-Helligkeit reduzieren
- Längeres Erfassungsintervall wählen

### App stoppt nach einiger Zeit
- Akku-Optimierung deaktivieren
- App im Vordergrund fixieren
- Geführter Zugriff aktivieren (iOS)
- "Don't kill my app" Einstellungen prüfen (Android)

## Datenschutz & Sicherheit

- ✅ Alle Daten bleiben lokal auf dem Gerät
- ✅ Keine Cloud-Verbindung
- ✅ Keine Tracking-Technologien
- ✅ Kein Account erforderlich
- ✅ Offline-First Architektur
- ✅ Open Source (alle Dateien einsehbar)

## Browser-Kompatibilität

| Feature | Chrome/Edge | Safari | Firefox |
|---------|-------------|--------|---------|
| PWA Installation | ✅ | ✅ | ⚠️ |
| Service Worker | ✅ | ✅ | ✅ |
| Wake Lock API | ✅ | ❌* | ❌* |
| Camera API | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ |
| OCR (Tesseract) | ✅ | ✅ | ✅ |

*Wake Lock: Nutzen Sie System-Einstellungen als Alternative

**Empfehlung**: Chrome oder Edge auf Android für beste Kompatibilität

## Lizenz

MIT
