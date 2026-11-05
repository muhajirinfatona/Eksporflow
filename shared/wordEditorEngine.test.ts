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
} from "../client/src/lib/wordEditorEngine";
import { getDocMargins, initialShipment } from "./shipment";

describe("Word Editor Engine - Microsoft Word Selection & Formatting", () => {
  beforeEach(() => {
    clearSavedSelection();
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
});
