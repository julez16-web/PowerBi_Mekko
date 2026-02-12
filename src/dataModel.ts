/**
 * Data model for the Mekko Chart.
 * Converts Power BI DataView (matrix) into a structured model
 * that preserves absolute values for labeling while supporting
 * 100%-stacked (normalized) rendering.
 */

export interface MekkoSegment {
    /** Series / legend name (e.g. Cost Element main category) */
    seriesName: string;
    /** Absolute numeric value from the data */
    absoluteValue: number;
    /** Value as fraction of bar total (0-1) */
    percentOfBar: number;
    /** Value as fraction of grand total (0-1) */
    percentOfTotal: number;
    /** Color assigned to this series */
    color: string;
    /** Selection identity for interactivity */
    selectionId: powerbi.visuals.ISelectionId | null;
}

export interface MekkoBar {
    /** Category name (e.g. PDC, MAT-OTH, PDOH) */
    categoryName: string;
    /** Absolute total for this bar (sum of segment absolute values) */
    barTotal: number;
    /** Bar total as fraction of grand total */
    barPercentOfTotal: number;
    /** Bar width as fraction of total width (proportional to barTotal) */
    barWidthFraction: number;
    /** Segments stacked within this bar */
    segments: MekkoSegment[];
}

export interface MekkoDataModel {
    /** All bars (one per category) */
    bars: MekkoBar[];
    /** All unique series names (for legend) */
    seriesNames: string[];
    /** Color per series name */
    seriesColors: Map<string, string>;
    /** Grand total across all bars/segments */
    grandTotal: number;
    /** Whether data is available */
    hasData: boolean;
}

/** Default color palette fallback */
const DEFAULT_COLORS: string[] = [
    "#01B8AA", "#374649", "#FD625E", "#F2C80F", "#5F6B6D",
    "#8AD4EB", "#FE9666", "#A66999", "#3599B8", "#DFBFBF",
    "#4AC5BB", "#5F6B6D", "#FB8281", "#F4D25A", "#7F898A",
];

/**
 * Convert a Power BI matrix DataView into our MekkoDataModel.
 * This extracts absolute values regardless of how the visual renders (normalized).
 */
export function convertDataView(
    dataView: powerbi.DataView | undefined,
    host: powerbi.extensibility.visual.IVisualHost,
): MekkoDataModel {
    const emptyModel: MekkoDataModel = {
        bars: [],
        seriesNames: [],
        seriesColors: new Map(),
        grandTotal: 0,
        hasData: false,
    };

    if (!dataView?.matrix?.rows?.root?.children?.length) {
        return emptyModel;
    }

    const matrix = dataView.matrix;
    const rowChildren = matrix.rows.root.children!;
    const colChildren = matrix.columns.root.children ?? [];

    // Build series names and colors from column hierarchy
    const seriesNames: string[] = [];
    const seriesColors = new Map<string, string>();
    const colorPalette = host.colorPalette;

    for (let ci = 0; ci < colChildren.length; ci++) {
        const colNode = colChildren[ci];
        const name = String(colNode.value ?? `Series ${ci}`);
        seriesNames.push(name);

        // Use Power BI's built-in color palette for each series
        const color = colorPalette
            ? colorPalette.getColor(name).value
            : DEFAULT_COLORS[ci % DEFAULT_COLORS.length];
        seriesColors.set(name, color);
    }

    // First pass: collect all bars and compute grand total
    let grandTotal = 0;
    const rawBars: Array<{ categoryName: string; segments: Array<{ seriesName: string; value: number; selectionId: powerbi.visuals.ISelectionId | null }> }> = [];

    for (const rowNode of rowChildren) {
        const categoryName = String(rowNode.value ?? "");
        const segments: Array<{ seriesName: string; value: number; selectionId: powerbi.visuals.ISelectionId | null }> = [];

        if (rowNode.values) {
            // Matrix values are keyed by column index
            for (let ci = 0; ci < seriesNames.length; ci++) {
                const valueEntry = rowNode.values[ci];
                const val = valueEntry?.value;
                const numericVal = typeof val === "number" ? val : 0;

                // Build selection ID for cross-filtering
                let selectionId: powerbi.visuals.ISelectionId | null = null;
                try {
                    selectionId = host.createSelectionIdBuilder()
                        .withMatrixNode(rowNode, matrix.rows.levels)
                        .createSelectionId() as powerbi.visuals.ISelectionId;
                } catch {
                    // Selection ID creation may fail in some contexts
                }

                segments.push({
                    seriesName: seriesNames[ci],
                    value: numericVal,
                    selectionId,
                });

                grandTotal += numericVal;
            }
        }

        rawBars.push({ categoryName, segments });
    }

    // Second pass: compute percentages and bar totals
    const bars: MekkoBar[] = rawBars.map((raw) => {
        const barTotal = raw.segments.reduce((sum, s) => sum + s.value, 0);

        const segments: MekkoSegment[] = raw.segments.map((s) => ({
            seriesName: s.seriesName,
            absoluteValue: s.value,
            percentOfBar: barTotal > 0 ? s.value / barTotal : 0,
            percentOfTotal: grandTotal > 0 ? s.value / grandTotal : 0,
            color: seriesColors.get(s.seriesName) ?? "#999999",
            selectionId: s.selectionId,
        }));

        return {
            categoryName: raw.categoryName,
            barTotal,
            barPercentOfTotal: grandTotal > 0 ? barTotal / grandTotal : 0,
            barWidthFraction: grandTotal > 0 ? barTotal / grandTotal : 1 / rawBars.length,
            segments,
        };
    });

    return {
        bars,
        seriesNames,
        seriesColors,
        grandTotal,
        hasData: bars.length > 0,
    };
}
