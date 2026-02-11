# Quick Start Guide - Enhanced Mekko Chart

## 🚀 Schnellstart

### 1. Dateien ins Projekt kopieren

```bash
# Neue Utility-Dateien (in src/ Ordner)
cp labelCalculations.ts ./src/
cp topNUtils.ts ./src/

# Aktualisierte Konfigurationsdateien (Projekt-Root)
cp capabilities.json ./
cp package.json ./
cp pbiviz.json ./

# Aktualisierte TypeScript-Dateien (in src/ Ordner, wenn vorhanden)
cp settings.ts ./src/
cp dataInterfaces.ts ./src/
```

### 2. Installation

```bash
npm install
```

### 3. Development Server starten

```bash
npm start
```

Dies startet den Development Server auf `https://localhost:8080`

### 4. In Power BI laden

1. Öffne Power BI Desktop
2. Gehe zu **Visualizations** Pane
3. Klicke auf **...**  → **Get more visuals** → **Import from file**
4. Oder während npm start läuft:
   - Aktiviere Developer Mode
   - Das Visual erscheint automatisch

### 5. Visual package erstellen

```bash
npm run package
```

Dies erstellt eine `.pbiviz` Datei im `dist/` Ordner.

## 📊 Erste Schritte mit Daten

### Minimales Setup

1. **Drag & Drop Felder:**
   - **Bar Category** → Ihre Hauptkategorien (z.B. Produktkategorie)
   - **Segment Category** → Ihre Segmente (z.B. Region)
   - **Segment Value** → Ihre Werte (z.B. Umsatz)
   - **Bar Width Value** → Breite der Balken (z.B. Marktanteil)

2. **Labels aktivieren:**
   - Format Pane → **Data Labels**
   - Toggle **Show** → ON
   - Wähle **Label Content** → z.B. "Amount"

### Erweitertes Setup mit Top-N

1. **Top-N aktivieren:**
   - Format Pane → **X-Axis**
   - Toggle **Enable Top N** → ON
   - Setze **Top N Count** → 10
   - Toggle **Show Other Category** → ON

2. **Labels optimieren:**
   - Format Pane → **Data Labels**
   - Wähle **Label Content** → "Category (Amount | % of Total)"
   - Toggle **Auto Hide Small Segments** → ON
   - Setze **Min Segment Threshold** → 0.03

## 🎨 Beliebte Konfigurationen

### Konfiguration 1: Marktanteil Dashboard

```
Data Fields:
- Bar Category: Produktkategorie
- Segment Category: Region
- Segment Value: Umsatz
- Bar Width Value: Marktanteil

Settings:
- X-Axis Sort By: Width Value (Descending)
- Enable Top N: ON (10)
- Show Other Category: ON
- Label Content: Category (% of Total)
- Auto Hide: ON (Threshold: 0.05)
```

### Konfiguration 2: Budget Übersicht

```
Data Fields:
- Bar Category: Abteilung
- Segment Category: Kostenstelle
- Segment Value: Kosten
- Bar Width Value: Budget

Settings:
- X-Axis Sort By: Alphabetical
- Show Bar Totals: ON
- Label Content: Amount | % of Total
- Position: Inside Center
```

### Konfiguration 3: Verkaufs-Performance

```
Data Fields:
- Bar Category: Verkäufer
- Segment Category: Produktgruppe
- Segment Value: Verkaufswert
- Bar Width Value: Verkaufsvolumen

Settings:
- Enable Top N: ON (15)
- Sort By: Width Value
- Label Content: Category (Amount)
- Auto Hide: ON (Threshold: 0.02)
```

## 🔧 Typische Anpassungen

### Label-Formatierung ändern

```typescript
// In Format Pane
Data Labels:
  - Label Content: "Category (Amount | % of Total)"
  - Display Units: Thousands (K)
  - Decimal Places: 1
  - Font Size: 11
  - Color: White
```

### Sortierung anpassen

```typescript
// In Format Pane
X-Axis:
  - Sort By: "Width Value (Descending)"
  // Oder für alphabetische Sortierung:
  - Sort By: "Alphabetical"
```

### Top-N optimieren für Performance

```typescript
// Für große Datasets (>100 Kategorien)
X-Axis:
  - Enable Top N: ON
  - Top N Count: 20
  - Show Other Category: ON
  - Other Category Label: "Andere"

Data Labels:
  - Auto Hide Small Segments: ON
  - Min Segment Threshold: 0.05
```

## ⚡ Performance-Tipps

### Bei vielen Kategorien (>50)

1. Aktiviere Top-N mit 10-20 Kategorien
2. Erhöhe Min Segment Threshold auf 0.05
3. Nutze "Auto Hide Small Segments"

### Bei vielen Datenpunkten (>5000)

1. Filtere Daten auf Power BI Ebene
2. Verwende DAX Measures statt berechnete Spalten
3. Aktiviere Top-N Filter

### Bei Performance-Problemen

1. Deaktiviere "Force Display" bei Labels
2. Reduziere Anzahl der sichtbaren Kategorien
3. Vereinfache Label Content (z.B. nur "Amount")

## 🐛 Häufige Probleme

### Problem: Labels werden nicht angezeigt

**Lösung:**
```
1. Prüfe ob "Show" in Data Labels aktiviert ist
2. Deaktiviere "Auto Hide Small Segments"
3. Reduziere "Min Segment Threshold" auf 0.01
4. Erhöhe Font Size
```

### Problem: "Other" Kategorie fehlt

**Lösung:**
```
1. Prüfe: Enable Top N = ON
2. Prüfe: Show Other Category = ON
3. Stelle sicher: Top N Count < Anzahl Kategorien
```

### Problem: Falsche Sortierung

**Lösung:**
```
1. Prüfe "Sort By" Einstellung in X-Axis
2. Bei "Custom": Stelle sicher Custom Sort Feld ist gemapped
3. Bei "Width Value": Prüfe ob Width Values korrekt sind
```

### Problem: Visual lädt nicht

**Lösung:**
```
1. npm install --force
2. Lösche node_modules und package-lock.json
3. npm install
4. npm start
```

## 📚 Weitere Ressourcen

- **Vollständige Dokumentation:** `ENHANCED_FEATURES.md`
- **Implementierungs-Details:** `IMPLEMENTATION.md`
- **Code-Dokumentation:** Siehe Kommentare in `.ts` Dateien

## ✉️ Support

Bei Problemen:
1. Prüfe Console auf Fehler (F12 in Power BI Desktop)
2. Schaue in die Dokumentation
3. Erstelle Issue auf GitHub mit:
   - Fehlerbeschreibung
   - Screenshots
   - Console Logs
   - Daten-Schema (anonymisiert)

## 📝 Changelog

### Version 4.0.0

**Neue Features:**
- ✅ 9 Label Content Modes
- ✅ Top-N mit "Other" Aggregation
- ✅ 3 Sortierungs-Modi
- ✅ Auto-Hide für kleine Segmente
- ✅ Bar Totals Anzeige
- ✅ Custom Label Support

**Performance:**
- ✅ Optimiert für 2000-5000 Datenpunkte
- ✅ Auto-Hide reduziert Rendering-Last
- ✅ Top-N Filter verhindert Überlastung

## 🎯 Best Practices

1. **Nutze Top-N** ab 30+ Kategorien
2. **Auto-Hide aktivieren** für bessere Lesbarkeit
3. **Aussagekräftige Labels** wählen (z.B. mit Kategorie-Namen)
4. **Sortierung** an Usecase anpassen
5. **Threshold** an Daten anpassen (kleine Werte → kleiner Threshold)

---

**Viel Erfolg mit dem Enhanced Mekko Chart! 🎉**
