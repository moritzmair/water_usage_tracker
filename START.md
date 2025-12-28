# 🚀 Wasserzähler Tracker - Schnellstart für Auto-Modus

## Sofortige Inbetriebnahme

Die App ist für 1-2 Monate Dauerbetrieb über dem Wasserzähler konzipiert.

### 1️⃣ Server starten

Wähle eine Option:

```bash
# Python (einfachste Option)
python3 -m http.server 8080

# PHP
php -S localhost:8080

# Node.js
npm install && npm start
```

### 2️⃣ HTTPS aktivieren (für Kamera erforderlich)

**Mit ngrok (empfohlen):**

```bash
# ngrok installieren: https://ngrok.com/download
# Dann ausführen:
ngrok http 8080

# Ausgabe z.B.: https://abc123.ngrok.io
# Diese URL verwenden!
```

**Ohne ngrok (nur für lokale Tests):**
- Chrome: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
- Hinzufügen: `http://localhost:8080`

### 3️⃣ Smartphone einrichten

#### App installieren:
1. HTTPS-URL im Browser öffnen
2. **iOS**: Teilen-Symbol → "Zum Home-Bildschirm"
3. **Android**: Menü → "App installieren"

#### System-Einstellungen (WICHTIG!):

**iOS:**
```
⚙️ Einstellungen → Anzeige & Helligkeit
   → Automatische Sperre: "Nie"

⚙️ Einstellungen → Batterie
   → Stromsparmodus: AUS
```

**Android:**
```
⚙️ Einstellungen → Display
   → Bildschirm-Timeout: "30 Minuten"

⚙️ Entwickleroptionen
   → Stay awake when charging: EIN
   
⚙️ Einstellungen → Apps → WZ Tracker
   → Akku → Nicht optimieren
```

### 4️⃣ Smartphone montieren

**Positionierung:**
- 📏 Abstand: 15-25 cm vom Zähler
- 📐 Ausrichtung: Kamera direkt auf Ziffern
- 💡 Licht: Gleichmäßig, keine Schatten
- 🔌 Netzteil: Dauerhaft angeschlossen!

**Halterung:**
- Flexibler Smartphone-Halter (z.B. Schwanenhals)
- Feste Montage (Saugnapf/Klebepad)
- Zugang zum Ladeanschluss

### 5️⃣ Auto-Modus starten

1. ✅ App öffnen
2. ✅ Erfassungsintervall wählen (empfohlen: **1 Stunde**)
3. ✅ **"Automatik starten"** drücken
4. ✅ Kamera-Berechtigung erteilen
5. ✅ Smartphone ans Netzteil anschließen
6. ✅ App im Vordergrund lassen

**Fertig!** Die App läuft nun vollautomatisch.

## Erfassungsintervalle

- ⚡ **5 Min**: Nur zum Testen
- 🔄 **15 Min**: Sehr detailliert
- ⭐ **1 Stunde**: **EMPFOHLEN** - Beste Balance
- 🔋 **2-6 Stunden**: Batterieschonend

## Status-Anzeige

Während des Betriebs zeigt die App:
- ✅ Status: Aktiv/Inaktiv
- 📊 Letzter Zählerstand
- ⏱️ Countdown bis nächster Erfassung
- ✔️ Anzahl erfolgreicher Erfassungen

## Datenauswertung (nach 1-2 Monaten)

1. 📊 **Tab "Analyse"** öffnen
2. Ansicht wählen:
   - **Heute (Std.)**: Stündlicher Verbrauch heute
   - **Woche (Tage)**: Verbrauch letzte 7 Tage
   - **Woche (Std./Tag)**: Durchschnitt pro Wochentag ⭐

3. 🔍 Verbrauchsmuster analysieren:
   - Wann wird am meisten Wasser benötigt?
   - Wann sind Schwachzeiten?

4. 🔧 Zirkulationspumpe programmieren:
   - Nur zu Bedarfszeiten laufen lassen
   - Nachtabschaltung nutzen
   - Bis zu **70% Energie** sparen!

## Häufige Probleme

### ❌ Kamera startet nicht
```
✓ HTTPS verwenden (ngrok)
✓ Berechtigung erteilt?
✓ Andere Apps schließen
```

### ❌ OCR erkennt nichts
```
✓ Beleuchtung verbessern
✓ Abstand prüfen (15-25 cm)
✓ Zähler reinigen
✓ Kamera ausrichten
```

### ❌ Display schaltet aus
```
✓ Wake Lock in App-Einstellungen
✓ System-Display-Timeout: "Nie"
✓ App im Vordergrund
✓ "Stay awake" aktiviert (Android)
```

### ❌ Batterie leer
```
⚠️  NETZTEIL ANSCHLIESSEN!
✓ Akku-Optimierung aus
✓ Display-Helligkeit senken
```

### ❌ App stoppt nach Stunden
```
✓ Akku-Optimierung deaktivieren
✓ Geführter Zugriff (iOS)
✓ App nicht aus Tasklist entfernen
```

## Checkliste vor Start

```
☐ Server läuft (mit HTTPS via ngrok)
☐ App auf Smartphone installiert
☐ Display-Timeout auf "Nie" oder "30 Min+"
☐ Akku-Optimierung für App deaktiviert
☐ Smartphone montiert (15-25 cm Abstand)
☐ Gute Beleuchtung des Zählers
☐ Netzteil angeschlossen
☐ Wake Lock in App aktiviert
☐ Erfassungsintervall gewählt
☐ "Automatik starten" gedrückt
☐ Kamera zeigt Zähler an
```

## Tipps für beste Ergebnisse

💡 **Beleuchtung**: LED-Streifen für gleichmäßiges Licht  
💡 **Stabilität**: Feste Halterung ohne Wackeln  
💡 **Batterie**: Powerbank als Backup bei Stromausfall  
💡 **Test**: Erst 24h testen, dann für 1-2 Monate laufen lassen  
💡 **Backup**: Screenshots der Konfiguration machen  
💡 **Export**: Regelmäßig Daten sichern (Browser-Export)

## Nächste Schritte

1. ✅ **Woche 1**: System stabilisiert, erste Daten sammeln
2. ✅ **Woche 2-4**: Verbrauchsmuster werden sichtbar
3. ✅ **Woche 5-8**: Präzise Analyse der Spitzenzeiten
4. ✅ **Nach 8 Wochen**: Zirkulationspumpe optimal programmieren

## Support & Dokumentation

- 📖 Vollständige Doku: [README.md](README.md)
- 🔧 Technische Details: Alle Dateien sind Open Source
- 🐛 Probleme? Browser Console (F12) → Fehlermeldungen prüfen

---

**Viel Erfolg beim Energie sparen! 💧⚡**
