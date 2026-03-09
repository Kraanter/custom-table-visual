"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import DataView = powerbi.DataView;
import DataViewTable = powerbi.DataViewTable;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import PrimitiveValue = powerbi.PrimitiveValue;

import { VisualFormattingSettingsModel } from "./settings";

interface TableStyleSettings {
    defaultColumnWidth: number;
    customColumnWidthMap: { [columnName: string]: number };
    tableBackgroundColor: string;
    headerBackgroundColor: string;
    rowDividerColor: string;
    columnDividerColor: string;
    evenRowBackgroundColor: string;
    headerTextColor: string;
    cellTextColor: string;
}

export class Visual implements IVisual {
    private static readonly DEFAULT_TABLE_BACKGROUND_COLOR: string = "#ffffff";
    private static readonly DEFAULT_HEADER_BACKGROUND_COLOR: string = "#eef2f6";
    private static readonly DEFAULT_ROW_DIVIDER_COLOR: string = "#d8dde4";
    private static readonly DEFAULT_COLUMN_DIVIDER_COLOR: string = "#d8dde4";
    private static readonly DEFAULT_EVEN_ROW_BACKGROUND_COLOR: string = "#f8fafc";
    private static readonly DEFAULT_HEADER_TEXT_COLOR: string = "#1f2937";
    private static readonly DEFAULT_CELL_TEXT_COLOR: string = "#334155";

    private target: HTMLElement;
    private container: HTMLElement;
    private scrollContainer: HTMLElement;
    private tableElement: HTMLTableElement;

    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private numberFormatter: Intl.NumberFormat = new Intl.NumberFormat(undefined, {
        maximumFractionDigits: 2
    });

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.formattingSettingsService = new FormattingSettingsService();

        this.container = document.createElement("div");
        this.container.className = "pbi-simple-table";
        this.container.style.boxSizing = "border-box";
        this.container.style.width = "100%";
        this.container.style.height = "100%";
        this.container.style.padding = "0";
        this.container.style.display = "flex";
        this.container.style.flexDirection = "column";
        this.container.style.gap = "0";
        this.container.style.background = Visual.DEFAULT_TABLE_BACKGROUND_COLOR;
        this.container.style.color = Visual.DEFAULT_CELL_TEXT_COLOR;
        this.container.style.fontFamily = '"Segoe UI", Tahoma, sans-serif';

        this.scrollContainer = document.createElement("div");
        this.scrollContainer.className = "pbi-simple-table__scroll";
        this.scrollContainer.style.flex = "1";
        this.scrollContainer.style.minHeight = "0";
        this.scrollContainer.style.overflow = "auto";

        this.tableElement = document.createElement("table");
        this.tableElement.className = "pbi-simple-table__table";
        this.tableElement.style.width = "max-content";
        this.tableElement.style.borderCollapse = "collapse";
        this.tableElement.style.tableLayout = "fixed";
        this.scrollContainer.appendChild(this.tableElement);

        this.container.appendChild(this.scrollContainer);
        this.target.appendChild(this.container);
    }

    public update(options: VisualUpdateOptions): void {
        const dataView: DataView = options.dataViews && options.dataViews.length > 0 ? options.dataViews[0] : undefined;
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, dataView);

        const tableData: DataViewTable = dataView && dataView.table ? dataView.table : undefined;
        const columns: DataViewMetadataColumn[] = tableData && tableData.columns ? tableData.columns : [];
        this.formattingSettings.tableCard.setIndividualColumnWidthItems(columns);

        const tableStyleSettings: TableStyleSettings = this.getTableStyleSettings();
        this.applyStyling(tableStyleSettings);

        if (!tableData || !tableData.columns || tableData.columns.length === 0) {
            this.clearTable();
            return;
        }

        this.renderTable(tableData, tableStyleSettings);
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    private applyStyling(settings: TableStyleSettings): void {
        this.container.style.background = settings.tableBackgroundColor;
        this.container.style.color = settings.cellTextColor;
        this.tableElement.style.tableLayout = "fixed";
    }

    private renderTable(tableData: DataViewTable, settings: TableStyleSettings): void {
        this.clearTable();

        const colgroupElement: HTMLTableColElement = document.createElement("colgroup");
        const headerRow: HTMLTableRowElement = document.createElement("tr");

        tableData.columns.forEach((column: DataViewMetadataColumn, index: number) => {
            const isLastColumn: boolean = index === tableData.columns.length - 1;
            const headerCell: HTMLTableCellElement = document.createElement("th");
            headerCell.className = "pbi-simple-table__header-cell";
            headerCell.textContent = column.displayName || "Column " + (index + 1);
            headerCell.style.background = settings.headerBackgroundColor;
            headerCell.style.color = settings.headerTextColor;
            headerCell.style.fontSize = "12px";
            headerCell.style.fontWeight = "600";
            headerCell.style.textAlign = "left";
            headerCell.style.padding = "8px";
            headerCell.style.borderBottom = "1px solid " + settings.rowDividerColor;
            headerCell.style.borderRight = isLastColumn ? "0" : "1px solid " + settings.columnDividerColor;
            headerCell.style.whiteSpace = "normal";
            headerCell.style.overflow = "visible";
            headerCell.style.textOverflow = "clip";
            headerCell.style.wordBreak = "break-word";
            headerRow.appendChild(headerCell);

            const width: number = this.resolveColumnWidth(column, settings);
            const colElement: HTMLTableColElement = document.createElement("col");
            colElement.style.width = width > 0 ? width + "px" : "auto";
            colgroupElement.appendChild(colElement);
        });

        const thead: HTMLTableSectionElement = document.createElement("thead");
        thead.appendChild(headerRow);
        this.tableElement.appendChild(colgroupElement);
        this.tableElement.appendChild(thead);

        const tbody: HTMLTableSectionElement = document.createElement("tbody");
        const rows: PrimitiveValue[][] = tableData.rows || [];

        rows.forEach((row: PrimitiveValue[], rowIndex: number) => {
            const rowElement: HTMLTableRowElement = document.createElement("tr");
            if (rowIndex % 2 === 1) {
                rowElement.style.background = settings.evenRowBackgroundColor;
            }

            tableData.columns.forEach((column: DataViewMetadataColumn, columnIndex: number) => {
                const isLastColumn: boolean = columnIndex === tableData.columns.length - 1;
                const cell: HTMLTableCellElement = document.createElement("td");
                cell.className = "pbi-simple-table__cell";
                cell.textContent = this.formatValue(row[columnIndex], column);
                cell.style.color = settings.cellTextColor;
                cell.style.fontSize = "12px";
                cell.style.padding = "8px";
                cell.style.borderBottom = "1px solid " + settings.rowDividerColor;
                cell.style.borderRight = isLastColumn ? "0" : "1px solid " + settings.columnDividerColor;
                cell.style.whiteSpace = "normal";
                cell.style.overflow = "visible";
                cell.style.textOverflow = "clip";
                cell.style.wordBreak = "break-word";
                rowElement.appendChild(cell);
            });

            tbody.appendChild(rowElement);
        });

        this.tableElement.appendChild(tbody);
    }

    private clearTable(): void {
        while (this.tableElement.firstChild) {
            this.tableElement.removeChild(this.tableElement.firstChild);
        }
    }

    private resolveColumnWidth(column: DataViewMetadataColumn, settings: TableStyleSettings): number {
        const defaultWidth: number = Math.max(0, Math.floor(settings.defaultColumnWidth));
        const displayName: string = (column.displayName || "").trim().toLowerCase();
        const queryName: string = (column.queryName || "").trim().toLowerCase();

        if (displayName && settings.customColumnWidthMap[displayName]) {
            return settings.customColumnWidthMap[displayName];
        }

        if (queryName && settings.customColumnWidthMap[queryName]) {
            return settings.customColumnWidthMap[queryName];
        }

        return defaultWidth;
    }

    private getTableStyleSettings(): TableStyleSettings {
        const tableCard = this.formattingSettings.tableCard;
        const defaultColumnWidth: number = tableCard.defaultColumnWidth.value || 160;
        const customColumnWidthMap: { [columnName: string]: number } = tableCard.getIndividualColumnWidthMap();
        const tableBackgroundColor: string = this.resolveColorValue(tableCard.tableBackgroundColor.value, Visual.DEFAULT_TABLE_BACKGROUND_COLOR);
        const headerBackgroundColor: string = this.resolveColorValue(tableCard.headerBackgroundColor.value, Visual.DEFAULT_HEADER_BACKGROUND_COLOR);
        const rowDividerColor: string = this.resolveColorValue(tableCard.rowDividerColor.value, Visual.DEFAULT_ROW_DIVIDER_COLOR);
        const columnDividerColor: string = this.resolveColorValue(tableCard.columnDividerColor.value, Visual.DEFAULT_COLUMN_DIVIDER_COLOR);
        const evenRowBackgroundColor: string = this.resolveColorValue(tableCard.evenRowBackgroundColor.value, Visual.DEFAULT_EVEN_ROW_BACKGROUND_COLOR);
        const headerTextColor: string = this.resolveColorValue(tableCard.headerTextColor.value, Visual.DEFAULT_HEADER_TEXT_COLOR);
        const cellTextColor: string = this.resolveColorValue(tableCard.cellTextColor.value, Visual.DEFAULT_CELL_TEXT_COLOR);

        return {
            defaultColumnWidth,
            customColumnWidthMap,
            tableBackgroundColor,
            headerBackgroundColor,
            rowDividerColor,
            columnDividerColor,
            evenRowBackgroundColor,
            headerTextColor,
            cellTextColor
        };
    }

    private resolveColorValue(rawColorValue: unknown, fallbackColor: string): string {
        if (typeof rawColorValue === "string" && rawColorValue.trim().length > 0) {
            return rawColorValue;
        }

        if (rawColorValue && typeof rawColorValue === "object") {
            const nestedValue: unknown = (rawColorValue as { value?: unknown }).value;
            if (typeof nestedValue === "string" && nestedValue.trim().length > 0) {
                return nestedValue;
            }
        }

        return fallbackColor;
    }

    private formatValue(value: PrimitiveValue, column: DataViewMetadataColumn): string {
        if (value === null || value === undefined) {
            return "";
        }

        if (value instanceof Date) {
            return value.toLocaleDateString();
        }

        if (typeof value === "number") {
            return this.numberFormatter.format(value);
        }

        if (typeof value === "boolean") {
            return value ? "True" : "False";
        }

        if (column && column.type && column.type.dateTime) {
            const parsedDate: Date = new Date(value as string | number);
            if (!Number.isNaN(parsedDate.getTime())) {
                return parsedDate.toLocaleDateString();
            }
        }

        return String(value);
    }
}
