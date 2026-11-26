import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react";

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
  presetKey: string;
}

interface DateRangePickerPopoverProps {
  selectedRange: DateRange;
  onSelectRange: (range: DateRange) => void;
  locale?: "ID" | "EN" | "AR";
}

export function DateRangePickerPopover({
  selectedRange,
  onSelectRange,
  locale = "ID",
}: DateRangePickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Temporary selection inside popover before clicking "Terapkan"
  const [tempStart, setTempStart] = useState<Date>(selectedRange.startDate);
  const [tempEnd, setTempEnd] = useState<Date>(selectedRange.endDate);
  const [tempPreset, setTempPreset] = useState<string>(selectedRange.presetKey);
  const [tempLabel, setTempLabel] = useState<string>(selectedRange.label);

  const [viewMonth, setViewMonth] = useState<Date>(
    new Date(selectedRange.endDate.getFullYear(), selectedRange.endDate.getMonth(), 1)
  );

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      setTempStart(selectedRange.startDate);
      setTempEnd(selectedRange.endDate);
      setTempPreset(selectedRange.presetKey);
      setTempLabel(selectedRange.label);
      setViewMonth(new Date(selectedRange.endDate.getFullYear(), selectedRange.endDate.getMonth(), 1));
    }
  }, [isOpen, selectedRange]);

  // Click outside listener
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

  const monthNames = locale === "ID"
    ? ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
    : locale === "AR"
    ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const dayHeaders = locale === "ID"
    ? ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
    : locale === "AR"
    ? ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const currentYear = viewMonth.getFullYear();
  const currentMonth = viewMonth.getMonth();

  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    setViewMonth(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewMonth(new Date(currentYear, currentMonth + 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isInRange = (date: Date) => {
    if (!tempStart || !tempEnd) return false;
    const t = date.getTime();
    const s = new Date(tempStart.getFullYear(), tempStart.getMonth(), tempStart.getDate()).getTime();
    const e = new Date(tempEnd.getFullYear(), tempEnd.getMonth(), tempEnd.getDate()).getTime();
    return t >= s && t <= e;
  };

  const getPresetLabel = (key: string) => {
    const dict: Record<string, Record<string, string>> = {
      today: { ID: "Hari Ini", EN: "Today", AR: "اليوم" },
      yesterday: { ID: "Kemarin", EN: "Yesterday", AR: "أمس" },
      last_7: { ID: "7 Hari Terakhir", EN: "Last 7 Days", AR: "آخر 7 أيام" },
      last_14: { ID: "14 Hari Terakhir", EN: "Last 14 Days", AR: "آخر 14 يوماً" },
      last_30: { ID: "30 Hari Terakhir", EN: "Last 30 Days", AR: "آخر 30 يوماً" },
      this_month: { ID: "Bulan Ini", EN: "This Month", AR: "هذا الشهر" },
      last_month: { ID: "Bulan Lalu", EN: "Last Month", AR: "الشهر الماضي" },
      max: { ID: "Sepanjang Waktu", EN: "Max Range", AR: "أقصى فترة" },
    };
    return dict[key]?.[locale] || dict[key]?.ID || key;
  };

  // Meta Ads presets list
  const presets = [
    { key: "today", label: getPresetLabel("today") },
    { key: "yesterday", label: getPresetLabel("yesterday") },
    { key: "last_7", label: getPresetLabel("last_7") },
    { key: "last_14", label: getPresetLabel("last_14") },
    { key: "last_30", label: getPresetLabel("last_30") },
    { key: "this_month", label: getPresetLabel("this_month") },
    { key: "last_month", label: getPresetLabel("last_month") },
    { key: "max", label: getPresetLabel("max") },
  ];

  const applyPreset = (key: string) => {
    const baseToday = new Date(2026, 10, 24); // Reference 24 Nov 2026
    let s = new Date(baseToday);
    let e = new Date(baseToday);
    let lbl = getPresetLabel(key);

    switch (key) {
      case "today":
        break;
      case "yesterday":
        s.setDate(baseToday.getDate() - 1);
        e.setDate(baseToday.getDate() - 1);
        break;
      case "last_7":
        s.setDate(baseToday.getDate() - 6);
        break;
      case "last_14":
        s.setDate(baseToday.getDate() - 13);
        break;
      case "last_30":
        s.setDate(baseToday.getDate() - 29);
        break;
      case "this_month":
        s = new Date(2026, 10, 1);
        e = new Date(2026, 10, 24);
        break;
      case "last_month":
        s = new Date(2026, 9, 1);
        e = new Date(2026, 9, 31);
        break;
      case "max":
        s = new Date(2026, 0, 1);
        e = new Date(2026, 10, 24);
        break;
    }

    setTempStart(s);
    setTempEnd(e);
    setTempPreset(key);
    setTempLabel(lbl);
    setViewMonth(new Date(e.getFullYear(), e.getMonth(), 1));
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    if (!tempStart || (tempStart && tempEnd)) {
      // Start new selection
      setTempStart(clickedDate);
      setTempEnd(clickedDate);
      setTempPreset("custom");
      setTempLabel("Rentang Kustom");
    } else {
      // Complete range
      if (clickedDate < tempStart) {
        setTempEnd(tempStart);
        setTempStart(clickedDate);
      } else {
        setTempEnd(clickedDate);
      }
      setTempPreset("custom");
      setTempLabel("Rentang Kustom");
    }
  };

  const handleApply = () => {
    onSelectRange({
      startDate: tempStart,
      endDate: tempEnd,
      label: tempLabel,
      presetKey: tempPreset,
    });
    setIsOpen(false);
  };

  const formatDateDisplay = (date: Date) => {
    return new Intl.DateTimeFormat(locale === "ID" ? "id-ID" : locale === "AR" ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const rangeDaysCount = Math.round(
    Math.abs(tempEnd.getTime() - tempStart.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  return (
    <div className="date-range-picker-container" ref={containerRef} style={{ position: "relative" }}>
      {/* Trigger Button - Clean Meta Ads Filter Style */}
      <button
        type="button"
        className="space-btn-secondary"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Pilih Rentang Waktu Transaksi (Gaya Meta Ads)"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          background: "#FFFFFF",
          border: "1px solid #CBD5E1",
          borderRadius: 8,
          padding: "7px 13px",
          fontSize: 12.5,
          fontWeight: 500,
          color: "#0F172A",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <Calendar size={13} style={{ color: "#2563EB" }} />
        <span>
          {selectedRange.presetKey !== "custom"
            ? `${getPresetLabel(selectedRange.presetKey)}: ${formatDateDisplay(selectedRange.startDate)} - ${formatDateDisplay(selectedRange.endDate)}`
            : `${formatDateDisplay(selectedRange.startDate)} - ${formatDateDisplay(selectedRange.endDate)}`}
        </span>
        <ChevronDown size={11} style={{ color: "#64748B" }} />
      </button>

      {/* Popover Dropdown (Meta Ads Manager Style) */}
      {isOpen && (
        <div
          className="meta-date-popover"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 520,
            maxWidth: "92vw",
            background: "#FFFFFF",
            border: "1px solid #CBD5E1",
            borderRadius: 12,
            boxShadow: "0 15px 35px -5px rgba(0, 0, 0, 0.15), 0 5px 15px rgba(0, 0, 0, 0.07)",
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Main Body: Presets List (Left) + Interactive Calendar (Right) */}
          <div style={{ display: "flex", borderBottom: "1px solid #E2E8F0" }}>
            {/* Left Column: Preset List */}
            <div
              style={{
                width: 175,
                background: "#F8FAFC",
                borderRight: "1px solid #E2E8F0",
                padding: "10px 8px",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#64748B",
                  textTransform: "uppercase",
                  padding: "4px 8px",
                  letterSpacing: "0.05em",
                }}
              >
                {locale === "AR" ? "الفترة الزمنية" : locale === "EN" ? "Date Range" : "Rentang Waktu"}
              </span>
              {presets.map((p) => {
                const isActive = tempPreset === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => applyPreset(p.key)}
                    style={{
                      border: "none",
                      background: isActive ? "#0F172A" : "transparent",
                      color: isActive ? "#FFFFFF" : "#334155",
                      fontWeight: isActive ? 600 : 400,
                      fontSize: 12,
                      padding: "7px 10px",
                      borderRadius: 6,
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.12s ease",
                    }}
                  >
                    <span>{p.label}</span>
                    {isActive && <Check size={12} />}
                  </button>
                );
              })}
            </div>

            {/* Right Column: Month Calendar */}
            <div style={{ flex: 1, padding: "16px 18px" }}>
              {/* Month Header Navigation */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
                  {monthNames[currentMonth]} {currentYear}
                </span>
                <div style={{ display: "flex", gap: 3 }}>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    aria-label="Bulan sebelumnya"
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: 6,
                      padding: 4,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      color: "#334155",
                    }}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    aria-label="Bulan berikutnya"
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: 6,
                      padding: 4,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      color: "#334155",
                    }}
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>

              {/* Day Headers (Min, Sen, Sel, ...) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#94A3B8",
                  marginBottom: 8,
                }}
              >
                {dayHeaders.map((dh) => (
                  <span key={dh}>{dh}</span>
                ))}
              </div>

              {/* Days Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "3px 0",
                  textAlign: "center",
                }}
              >
                {/* Empty offset cells */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} style={{ height: 28 }} />
                ))}

                {/* Days 1 to N */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateObj = new Date(currentYear, currentMonth, day);
                  const isStart = isSameDay(dateObj, tempStart);
                  const isEnd = isSameDay(dateObj, tempEnd);
                  const inRange = isInRange(dateObj);

                  let bg = "transparent";
                  let color = "#334155";
                  let borderRadius = "0";

                  if (isStart && isEnd) {
                    bg = "#0F172A";
                    color = "#FFFFFF";
                    borderRadius = "6px";
                  } else if (isStart) {
                    bg = "#0F172A";
                    color = "#FFFFFF";
                    borderRadius = "6px 0 0 6px";
                  } else if (isEnd) {
                    bg = "#0F172A";
                    color = "#FFFFFF";
                    borderRadius = "0 6px 6px 0";
                  } else if (inRange) {
                    bg = "#EFF6FF"; // Soft blue range tint
                    color = "#1D4ED8";
                  }

                  return (
                    <button
                      key={`day-${day}`}
                      type="button"
                      onClick={() => handleDateClick(day)}
                      style={{
                        height: 28,
                        border: "none",
                        background: bg,
                        color: color,
                        fontWeight: isStart || isEnd ? 600 : 400,
                        fontSize: 12,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: borderRadius,
                        transition: "all 0.1s ease",
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Bar: Range Summary + Batal / Terapkan Buttons */}
          <div
            style={{
              padding: "10px 16px",
              background: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 12, color: "#475569" }}>
              <span style={{ color: "#64748B" }}>{locale === "AR" ? "المحدد: " : locale === "EN" ? "Selected: " : "Terpilih: "}</span>
              <strong style={{ color: "#0F172A" }}>
                {formatDateDisplay(tempStart)} - {formatDateDisplay(tempEnd)}
              </strong>
              <span style={{ color: "#2563EB", marginLeft: 6, fontWeight: 500 }}>
                ({rangeDaysCount} {locale === "AR" ? "أيام" : locale === "EN" ? "days" : "hari"})
              </span>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="space-btn-secondary"
                onClick={() => setIsOpen(false)}
                style={{ padding: "5px 12px", fontSize: 12 }}
              >
                {locale === "AR" ? "إلغاء" : locale === "EN" ? "Cancel" : "Batal"}
              </button>
              <button
                type="button"
                className="space-btn-primary"
                onClick={handleApply}
                style={{ padding: "5px 14px", fontSize: 12 }}
              >
                {locale === "AR" ? "تطبيق" : locale === "EN" ? "Apply" : "Terapkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
