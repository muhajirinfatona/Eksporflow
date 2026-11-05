import { describe, it, expect, beforeEach } from "vitest";
import {
  saveActiveSelection,
  clearSavedSelection,
  getSavedSelection,
  isTextSelected,
  getSelectionFontSize,
  getSelectionFontFamily,
  mapLineHeightToGapPx,
  applyLineSpacingToSelection,
  getSelectionLineHeight,
  registerShipmentHistoryBridge,
  pushEditorHistory,
  performEditorUndo,
  performEditorRedo,
  canEditorUndo,
  canEditorRedo,
  resetEditorHistory,
} from "../client/src/lib/wordEditorEngine";
import { getDocMargins, initialShipment } from "./shipment";

describe("Word Editor Engine - Microsoft Word Selection & Formatting", () => {
  beforeEach(() => {
    clearSavedSelection();
    resetEditorHistory();
  });

  it("handles headless/SSR environment safely without throwing exceptions", () => {
    expect(saveActiveSelection()).toBeNull();
    expect(getSavedSelection()).toBeNull();
    expect(isTextSelected()).toBe(false);
    expect(getSelectionFontSize()).toBe(11);
    expect(getSelectionFontFamily()).toBe("Calibri");
    expect(getSelectionLineHeight()).toBeNull();
    expect(applyLineSpacingToSelection(1.5)).toEqual({
      applied: false,
      isLetterhead: false,
      mappedSpacingPx: 8,
    });
  });

  it("maps line-height presets to proportional vertical gap pixels", () => {
    expect(mapLineHeightToGapPx(1.0)).toBe(0);
    expect(mapLineHeightToGapPx(1.15)).toBe(2);
    expect(mapLineHeightToGapPx(1.25)).toBe(4);
    expect(mapLineHeightToGapPx(1.5)).toBe(8);
    expect(mapLineHeightToGapPx(2.0)).toBe(14);
  });

  it("safely resets and manages saved selection state", () => {
    clearSavedSelection();
    expect(getSavedSelection()).toBeNull();
  });

  it("correctly parses and returns custom margins when preset is Kustom", () => {
    const customShipment = {
      ...initialShipment,
      docMarginPreset: "Kustom" as const,
      docMarginTop: 15,
      docMarginBottom: 18,
      docMarginLeft: 22,
      docMarginRight: 20,
    };
    const margins = getDocMargins(customShipment);
    expect(margins.preset).toBe("Kustom");
    expect(margins.top).toBe(15);
    expect(margins.bottom).toBe(18);
    expect(margins.left).toBe(22);
    expect(margins.right).toBe(20);
  });

  it("supports Microsoft Word image wrap modes and defaults", () => {
    expect(initialShipment.letterheadLogoWrap).toBe("inline");
    expect(initialShipment.letterheadLogoOpacity).toBe(100);
    expect(initialShipment.letterheadLogoRotate).toBe(0);

    const behindTextShipment = {
      ...initialShipment,
      letterheadLogoWrap: "behind" as const,
      letterheadLogoOpacity: 30,
    };
    expect(behindTextShipment.letterheadLogoWrap).toBe("behind");
    expect(behindTextShipment.letterheadLogoOpacity).toBe(30);
  });

  it("tracks and restores shipment state across Undo and Redo actions", () => {
    let state = {
      ...initialShipment,
      docEditorFontSize: 11,
      letterheadSpacing: 2,
    };

    const unregister = registerShipmentHistoryBridge(
      () => ({ ...state }),
      (restored) => {
        state = { ...state, ...restored };
      }
    );

    expect(canEditorUndo()).toBe(false);
    expect(canEditorRedo()).toBe(false);

    // Step 1: Change font size from 11 to 16
    pushEditorHistory("font-size");
    state.docEditorFontSize = 16;
    expect(canEditorUndo()).toBe(true);

    // Step 2: Change letterhead spacing from 2 to 10
    pushEditorHistory("letterhead-spacing");
    state.letterheadSpacing = 10;

    // Undo Step 2 -> letterheadSpacing returns to 2, fontSize stays 16
    expect(performEditorUndo()).toBe(true);
    expect(state.letterheadSpacing).toBe(2);
    expect(state.docEditorFontSize).toBe(16);
    expect(canEditorRedo()).toBe(true);

    // Undo Step 1 -> fontSize returns to 11
    expect(performEditorUndo()).toBe(true);
    expect(state.docEditorFontSize).toBe(11);
    expect(canEditorUndo()).toBe(false);

    // Redo Step 1 -> fontSize returns to 16
    expect(performEditorRedo()).toBe(true);
    expect(state.docEditorFontSize).toBe(16);

    // Redo Step 2 -> letterheadSpacing returns to 10
    expect(performEditorRedo()).toBe(true);
    expect(state.letterheadSpacing).toBe(10);
    expect(canEditorRedo()).toBe(false);

    unregister();
  });
});
