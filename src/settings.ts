/**
 * Settings classes for the Mekko Chart visual.
 * Maps to capabilities.json objects for the Power BI format panel.
 */

export type LabelContentMode =
    | "amount"
    | "percentTotal"
    | "percentBar"
    | "amountPercentTotal"
    | "categoryAmount"
    | "categoryPercentTotal"
    | "categoryPercentBar"
    | "categoryAmountPercentTotal";

export type LabelPosition = "inside" | "outside" | "centered";

export type DisplayUnits = "auto" | "none" | "thousands" | "millions" | "billions";

export type TotalLabelFormat = "amount" | "amountPercentTotal";

export type LegendPosition = "top" | "bottom" | "left" | "right";

export interface SegmentLabelSettings {
    show: boolean;
    labelContentMode: LabelContentMode;
    labelPosition: LabelPosition;
    fontSize: number;
    fontColor: string;
    decimalPlaces: number;
    displayUnits: DisplayUnits;
    currencySymbol: string;
    minThreshold: number;
}

export interface BarTotalSettings {
    show: boolean;
    totalLabelFormat: TotalLabelFormat;
    fontSize: number;
    fontColor: string;
    decimalPlaces: number;
    displayUnits: DisplayUnits;
    currencySymbol: string;
}

export interface LegendSettings {
    show: boolean;
    position: LegendPosition;
    fontSize: number;
}

export interface CategoryAxisSettings {
    show: boolean;
    fontSize: number;
    fontColor: string;
}

export interface MekkoSettings {
    segmentLabels: SegmentLabelSettings;
    barTotals: BarTotalSettings;
    legend: LegendSettings;
    categoryAxis: CategoryAxisSettings;
}

export const DEFAULT_SETTINGS: MekkoSettings = {
    segmentLabels: {
        show: true,
        labelContentMode: "amount",
        labelPosition: "inside",
        fontSize: 9,
        fontColor: "#333333",
        decimalPlaces: 0,
        displayUnits: "auto",
        currencySymbol: "",
        minThreshold: 3,
    },
    barTotals: {
        show: true,
        totalLabelFormat: "amount",
        fontSize: 10,
        fontColor: "#333333",
        decimalPlaces: 0,
        displayUnits: "auto",
        currencySymbol: "",
    },
    legend: {
        show: true,
        position: "top",
        fontSize: 10,
    },
    categoryAxis: {
        show: true,
        fontSize: 10,
        fontColor: "#333333",
    },
};

/**
 * Parse settings from a Power BI DataView objects map.
 */
export function parseSettings(objects: powerbi.DataViewObjects | undefined): MekkoSettings {
    if (!objects) {
        return { ...DEFAULT_SETTINGS };
    }

    return {
        segmentLabels: parseSegmentLabelSettings(objects),
        barTotals: parseBarTotalSettings(objects),
        legend: parseLegendSettings(objects),
        categoryAxis: parseCategoryAxisSettings(objects),
    };
}

function getObjectValue<T>(objects: powerbi.DataViewObjects, objectName: string, propertyName: string, defaultValue: T): T {
    const obj = objects[objectName];
    if (!obj) return defaultValue;
    const prop = (obj as Record<string, unknown>)[propertyName];
    if (prop === undefined || prop === null) return defaultValue;
    return prop as T;
}

function getFillColor(objects: powerbi.DataViewObjects, objectName: string, propertyName: string, defaultValue: string): string {
    const obj = objects[objectName];
    if (!obj) return defaultValue;
    const prop = (obj as Record<string, unknown>)[propertyName];
    if (!prop) return defaultValue;
    const fill = prop as { solid?: { color?: string } };
    return fill?.solid?.color ?? defaultValue;
}

function parseSegmentLabelSettings(objects: powerbi.DataViewObjects): SegmentLabelSettings {
    const d = DEFAULT_SETTINGS.segmentLabels;
    return {
        show: getObjectValue(objects, "segmentLabels", "show", d.show),
        labelContentMode: getObjectValue(objects, "segmentLabels", "labelContentMode", d.labelContentMode),
        labelPosition: getObjectValue(objects, "segmentLabels", "labelPosition", d.labelPosition),
        fontSize: getObjectValue(objects, "segmentLabels", "fontSize", d.fontSize),
        fontColor: getFillColor(objects, "segmentLabels", "fontColor", d.fontColor),
        decimalPlaces: getObjectValue(objects, "segmentLabels", "decimalPlaces", d.decimalPlaces),
        displayUnits: getObjectValue(objects, "segmentLabels", "displayUnits", d.displayUnits),
        currencySymbol: getObjectValue(objects, "segmentLabels", "currencySymbol", d.currencySymbol),
        minThreshold: getObjectValue(objects, "segmentLabels", "minThreshold", d.minThreshold),
    };
}

function parseBarTotalSettings(objects: powerbi.DataViewObjects): BarTotalSettings {
    const d = DEFAULT_SETTINGS.barTotals;
    return {
        show: getObjectValue(objects, "barTotals", "show", d.show),
        totalLabelFormat: getObjectValue(objects, "barTotals", "totalLabelFormat", d.totalLabelFormat),
        fontSize: getObjectValue(objects, "barTotals", "fontSize", d.fontSize),
        fontColor: getFillColor(objects, "barTotals", "fontColor", d.fontColor),
        decimalPlaces: getObjectValue(objects, "barTotals", "decimalPlaces", d.decimalPlaces),
        displayUnits: getObjectValue(objects, "barTotals", "displayUnits", d.displayUnits),
        currencySymbol: getObjectValue(objects, "barTotals", "currencySymbol", d.currencySymbol),
    };
}

function parseLegendSettings(objects: powerbi.DataViewObjects): LegendSettings {
    const d = DEFAULT_SETTINGS.legend;
    return {
        show: getObjectValue(objects, "legend", "show", d.show),
        position: getObjectValue(objects, "legend", "position", d.position),
        fontSize: getObjectValue(objects, "legend", "fontSize", d.fontSize),
    };
}

function parseCategoryAxisSettings(objects: powerbi.DataViewObjects): CategoryAxisSettings {
    const d = DEFAULT_SETTINGS.categoryAxis;
    return {
        show: getObjectValue(objects, "categoryAxis", "show", d.show),
        fontSize: getObjectValue(objects, "categoryAxis", "fontSize", d.fontSize),
        fontColor: getFillColor(objects, "categoryAxis", "fontColor", d.fontColor),
    };
}
