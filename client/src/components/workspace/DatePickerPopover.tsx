import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react";

interface DatePickerPopoverProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  locale?: "ID" | "EN";
}

export function DatePickerPopover({
  selectedDate,
  onSelectDate,
  locale = "ID",
}: DatePickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
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
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const dayHeaders = locale === "ID"
    ? ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const currentYear = viewMonth.getFullYear();
  const currentMonth = viewMonth.getMonth();

  // First day of current view month & total days
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

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    onSelectDate(newDate);
    setIsOpen(false);
  };

  // Quick Presets
  const applyPreset = (preset: "today" | "yesterday" | "this_month") => {
    const now = new Date(2026, 10, 24); // Reference year 2026
    if (preset === "today") {
      onSelectDate(now);
      setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    } else if (preset === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      onSelectDate(yesterday);
      setViewMonth(new Date(yesterday.getFullYear(), yesterday.getMonth(), 1));
    } else if (preset === "this_month") {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      onSelectDate(firstOfMonth);
      setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    }
    setIsOpen(false);
  };

  const formattedSelected = new Intl.DateTimeFormat(locale === "ID" ? "id-ID" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(selectedDate);

  return (
    <div className="date-picker-wrapper" ref={containerRef} style={{ position: "relative" }}>
      {/* Trigger Button */}
      <button
        type="button"
        className="space-topbar-pill date-pill"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Pilih Tanggal Operasional Ekspor"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#FFFFFF",
          border: "1px solid #CBD5E1",
          borderRadius: 8,
          padding: "6px 12px",
          fontSize: 12.5,
          fontWeight: 500,
          color: "#0F172A",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        <Calendar size={13} style={{ color: "#475569" }} />
        <span>{formattedSelected}</span>
        <ChevronDown size={11} style={{ color: "#94A3B8" }} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className="date-picker-popover"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            width: 290,
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: 14,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
            zIndex: 150,
          }}
        >
          {/* Quick Presets Row */}
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: "1px solid #F1F5F9",
            }}
          >
            <button
              type="button"
              onClick={() => applyPreset("today")}
              style={{
                flex: 1,
                border: "1px solid #E2E8F0",
                background: "#F8FAFC",
                color: "#334155",
                borderRadius: 6,
                padding: "4px 6px",
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => applyPreset("yesterday")}
              style={{
                flex: 1,
                border: "1px solid #E2E8F0",
                background: "#F8FAFC",
                color: "#334155",
                borderRadius: 6,
                padding: "4px 6px",
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Kemarin
            </button>
            <button
              type="button"
              onClick={() => applyPreset("this_month")}
              style={{
                flex: 1,
                border: "1px solid #E2E8F0",
                background: "#F8FAFC",
                color: "#334155",
                borderRadius: 6,
                padding: "4px 6px",
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Bulan Ini
            </button>
          </div>

          {/* Month & Year Navigation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
              {monthNames[currentMonth]} {currentYear}
            </span>
            <div style={{ display: "flex", gap: 2 }}>
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Bulan sebelumnya"
                style={{
                  background: "transparent",
                  border: "none",
                  borderRadius: 6,
                  padding: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#475569",
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Bulan berikutnya"
                style={{
                  background: "transparent",
                  border: "none",
                  borderRadius: 6,
                  padding: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#475569",
                }}
              >
                <ChevronRight size={16} />
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
              marginBottom: 6,
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
              gap: 2,
              textAlign: "center",
            }}
          >
            {/* Empty offset cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} style={{ height: 30 }} />
            ))}

            {/* Days 1 to N */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(currentYear, currentMonth, day);
              const isSelected = isSameDay(dateObj, selectedDate);
              const isToday = isSameDay(dateObj, new Date(2026, 10, 24));

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  style={{
                    height: 30,
                    border: "none",
                    borderRadius: 6,
                    background: isSelected ? "#0F172A" : isToday ? "#F1F5F9" : "transparent",
                    color: isSelected ? "#FFFFFF" : isToday ? "#0F172A" : "#334155",
                    fontWeight: isSelected || isToday ? 600 : 400,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.1s ease",
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer note: Operational context */}
          <div
            style={{
              marginTop: 12,
              paddingTop: 8,
              borderTop: "1px solid #F1F5F9",
              fontSize: 11,
              color: "#64748B",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>Cut-off Pelayaran: <b>27 Nov '26</b></span>
            <span style={{ color: "#16A34A", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}>
              <Check size={11} /> Aktif
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
