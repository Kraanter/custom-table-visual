"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
import ColorPicker = formattingSettings.ColorPicker;
import NumUpDown = formattingSettings.NumUpDown;
import TextInput = formattingSettings.TextInput;
import ToggleSwitch = formattingSettings.ToggleSwitch;

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

    defaultColumnWidth = new NumUpDown({
        name: "defaultColumnWidth",
        displayName: "Default column width",
        value: 160
    });

    individualColumnWidths = new TextInput({
        name: "individualColumnWidths",
        displayName: "Individual column widths",
        value: "",
        placeholder: "Customer:220, Amount:120"
    });

    autoFitColumns = new ToggleSwitch({
        name: "autoFitColumns",
        displayName: "Auto-fit long text",
        value: false
    });

    name: string = "table";
    displayName: string = "Table";
    slices: Array<FormattingSettingsSlice> = [
        this.titleText,
        this.backgroundColor,
        this.headerBackgroundColor,
        this.rowDividerColor,
        this.columnDividerColor,
        this.unevenRowBackgroundColor,
        this.defaultColumnWidth,
        this.individualColumnWidths,
        this.autoFitColumns
    ];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    tableCard = new TableCardSettings();

    cards = [this.tableCard];
}
