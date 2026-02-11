# Enhanced Mekko Chart - Custom Power BI Visual

## Neue Features

### 1. Dynamisches Label-System

Das Visual unterstützt jetzt flexible Label-Darstellungen:

#### Label Content Modes

- **Amount**: Zeigt den absoluten Wert
- **% of Total**: Zeigt den Prozentsatz vom Gesamtwert
- **% within Bar**: Zeigt den Prozentsatz innerhalb des Balkens
- **Amount | % of Total**: Kombiniert Betrag und Gesamtprozent
- **Category (Amount)**: Kategoriename mit Betrag in Klammern
- **Category (% of Total)**: Kategoriename mit Gesamtprozent in Klammern
- **Category (% within Bar)**: Kategoriename mit Balkenprozent in Klammern
- **Category (Amount | % of Total)**: Kategoriename mit kombinierter Anzeige
- **Custom**: Verwendet ein benutzerdefiniertes Measure-Feld

#### Label-Einstellungen

```typescript
{
  show: boolean,                    // Labels anzeigen
  contentMode: string,               // Siehe Content Modes oben
  position: string,                  // "insideCenter" | "insideEnd" | "outsideEnd"
  autoHideSmallSegments: boolean,    // Kleine Segmente automatisch ausblenden
  minSegmentThreshold: number,       // Schwellenwert (0-1) für Auto-Hide
  forceDisplay: boolean,             // Labels auch bei Überlappung anzeigen
  displayUnits: number,              // Anzeigeeinheiten
  labelPrecision: number,            // Dezimalstellen
  color: string,                     // Label-Farbe
  fontSize: number,                  // Schriftgröße
  fontFamily: string                 // Schriftart
}
```

### 2. Top-N Funktionalität

Filtert und aggregiert Kategorien:

#### Einstellungen

```typescript
{
  enableTopN: boolean,              // Top-N aktivieren
  topNCount: number,                // Anzahl der Top-Kategorien (1-100)
  showOtherCategory: boolean,       // "Other"-Kategorie anzeigen
  otherCategoryLabel: string        // Label für "Other" (Standard: "Other")
}
```

#### Funktionsweise

1. Kategorien werden nach `widthValue` sortiert (absteigend)
2. Die Top-N Kategorien werden angezeigt
3. Verbleibende Kategorien werden zu "Other" aggregiert
4. "Other" wird als zusätzlicher Balken dargestellt

### 3. Erweiterte Sortierung

#### Sort-Modi

- **Width Value (Descending)**: Sortiert nach Balkenbreite (größte zuerst)
- **Alphabetical**: Sortiert alphabetisch nach Kategoriename
- **Custom Order**: Verwendet ein benutzerdefiniertes Sortierfeld

#### Bar Totals

Option zum Anzeigen von Gesamtsummen pro Balken auf der X-Achse.

### 4. Datenrollen

#### Erforderlich

- **Bar Category**: Die Hauptkategorien (Balken)
- **Segment Category**: Die Segmente innerhalb der Balken
- **Segment Value**: Die Werte für jedes Segment
- **Bar Width Value**: Die Breite jedes Balkens

#### Optional

- **Custom Label Text**: Benutzerdefinierter Text für Labels
- **Tooltip Fields**: Zusätzliche Felder für Tooltips
- **Category Sorting**: Feld für benutzerdefinierte Sortierung

## Verwendung

### Basis-Setup

1. Fügen Sie das Visual zu Power BI hinzu
2. Ziehen Sie Felder in die entsprechenden Data Roles:
   - `Bar Category`: z.B. Produktkategorie
   - `Segment Category`: z.B. Region
   - `Segment Value`: z.B. Umsatz
   - `Bar Width Value`: z.B. Marktanteil

### Label-Konfiguration

1. Öffnen Sie das Format-Panel
2. Navigieren Sie zu "Data Labels"
3. Aktivieren Sie "Show"
4. Wählen Sie "Label Content" aus dem Dropdown
5. Passen Sie weitere Optionen an (Position, Farbe, etc.)

### Top-N Aktivierung

1. Öffnen Sie das Format-Panel
2. Navigieren Sie zu "X-Axis"
3. Aktivieren Sie "Enable Top N"
4. Setzen Sie "Top N Count" (z.B. 10)
5. Optional: Aktivieren Sie "Show Other Category"

### Sortierung

1. Öffnen Sie das Format-Panel
2. Navigieren Sie zu "X-Axis"
3. Wählen Sie "Sort By":
   - "Width Value" für größte Balken zuerst
   - "Alphabetical" für alphabetische Sortierung
   - "Custom Order" wenn Sie ein Sortierfeld haben

## Performance-Hinweise

### Optimale Performance

- **2.000 - 5.000 Datenpunkte**: Optimaler Bereich
- **< 30 Kategorien**: Empfohlen ohne Top-N
- **> 30 Kategorien**: Top-N verwenden

### Bei großen Datasets

1. Aktivieren Sie Top-N (empfohlen: 10-20)
2. Verwenden Sie "Auto Hide Small Segments"
3. Setzen Sie einen höheren Threshold (z.B. 0.05)

## Berechnungen

### Interne Berechnungen

Das Visual berechnet automatisch:

```typescript
// Prozent vom Gesamtwert
percentOfTotal = segmentValue / grandTotal * 100

// Prozent innerhalb des Balkens
percentWithinBar = segmentValue / barTotal * 100

// Balkensumme
barTotal = sum(segmentValues for categoryIndex)

// Gesamtsumme
grandTotal = sum(all segmentValues)
```

### DAX-Measures (Optional)

Sie können diese Berechnungen auch als DAX-Measures bereitstellen:

```dax
WidthValue = 
    [YourMeasure]

SegmentValue = 
    SUM(YourTable[Amount])

PctTotal = 
    DIVIDE(
        [SegmentValue],
        CALCULATE([SegmentValue], ALL(YourTable[Segment])),
        0
    )

PctWithinBar = 
    DIVIDE(
        [SegmentValue],
        CALCULATE([SegmentValue], ALLEXCEPT(YourTable, YourTable[Category])),
        0
    )

CustomLabel = 
    YourTable[Category] & " (" & 
    FORMAT([SegmentValue], "#,##0") & " | " &
    FORMAT([PctTotal], "0.0%") & ")"
```

## Interaktivität

### Cross-Filtering

- Klicken Sie auf ein Segment, um andere Visuals zu filtern
- Ctrl+Klick für Mehrfachauswahl
- Funktioniert mit allen Power BI Filter-Interaktionen

### Drill-Down

- Unterstützt Hierarchien in "Bar Category"
- Aktivieren Sie Drill-Mode in der Symbolleiste
- Klicken Sie auf Balken zum Drill-Down/Up

### Tooltips

- Standard-Tooltips zeigen alle relevanten Werte
- Unterstützt Tooltip Pages
- Zusätzliche Felder via "Tooltip Fields" Role

## Export

### Show as Table

Das Visual unterstützt "Show as Table":
- Zeigt alle Rohdaten in tabellarischer Form
- Inklusive berechneter Werte

### Export Underlying Data

- Exportiert alle Daten als CSV/Excel
- Inklusive aller Berechnungen

## Technische Details

### Dateien

- `labelCalculations.ts`: Label-Berechnungs-Logik
- `topNUtils.ts`: Top-N und Sortierungs-Logik
- `capabilities.json`: Visual-Konfiguration (erweitert)
- `settings.ts`: Format-Panel Einstellungen (erweitert)

### Dependencies

- Power BI Visual API 5.11.0
- D3.js (Rendering)
- powerbi-visuals-utils-* (Standard-Utils)

## Troubleshooting

### Labels werden nicht angezeigt

1. Prüfen Sie, ob "Show" aktiviert ist
2. Prüfen Sie "Auto Hide" Einstellungen
3. Deaktivieren Sie temporär "Auto Hide"
4. Erhöhen Sie die Schriftgröße

### Top-N funktioniert nicht

1. Prüfen Sie, ob "Enable Top N" aktiviert ist
2. Stellen Sie sicher, dass Top N < Anzahl Kategorien
3. Prüfen Sie die Sortierung

### Performance-Probleme

1. Reduzieren Sie die Anzahl der Kategorien
2. Aktivieren Sie Top-N
3. Erhöhen Sie den "Min Segment Threshold"
4. Deaktivieren Sie "Force Display"

## Changelog

### Version 4.0.0 (Enhanced)

**Neue Features:**
- Dynamisches Label-System mit 9 Content Modes
- Top-N Funktionalität mit "Other" Aggregation
- Erweiterte Sortierungsoptionen
- Auto-Hide für kleine Segmente
- Bar Totals Anzeige
- Custom Label Text Support
- Verbesserte Performance bei großen Datasets

**Verbesserte Features:**
- Optimierte Label-Positionierung
- Besseres Collision Handling
- Erweiterte Tooltip-Unterstützung

## Support

Bei Problemen oder Fragen:
1. Prüfen Sie diese Dokumentation
2. Schauen Sie in die Beispiel-Dashboards
3. Erstellen Sie ein Issue auf GitHub

## Lizenz

MIT License - Copyright (c) Microsoft Corporation
