import { describe, it, expect, beforeEach } from "vitest";
import {
  saveActiveSelection,
  clearSavedSelection,
  getSavedSelection,
  isTextSelected,
  getSelectionFontSize,
  getSelectionFontFamily,
} from "../client/src/lib/wordEditorEngine";

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
  });

  it("safely resets and manages saved selection state", () => {
    clearSavedSelection();
    expect(getSavedSelection()).toBeNull();
  });
});
