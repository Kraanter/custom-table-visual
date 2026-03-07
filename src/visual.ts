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
    title: string;
    backgroundColor: string;
    headerBackgroundColor: string;
    rowDividerColor: string;
    columnDividerColor: string;
    unevenRowBackgroundColor: string;
    defaultColumnWidth: number;
    customColumnWidthMap: { [columnName: string]: number };
    autoFitColumns: boolean;
}

export class Visual implements IVisual {
    private target: HTMLElement;
    private container: HTMLElement;
    private titleNode: HTMLElement;
    private scrollContainer: HTMLElement;
    private tableElement: HTMLTableElement;
    private statusNode: HTMLElement;

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

        this.titleNode = document.createElement("h2");
        this.titleNode.className = "pbi-simple-table__title";

        this.scrollContainer = document.createElement("div");
        this.scrollContainer.className = "pbi-simple-table__scroll";

        this.tableElement = document.createElement("table");
        this.tableElement.className = "pbi-simple-table__table";
        this.scrollContainer.appendChild(this.tableElement);

        this.statusNode = document.createElement("p");
        this.statusNode.className = "pbi-simple-table__status";

        this.container.appendChild(this.titleNode);
        this.container.appendChild(this.scrollContainer);
        this.container.appendChild(this.statusNode);
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
            this.statusNode.textContent = "Add columns to the visual to render the table.";
            return;
        }

        this.renderTable(tableData, tableStyleSettings);
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    private applyStyling(settings: TableStyleSettings): void {
        this.titleNode.textContent = settings.title;
        this.container.style.setProperty("--pbi-table-bg", settings.backgroundColor);
        this.container.style.setProperty("--pbi-table-header-bg", settings.headerBackgroundColor);
        this.container.style.setProperty("--pbi-table-row-divider", settings.rowDividerColor);
        this.container.style.setProperty("--pbi-table-column-divider", settings.columnDividerColor);
        this.container.style.setProperty("--pbi-table-uneven-row-bg", settings.unevenRowBackgroundColor);
        this.container.classList.toggle("is-auto-fit", settings.autoFitColumns);
    }

    private renderTable(tableData: DataViewTable, settings: TableStyleSettings): void {
        this.clearTable();

        const colgroupElement: HTMLTableColElement = document.createElement("colgroup");
        const headerRow: HTMLTableRowElement = document.createElement("tr");

        tableData.columns.forEach((column: DataViewMetadataColumn, index: number) => {
            const headerCell: HTMLTableCellElement = document.createElement("th");
            headerCell.className = "pbi-simple-table__header-cell";
            headerCell.textContent = column.displayName || "Column " + (index + 1);
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

        rows.forEach((row: PrimitiveValue[]) => {
            const rowElement: HTMLTableRowElement = document.createElement("tr");

            tableData.columns.forEach((column: DataViewMetadataColumn, columnIndex: number) => {
                const cell: HTMLTableCellElement = document.createElement("td");
                cell.className = "pbi-simple-table__cell";
                cell.textContent = this.formatValue(row[columnIndex], column);
                rowElement.appendChild(cell);
            });

            tbody.appendChild(rowElement);
        });

        this.tableElement.appendChild(tbody);
        this.statusNode.textContent = "Showing " + rows.length + " rows and " + tableData.columns.length + " columns.";
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
        const title: string = tableCard.titleText.value && tableCard.titleText.value.trim().length > 0
            ? tableCard.titleText.value
            : "Simple Table";

        const backgroundColor: string = tableCard.backgroundColor.value && tableCard.backgroundColor.value.value
            ? tableCard.backgroundColor.value.value
            : "#FFFFFF";

        const headerBackgroundColor: string = tableCard.headerBackgroundColor.value && tableCard.headerBackgroundColor.value.value
            ? tableCard.headerBackgroundColor.value.value
            : "#EEF2F6";

        const rowDividerColor: string = tableCard.rowDividerColor.value && tableCard.rowDividerColor.value.value
            ? tableCard.rowDividerColor.value.value
            : "#D8DDE4";

        const columnDividerColor: string = tableCard.columnDividerColor.value && tableCard.columnDividerColor.value.value
            ? tableCard.columnDividerColor.value.value
            : "#D8DDE4";

        const unevenRowBackgroundColor: string = tableCard.unevenRowBackgroundColor.value && tableCard.unevenRowBackgroundColor.value.value
            ? tableCard.unevenRowBackgroundColor.value.value
            : "#F8FAFC";

        const defaultColumnWidth: number = tableCard.defaultColumnWidth.value || 160;
        const customColumnWidthMap: { [columnName: string]: number } = tableCard.getIndividualColumnWidthMap();
        const autoFitColumns: boolean = !!tableCard.autoFitColumns.value;

        return {
            title,
            backgroundColor,
            headerBackgroundColor,
            rowDividerColor,
            columnDividerColor,
            unevenRowBackgroundColor,
            defaultColumnWidth,
            customColumnWidthMap,
            autoFitColumns
        };
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
