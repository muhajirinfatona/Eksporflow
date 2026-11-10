import React, { useRef, useState, useEffect } from "react";
import type { DocumentShape } from "@shared/shipment";
import { Trash2 } from "lucide-react";

interface DocumentShapeItemProps {
  shape: DocumentShape;
  isEditMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onUpdateText: (text: string) => void;
  onDelete: () => void;
  onUpdatePosition: (x: number, y: number) => void;
  onUpdateSize: (width: number, height: number) => void;
}

export function DocumentShapeItem({
  shape,
  isEditMode,
  isSelected,
  onSelect,
  onUpdateText,
  onDelete,
  onUpdatePosition,
  onUpdateSize,
}: DocumentShapeItemProps) {
  const shapeRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [currentSize, setCurrentSize] = useState<{ w: number; h: number }>({
    w: shape.width,
    h: shape.height,
  });

  // Sync size with prop
  useEffect(() => {
    setCurrentSize({ w: shape.width, h: shape.height });
  }, [shape.width, shape.height]);

  // Drag Move
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    if ((e.target as HTMLElement).classList.contains("shape-resize-handle")) return;
    if ((e.target as HTMLElement).isContentEditable) return;
    e.stopPropagation();
    onSelect();
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = shape.x || 0;
    const initialY = shape.y || 0;
    let finalX = initialX;
    let finalY = initialY;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      finalX = Math.round(initialX + dx);
      finalY = Math.round(initialY + dy);
      setDragOffset({ x: finalX, y: finalY });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      setIsDragging(false);
      onUpdatePosition(finalX, finalY);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Resize Corner Handle
  const handleResizeStart = (e: React.MouseEvent, corner: "se" | "sw" | "e" | "s") => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditMode) return;
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialW = currentSize.w;
    const initialH = currentSize.h;
    let finalW = initialW;
    let finalH = initialH;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (corner === "se" || corner === "e") {
        finalW = Math.max(60, Math.min(750, Math.round(initialW + dx)));
      }
      if (corner === "se" || corner === "s") {
        finalH = Math.max(20, Math.min(300, Math.round(initialH + dy)));
      }
      setCurrentSize({ w: finalW, h: finalH });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      setIsResizing(false);
      onUpdateSize(finalW, finalH);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const posX = isDragging ? dragOffset.x : shape.x || 0;
  const posY = isDragging ? dragOffset.y : shape.y || 0;

  // Compute border-radius by type
  const borderRadius =
    shape.type === "pill"
      ? "9999px"
      : shape.type === "rounded"
      ? "10px"
      : shape.type === "callout"
      ? "6px"
      : shape.type === "line"
      ? "0px"
      : "2px";

  return (
    <div
      ref={shapeRef}
      className={`doc-word-shape-item ${isEditMode ? "editable" : ""} ${isSelected ? "selected" : ""}`}
      onClick={(e) => {
        if (isEditMode) {
          e.stopPropagation();
          onSelect();
        }
      }}
      onMouseDown={handleMouseDown}
      style={{
        position: "relative",
        display: shape.type === "line" ? "block" : "inline-flex",
        alignItems: "center",
        justifyContent:
          shape.textAlign === "center"
            ? "center"
            : shape.textAlign === "right"
            ? "flex-end"
            : "flex-start",
        width: `${currentSize.w}px`,
        minHeight: `${currentSize.h}px`,
        maxWidth: "100%",
        transform: `translate(${posX}px, ${posY}px)`,
        backgroundColor: shape.fillColor,
        border:
          shape.type === "line"
            ? "none"
            : `${shape.borderWidth}px ${shape.borderStyle} ${shape.borderColor}`,
        borderBottom:
          shape.type === "line"
            ? `${shape.borderWidth}px ${shape.borderStyle} ${shape.borderColor}`
            : undefined,
        borderRadius,
        padding: shape.type === "line" ? "0" : "6px 12px",
        margin: "4px 0",
        cursor: isEditMode ? (isDragging ? "grabbing" : "grab") : "default",
        boxSizing: "border-box",
        zIndex: isSelected ? 35 : 10,
        boxShadow:
          isSelected && isEditMode
            ? "0 0 0 1.5px #2563eb, 0 3px 10px rgba(37,99,235,0.2)"
            : undefined,
      }}
    >
      {/* Editable Text Inside Shape (Seperti di MS Word) */}
      {shape.type !== "line" && (
        <div
          ref={textRef}
          contentEditable={isEditMode}
          suppressContentEditableWarning
          onBlur={(e) => {
            const nextText = e.currentTarget.innerText.trim();
            onUpdateText(nextText || "Ketik teks di sini...");
          }}
          onMouseDown={(e) => {
            if (isEditMode) e.stopPropagation();
          }}
          style={{
            width: "100%",
            color: shape.textColor || "#0f172a",
            fontSize: `${shape.fontSize || 10.5}pt`,
            fontWeight: shape.fontWeight || "normal",
            textAlign: shape.textAlign || "left",
            lineHeight: 1.25,
            outline: "none",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif",
            cursor: isEditMode ? "text" : "default",
          }}
        >
          {shape.text || "Ketik teks di sini..."}
        </div>
      )}

      {/* MS Word Selection Handles & Quick Delete button */}
      {isEditMode && isSelected && (
        <>
          <span
            className="shape-resize-handle se no-print"
            onMouseDown={(e) => handleResizeStart(e, "se")}
            title="Tarik sudut untuk mengubah ukuran bentuk"
          />
          <span
            className="shape-resize-handle e no-print"
            onMouseDown={(e) => handleResizeStart(e, "e")}
            title="Tarik ke kanan untuk mengubah lebar bentuk"
          />
          <span
            className="shape-resize-handle s no-print"
            onMouseDown={(e) => handleResizeStart(e, "s")}
            title="Tarik ke bawah untuk mengubah tinggi bentuk"
          />

          <button
            type="button"
            className="shape-delete-btn no-print"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Hapus Bentuk Ini (Delete)"
            style={{
              position: "absolute",
              top: "-10px",
              right: "-10px",
              width: "20px",
              height: "20px",
              background: "#ffffff",
              border: "1px solid #ef4444",
              borderRadius: "50%",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(220,38,38,0.25)",
              cursor: "pointer",
              zIndex: 40,
            }}
          >
            <Trash2 size={11} />
          </button>
        </>
      )}
    </div>
  );
}
