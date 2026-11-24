import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export type SupportedLocale = "ID" | "EN" | "AR";

interface LanguageDropdownProps {
  currentLocale: SupportedLocale;
  onSelectLocale: (locale: SupportedLocale) => void;
}

// Crisp inline SVG flags that render beautifully on Windows, macOS, iOS, Android
function FlagIcon({ code }: { code: SupportedLocale }) {
  if (code === "ID") {
    return (
      <svg width="18" height="13" viewBox="0 0 18 13" style={{ borderRadius: 2, flexShrink: 0, boxShadow: "0 0 1px rgba(0,0,0,0.3)" }}>
        <rect width="18" height="6.5" fill="#E11D48" />
        <rect y="6.5" width="18" height="6.5" fill="#FFFFFF" />
      </svg>
    );
  }
  if (code === "EN") {
    return (
      <svg width="18" height="13" viewBox="0 0 18 13" style={{ borderRadius: 2, flexShrink: 0, boxShadow: "0 0 1px rgba(0,0,0,0.3)" }}>
        <rect width="18" height="13" fill="#B91C1C" />
        <rect y="2" width="18" height="2" fill="#FFFFFF" />
        <rect y="6" width="18" height="2" fill="#FFFFFF" />
        <rect y="10" width="18" height="2" fill="#FFFFFF" />
        <rect width="8" height="7" fill="#1D4ED8" />
        <circle cx="2" cy="2" r="0.6" fill="#FFFFFF" />
        <circle cx="5" cy="2" r="0.6" fill="#FFFFFF" />
        <circle cx="3.5" cy="4" r="0.6" fill="#FFFFFF" />
        <circle cx="2" cy="5.5" r="0.6" fill="#FFFFFF" />
        <circle cx="5" cy="5.5" r="0.6" fill="#FFFFFF" />
      </svg>
    );
  }
  // Saudi Arabia flag (green with white script/sword)
  return (
    <svg width="18" height="13" viewBox="0 0 18 13" style={{ borderRadius: 2, flexShrink: 0, boxShadow: "0 0 1px rgba(0,0,0,0.3)" }}>
      <rect width="18" height="13" fill="#15803D" />
      <path d="M 3 6.5 L 15 6.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 5 5 L 13 5" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M 4 8 L 14 8" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

export function LanguageDropdown({ currentLocale, onSelectLocale }: LanguageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const languages = [
    { code: "ID" as SupportedLocale, name: "Bahasa Indonesia", short: "ID" },
    { code: "EN" as SupportedLocale, name: "English (US)", short: "EN" },
    { code: "AR" as SupportedLocale, name: "العربية (Arabic)", short: "AR" },
  ];

  const current = languages.find((l) => l.code === currentLocale) || languages[0];

  return (
    <div className="language-dropdown-wrapper" ref={containerRef} style={{ position: "relative" }}>
      {/* Trigger Button */}
      <button
        type="button"
        className="space-btn-secondary"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Pilih Bahasa Sistem (ID / EN / AR)"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          background: "#FFFFFF",
          border: "1px solid #CBD5E1",
          borderRadius: 8,
          padding: "6px 11px",
          fontSize: 12.5,
          fontWeight: 500,
          color: "#0F172A",
          cursor: "pointer",
        }}
      >
        <FlagIcon code={current.code} />
        <span>{current.short}</span>
        <ChevronDown size={11} style={{ color: "#64748B" }} />
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            width: 205,
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 10,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
            padding: 5,
            zIndex: 300,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {languages.map((lang) => {
            const isSelected = lang.code === currentLocale;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  onSelectLocale(lang.code);
                  setIsOpen(false);
                }}
                style={{
                  border: "none",
                  background: isSelected ? "#F1F5F9" : "transparent",
                  color: isSelected ? "#0F172A" : "#334155",
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: 12.5,
                  padding: "8px 10px",
                  borderRadius: 6,
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "background 0.12s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <FlagIcon code={lang.code} />
                  <span>{lang.name}</span>
                </div>
                {isSelected && <Check size={13} style={{ color: "#2563EB" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
