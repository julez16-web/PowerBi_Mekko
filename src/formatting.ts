/**
 * Number formatting utilities for labels.
 * Handles display units (k/M/B), decimal places, currency symbols,
 * and thousand separators.
 */

import { DisplayUnits, LabelContentMode, SegmentLabelSettings, BarTotalSettings, TotalLabelFormat } from "./settings";
import { MekkoSegment, MekkoBar } from "./dataModel";

/**
 * Format a numeric value according to the display unit settings.
 */
export function formatAmount(
    value: number,
    displayUnits: DisplayUnits,
    decimalPlaces: number,
    currencySymbol: string,
): string {
    let divisor = 1;
    let suffix = "";

    switch (displayUnits) {
        case "auto":
            if (Math.abs(value) >= 1_000_000_000) {
                divisor = 1_000_000_000;
                suffix = "B";
            } else if (Math.abs(value) >= 1_000_000) {
                divisor = 1_000_000;
                suffix = "M";
            } else if (Math.abs(value) >= 10_000) {
                divisor = 1_000;
                suffix = "k";
            }
            break;
        case "thousands":
            divisor = 1_000;
            suffix = "k";
            break;
        case "millions":
            divisor = 1_000_000;
            suffix = "M";
            break;
        case "billions":
            divisor = 1_000_000_000;
            suffix = "B";
            break;
        case "none":
        default:
            break;
    }

    const scaled = value / divisor;
    const formatted = formatWithThousandsSeparator(scaled, decimalPlaces);
    const prefix = currencySymbol ? `${currencySymbol} ` : "";
    return `${prefix}${formatted}${suffix}`;
}

/**
 * Format a number with thousand separators and fixed decimal places.
 */
function formatWithThousandsSeparator(value: number, decimalPlaces: number): string {
    const fixed = value.toFixed(decimalPlaces);
    const parts = fixed.split(".");
    // Add thousand separators to integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

/**
 * Format a percentage value.
 */
export function formatPercent(value: number, decimalPlaces: number): string {
    return `${(value * 100).toFixed(decimalPlaces)}%`;
}

/**
 * Build the label text for a segment based on the label content mode.
 */
export function buildSegmentLabel(
    segment: MekkoSegment,
    _bar: MekkoBar,
    settings: SegmentLabelSettings,
): string {
    const { labelContentMode, decimalPlaces, displayUnits, currencySymbol } = settings;
    const amt = formatAmount(segment.absoluteValue, displayUnits, decimalPlaces, currencySymbol);
    const pctTotal = formatPercent(segment.percentOfTotal, decimalPlaces);
    const pctBar = formatPercent(segment.percentOfBar, decimalPlaces);
    const cat = segment.seriesName;

    switch (labelContentMode as LabelContentMode) {
        case "amount":
            return amt;
        case "percentTotal":
            return pctTotal;
        case "percentBar":
            return pctBar;
        case "amountPercentTotal":
            return `${amt} | ${pctTotal}`;
        case "categoryAmount":
            return `${cat} (${amt})`;
        case "categoryPercentTotal":
            return `${cat} (${pctTotal})`;
        case "categoryPercentBar":
            return `${cat} (${pctBar})`;
        case "categoryAmountPercentTotal":
            return `${cat} (${amt} | ${pctTotal})`;
        default:
            return amt;
    }
}

/**
 * Build the label text for a bar total.
 */
export function buildBarTotalLabel(
    bar: MekkoBar,
    settings: BarTotalSettings,
): string {
    const { totalLabelFormat, decimalPlaces, displayUnits, currencySymbol } = settings;
    const amt = formatAmount(bar.barTotal, displayUnits, decimalPlaces, currencySymbol);

    switch (totalLabelFormat as TotalLabelFormat) {
        case "amount":
            return amt;
        case "amountPercentTotal":
            return `${amt} | ${formatPercent(bar.barPercentOfTotal, decimalPlaces)}`;
        default:
            return amt;
    }
}
