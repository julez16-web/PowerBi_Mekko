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

import powerbi from "powerbi-visuals-api";
import PrimitiveValue = powerbi.PrimitiveValue;

export enum SortByMode {
    WidthValue = "widthValue",
    Alphabetical = "alphabetical",
    Custom = "custom"
}

export interface CategoryData {
    category: PrimitiveValue;
    categoryIndex: number;
    widthValue: number;
    totalValue: number;
    customSortValue?: PrimitiveValue;
}

export interface TopNResult {
    topCategories: CategoryData[];
    otherCategory?: CategoryData;
    shouldShowOther: boolean;
}

export class TopNUtils {
    /**
     * Sort categories based on the specified mode
     */
    public static sortCategories(
        categories: CategoryData[],
        sortMode: SortByMode
    ): CategoryData[] {
        const sorted = [...categories];

        switch (sortMode) {
            case SortByMode.WidthValue:
                return sorted.sort((a, b) => b.widthValue - a.widthValue);

            case SortByMode.Alphabetical:
                return sorted.sort((a, b) => {
                    const aStr = String(a.category);
                    const bStr = String(b.category);
                    return aStr.localeCompare(bStr);
                });

            case SortByMode.Custom:
                return sorted.sort((a, b) => {
                    if (a.customSortValue === undefined || b.customSortValue === undefined) {
                        return 0;
                    }
                    if (typeof a.customSortValue === 'number' && typeof b.customSortValue === 'number') {
                        return a.customSortValue - b.customSortValue;
                    }
                    return String(a.customSortValue).localeCompare(String(b.customSortValue));
                });

            default:
                return sorted;
        }
    }

    /**
     * Apply Top-N filtering
     */
    public static applyTopN(
        categories: CategoryData[],
        topN: number,
        showOther: boolean,
        otherLabel: string = "Other"
    ): TopNResult {
        if (categories.length <= topN) {
            return {
                topCategories: categories,
                shouldShowOther: false
            };
        }

        const topCategories = categories.slice(0, topN);
        const remainingCategories = categories.slice(topN);

        if (!showOther || remainingCategories.length === 0) {
            return {
                topCategories: topCategories,
                shouldShowOther: false
            };
        }

        // Aggregate "Other" category
        const otherWidthValue = remainingCategories.reduce(
            (sum, cat) => sum + cat.widthValue,
            0
        );
        const otherTotalValue = remainingCategories.reduce(
            (sum, cat) => sum + cat.totalValue,
            0
        );

        const otherCategory: CategoryData = {
            category: otherLabel,
            categoryIndex: -1, // Special index for "Other"
            widthValue: otherWidthValue,
            totalValue: otherTotalValue
        };

        return {
            topCategories: topCategories,
            otherCategory: otherCategory,
            shouldShowOther: true
        };
    }

    /**
     * Create category data from raw data
     */
    public static createCategoryData(
        categories: PrimitiveValue[],
        widthValues: number[],
        totalValues: number[],
        customSortValues?: PrimitiveValue[]
    ): CategoryData[] {
        return categories.map((category, index) => ({
            category: category,
            categoryIndex: index,
            widthValue: widthValues[index] || 0,
            totalValue: totalValues[index] || 0,
            customSortValue: customSortValues ? customSortValues[index] : undefined
        }));
    }

    /**
     * Calculate total values for each category
     */
    public static calculateCategoryTotals(
        categoryIndices: number[],
        values: number[]
    ): Map<number, number> {
        const totals = new Map<number, number>();

        categoryIndices.forEach((catIndex, i) => {
            const current = totals.get(catIndex) || 0;
            totals.set(catIndex, current + (values[i] || 0));
        });

        return totals;
    }

    /**
     * Get width values for each category
     */
    public static getCategoryWidths(
        categoryIndices: number[],
        widthValues: number[]
    ): Map<number, number> {
        const widths = new Map<number, number>();

        categoryIndices.forEach((catIndex, i) => {
            if (!widths.has(catIndex)) {
                widths.set(catIndex, widthValues[i] || 0);
            }
        });

        return widths;
    }

    /**
     * Validate Top-N settings
     */
    public static validateTopNSettings(
        topN: number,
        totalCategories: number
    ): number {
        if (topN < 1) {
            return 1;
        }
        if (topN > totalCategories) {
            return totalCategories;
        }
        return Math.floor(topN);
    }

    /**
     * Check if Top-N should be applied
     */
    public static shouldApplyTopN(
        enabled: boolean,
        topN: number,
        totalCategories: number
    ): boolean {
        return enabled && topN > 0 && topN < totalCategories;
    }
}
