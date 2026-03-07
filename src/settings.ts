"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import powerbi from "powerbi-visuals-api";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
import ColorPicker = formattingSettings.ColorPicker;
import NumUpDown = formattingSettings.NumUpDown;
import TextInput = formattingSettings.TextInput;
import Container = formattingSettings.Container;
import ToggleSwitch = formattingSettings.ToggleSwitch;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataViewObjects = powerbi.DataViewObjects;

class TableCardSettings extends FormattingSettingsCard {
    titleText = new TextInput({
        name: "titleText",
        displayName: "Title",
        value: "Simple Table",
        placeholder: "Simple Table"
    });

    backgroundColor = new ColorPicker({
        name: "backgroundColor",
        displayName: "Background color",
        value: { value: "#FFFFFF" }
    });

    headerBackgroundColor = new ColorPicker({
        name: "headerBackgroundColor",
        displayName: "Header background",
        value: { value: "#EEF2F6" }
    });

    rowDividerColor = new ColorPicker({
        name: "rowDividerColor",
        displayName: "Row divider color",
        value: { value: "#D8DDE4" }
    });

    columnDividerColor = new ColorPicker({
        name: "columnDividerColor",
        displayName: "Column divider color",
        value: { value: "#D8DDE4" }
    });

    unevenRowBackgroundColor = new ColorPicker({
        name: "unevenRowBackgroundColor",
        displayName: "Uneven row background",
        value: { value: "#F8FAFC" }
    });

    individualColumnWidthContainer = new Container({
        displayName: "Individual column widths",
        containerItems: []
    });

    private individualColumnWidthSlices: NumUpDown[] = [];

    defaultColumnWidth = new NumUpDown({
        name: "defaultColumnWidth",
        displayName: "Default column width",
        value: 160
    });

    autoFitColumns = new ToggleSwitch({
        name: "autoFitColumns",
        displayName: "Auto-fit long text",
        value: false
    });

    name: string = "table";
    displayName: string = "Table";
    container: Container = this.individualColumnWidthContainer;
    slices: Array<FormattingSettingsSlice> = [
        this.titleText,
        this.backgroundColor,
        this.headerBackgroundColor,
        this.rowDividerColor,
        this.columnDividerColor,
        this.unevenRowBackgroundColor,
        this.defaultColumnWidth,
        this.autoFitColumns
    ];

    public setIndividualColumnWidthItems(columns: DataViewMetadataColumn[]): void {
        this.individualColumnWidthSlices = [];

        this.individualColumnWidthContainer.containerItems = columns.map((column: DataViewMetadataColumn, index: number) => {
            const columnLabel: string = column.displayName || "Column " + (index + 1);
            const storedWidth: number = this.readStoredColumnWidth(column.objects, this.defaultColumnWidth.value || 160);

            const widthSlice = new NumUpDown({
                name: "columnWidth",
                displayName: "Width (px)",
                value: storedWidth,
                selector: {
                    metadata: column.queryName || column.displayName || columnLabel
                }
            });

            this.individualColumnWidthSlices.push(widthSlice);

            return {
                displayName: columnLabel,
                slices: [widthSlice]
            };
        });
    }

    public getIndividualColumnWidthMap(): { [columnKey: string]: number } {
        const widthMap: { [columnKey: string]: number } = {};

        this.individualColumnWidthSlices.forEach((slice: NumUpDown) => {
            const selectorMetadata: unknown = slice.selector && (slice.selector as { metadata?: unknown }).metadata;
            if (!selectorMetadata || typeof selectorMetadata !== "string") {
                return;
            }

            const normalizedKey: string = this.normalizeColumnKey(selectorMetadata);
            const widthValue: number = Number(slice.value);
            if (!normalizedKey || Number.isNaN(widthValue) || widthValue <= 0) {
                return;
            }

            widthMap[normalizedKey] = Math.floor(widthValue);
        });

        return widthMap;
    }

    private readStoredColumnWidth(objects: DataViewObjects, fallbackWidth: number): number {
        const objectRecord = objects && objects.table;
        const rawValue: unknown = objectRecord && objectRecord.columnWidth;
        const widthValue: number = Number(rawValue);

        if (Number.isNaN(widthValue) || widthValue <= 0) {
            return Math.max(1, Math.floor(fallbackWidth || 160));
        }

        return Math.floor(widthValue);
    }

    private normalizeColumnKey(rawKey: string): string {
        return (rawKey || "").trim().toLowerCase();
    }
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    tableCard = new TableCardSettings();

    cards = [this.tableCard];
}
