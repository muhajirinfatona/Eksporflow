/**
 * wordEditorEngine.ts
 * High-fidelity Microsoft Word-grade selection preservation, rich text formatting,
 * and DOM range manipulation for EksporFlow Word Document Editor.
 */

let savedRange: Range | null = null;

/**
 * Saves current selection range if it resides within .paper-document and is not collapsed.
 */
export function saveActiveSelection(): Range | null {
  if (typeof window === "undefined") return null;
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
    const range = sel.getRangeAt(0);
    const paper = document.querySelector(".paper-document");
    if (paper && paper.contains(range.commonAncestorContainer)) {
      savedRange = range.cloneRange();
      return savedRange;
    }
  }
  return null;
}

export function clearSavedSelection(): void {
  savedRange = null;
}

export function getSavedSelection(): Range | null {
  return savedRange;
}

/**
 * Restores the saved selection range back into window.getSelection().
 */
export function restoreActiveSelection(): boolean {
  if (typeof window === "undefined" || !savedRange) return false;
  try {
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange);
      return true;
    }
  } catch {
    // Ignore invalid range
  }
  return false;
}

/**
 * Returns active selection if within .paper-document and non-collapsed,
 * or falls back to savedRange if still valid.
 */
export function getEffectiveSelectionRange(): Range | null {
  if (typeof window === "undefined") return null;
  const sel = window.getSelection();
  const paper = document.querySelector(".paper-document");
  if (!paper) return null;

  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
    const range = sel.getRangeAt(0);
    if (paper.contains(range.commonAncestorContainer)) {
      savedRange = range.cloneRange();
      return range;
    }
  }

  if (savedRange && paper.contains(savedRange.commonAncestorContainer)) {
    return savedRange;
  }

  return null;
}

/**
 * Returns whether any text is currently blocked/selected inside .paper-document.
 */
export function isTextSelected(): boolean {
  const range = getEffectiveSelectionRange();
  return !!range && !range.collapsed;
}

/**
 * Collects all non-empty Text nodes intersecting the specified Range.
 */
function getTextNodesInRange(range: Range): Text[] {
  const root = range.commonAncestorContainer;
  const textNodes: Text[] = [];

  if (root.nodeType === Node.TEXT_NODE) {
    return [root as Text];
  }

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.textContent || node.textContent.length === 0) {
          return NodeFilter.FILTER_REJECT;
        }
        try {
          if (node === range.startContainer && range.startOffset >= (node.textContent?.length || 0)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (node === range.endContainer && range.endOffset <= 0) {
            return NodeFilter.FILTER_REJECT;
          }
          const nodeRange = document.createRange();
          nodeRange.selectNodeContents(node);
          const isAfterStart = range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0;
          const isBeforeEnd = range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0;
          if (!isAfterStart || !isBeforeEnd) {
            return NodeFilter.FILTER_REJECT;
          }
          const start = node === range.startContainer ? range.startOffset : 0;
          const end = node === range.endContainer ? range.endOffset : (node.textContent?.length || 0);
          if (start >= end) return NodeFilter.FILTER_REJECT;
          const selectedSlice = node.textContent.slice(start, end);
          if (selectedSlice.trim().length === 0 && range.startContainer !== range.endContainer) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        } catch {
          return NodeFilter.FILTER_REJECT;
        }
      },
    }
  );

  let current = walker.nextNode();
  while (current) {
    textNodes.push(current as Text);
    current = walker.nextNode();
  }
  return textNodes;
}

/**
 * Applies inline CSS properties strictly to the blocked/selected text segment,
 * handling cross-block, cross-tag, and partial node selections seamlessly.
 */
export function applyInlineStyleToSelection(styles: Record<string, string>): boolean {
  const range = getEffectiveSelectionRange();
  if (!range || range.collapsed) return false;

  const paper = document.querySelector(".paper-document");
  if (!paper || !paper.contains(range.commonAncestorContainer)) return false;

  pushEditorHistory("format-inline");

  try {
    // Case 1: Range is strictly within a single Text Node
    if (range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
      const textNode = range.startContainer as Text;
      const start = range.startOffset;
      const end = range.endOffset;
      if (start >= end) return false;

      // If textNode is the single child of an existing inline span inside paper
      const parent = textNode.parentElement;
      if (
        parent &&
        parent.tagName === "SPAN" &&
        parent !== paper &&
        parent.childNodes.length === 1 &&
        start === 0 &&
        end === textNode.length
      ) {
        for (const [prop, val] of Object.entries(styles)) {
          parent.style.setProperty(prop, val, "important");
        }
        const newRange = document.createRange();
        newRange.selectNodeContents(parent);
        savedRange = newRange.cloneRange();
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(newRange);
        return true;
      }

      // Split text node cleanly
      let targetNode = textNode;
      if (end < textNode.length) {
        textNode.splitText(end);
      }
      if (start > 0) {
        targetNode = textNode.splitText(start);
      }

      const span = document.createElement("span");
      span.className = "word-formatted-span";
      for (const [prop, val] of Object.entries(styles)) {
        span.style.setProperty(prop, val, "important");
      }

      targetNode.parentNode?.replaceChild(span, targetNode);
      span.appendChild(targetNode);

      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      savedRange = newRange.cloneRange();
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(newRange);
      return true;
    }

    // Case 2: Multi-node selection (crossing bold, italic, table cells, or paragraphs)
    const textNodes = getTextNodesInRange(range);
    if (textNodes.length === 0) return false;

    const formattedSpans: HTMLElement[] = [];

    for (const textNode of textNodes) {
      const start = textNode === range.startContainer ? range.startOffset : 0;
      const end = textNode === range.endContainer ? range.endOffset : textNode.length;
      if (start >= end) continue;

      let target = textNode;
      if (end < textNode.length) {
        textNode.splitText(end);
      }
      if (start > 0) {
        target = textNode.splitText(start);
      }

      const parent = target.parentElement;
      if (
        parent &&
        parent.tagName === "SPAN" &&
        parent !== paper &&
        parent.childNodes.length === 1
      ) {
        for (const [prop, val] of Object.entries(styles)) {
          parent.style.setProperty(prop, val, "important");
        }
        formattedSpans.push(parent);
      } else {
        const span = document.createElement("span");
        span.className = "word-formatted-span";
        for (const [prop, val] of Object.entries(styles)) {
          span.style.setProperty(prop, val, "important");
        }
        target.parentNode?.replaceChild(span, target);
        span.appendChild(target);
        formattedSpans.push(span);
      }
    }

    if (formattedSpans.length > 0) {
      const newRange = document.createRange();
      newRange.setStartBefore(formattedSpans[0]);
      newRange.setEndAfter(formattedSpans[formattedSpans.length - 1]);
      savedRange = newRange.cloneRange();
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(newRange);
      return true;
    }
  } catch (err) {
    console.warn("applyInlineStyleToSelection caught error:", err);
  }

  return false;
}

/**
 * Detects the current font size in pt of the selection or cursor.
 */
export function getSelectionFontSize(): number {
  if (typeof window === "undefined") return 11;
  const range = getEffectiveSelectionRange();
  if (!range) return 11;

  try {
    // Gunakan elemen induk dari teks pertama yang benar-benar terpilih.
    // Setelah format diterapkan, range dimulai SEBELUM span baru (startContainer = <p> induk),
    // sehingga membaca startContainer langsung akan mengembalikan ukuran lama (mis. 7.5 pt).
    let el: HTMLElement | null = null;
    if (!range.collapsed) {
      const firstText = getTextNodesInRange(range)[0];
      if (firstText) el = firstText.parentElement;
    }
    if (!el) {
      const sc = range.startContainer;
      if (sc.nodeType === Node.TEXT_NODE) {
        el = sc.parentElement;
      } else {
        const child = sc.childNodes[range.startOffset];
        el = (child && child.nodeType === Node.ELEMENT_NODE ? child : sc) as HTMLElement;
      }
    }

    if (el) {
      // Check inline style first
      if (el.style.fontSize && el.style.fontSize.includes("pt")) {
        const ptVal = parseFloat(el.style.fontSize);
        if (!isNaN(ptVal)) return ptVal;
      }
      const computed = window.getComputedStyle(el);
      const pxVal = parseFloat(computed.fontSize);
      if (!isNaN(pxVal)) {
        // 1 pt = 1.3333 px => pt = px / 1.3333 = px * 0.75
        const pt = Math.round((pxVal * 0.75) * 2) / 2;
        return pt;
      }
    }
  } catch {
    // fallback
  }

  return 11;
}

/**
 * Detects the current font family of the selection.
 */
export function getSelectionFontFamily(): string {
  if (typeof window === "undefined") return "Calibri";
  const range = getEffectiveSelectionRange();
  if (!range) return "Calibri";

  try {
    let el: HTMLElement | null = null;
    if (!range.collapsed) {
      const firstText = getTextNodesInRange(range)[0];
      if (firstText) el = firstText.parentElement;
    }
    if (!el) {
      el = (range.startContainer.nodeType === Node.TEXT_NODE
        ? range.startContainer.parentElement
        : range.startContainer) as HTMLElement | null;
    }

    if (el) {
      if (el.style.fontFamily) {
        return el.style.fontFamily.replace(/['"]/g, "").split(",")[0].trim();
      }
      const computed = window.getComputedStyle(el);
      if (computed.fontFamily) {
        return computed.fontFamily.replace(/['"]/g, "").split(",")[0].trim();
      }
    }
  } catch {
    // fallback
  }

  return "Calibri";
}

/**
 * Increments or decrements font size by delta on blocked text if selected.
 * Returns the new font size, or null if no text was blocked.
 */
export function stepSelectionFontSize(delta: number): number | null {
  if (!isTextSelected()) return null;
  const current = getSelectionFontSize();
  const next = Math.max(7, Math.min(72, Math.round((current + delta) * 2) / 2));
  const success = applyInlineStyleToSelection({ "font-size": `${next}pt` });
  return success ? next : null;
}

/**
 * Changes letter casing of blocked text (UPPERCASE -> lowercase -> Capitalize).
 */
export function changeSelectionCase(): boolean {
  const range = getEffectiveSelectionRange();
  if (!range || range.collapsed) return false;

  const textNodes = getTextNodesInRange(range);
  if (textNodes.length === 0) return false;

  const fullText = textNodes.map((n) => n.textContent || "").join("");
  if (!fullText) return false;

  pushEditorHistory("change-case");

  const isAllUpper = fullText === fullText.toUpperCase();
  const isAllLower = fullText === fullText.toLowerCase();

  let transformFn: (s: string) => string;
  if (isAllUpper) {
    transformFn = (s) => s.toLowerCase();
  } else if (isAllLower) {
    // Capitalize Each Word
    transformFn = (s) =>
      s.replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  } else {
    transformFn = (s) => s.toUpperCase();
  }

  for (const textNode of textNodes) {
    if (textNode.textContent) {
      textNode.textContent = transformFn(textNode.textContent);
    }
  }

  return true;
}

/**
 * Clears formatting from selection (removes inline styles and un-wraps spans).
 */
export function clearFormattingFromSelection(): boolean {
  const range = getEffectiveSelectionRange();
  if (!range || range.collapsed) return false;

  pushEditorHistory("clear-format");

  try {
    document.execCommand("removeFormat");
    const paper = document.querySelector(".paper-document");
    if (paper) {
      const formatted = paper.querySelectorAll(".word-formatted-span");
      formatted.forEach((el) => {
        const span = el as HTMLElement;
        span.removeAttribute("style");
      });
    }
    return true;
  } catch {
    return false;
  }
}

const BLOCK_SELECTOR =
  "h1, h2, h3, h4, h5, h6, p, li, div.company-tagline, div.company-details, div.company-contact, div.reg-block-title, div.reg-block-row, div.doc-entity-name, div.doc-entity-address, div.doc-entity-contact, div.party-name, div.party-address, div.party-phone, div.party-tax, b.table-product-title, td, th";

/**
 * Maps a line-height multiplier (e.g., 1.0, 1.15, 1.5, 2.0) to a vertical gap in px.
 */
export function mapLineHeightToGapPx(lh: number): number {
  if (lh <= 1.0) return 0;
  if (lh <= 1.15) return 2;
  if (lh <= 1.25) return 4;
  if (lh <= 1.35) return 5;
  if (lh <= 1.5) return 8;
  if (lh <= 1.75) return 11;
  if (lh <= 2.0) return 14;
  return Math.max(0, Math.round((lh - 1.0) * 14));
}

/**
 * Applies line-height and paragraph/line vertical spacing to the currently blocked/selected text.
 * Works across letterhead lines (.company-name, .company-details, .company-contact),
 * paragraphs, list items, party cards, and table cells.
 */
export function applyLineSpacingToSelection(lh: number): {
  applied: boolean;
  isLetterhead: boolean;
  allLetterheadSelected: boolean;
  mappedSpacingPx: number;
} {
  const mappedSpacingPx = mapLineHeightToGapPx(lh);
  const range = getEffectiveSelectionRange();
  if (!range || range.collapsed) {
    return { applied: false, isLetterhead: false, allLetterheadSelected: false, mappedSpacingPx };
  }

  const paper = document.querySelector(".paper-document");
  if (!paper || !paper.contains(range.commonAncestorContainer)) {
    return { applied: false, isLetterhead: false, allLetterheadSelected: false, mappedSpacingPx };
  }

  pushEditorHistory("line-spacing");

  try {
    const textNodes = getTextNodesInRange(range);
    const blockSet = new Set<HTMLElement>();
    let isLetterhead = false;

    const addNodeBlocks = (node: Node) => {
      const el = (node.nodeType === Node.TEXT_NODE ? node.parentElement : node) as HTMLElement | null;
      if (!el) return;
      if (el.closest(".paper-letterhead-wrap, .letterhead-text")) {
        isLetterhead = true;
      }
      const block = el.closest(BLOCK_SELECTOR) as HTMLElement | null;
      if (block && paper.contains(block)) {
        blockSet.add(block);
      } else if (el !== paper && paper.contains(el)) {
        blockSet.add(el);
      }
    };

    if (textNodes.length > 0) {
      for (const tn of textNodes) {
        addNodeBlocks(tn);
      }
    } else {
      addNodeBlocks(range.startContainer);
    }

    if (blockSet.size === 0) {
      const ok = applyInlineStyleToSelection({ "line-height": String(lh) });
      return { applied: ok, isLetterhead, allLetterheadSelected: false, mappedSpacingPx };
    }

    let kopSelectedCount = 0;
    blockSet.forEach((blockEl) => {
      blockEl.setAttribute("data-custom-lh", String(lh));
      blockEl.setAttribute("data-custom-gap-px", String(mappedSpacingPx));
      blockEl.style.setProperty("line-height", String(lh), "important");

      if (
        blockEl.classList.contains("company-name") ||
        blockEl.classList.contains("company-tagline") ||
        blockEl.classList.contains("company-details") ||
        blockEl.classList.contains("company-contact")
      ) {
        kopSelectedCount++;
        blockEl.style.setProperty("margin-top", "0px", "important");
        blockEl.style.setProperty("margin-bottom", `${mappedSpacingPx}px`, "important");
      } else if (blockEl.tagName !== "TD" && blockEl.tagName !== "TH") {
        blockEl.style.setProperty("margin-top", "0px", "important");
        blockEl.style.setProperty("margin-bottom", `${mappedSpacingPx}px`, "important");
      }
    });

    // Restore selection so highlight stays active
    restoreActiveSelection();
    return {
      applied: true,
      isLetterhead,
      allLetterheadSelected: kopSelectedCount >= 4,
      mappedSpacingPx,
    };
  } catch (err) {
    console.warn("applyLineSpacingToSelection error:", err);
    return { applied: false, isLetterhead: false, allLetterheadSelected: false, mappedSpacingPx };
  }
}

/**
 * Steps the vertical spacing (in px) ONLY on the currently blocked/selected block(s)
 * without affecting unselected sibling lines below or above.
 */
export function stepSelectedBlockSpacingPx(deltaPx: number, fallbackPx = 2): {
  applied: boolean;
  allLetterheadSelected: boolean;
  nextPx: number;
} {
  const range = getEffectiveSelectionRange();
  if (!range || range.collapsed) {
    return { applied: false, allLetterheadSelected: false, nextPx: fallbackPx };
  }

  const paper = document.querySelector(".paper-document");
  if (!paper || !paper.contains(range.commonAncestorContainer)) {
    return { applied: false, allLetterheadSelected: false, nextPx: fallbackPx };
  }

  const textNodes = getTextNodesInRange(range);
  const blockSet = new Set<HTMLElement>();
  for (const tn of textNodes) {
    const el = tn.parentElement;
    if (!el) continue;
    const block = el.closest(BLOCK_SELECTOR) as HTMLElement | null;
    if (block && paper.contains(block)) {
      blockSet.add(block);
    }
  }

  if (blockSet.size === 0) {
    return { applied: false, allLetterheadSelected: false, nextPx: fallbackPx };
  }

  pushEditorHistory("block-gap-px");

  let nextPx = fallbackPx;
  let kopCount = 0;

  Array.from(blockSet).forEach((blockEl, idx) => {
    const customGap = blockEl.getAttribute("data-custom-gap-px");
    const currentMb = parseFloat(blockEl.style.marginBottom || "");
    const basePx =
      customGap !== null && !isNaN(parseFloat(customGap))
        ? parseFloat(customGap)
        : !isNaN(currentMb)
          ? currentMb
          : fallbackPx;
    const computedNext = Math.max(0, Math.min(28, Math.round(basePx + deltaPx)));
    if (idx === 0) nextPx = computedNext;

    const lh = Number((1.1 + computedNext * 0.05).toFixed(2));
    blockEl.setAttribute("data-custom-gap-px", String(computedNext));
    blockEl.setAttribute("data-custom-lh", String(lh));
    blockEl.style.setProperty("line-height", String(lh), "important");
    blockEl.style.setProperty("margin-top", "0px", "important");
    blockEl.style.setProperty("margin-bottom", `${computedNext}px`, "important");

    if (
      blockEl.classList.contains("company-name") ||
      blockEl.classList.contains("company-tagline") ||
      blockEl.classList.contains("company-details") ||
      blockEl.classList.contains("company-contact")
    ) {
      kopCount++;
    }
  });

  restoreActiveSelection();
  return {
    applied: true,
    allLetterheadSelected: kopCount >= 4,
    nextPx,
  };
}

/**
 * Detects the line-height of the currently selected text/block.
 */
export function getSelectionLineHeight(): number | null {
  if (typeof window === "undefined") return null;
  const range = getEffectiveSelectionRange();
  if (!range) return null;

  try {
    const el = (range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer.parentElement
      : range.startContainer) as HTMLElement | null;
    if (!el) return null;

    const block = (el.closest(BLOCK_SELECTOR) as HTMLElement | null) || el;
    const customAttr = block.getAttribute("data-custom-lh");
    if (customAttr) {
      const parsed = parseFloat(customAttr);
      if (!isNaN(parsed)) return parsed;
    }

    if (block.style.lineHeight) {
      const val = parseFloat(block.style.lineHeight);
      if (!isNaN(val) && val > 0 && val < 5) {
        return Math.round(val * 100) / 100;
      }
    }

    const computed = window.getComputedStyle(block);
    const lhPx = parseFloat(computed.lineHeight);
    const fsPx = parseFloat(computed.fontSize);
    if (!isNaN(lhPx) && !isNaN(fsPx) && fsPx > 0) {
      const ratio = Math.round((lhPx / fsPx) * 20) / 20;
      if (ratio >= 0.8 && ratio <= 4.0) return ratio;
    }
  } catch {
    // ignore
  }
  return null;
}

// ============================================================================
// MICROSOFT WORD PARAGRAPH & BOX SPACING (SPASI ATAS / SPASI BAWAH)
// Allows fine-grained Space Before & Space After on any selection, block, cell or total bar
// ============================================================================

const EXTENDED_SPACING_BLOCK_SELECTOR =
  "h1, h2, h3, h4, h5, h6, p, li, .unlk-total-bar, .unlk-cell, .unlk-val, .unlk-val-bold, .unlk-lbl, .unlk-item-spec, .company-name, .company-tagline, .company-details, .company-contact, td, th, tr, div.doc-box, div.contract-party-card, div.unlk-subrow-2col";

export function getTargetBlocksForSpacing(): HTMLElement[] {
  const paper = document.querySelector(".paper-document");
  if (!paper) return [];

  // 1. Text selection range in document
  const range = getEffectiveSelectionRange();
  if (range && paper.contains(range.commonAncestorContainer)) {
    if (!range.collapsed) {
      const textNodes = getTextNodesInRange(range);
      const blockSet = new Set<HTMLElement>();
      for (const tn of textNodes) {
        const el = tn.parentElement;
        if (!el) continue;
        const block = (el.closest(EXTENDED_SPACING_BLOCK_SELECTOR) as HTMLElement | null) || el;
        if (block && paper.contains(block)) {
          blockSet.add(block);
        }
      }
      if (blockSet.size > 0) return Array.from(blockSet);
    } else {
      const node = range.startContainer;
      const el = node instanceof Element ? node : node?.parentElement;
      const block = (el?.closest(EXTENDED_SPACING_BLOCK_SELECTOR) as HTMLElement | null) || (el instanceof HTMLElement ? el : null);
      if (block && paper.contains(block)) {
        return [block];
      }
    }
  }

  // 2. Blocked / active table cells or boxes
  const selectedCells = Array.from(
    paper.querySelectorAll("td.table-cell-selected, th.table-cell-selected, td.active-cell, th.active-cell")
  ) as HTMLElement[];
  if (selectedCells.length > 0) return selectedCells;

  // 3. Active box (.unlk-total-bar, .unlk-cell, etc.)
  const activeBox =
    (window as any).__eksporflow_active_cell ||
    paper.querySelector(".unlk-total-bar.active-cell, .active-doc-box, .unlk-total-bar");
  if (activeBox && paper.contains(activeBox)) {
    return [activeBox as HTMLElement];
  }

  return [];
}

export function getElementSpacingBefore(el: HTMLElement): number {
  const custom = el.getAttribute("data-space-before");
  if (custom !== null && !isNaN(parseFloat(custom))) return parseFloat(custom);
  const cs = window.getComputedStyle(el);
  const isBox =
    el.tagName === "TD" ||
    el.tagName === "TH" ||
    el.classList.contains("unlk-cell") ||
    el.classList.contains("unlk-total-bar");
  const val = isBox ? cs.paddingTop : cs.marginTop;
  return Math.round(parseFloat(val) || 0);
}

export function getElementSpacingAfter(el: HTMLElement): number {
  const custom = el.getAttribute("data-space-after");
  if (custom !== null && !isNaN(parseFloat(custom))) return parseFloat(custom);
  const cs = window.getComputedStyle(el);
  const isBox =
    el.tagName === "TD" ||
    el.tagName === "TH" ||
    el.classList.contains("unlk-cell") ||
    el.classList.contains("unlk-total-bar");
  const val = isBox ? cs.paddingBottom : cs.marginBottom;
  return Math.round(parseFloat(val) || 0);
}

export function getSelectionSpacingBefore(): number {
  const targets = getTargetBlocksForSpacing();
  if (targets.length === 0) return 4;
  return getElementSpacingBefore(targets[0]);
}

export function getSelectionSpacingAfter(): number {
  const targets = getTargetBlocksForSpacing();
  if (targets.length === 0) return 4;
  return getElementSpacingAfter(targets[0]);
}

export function adjustSelectionSpacing(
  type: "before" | "after",
  deltaOrValue: number,
  isAbsolute = false
): {
  applied: boolean;
  valuePx: number;
} {
  const targets = getTargetBlocksForSpacing();
  if (targets.length === 0) {
    return { applied: false, valuePx: 0 };
  }

  pushEditorHistory(`spacing-${type}`);

  let resultVal = 0;
  targets.forEach((el, idx) => {
    const isBox =
      el.tagName === "TD" ||
      el.tagName === "TH" ||
      el.classList.contains("unlk-cell") ||
      el.classList.contains("unlk-total-bar");
    const current = type === "before" ? getElementSpacingBefore(el) : getElementSpacingAfter(el);
    const next = isAbsolute
      ? Math.max(0, Math.min(60, Math.round(deltaOrValue)))
      : Math.max(0, Math.min(60, Math.round(current + deltaOrValue)));
    if (idx === 0) resultVal = next;

    if (type === "before") {
      el.setAttribute("data-space-before", String(next));
      if (isBox) {
        el.style.setProperty("padding-top", `${next}px`, "important");
      } else {
        el.style.setProperty("margin-top", `${next}px`, "important");
      }
    } else {
      el.setAttribute("data-space-after", String(next));
      if (isBox) {
        el.style.setProperty("padding-bottom", `${next}px`, "important");
      } else {
        el.style.setProperty("margin-bottom", `${next}px`, "important");
      }
    }
  });

  return { applied: true, valuePx: resultVal };
}

// ============================================================================
// UNIFIED MICROSOFT WORD UNDO / REDO HISTORY ENGINE
// Tracks both DOM mutations inside .paper-document AND React Shipment state
// ============================================================================

export interface DomBlockSnapshot {
  histKey: string;
  innerHTML: string;
  styleAttr: string | null;
  customLh: string | null;
}

export interface EditorHistorySnapshot {
  key: string;
  timestamp: number;
  shipmentState: Record<string, any> | null;
  blocks: DomBlockSnapshot[];
}

const HISTORY_TRACKED_SELECTOR = [
  ".company-name",
  ".company-tagline",
  ".company-details",
  ".company-contact",
  ".letterhead-reg-block",
  ".doc-title-bar",
  ".doc-title-bar h2",
  ".doc-two-col-grid",
  ".doc-three-col-grid",
  ".doc-si-header-meta",
  ".doc-transport-row-strip",
  ".doc-contract-ref-bar",
  ".doc-preamble-text",
  ".doc-contract-parties-grid",
  ".contract-articles-wrapper",
  ".doc-witness-clause",
  "table.doc-table-pro",
  "table.bank-card-table",
  "table.doc-user-table",
  ".doc-instructions-box",
  ".doc-notes-box",
  ".sig-signed-for",
  ".sig-company-name",
  ".sig-signatory-name",
  ".sig-signatory-title",
  ".sig-header-txt",
  ".sig-name",
  ".sig-sub",
].join(", ");

const MAX_HISTORY_STEPS = 50;
let undoStack: EditorHistorySnapshot[] = [];
let redoStack: EditorHistorySnapshot[] = [];
let isRestoringHistory = false;
let lastPushKey = "";
let lastPushTimestamp = 0;

let getShipmentSnapshotFn: (() => Record<string, any> | null) | null = null;
let applyShipmentSnapshotFn: ((state: Record<string, any>) => void) | null = null;

/**
 * Registers callbacks from DocumentsModule so Undo/Redo can also snapshot and
 * restore React Shipment state alongside DOM inline formatting & text edits.
 */
export function registerShipmentHistoryBridge(
  getShipment: () => Record<string, any> | null,
  applyShipment: (state: Record<string, any>) => void
): () => void {
  getShipmentSnapshotFn = getShipment;
  applyShipmentSnapshotFn = applyShipment;
  return () => {
    if (getShipmentSnapshotFn === getShipment) getShipmentSnapshotFn = null;
    if (applyShipmentSnapshotFn === applyShipment) applyShipmentSnapshotFn = null;
  };
}

function notifyHistoryChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("eksporflow:history-change", {
      detail: {
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        undoCount: undoStack.length,
        redoCount: redoStack.length,
      },
    })
  );
}

function captureCurrentSnapshot(key = "manual"): EditorHistorySnapshot | null {
  const blocks: DomBlockSnapshot[] = [];
  const paper = typeof document !== "undefined" ? document.querySelector(".paper-document") : null;

  if (paper) {
    const elements = paper.querySelectorAll<HTMLElement>(HISTORY_TRACKED_SELECTOR);
    elements.forEach((el, idx) => {
      let histKey = el.getAttribute("data-hist-key");
      if (!histKey) {
        histKey = `${el.tagName.toLowerCase()}-${idx}`;
        el.setAttribute("data-hist-key", histKey);
      }
      blocks.push({
        histKey,
        innerHTML: el.innerHTML,
        styleAttr: el.getAttribute("style"),
        customLh: el.getAttribute("data-custom-lh"),
      });
    });
  }

  const rawShipment = getShipmentSnapshotFn ? getShipmentSnapshotFn() : null;
  const shipmentState = rawShipment ? { ...rawShipment } : null;

  if (!paper && !shipmentState) return null;

  return {
    key,
    timestamp: Date.now(),
    shipmentState,
    blocks,
  };
}

function applySnapshotToDom(snap: EditorHistorySnapshot): void {
  if (typeof document === "undefined") return;
  const paper = document.querySelector(".paper-document");
  if (!paper) return;

  const elements = paper.querySelectorAll<HTMLElement>(HISTORY_TRACKED_SELECTOR);
  elements.forEach((el, idx) => {
    if (!el.getAttribute("data-hist-key")) {
      el.setAttribute("data-hist-key", `${el.tagName.toLowerCase()}-${idx}`);
    }
  });

  snap.blocks.forEach((b, idx) => {
    const target =
      paper.querySelector<HTMLElement>(`[data-hist-key="${b.histKey}"]`) ||
      elements[idx];
    if (!target) return;

    if (!target.classList.contains("doc-title-bar") && target.innerHTML !== b.innerHTML) {
      target.innerHTML = b.innerHTML;
    }
    if (b.styleAttr !== null && b.styleAttr !== "") {
      target.setAttribute("style", b.styleAttr);
    } else {
      target.removeAttribute("style");
    }
    if (b.customLh !== null) {
      target.setAttribute("data-custom-lh", b.customLh);
    } else {
      target.removeAttribute("data-custom-lh");
    }
  });
}

/**
 * Records current editor state before a change is applied.
 */
export function pushEditorHistory(key = "edit"): void {
  if (isRestoringHistory) return;

  const now = Date.now();
  // Coalesce high-frequency updates with the same key (e.g., slider drag or rapid typing)
  const coalesceWindowMs = key.startsWith("shipment:") ? 250 : key === "typing" ? 750 : 50;
  if (key === lastPushKey && now - lastPushTimestamp < coalesceWindowMs && undoStack.length > 0) {
    lastPushTimestamp = now;
    return;
  }

  const snap = captureCurrentSnapshot(key);
  if (!snap) return;

  undoStack.push(snap);
  if (undoStack.length > MAX_HISTORY_STEPS) {
    undoStack.shift();
  }
  redoStack = [];
  lastPushKey = key;
  lastPushTimestamp = now;
  notifyHistoryChange();
}

/**
 * Undoes the most recent document change (DOM formatting, text edit, or Shipment setting).
 */
export function performEditorUndo(): boolean {
  if (undoStack.length === 0) {
    // Fallback to native browser undo if stack is empty
    try {
      if (typeof document !== "undefined") {
        return document.execCommand("undo", false);
      }
      return false;
    } catch {
      return false;
    }
  }

  isRestoringHistory = true;
  try {
    const currentSnap = captureCurrentSnapshot("current");
    const prevSnap = undoStack.pop()!;
    if (currentSnap) {
      redoStack.push(currentSnap);
    }

    if (prevSnap.shipmentState && applyShipmentSnapshotFn) {
      applyShipmentSnapshotFn(prevSnap.shipmentState);
    }

    applySnapshotToDom(prevSnap);
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => {
        applySnapshotToDom(prevSnap);
        isRestoringHistory = false;
      });
    } else {
      isRestoringHistory = false;
    }

    lastPushKey = "";
    notifyHistoryChange();
    return true;
  } catch (err) {
    console.warn("performEditorUndo error:", err);
    isRestoringHistory = false;
    return false;
  }
}

/**
 * Redoes the most recently undone document change.
 */
export function performEditorRedo(): boolean {
  if (redoStack.length === 0) {
    try {
      if (typeof document !== "undefined") {
        return document.execCommand("redo", false);
      }
      return false;
    } catch {
      return false;
    }
  }

  isRestoringHistory = true;
  try {
    const currentSnap = captureCurrentSnapshot("current");
    const nextSnap = redoStack.pop()!;
    if (currentSnap) {
      undoStack.push(currentSnap);
    }

    if (nextSnap.shipmentState && applyShipmentSnapshotFn) {
      applyShipmentSnapshotFn(nextSnap.shipmentState);
    }

    applySnapshotToDom(nextSnap);
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => {
        applySnapshotToDom(nextSnap);
        isRestoringHistory = false;
      });
    } else {
      isRestoringHistory = false;
    }

    lastPushKey = "";
    notifyHistoryChange();
    return true;
  } catch (err) {
    console.warn("performEditorRedo error:", err);
    isRestoringHistory = false;
    return false;
  }
}

export function canEditorUndo(): boolean {
  return undoStack.length > 0;
}

export function canEditorRedo(): boolean {
  return redoStack.length > 0;
}

export function resetEditorHistory(): void {
  undoStack = [];
  redoStack = [];
  lastPushKey = "";
  lastPushTimestamp = 0;
  notifyHistoryChange();
}

