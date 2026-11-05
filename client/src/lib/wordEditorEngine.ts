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
          const nodeRange = document.createRange();
          nodeRange.selectNodeContents(node);
          const isAfterStart = range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0;
          const isBeforeEnd = range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0;
          return isAfterStart && isBeforeEnd ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
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
    const el = (range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer.parentElement
      : range.startContainer) as HTMLElement | null;

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
    const el = (range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer.parentElement
      : range.startContainer) as HTMLElement | null;

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
  "h1, h2, h3, h4, h5, h6, p, li, div.company-details, div.company-contact, div.doc-entity-name, div.doc-entity-address, div.doc-entity-contact, div.party-name, div.party-address, div.party-phone, div.party-tax, b.table-product-title, td, th";

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
  mappedSpacingPx: number;
} {
  const mappedSpacingPx = mapLineHeightToGapPx(lh);
  const range = getEffectiveSelectionRange();
  if (!range || range.collapsed) {
    return { applied: false, isLetterhead: false, mappedSpacingPx };
  }

  const paper = document.querySelector(".paper-document");
  if (!paper || !paper.contains(range.commonAncestorContainer)) {
    return { applied: false, isLetterhead: false, mappedSpacingPx };
  }

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
      addNodeBlocks(range.endContainer);
    }

    // If selection is inside letterhead, include all selected letterhead lines
    if (isLetterhead) {
      const kopWrap = paper.querySelector(".letterhead-text");
      if (kopWrap) {
        const kopBlocks = kopWrap.querySelectorAll<HTMLElement>(".company-name, .company-details, .company-contact");
        kopBlocks.forEach((kb) => {
          try {
            if (range.intersectsNode(kb)) {
              blockSet.add(kb);
            }
          } catch {
            blockSet.add(kb);
          }
        });
      }
    }

    if (blockSet.size === 0) {
      const ok = applyInlineStyleToSelection({ "line-height": String(lh) });
      return { applied: ok, isLetterhead, mappedSpacingPx };
    }

    blockSet.forEach((blockEl) => {
      blockEl.setAttribute("data-custom-lh", String(lh));
      blockEl.style.setProperty("line-height", String(lh), "important");

      if (blockEl.classList.contains("company-name")) {
        blockEl.style.setProperty("margin-top", "0px", "important");
        blockEl.style.setProperty("margin-bottom", `${mappedSpacingPx}px`, "important");
      } else if (
        blockEl.classList.contains("company-details") ||
        blockEl.classList.contains("company-contact")
      ) {
        blockEl.style.setProperty("margin-top", `${mappedSpacingPx}px`, "important");
        blockEl.style.setProperty("margin-bottom", "0px", "important");
      } else if (blockEl.tagName !== "TD" && blockEl.tagName !== "TH") {
        blockEl.style.setProperty("margin-top", `${Math.max(0, Math.round(mappedSpacingPx * 0.5))}px`, "important");
        blockEl.style.setProperty("margin-bottom", `${mappedSpacingPx}px`, "important");
      }
    });

    // Restore selection so highlight stays active
    restoreActiveSelection();
    return { applied: true, isLetterhead, mappedSpacingPx };
  } catch (err) {
    console.warn("applyLineSpacingToSelection error:", err);
    return { applied: false, isLetterhead: false, mappedSpacingPx };
  }
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
