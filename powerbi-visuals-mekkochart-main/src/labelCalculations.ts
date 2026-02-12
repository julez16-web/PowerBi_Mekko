/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import { MekkoChartColumnDataPoint } from "./dataInterfaces";

export enum LabelContentMode {
    Amount = "amount",
    PercentOfTotal = "percentOfTotal",
    PercentWithinBar = "percentWithinBar",
    AmountAndPercent = "amountAndPercent",
    CategoryAmount = "categoryAmount",
    CategoryPercentTotal = "categoryPercentTotal",
    CategoryPercentBar = "categoryPercentBar",
    CategoryAmountAndPercent = "categoryAmountAndPercent",
    Custom = "custom"
}

export interface LabelCalculationContext {
    dataPoint: MekkoChartColumnDataPoint;
    categoryName: string;
    grandTotal: number;
    barTotal: number;
    customLabelText?: string;
    displayUnits: number;
    precision: number;
    formatString?: string;
}

export class LabelCalculations {
    /**
     * Calculate the label text based on the content mode
     */
    public static calculateLabelText(
        context: LabelCalculationContext,
        contentMode: LabelContentMode
    ): string {
        const {
            dataPoint,
            categoryName,
            grandTotal,
            barTotal,
            customLabelText,
            displayUnits,
            precision,
            formatString
        } = context;

        // Use valueOriginal for absolute amounts (raw data value),
        // NOT valueAbsolute which is normalized (0..1) in 100%-stacked mode
        const rawOriginal = dataPoint.valueOriginal;
        const rawAbsolute = dataPoint.valueAbsolute;
        const rawValue = dataPoint.value;
        const amount = Math.abs(rawOriginal ?? rawAbsolute ?? rawValue ?? 0);

        // Debug: trace which value source is being used for the label
        console.log(`[LabelCalc] contentMode=${contentMode}, valueOriginal=${rawOriginal}, valueAbsolute=${rawAbsolute}, value=${rawValue}, amount=${amount}, displayUnits=${displayUnits}, format=${formatString}`);
        const percentTotal = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;
        const percentBar = barTotal > 0 ? (amount / barTotal) * 100 : 0;

        // Create formatters
        const amountFormatter = valueFormatter.create({
            format: formatString,
            value: displayUnits,
            precision: precision,
            allowFormatBeautification: true
        });

        const percentFormatter = valueFormatter.create({
            format: "0.##\\%",
            value: 1,
            precision: precision
        });

        switch (contentMode) {
            case LabelContentMode.Amount:
                return amountFormatter.format(amount);

            case LabelContentMode.PercentOfTotal:
                return percentFormatter.format(percentTotal / 100);

            case LabelContentMode.PercentWithinBar:
                return percentFormatter.format(percentBar / 100);

            case LabelContentMode.AmountAndPercent:
                return `${amountFormatter.format(amount)} | ${percentFormatter.format(percentTotal / 100)}`;

            case LabelContentMode.CategoryAmount:
                return `${categoryName} (${amountFormatter.format(amount)})`;

            case LabelContentMode.CategoryPercentTotal:
                return `${categoryName} (${percentFormatter.format(percentTotal / 100)})`;

            case LabelContentMode.CategoryPercentBar:
                return `${categoryName} (${percentFormatter.format(percentBar / 100)})`;

            case LabelContentMode.CategoryAmountAndPercent:
                return `${categoryName} (${amountFormatter.format(amount)} | ${percentFormatter.format(percentTotal / 100)})`;

            case LabelContentMode.Custom:
                return customLabelText || amountFormatter.format(amount);

            default:
                return amountFormatter.format(amount);
        }
    }

    /**
     * Calculate grand total from all data points
     */
    public static calculateGrandTotal(dataPoints: MekkoChartColumnDataPoint[]): number {
        return dataPoints.reduce((sum, dp) => {
            return sum + (dp.valueAbsolute || dp.value || 0);
        }, 0);
    }

    /**
     * Calculate total for a specific bar/category
     */
    public static calculateBarTotal(
        dataPoints: MekkoChartColumnDataPoint[],
        categoryIndex: number
    ): number {
        return dataPoints
            .filter(dp => dp.categoryIndex === categoryIndex)
            .reduce((sum, dp) => {
                return sum + (dp.valueAbsolute || dp.value || 0);
            }, 0);
    }

    /**
     * Calculate totals for all categories
     */
    public static calculateCategoryTotals(
        dataPoints: MekkoChartColumnDataPoint[]
    ): Map<number, number> {
        const totals = new Map<number, number>();
        
        dataPoints.forEach(dp => {
            const current = totals.get(dp.categoryIndex) || 0;
            totals.set(dp.categoryIndex, current + (dp.valueAbsolute || dp.value || 0));
        });

        return totals;
    }

    /**
     * Determine if a label should be shown based on segment size
     */
    public static shouldShowLabel(
        dataPoint: MekkoChartColumnDataPoint,
        autoHide: boolean,
        threshold: number,
        barTotal: number,
        forceDisplay: boolean
    ): boolean {
        if (forceDisplay) {
            return true;
        }

        if (!autoHide) {
            return true;
        }

        const segmentValue = dataPoint.valueAbsolute || dataPoint.value || 0;
        const percentOfBar = barTotal > 0 ? segmentValue / barTotal : 0;

        return percentOfBar >= threshold;
    }

    /**
     * Format percentage value
     */
    public static formatPercentage(value: number, precision: number = 1): string {
        const formatter = valueFormatter.create({
            format: "0.##\\%",
            value: 1,
            precision: precision
        });
        return formatter.format(value);
    }

    /**
     * Get segment percentage of total
     */
    public static getPercentOfTotal(
        segmentValue: number,
        grandTotal: number
    ): number {
        return grandTotal > 0 ? (segmentValue / grandTotal) * 100 : 0;
    }

    /**
     * Get segment percentage within bar
     */
    public static getPercentWithinBar(
        segmentValue: number,
        barTotal: number
    ): number {
        return barTotal > 0 ? (segmentValue / barTotal) * 100 : 0;
    }
}
