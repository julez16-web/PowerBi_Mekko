/**
 * MekkoVisual – Power BI Custom Visual
 *
 * Renders a Marimekko / Mekko chart with:
 *  - 100%-stacked bars (variable width proportional to bar total)
 *  - Configurable segment labels (absolute amounts, percentages, categories)
 *  - Bar totals above each column
 *  - Full format panel integration
 *  - Accessibility (ARIA attributes, keyboard focus)
 *
 * No external network calls. No tracking. Microsoft AppSource & certification ready.
 */

import * as d3 from "d3";
import { MekkoDataModel, MekkoBar, MekkoSegment, convertDataView } from "./dataModel";
import { MekkoSettings, parseSettings, DEFAULT_SETTINGS } from "./settings";
import { buildSegmentLabel, buildBarTotalLabel } from "./formatting";

import "../style/visual.less";

export class MekkoVisual implements powerbi.extensibility.visual.IVisual {
    private host: powerbi.extensibility.visual.IVisualHost;
    private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    private container: d3.Selection<SVGGElement, unknown, null, undefined>;
    private selectionManager: powerbi.extensibility.ISelectionManager;
    private model: MekkoDataModel;
    private settings: MekkoSettings;

    // Layout margins
    private static readonly MARGIN = { top: 30, right: 10, bottom: 40, left: 10 };
    private static readonly BAR_GAP = 2;
    private static readonly LEGEND_ITEM_HEIGHT = 18;
    private static readonly LEGEND_SWATCH_SIZE = 12;

    constructor(options: powerbi.extensibility.visual.VisualConstructorOptions) {
        this.host = options.host;
        this.selectionManager = this.host.createSelectionManager();
        this.model = { bars: [], seriesNames: [], seriesColors: new Map(), grandTotal: 0, hasData: false };
        this.settings = { ...DEFAULT_SETTINGS };

        // Create root SVG
        this.svg = d3.select(options.element)
            .append("svg")
            .attr("role", "img")
            .attr("aria-label", "Mekko / Marimekko Chart");

        this.container = this.svg.append("g")
            .attr("class", "mekko-container");
    }

    public update(options: powerbi.extensibility.visual.VisualUpdateOptions): void {
        const dataView = options.dataViews?.[0];
        this.settings = parseSettings(dataView?.metadata?.objects);
        this.model = convertDataView(dataView, this.host);

        const width = options.viewport.width;
        const height = options.viewport.height;

        this.svg
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`);

        // Clear previous render
        this.container.selectAll("*").remove();

        if (!this.model.hasData) {
            this.renderEmptyState(width, height);
            return;
        }

        // Compute layout regions
        const legendHeight = this.settings.legend.show
            ? this.computeLegendHeight(width)
            : 0;
        const legendY = this.settings.legend.position === "bottom"
            ? height - legendHeight
            : 0;

        const chartTop = (this.settings.legend.position === "top" ? legendHeight : 0) + MekkoVisual.MARGIN.top;
        const chartBottom = (this.settings.legend.position === "bottom" ? height - legendHeight : height) - MekkoVisual.MARGIN.bottom;
        const chartLeft = MekkoVisual.MARGIN.left;
        const chartRight = width - MekkoVisual.MARGIN.right;
        const chartWidth = chartRight - chartLeft;
        const chartHeight = chartBottom - chartTop;

        if (chartWidth <= 0 || chartHeight <= 0) return;

        // Render components
        if (this.settings.legend.show) {
            this.renderLegend(chartLeft, legendY, chartWidth);
        }
        this.renderBars(chartLeft, chartTop, chartWidth, chartHeight);
        if (this.settings.categoryAxis.show) {
            this.renderCategoryAxis(chartLeft, chartBottom, chartWidth);
        }
    }

    /**
     * Render the 100%-stacked Mekko bars.
     * Bar widths are proportional to their total value (Marimekko style).
     * Within each bar, segments stack to 100% of the bar height.
     */
    private renderBars(x0: number, y0: number, totalWidth: number, totalHeight: number): void {
        const barsGroup = this.container.append("g").attr("class", "mekko-bars");

        // Compute x positions for each bar (variable width)
        const totalGap = MekkoVisual.BAR_GAP * Math.max(0, this.model.bars.length - 1);
        const availableWidth = totalWidth - totalGap;

        let currentX = x0;

        for (const bar of this.model.bars) {
            const barWidth = Math.max(1, bar.barWidthFraction * availableWidth);
            const barGroup = barsGroup.append("g")
                .attr("class", "mekko-bar")
                .attr("aria-label", `${bar.categoryName}: ${bar.barTotal}`);

            // Stack segments from bottom to top (100%-stacked)
            let currentY = y0 + totalHeight; // start at bottom

            for (const segment of bar.segments) {
                if (segment.absoluteValue <= 0) continue;

                const segmentHeight = segment.percentOfBar * totalHeight;
                currentY -= segmentHeight;

                const rect = barGroup.append("rect")
                    .attr("x", currentX)
                    .attr("y", currentY)
                    .attr("width", barWidth)
                    .attr("height", Math.max(0, segmentHeight))
                    .attr("fill", segment.color)
                    .attr("stroke", "#ffffff")
                    .attr("stroke-width", 0.5)
                    .attr("role", "graphics-symbol")
                    .attr("aria-label", `${segment.seriesName}: ${segment.absoluteValue}`)
                    .attr("tabindex", 0);

                // Click for selection / cross-filtering
                rect.on("click", (_event: MouseEvent) => {
                    if (segment.selectionId) {
                        this.selectionManager.select(segment.selectionId);
                    }
                });

                // Tooltip on hover
                rect.on("mouseover", (event: MouseEvent) => {
                    this.host.tooltipService.show({
                        dataItems: [
                            { displayName: bar.categoryName, value: "" },
                            { displayName: segment.seriesName, value: String(segment.absoluteValue) },
                        ],
                        identities: segment.selectionId ? [segment.selectionId] : [],
                        coordinates: [event.clientX, event.clientY],
                        isTouchEvent: false,
                    });
                });

                rect.on("mouseout", () => {
                    this.host.tooltipService.hide({ immediately: true, isTouchEvent: false });
                });

                // Segment label
                if (this.settings.segmentLabels.show) {
                    this.renderSegmentLabel(barGroup, segment, bar, currentX, currentY, barWidth, segmentHeight);
                }
            }

            // Bar total above the column
            if (this.settings.barTotals.show) {
                this.renderBarTotal(barsGroup, bar, currentX, y0, barWidth);
            }

            currentX += barWidth + MekkoVisual.BAR_GAP;
        }
    }

    /**
     * Render a label inside/centered on a segment rect.
     */
    private renderSegmentLabel(
        parent: d3.Selection<SVGGElement, unknown, null, undefined>,
        segment: MekkoSegment,
        bar: MekkoBar,
        x: number,
        y: number,
        width: number,
        height: number,
    ): void {
        const settings = this.settings.segmentLabels;

        // Min threshold check: hide labels for segments that are too small
        if (segment.percentOfBar * 100 < settings.minThreshold) return;

        const labelText = buildSegmentLabel(segment, bar, settings);
        const fontSize = settings.fontSize;

        // Position based on setting
        let labelY: number;
        let dominantBaseline: string;
        switch (settings.labelPosition) {
            case "outside":
                labelY = y - 2;
                dominantBaseline = "auto";
                break;
            case "centered":
                labelY = y + height / 2;
                dominantBaseline = "central";
                break;
            case "inside":
            default:
                labelY = y + height / 2;
                dominantBaseline = "central";
                break;
        }

        const labelX = x + width / 2;

        const text = parent.append("text")
            .attr("class", "segment-label")
            .attr("x", labelX)
            .attr("y", labelY)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", dominantBaseline)
            .attr("font-size", `${fontSize}pt`)
            .attr("fill", settings.fontColor)
            .attr("pointer-events", "none")
            .attr("aria-hidden", "true")
            .text(labelText);

        // Hide label if it overflows the segment rect (inside/centered mode)
        if (settings.labelPosition !== "outside") {
            const bbox = (text.node() as SVGTextElement).getBBox();
            if (bbox.width > width - 4 || bbox.height > height - 2) {
                text.remove();
            }
        }
    }

    /**
     * Render a total label above a bar column.
     */
    private renderBarTotal(
        parent: d3.Selection<SVGGElement, unknown, null, undefined>,
        bar: MekkoBar,
        x: number,
        chartTop: number,
        barWidth: number,
    ): void {
        const settings = this.settings.barTotals;
        const labelText = buildBarTotalLabel(bar, settings);

        parent.append("text")
            .attr("class", "bar-total-label")
            .attr("x", x + barWidth / 2)
            .attr("y", chartTop - 6)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "auto")
            .attr("font-size", `${settings.fontSize}pt`)
            .attr("font-weight", "600")
            .attr("fill", settings.fontColor)
            .attr("pointer-events", "none")
            .attr("aria-hidden", "true")
            .text(labelText);
    }

    /**
     * Render the category axis labels below the chart.
     */
    private renderCategoryAxis(x0: number, y: number, totalWidth: number): void {
        const axisGroup = this.container.append("g").attr("class", "mekko-axis");
        const settings = this.settings.categoryAxis;

        const totalGap = MekkoVisual.BAR_GAP * Math.max(0, this.model.bars.length - 1);
        const availableWidth = totalWidth - totalGap;

        let currentX = x0;

        for (const bar of this.model.bars) {
            const barWidth = Math.max(1, bar.barWidthFraction * availableWidth);

            axisGroup.append("text")
                .attr("class", "axis-label")
                .attr("x", currentX + barWidth / 2)
                .attr("y", y + 14)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "hanging")
                .attr("font-size", `${settings.fontSize}pt`)
                .attr("fill", settings.fontColor)
                .attr("role", "presentation")
                .text(bar.categoryName);

            currentX += barWidth + MekkoVisual.BAR_GAP;
        }
    }

    /**
     * Compute the height needed for the legend.
     */
    private computeLegendHeight(availableWidth: number): number {
        if (!this.settings.legend.show) return 0;

        // Estimate: one row of legend items; wrap if needed
        const approxItemWidth = 120; // rough estimate per legend item
        const itemsPerRow = Math.max(1, Math.floor(availableWidth / approxItemWidth));
        const rows = Math.ceil(this.model.seriesNames.length / itemsPerRow);
        return rows * MekkoVisual.LEGEND_ITEM_HEIGHT + 8;
    }

    /**
     * Render the legend.
     */
    private renderLegend(x0: number, y0: number, totalWidth: number): void {
        const legendGroup = this.container.append("g")
            .attr("class", "mekko-legend")
            .attr("role", "list")
            .attr("aria-label", "Chart legend");

        const fontSize = this.settings.legend.fontSize;
        const swatchSize = MekkoVisual.LEGEND_SWATCH_SIZE;
        const itemPadding = 16;
        let currentX = x0;
        let currentY = y0 + 4;

        for (const name of this.model.seriesNames) {
            const color = this.model.seriesColors.get(name) ?? "#999";

            // Estimate text width (rough: fontSize * 0.6 per char)
            const textWidth = name.length * fontSize * 0.6;
            const itemWidth = swatchSize + 4 + textWidth + itemPadding;

            // Wrap to next line if needed
            if (currentX + itemWidth > x0 + totalWidth && currentX > x0) {
                currentX = x0;
                currentY += MekkoVisual.LEGEND_ITEM_HEIGHT;
            }

            const itemGroup = legendGroup.append("g")
                .attr("role", "listitem")
                .attr("aria-label", name);

            itemGroup.append("rect")
                .attr("x", currentX)
                .attr("y", currentY)
                .attr("width", swatchSize)
                .attr("height", swatchSize)
                .attr("fill", color)
                .attr("rx", 2);

            itemGroup.append("text")
                .attr("x", currentX + swatchSize + 4)
                .attr("y", currentY + swatchSize / 2)
                .attr("dominant-baseline", "central")
                .attr("font-size", `${fontSize}pt`)
                .attr("fill", "#333")
                .text(name);

            currentX += itemWidth;
        }
    }

    /**
     * Render an empty state message when no data is available.
     */
    private renderEmptyState(width: number, height: number): void {
        this.container.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .attr("font-size", "14pt")
            .attr("fill", "#999")
            .text("No data available. Add Category, Series, and Values.");
    }

    /**
     * Enumerate formatting properties for the format panel.
     * Power BI calls this to populate the formatting pane.
     */
    public enumerateObjectInstances(
        options: powerbi.EnumerateVisualObjectInstancesOptions,
    ): powerbi.VisualObjectInstanceEnumeration {
        const instances: powerbi.VisualObjectInstance[] = [];
        const objectName = options.objectName;

        switch (objectName) {
            case "segmentLabels": {
                const s = this.settings.segmentLabels;
                instances.push({
                    objectName,
                    selector: null,
                    properties: {
                        show: s.show,
                        labelContentMode: s.labelContentMode,
                        labelPosition: s.labelPosition,
                        fontSize: s.fontSize,
                        fontColor: { solid: { color: s.fontColor } },
                        decimalPlaces: s.decimalPlaces,
                        displayUnits: s.displayUnits,
                        currencySymbol: s.currencySymbol,
                        minThreshold: s.minThreshold,
                    },
                });
                break;
            }
            case "barTotals": {
                const bt = this.settings.barTotals;
                instances.push({
                    objectName,
                    selector: null,
                    properties: {
                        show: bt.show,
                        totalLabelFormat: bt.totalLabelFormat,
                        fontSize: bt.fontSize,
                        fontColor: { solid: { color: bt.fontColor } },
                        decimalPlaces: bt.decimalPlaces,
                        displayUnits: bt.displayUnits,
                        currencySymbol: bt.currencySymbol,
                    },
                });
                break;
            }
            case "legend": {
                const l = this.settings.legend;
                instances.push({
                    objectName,
                    selector: null,
                    properties: {
                        show: l.show,
                        position: l.position,
                        fontSize: l.fontSize,
                    },
                });
                break;
            }
            case "categoryAxis": {
                const ca = this.settings.categoryAxis;
                instances.push({
                    objectName,
                    selector: null,
                    properties: {
                        show: ca.show,
                        fontSize: ca.fontSize,
                        fontColor: { solid: { color: ca.fontColor } },
                    },
                });
                break;
            }
        }

        return instances;
    }
}
