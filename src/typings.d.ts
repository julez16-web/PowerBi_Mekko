/**
 * Power BI Visual API type declarations.
 * These provide type safety for the Power BI extensibility interfaces.
 * In production builds, powerbi-visuals-api provides these; this file
 * ensures TypeScript compilation succeeds.
 */

declare namespace powerbi {
    interface DataView {
        metadata: DataViewMetadata;
        matrix?: DataViewMatrix;
        categorical?: unknown;
    }

    interface DataViewMetadata {
        objects?: DataViewObjects;
        columns: DataViewMetadataColumn[];
    }

    interface DataViewMetadataColumn {
        displayName: string;
        queryName?: string;
        roles?: Record<string, boolean>;
        type?: unknown;
        format?: string;
    }

    interface DataViewObjects {
        [objectName: string]: DataViewObject;
    }

    interface DataViewObject {
        [propertyName: string]: unknown;
    }

    interface DataViewMatrix {
        rows: DataViewMatrixNode;
        columns: DataViewMatrixNode;
        valueSources: DataViewMetadataColumn[];
    }

    interface DataViewMatrixNode {
        root: DataViewMatrixNodeRoot;
        levels: DataViewHierarchyLevel[];
    }

    interface DataViewHierarchyLevel {
        sources: DataViewMetadataColumn[];
    }

    interface DataViewMatrixNodeRoot {
        children?: DataViewMatrixNodeValue[];
        value?: unknown;
        values?: Record<number, DataViewMatrixNodeValueEntry>;
    }

    interface DataViewMatrixNodeValue {
        value?: unknown;
        children?: DataViewMatrixNodeValue[];
        values?: Record<number, DataViewMatrixNodeValueEntry>;
        identity?: unknown;
        level?: number;
    }

    interface DataViewMatrixNodeValueEntry {
        value?: unknown;
        valueSourceIndex?: number;
    }

    interface EnumerateVisualObjectInstancesOptions {
        objectName: string;
    }

    type VisualObjectInstanceEnumeration = VisualObjectInstance[];

    interface VisualObjectInstance {
        objectName: string;
        selector: unknown;
        properties: Record<string, unknown>;
    }

    namespace extensibility {
        interface ISelectionManager {
            select(selectionId: visuals.ISelectionId, multiSelect?: boolean): Promise<visuals.ISelectionId[]>;
            clear(): Promise<void>;
        }

        interface IColorPalette {
            getColor(key: string): IColorInfo;
        }

        interface IColorInfo {
            value: string;
        }

        interface ITooltipService {
            show(args: TooltipShowOptions): void;
            hide(args: TooltipHideOptions): void;
        }

        interface TooltipShowOptions {
            dataItems: TooltipDataItem[];
            identities: visuals.ISelectionId[];
            coordinates: [number, number];
            isTouchEvent: boolean;
        }

        interface TooltipHideOptions {
            immediately: boolean;
            isTouchEvent: boolean;
        }

        interface TooltipDataItem {
            displayName: string;
            value: string;
        }

        interface ISelectionIdBuilder {
            withMatrixNode(node: DataViewMatrixNodeValue, levels: DataViewHierarchyLevel[]): ISelectionIdBuilder;
            createSelectionId(): visuals.ISelectionId;
        }

        namespace visual {
            interface IVisual {
                update(options: VisualUpdateOptions): void;
                enumerateObjectInstances?(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration;
                destroy?(): void;
            }

            interface VisualConstructorOptions {
                element: HTMLElement;
                host: IVisualHost;
            }

            interface VisualUpdateOptions {
                dataViews?: DataView[];
                viewport: IViewport;
                type?: number;
            }

            interface IVisualHost {
                colorPalette: IColorPalette;
                tooltipService: ITooltipService;
                createSelectionIdBuilder(): ISelectionIdBuilder;
                createSelectionManager(): ISelectionManager;
            }

            interface IViewport {
                width: number;
                height: number;
            }
        }
    }

    namespace visuals {
        interface ISelectionId {
            equals(other: ISelectionId): boolean;
            includes(other: ISelectionId, ignoreHighlight?: boolean): boolean;
            getKey(): string;
        }
    }
}
