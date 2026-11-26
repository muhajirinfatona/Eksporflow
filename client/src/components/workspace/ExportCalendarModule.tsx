import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  MapPin,
  Building2,
  AlertCircle,
  Ship,
  Package,
  FileText,
  DollarSign,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  Users,
} from "lucide-react";
import {
  SpaceButton,
  SpaceBadge,
  SpaceInput,
  SpaceSelect,
} from "./Primitives";
import { toast } from "sonner";
import type { ScreenId } from "@shared/risk";

export interface ExportPlan {
  id: string;
  title: string;
  category: "stuffing" | "vessel" | "peb" | "finance" | "inspection" | "meeting";
  date: string; // YYYY-MM-DD
  time?: string;
  buyerOrPo?: string;
  location?: string;
  priority: "high" | "medium" | "low";
  status: "planned" | "completed";
  notes?: string;
}

export type PeriodFilterKey = "today" | "yesterday" | "7days" | "this_month" | "last_month" | "custom";

interface UnifiedTxSimple {
  id: string;
  reference?: string;
  buyer?: string;
  buyerCountry?: string;
  product?: string;
}

interface ExportCalendarModuleProps {
  allTransactions?: UnifiedTxSimple[];
  onNavigate?: (screen: ScreenId) => void;
  onSelectBuyer?: (buyerName: string) => void;
}

// Initial realistic export plans for simulation
const INITIAL_EXPORT_PLANS: ExportPlan[] = [
  {
    id: "plan-1",
    title: "Stuffing 40HC Kopi Arabika Gayo",
    category: "stuffing",
    date: "2026-11-05",
    time: "08:30 WIB",
    buyerOrPo: "Global Coffee LLC / PO-2026/US/089",
    location: "Gudang Konsolidasi Belawan",
    priority: "high",
    status: "completed",
    notes: "Selesai muat 320 karung goni (@60kg), segel seal line terpasang.",
  },
  {
    id: "plan-2",
    title: "ETD KM Nusantara menuju Port of Tokyo",
    category: "vessel",
    date: "2026-11-12",
    time: "14:00 WIB",
    buyerOrPo: "Marubeni Specialty Foods / PO-2026/TYO/04",
    location: "Dermaga 102 Pelabuhan Belawan",
    priority: "high",
    status: "completed",
    notes: "Kapal bertolak tepat waktu, estimasi transit Singapura 2 hari.",
  },
  {
    id: "plan-3",
    title: "Closing PEB DJBC & Pengajuan e-SKA Form D",
    category: "peb",
    date: "2026-11-18",
    time: "16:00 WIB",
    buyerOrPo: "Siam Bio Agro Co. / INQ-2026/BKK/08",
    location: "Portal Ceisa 4.0 Bea Cukai",
    priority: "high",
    status: "completed",
    notes: "NPE (Nota Pelayanan Ekspor) telah terbit tanpa kendala jalur hijau.",
  },
  {
    id: "plan-4",
    title: "Jatuh Tempo Pelunasan 70% L/C",
    category: "finance",
    date: "2026-11-22",
    time: "11:00 WIB",
    buyerOrPo: "Nordic Pantry AB / NEG-2026/SWE/01",
    location: "Bank Mandiri Cabang Ekspor Impor",
    priority: "high",
    status: "completed",
    notes: "Dokumen B/L, Invoice, dan COO telah di-endorse ke advising bank.",
  },
  {
    id: "plan-5",
    title: "Review & Validasi Draft Bill of Lading (B/L)",
    category: "peb",
    date: "2026-11-23",
    time: "15:00 WIB",
    buyerOrPo: "Hamburg Roasters B.V. / PO-2026/DEU/12",
    location: "Kantor Pelayaran Maersk Line",
    priority: "medium",
    status: "completed",
    notes: "Draft B/L telah diverifikasi, shipper name dan consignee sudah klop.",
  },
  {
    id: "plan-6",
    title: "ETA Vessel KM Meratus di Hub Port Singapura & Sandar",
    category: "vessel",
    date: "2026-11-24",
    time: "10:00 WIB",
    buyerOrPo: "Olam International Ltd / PO-2026/SIN/01",
    location: "Port of Singapore PSA",
    priority: "high",
    status: "planned",
    notes: "Kargo transit untuk transshipment ke kapal feeder rute lanjutan.",
  },
  {
    id: "plan-7",
    title: "Final Check Kemasan & Uji Kadar Air Briket Kelapa",
    category: "stuffing",
    date: "2026-11-24",
    time: "13:30 WIB",
    buyerOrPo: "Al-Barakah Global Trading / INQ-2026/DXB/03",
    location: "Pabrik Briket Kelapa Gresik, Jatim",
    priority: "medium",
    status: "planned",
    notes: "Pastikan kadar air di bawah 6% dan sertifikat self-heating ready.",
  },
  {
    id: "plan-8",
    title: "Inspeksi Karantina & Fumigasi Muatan Kayu Rotan",
    category: "inspection",
    date: "2026-11-26",
    time: "09:00 WIB",
    buyerOrPo: "Van Dijk Furniture BV / QUO-2026/AMS/07",
    location: "Depo Kontainer Tanjung Emas Semarang",
    priority: "high",
    status: "planned",
    notes: "Fumigasi Methyl Bromide dan penerbitan Phytosanitary Certificate.",
  },
  {
    id: "plan-9",
    title: "Rapat Koordinasi Kontrak Ulang Ekspor Q1 2027",
    category: "meeting",
    date: "2026-11-28",
    time: "14:00 WIB",
    buyerOrPo: "Siam Bio Agro Co. / Thailand",
    location: "Zoom Video Conference",
    priority: "medium",
    status: "planned",
    notes: "Penyelarasan kuota pasokan minyak atsiri nilam untuk kuartal pertama.",
  },
  {
    id: "plan-10",
    title: "Estimasi Kargo Tiba (ETA) di Pelabuhan Rotterdam",
    category: "vessel",
    date: "2026-11-30",
    time: "17:00 WIB",
    buyerOrPo: "Van Dijk Furniture BV / Belanda",
    location: "Port of Rotterdam (Maasvlakte)",
    priority: "high",
    status: "planned",
    notes: "Kargo CFR tiba di pelabuhan tujuan, koordinasi serah terima dengan buyer.",
  },
  {
    id: "plan-11",
    title: "Audit Kesiapan Sertifikasi Halal & HACCP Pabrik",
    category: "inspection",
    date: "2026-10-15",
    time: "09:00 WIB",
    buyerOrPo: "Umum / Semua Pesanan Ekspor",
    location: "Pabrik Pengolahan Kopi Takengon",
    priority: "medium",
    status: "completed",
    notes: "Sertifikasi ISO 22000 & Halal resmi diperpanjang.",
  },
  {
    id: "plan-12",
    title: "Penerimaan DP 30% Kontrak Ekspor Kopi",
    category: "finance",
    date: "2026-10-28",
    time: "10:30 WIB",
    buyerOrPo: "Global Coffee LLC / Amerika Serikat",
    location: "Rekening Escrow Bank Mandiri",
    priority: "high",
    status: "completed",
    notes: "Dana DP $17,100 telah masuk rekening valas USD perusahaan.",
  },
];

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_NAMES_ID = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"];

const CATEGORY_METAS = {
  stuffing: {
    label: "Stuffing & Muat",
    icon: Package,
    color: "#059669",
    bgColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  vessel: {
    label: "Kapal & Pelayaran",
    icon: Ship,
    color: "#0284C7",
    bgColor: "#F0F9FF",
    borderColor: "#BAE6FD",
  },
  peb: {
    label: "Dokumen & PEB",
    icon: FileText,
    color: "#D97706",
    bgColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  finance: {
    label: "Finansial & L/C",
    icon: DollarSign,
    color: "#7C3AED",
    bgColor: "#F5F3FF",
    borderColor: "#DDD6FE",
  },
  inspection: {
    label: "Inspeksi & Mutu",
    icon: AlertCircle,
    color: "#E11D48",
    bgColor: "#FFF1F2",
    borderColor: "#FECDD3",
  },
  meeting: {
    label: "Rapat & Negosiasi",
    icon: Users,
    color: "#475569",
    bgColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
};

export function ExportCalendarModule({
  allTransactions = [],
  onNavigate,
  onSelectBuyer,
}: ExportCalendarModuleProps) {
  // Calendar base reference: November 2026 (today = 24 Nov 2026)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(10); // 10 = November (0-indexed)
  const [selectedDate, setSelectedDate] = useState<string>("2026-11-24");

  // Filter Period Key
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterKey>("this_month");
  
  // Custom range dates
  const [customStartDate, setCustomStartDate] = useState<string>("2026-11-20");
  const [customEndDate, setCustomEndDate] = useState<string>("2026-11-27");

  // Plan search and status filter
  const [planStatusFilter, setPlanStatusFilter] = useState<"ALL" | "planned" | "completed">("ALL");
  const [planSearchQuery, setPlanSearchQuery] = useState("");

  // Modal State for adding/scheduling a plan
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newPlanCategory, setNewPlanCategory] = useState<ExportPlan["category"]>("stuffing");
  const [newPlanDate, setNewPlanDate] = useState("2026-11-24");
  const [newPlanTime, setNewPlanTime] = useState("09:00 WIB");
  const [newPlanBuyer, setNewPlanBuyer] = useState("");
  const [newPlanLocation, setNewPlanLocation] = useState("");
  const [newPlanPriority, setNewPlanPriority] = useState<"high" | "medium" | "low">("high");
  const [newPlanNotes, setNewPlanNotes] = useState("");

  // Stored Plans with LocalStorage Persistence
  const [plans, setPlans] = useState<ExportPlan[]>(() => {
    try {
      const saved = localStorage.getItem("eksporflow_export_plans");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_EXPORT_PLANS;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("eksporflow_export_plans", JSON.stringify(plans));
    } catch {
      // ignore
    }
  }, [plans]);

  // Handle preset period filter selection
  const handleSelectPeriod = (key: PeriodFilterKey) => {
    setPeriodFilter(key);
    if (key === "today") {
      setCurrentYear(2026);
      setCurrentMonth(10);
      setSelectedDate("2026-11-24");
      toast.info("Filter aktif: Hari Ini (24 Nov 2026)");
    } else if (key === "yesterday") {
      setCurrentYear(2026);
      setCurrentMonth(10);
      setSelectedDate("2026-11-23");
      toast.info("Filter aktif: Kemarin (23 Nov 2026)");
    } else if (key === "7days") {
      setCurrentYear(2026);
      setCurrentMonth(10);
      toast.info("Filter aktif: 7 Hari / Mingguan (21 - 27 Nov 2026)");
    } else if (key === "this_month") {
      setCurrentYear(2026);
      setCurrentMonth(10);
      toast.info("Filter aktif: Bulan Ini (November 2026)");
    } else if (key === "last_month") {
      setCurrentYear(2026);
      setCurrentMonth(9); // October
      toast.info("Filter aktif: Bulan Lalu (Oktober 2026)");
    } else if (key === "custom") {
      toast.info("Silakan tentukan Tanggal Mulai dan Tanggal Akhir");
    }
  };

  // Navigating months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleResetToToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(10);
    setSelectedDate("2026-11-24");
    setPeriodFilter("today");
    toast.info("Kembali ke Hari Ini (24 Nov 2026)");
  };

  // Determine active date range for filtering plans
  const dateRangeBounds = useMemo(() => {
    if (periodFilter === "today") {
      return { start: "2026-11-24", end: "2026-11-24", label: "Hari Ini (24 Nov 2026)" };
    }
    if (periodFilter === "yesterday") {
      return { start: "2026-11-23", end: "2026-11-23", label: "Kemarin (23 Nov 2026)" };
    }
    if (periodFilter === "7days") {
      return { start: "2026-11-21", end: "2026-11-27", label: "7 Hari Terakhir / Minggu Ini (21 - 27 Nov 2026)" };
    }
    if (periodFilter === "this_month") {
      return { start: "2026-11-01", end: "2026-11-30", label: "Bulan Ini (November 2026)" };
    }
    if (periodFilter === "last_month") {
      return { start: "2026-10-01", end: "2026-10-31", label: "Bulan Lalu (Oktober 2026)" };
    }
    if (periodFilter === "custom") {
      const s = customStartDate || "2026-11-01";
      const e = customEndDate || "2026-11-30";
      return { start: s <= e ? s : e, end: s <= e ? e : s, label: `Rentang: ${s} s/d ${e}` };
    }
    return { start: "2026-11-01", end: "2026-11-30", label: "November 2026" };
  }, [periodFilter, customStartDate, customEndDate]);

  // Filtered plans list for the Agenda panel
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      // 1. Date range filter
      if (plan.date < dateRangeBounds.start || plan.date > dateRangeBounds.end) {
        return false;
      }
      // 2. Status filter
      if (planStatusFilter !== "ALL" && plan.status !== planStatusFilter) {
        return false;
      }
      // 3. Search query
      if (planSearchQuery.trim()) {
        const q = planSearchQuery.toLowerCase();
        const matchTitle = plan.title.toLowerCase().includes(q);
        const matchBuyer = plan.buyerOrPo?.toLowerCase().includes(q);
        const matchLocation = plan.location?.toLowerCase().includes(q);
        const matchNotes = plan.notes?.toLowerCase().includes(q);
        if (!matchTitle && !matchBuyer && !matchLocation && !matchNotes) return false;
      }
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [plans, dateRangeBounds, planStatusFilter, planSearchQuery]);

  // Plan KPI summary
  const planStats = useMemo(() => {
    const total = filteredPlans.length;
    const completed = filteredPlans.filter((p) => p.status === "completed").length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [filteredPlans]);

  // Toggle plan completion
  const handleTogglePlanStatus = (id: string) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextStatus = p.status === "completed" ? "planned" : "completed";
          toast.success(
            nextStatus === "completed"
              ? `Plan "${p.title}" ditandai selesai! ✓`
              : `Status plan dikembalikan ke belum selesai.`
          );
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
  };

  // Delete plan
  const handleDeletePlan = (id: string, title: string) => {
    if (confirm(`Hapus jadwal plan "${title}"?`)) {
      setPlans((prev) => prev.filter((p) => p.id !== id));
      toast.success(`Jadwal "${title}" telah dihapus.`);
    }
  };

  // Open modal with preselected date
  const handleOpenAddModalForDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setNewPlanDate(dateStr);
    setIsPlanModalOpen(true);
  };

  // Save new plan from modal
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim()) {
      toast.error("Judul rencana / plan wajib diisi.");
      return;
    }
    if (!newPlanDate) {
      toast.error("Tanggal rencana wajib dipilih.");
      return;
    }

    const newId = `plan-${Date.now()}`;
    const newPlan: ExportPlan = {
      id: newId,
      title: newPlanTitle.trim(),
      category: newPlanCategory,
      date: newPlanDate,
      time: newPlanTime.trim() || "09:00 WIB",
      buyerOrPo: newPlanBuyer.trim() || "Umum / Semua Pesanan Ekspor",
      location: newPlanLocation.trim() || "Gudang / Pelabuhan Muat",
      priority: newPlanPriority,
      status: "planned",
      notes: newPlanNotes.trim(),
    };

    setPlans((prev) => [...prev, newPlan]);
    toast.success(`Jadwal rencana "${newPlan.title}" berhasil dijadwalkan!`);
    setIsPlanModalOpen(false);

    // Reset form
    setNewPlanTitle("");
    setNewPlanNotes("");
    setNewPlanLocation("");
  };

  // Helper chips to quickly fill template plans
  const handleApplyPlanTemplate = (
    title: string,
    category: ExportPlan["category"],
    location: string
  ) => {
    setNewPlanTitle(title);
    setNewPlanCategory(category);
    setNewPlanLocation(location);
  };

  // Calendar cells computation (Monday to Sunday)
  const calendarCells = useMemo(() => {
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // Monday = 0, Sunday = 6
    const startDayOfWeek = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: {
      dayNum: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isInActiveRange: boolean;
      plans: ExportPlan[];
    }[] = [];

    // Leading days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, "0")}-${String(dNum).padStart(2, "0")}`;
      const dayPlans = plans.filter((p) => p.date === dateStr);
      cells.push({
        dayNum: dNum,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === "2026-11-24",
        isSelected: dateStr === selectedDate,
        isInActiveRange: dateStr >= dateRangeBounds.start && dateStr <= dateRangeBounds.end,
        plans: dayPlans,
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayPlans = plans.filter((p) => p.date === dateStr);
      cells.push({
        dayNum: day,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === "2026-11-24",
        isSelected: dateStr === selectedDate,
        isInActiveRange: dateStr >= dateRangeBounds.start && dateStr <= dateRangeBounds.end,
        plans: dayPlans,
      });
    }

    // Trailing days from next month to make a complete 35 or 42 grid
    const totalCells = cells.length <= 35 ? 35 : 42;
    const remaining = totalCells - cells.length;
    for (let nextDay = 1; nextDay <= remaining; nextDay++) {
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`;
      const dayPlans = plans.filter((p) => p.date === dateStr);
      cells.push({
        dayNum: nextDay,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === "2026-11-24",
        isSelected: dateStr === selectedDate,
        isInActiveRange: dateStr >= dateRangeBounds.start && dateStr <= dateRangeBounds.end,
        plans: dayPlans,
      });
    }

    return cells;
  }, [currentYear, currentMonth, selectedDate, dateRangeBounds, plans]);

  return (
    <div className="space-crm-container" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 1. TOP TOOLBAR: QUICK PERIOD PRESETS & RANGE PICKER */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A" }}>
                Kalender Ekspor &amp; Penjadwalan Rencana Operasional
              </h3>
              <SpaceBadge tone="primary">
                {plans.length} Total Plan Terjadwal
              </SpaceBadge>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748B" }}>
              Pilih periode (Hari Ini, Kemarin, Mingguan, Bulan Ini, Bulan Lalu, atau Range Tanggal) dan kelola jadwal ekspor agar seluruh rencana pengapalan terpantau presisi.
            </p>
          </div>

          {/* Tombol Buat Jadwal Plan */}
          <SpaceButton
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => handleOpenAddModalForDate(selectedDate || "2026-11-24")}
          >
            + Buat Jadwal / Tambah Plan
          </SpaceButton>
        </div>

        {/* 2. FILTER PERIOD BUTTONS BAR */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            paddingTop: 12,
            borderTop: "1px solid #F1F5F9",
          }}
        >
          {/* Quick Preset Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginRight: 4 }}>
              Pilih Periode:
            </span>

            {[
              { key: "today" as const, label: "Hari Ini" },
              { key: "yesterday" as const, label: "Kemarin" },
              { key: "7days" as const, label: "7 Hari (Mingguan)" },
              { key: "this_month" as const, label: "Bulan Ini" },
              { key: "last_month" as const, label: "Bulan Lalu" },
              { key: "custom" as const, label: "📅 Range Tanggal" },
            ].map((preset) => {
              const isActive = periodFilter === preset.key;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handleSelectPeriod(preset.key)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    border: isActive ? "1px solid #0F2942" : "1px solid #E2E8F0",
                    background: isActive ? "#0F2942" : "#FFFFFF",
                    color: isActive ? "#FFFFFF" : "#334155",
                    boxShadow: isActive ? "0 2px 4px rgba(15, 41, 66, 0.15)" : "none",
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Active Period Display Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#64748B" }}>Periode Aktif:</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#0F2942",
                background: "#F1F5F9",
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid #E2E8F0",
              }}
            >
              {dateRangeBounds.label}
            </span>
          </div>
        </div>

        {/* Custom Range Input Bar (Appears when 'custom' is active) */}
        {periodFilter === "custom" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              background: "#F8FAFC",
              borderRadius: 8,
              border: "1px dashed #CBD5E1",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#334155" }}>
              Tentukan Rentang Tanggal Ekspor:
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 12, color: "#64748B" }}>Dari:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: "1px solid #CBD5E1",
                  fontSize: 12.5,
                  color: "#0F172A",
                  background: "#FFFFFF",
                }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 12, color: "#64748B" }}>Sampai:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: "1px solid #CBD5E1",
                  fontSize: 12.5,
                  color: "#0F172A",
                  background: "#FFFFFF",
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => toast.success(`Rentang diterapkan: ${customStartDate} s/d ${customEndDate}`)}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                background: "#0F2942",
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              Terapkan Rentang
            </button>
          </div>
        )}
      </div>

      {/* 2. MAIN LAYOUT: MONTHLY CALENDAR GRID + OPERATIONAL PLAN AGENDA PANEL */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        {/* CALENDAR CARD */}
        <div className="space-calendar-card" style={{ padding: "18px 20px" }}>
          {/* Calendar Header Navigation */}
          <div className="space-calendar-nav" style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A" }}>
                {MONTH_NAMES_ID[currentMonth]} {currentYear}
              </h3>
              {currentMonth === 10 && currentYear === 2026 && (
                <SpaceBadge tone="primary">Bulan Ini</SpaceBadge>
              )}
              {currentMonth === 9 && currentYear === 2026 && (
                <SpaceBadge tone="neutral">Bulan Lalu</SpaceBadge>
              )}
            </div>

            {/* Navigation buttons: Sebelumnya, Hari Ini, Berikutnya */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <SpaceButton
                variant="secondary"
                size="sm"
                icon={<ChevronLeft size={14} />}
                onClick={handlePrevMonth}
                title="Bulan sebelumnya"
              >
                Sebelumnya
              </SpaceButton>

              <SpaceButton
                variant="secondary"
                size="sm"
                onClick={handleResetToToday}
                title="Kembali ke Hari Ini (24 Nov 2026)"
              >
                Hari Ini
              </SpaceButton>

              <SpaceButton
                variant="secondary"
                size="sm"
                iconRight={<ChevronRight size={14} />}
                onClick={handleNextMonth}
                title="Bulan berikutnya"
              >
                Berikutnya
              </SpaceButton>
            </div>
          </div>

          {/* Day Headers (SEN, SEL, RAB, KAM, JUM, SAB, MIN) */}
          <div className="space-calendar-grid" style={{ marginBottom: 4 }}>
            {DAY_NAMES_ID.map((day) => (
              <div key={day} className="space-calendar-day-header" style={{ fontWeight: 700, color: "#475569" }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="space-calendar-grid">
            {calendarCells.map((cell, idx) => {
              const cellClasses = [
                "space-calendar-cell",
                cell.isToday ? "today" : "",
                !cell.isCurrentMonth ? "other-month" : "",
                cell.isSelected ? "selected" : "",
                cell.isInActiveRange && !cell.isSelected ? "in-range" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={`${cell.dateStr}-${idx}`}
                  className={cellClasses}
                  style={{
                    cursor: "pointer",
                    position: "relative",
                    minHeight: 90,
                    outline: cell.isSelected ? "2px solid #2563EB" : "none",
                  }}
                  onClick={() => {
                    setSelectedDate(cell.dateStr);
                    toast.info(`Tanggal dipilih: ${cell.dateStr} (${cell.plans.length} plan)`);
                  }}
                  onDoubleClick={() => handleOpenAddModalForDate(cell.dateStr)}
                  title={`Klik untuk melihat agenda | Double-click untuk tambah plan (${cell.dateStr})`}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      className="space-calendar-date-num"
                      style={{
                        color: cell.isToday
                          ? "#0F2942"
                          : cell.isCurrentMonth
                          ? "#1E293B"
                          : "#94A3B8",
                      }}
                    >
                      {cell.dayNum}
                    </span>
                    {cell.isToday && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          color: "#FFFFFF",
                          background: "#0F2942",
                          padding: "1px 5px",
                          borderRadius: 4,
                          letterSpacing: 0.5,
                        }}
                      >
                        HARI INI
                      </span>
                    )}
                  </div>

                  {/* Render plan chips inside calendar cell */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 2 }}>
                    {cell.plans.slice(0, 3).map((plan) => {
                      const meta = CATEGORY_METAS[plan.category] || CATEGORY_METAS.stuffing;
                      const isCompleted = plan.status === "completed";

                      return (
                        <div
                          key={plan.id}
                          className={`space-calendar-event ${plan.category}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            opacity: isCompleted ? 0.65 : 1,
                            textDecoration: isCompleted ? "line-through" : "none",
                            fontSize: 10,
                            padding: "2px 5px",
                            borderRadius: 4,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(plan.date);
                            toast.info(`[${meta.label}] ${plan.title} (${plan.time || ""}) - ${plan.status === "completed" ? "Selesai" : "Terjadwal"}`);
                          }}
                          title={`${meta.label}: ${plan.title}\nBuyer: ${plan.buyerOrPo || "-"}\nLokasi: ${plan.location || "-"}`}
                        >
                          <span>{meta.label.startsWith("Stuffing") ? "📦" : meta.label.startsWith("Kapal") ? "🚢" : meta.label.startsWith("Dokumen") ? "📄" : meta.label.startsWith("Finansial") ? "💵" : meta.label.startsWith("Inspeksi") ? "🔍" : "🤝"}</span>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {plan.title}
                          </span>
                        </div>
                      );
                    })}

                    {cell.plans.length > 3 && (
                      <span style={{ fontSize: 9.5, color: "#64748B", fontWeight: 600 }}>
                        +{cell.plans.length - 3} kegiatan lainnya
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid #F1F5F9",
              flexWrap: "wrap",
              gap: 8,
              fontSize: 11.5,
              color: "#64748B",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 600, color: "#334155" }}>Kategori Kegiatan:</span>
              {Object.entries(CATEGORY_METAS).map(([catKey, meta]) => (
                <div key={catKey} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: meta.color,
                    }}
                  />
                  <span>{meta.label}</span>
                </div>
              ))}
            </div>
            <span>💡 <em>Klik tanggal pada kalender untuk melihat rencana atau klik <strong>+ Buat Jadwal</strong>.</em></span>
          </div>
        </div>

        {/* 3. OPERATIONAL PLAN AGENDA PANEL (MENGETAHUI PLAN YANG AKAN DILAKUKAN) */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Header Panel Agenda */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={18} color="#0F2942" />
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                  Daftar Rencana &amp; Action Plan Operasional
                </h4>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "#0F2942",
                    background: "#E2E8F0",
                    padding: "2px 8px",
                    borderRadius: 12,
                  }}
                >
                  {filteredPlans.length} Rencana
                </span>
              </div>
              <p style={{ margin: "3px 0 0 0", fontSize: 12.5, color: "#64748B" }}>
                Menampilkan rencana untuk: <strong>{dateRangeBounds.label}</strong>
              </p>
            </div>

            {/* Filter Status (Semua, Menunggu, Selesai) & Pencarian */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: 9, color: "#94A3B8" }} />
                <input
                  type="text"
                  placeholder="Cari plan, buyer, lokasi..."
                  value={planSearchQuery}
                  onChange={(e) => setPlanSearchQuery(e.target.value)}
                  style={{
                    padding: "6px 12px 6px 30px",
                    fontSize: 12.5,
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    width: 200,
                  }}
                />
              </div>

              <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 6, padding: 2 }}>
                {[
                  { key: "ALL" as const, label: "Semua" },
                  { key: "planned" as const, label: `Harus Dijalankan (${planStats.pending})` },
                  { key: "completed" as const, label: `Selesai (${planStats.completed})` },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setPlanStatusFilter(st.key)}
                    style={{
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: planStatusFilter === st.key ? 700 : 500,
                      borderRadius: 4,
                      border: "none",
                      background: planStatusFilter === st.key ? "#FFFFFF" : "transparent",
                      color: planStatusFilter === st.key ? "#0F172A" : "#64748B",
                      cursor: "pointer",
                      boxShadow: planStatusFilter === st.key ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                    }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick KPI Stats Bar for the Selected Period */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
              background: "#F8FAFC",
              padding: "12px 14px",
              borderRadius: 8,
              border: "1px solid #E2E8F0",
            }}
          >
            <div>
              <span style={{ fontSize: 11.5, color: "#64748B", display: "block" }}>Total Rencana Periode Ini</span>
              <strong style={{ fontSize: 18, color: "#0F172A" }}>{planStats.total}</strong>
            </div>
            <div>
              <span style={{ fontSize: 11.5, color: "#D97706", display: "block" }}>⏳ Menunggu / Action Pending</span>
              <strong style={{ fontSize: 18, color: "#D97706" }}>{planStats.pending}</strong>
            </div>
            <div>
              <span style={{ fontSize: 11.5, color: "#059669", display: "block" }}>✅ Telah Dilaksanakan</span>
              <strong style={{ fontSize: 18, color: "#059669" }}>{planStats.completed}</strong>
            </div>
          </div>

          {/* Plans List Cards */}
          {filteredPlans.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "36px 20px",
                border: "1px dashed #CBD5E1",
                borderRadius: 8,
                background: "#F8FAFC",
              }}
            >
              <CalendarIcon size={32} style={{ color: "#94A3B8", margin: "0 auto 8px" }} />
              <h5 style={{ margin: 0, fontSize: 14, color: "#334155" }}>
                Tidak Ada Jadwal Rencana untuk Periode Ini
              </h5>
              <p style={{ margin: "4px 0 14px 0", fontSize: 12.5, color: "#64748B" }}>
                Belum ada rencana yang dijadwalkan pada {dateRangeBounds.label}.
              </p>
              <SpaceButton
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => handleOpenAddModalForDate(dateRangeBounds.start)}
              >
                + Buat Jadwal Plan untuk Tanggal Ini
              </SpaceButton>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredPlans.map((plan) => {
                const meta = CATEGORY_METAS[plan.category] || CATEGORY_METAS.stuffing;
                const isCompleted = plan.status === "completed";
                const isTodayPlan = plan.date === "2026-11-24";

                return (
                  <div
                    key={plan.id}
                    style={{
                      border: isTodayPlan ? "1.5px solid #0F2942" : "1px solid #E2E8F0",
                      borderRadius: 10,
                      padding: "14px 16px",
                      background: isCompleted ? "#F8FAFC" : isTodayPlan ? "#F0F9FF" : "#FFFFFF",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 14,
                      transition: "all 0.15s ease",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                    }}
                  >
                    {/* Left: Checkbox / Toggle */}
                    <button
                      type="button"
                      onClick={() => handleTogglePlanStatus(plan.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 2,
                        marginTop: 2,
                        color: isCompleted ? "#059669" : "#94A3B8",
                      }}
                      title={isCompleted ? "Tandai belum selesai" : "Tandai telah selesai"}
                    >
                      {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>

                    {/* Middle: Plan Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        {/* Category Badge */}
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: meta.bgColor,
                            color: meta.color,
                            border: `1px solid ${meta.borderColor}`,
                          }}
                        >
                          {meta.label}
                        </span>

                        {/* Priority Badge */}
                        {plan.priority === "high" && (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: "#FFE4E6",
                              color: "#E11D48",
                            }}
                          >
                            Prioritas Tinggi
                          </span>
                        )}

                        {/* Date & Time */}
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
                          📅 {plan.date} {plan.time && `• ⏰ ${plan.time}`}
                        </span>

                        {isTodayPlan && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              background: "#0F2942",
                              color: "#FFFFFF",
                              padding: "1px 5px",
                              borderRadius: 4,
                            }}
                          >
                            HARI INI
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h5
                        style={{
                          margin: 0,
                          fontSize: 14.5,
                          fontWeight: 700,
                          color: isCompleted ? "#64748B" : "#0F172A",
                          textDecoration: isCompleted ? "line-through" : "none",
                        }}
                      >
                        {plan.title}
                      </h5>

                      {/* Buyer & Location Details */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                          flexWrap: "wrap",
                          marginTop: 6,
                          fontSize: 12,
                          color: "#64748B",
                        }}
                      >
                        {plan.buyerOrPo && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Building2 size={13} color="#475569" />
                            <span>{plan.buyerOrPo}</span>
                          </div>
                        )}
                        {plan.location && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <MapPin size={13} color="#475569" />
                            <span>{plan.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Notes / Instructions */}
                      {plan.notes && (
                        <p
                          style={{
                            margin: "6px 0 0 0",
                            fontSize: 12,
                            color: "#475569",
                            background: "#F8FAFC",
                            padding: "6px 10px",
                            borderRadius: 6,
                            borderLeft: "3px solid #CBD5E1",
                          }}
                        >
                          <strong>Instruksi:</strong> {plan.notes}
                        </p>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleTogglePlanStatus(plan.id)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          border: isCompleted ? "1px solid #CBD5E1" : "1px solid #059669",
                          background: isCompleted ? "#FFFFFF" : "#ECFDF5",
                          color: isCompleted ? "#475569" : "#059669",
                        }}
                      >
                        {isCompleted ? "Batal Selesai" : "✓ Selesai"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePlan(plan.id, plan.title)}
                        style={{
                          padding: "5px 8px",
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: "pointer",
                          border: "1px solid #CBD5E1",
                          background: "#FFFFFF",
                          color: "#94A3B8",
                        }}
                        title="Hapus jadwal ini"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. MODAL: BUAT JADWAL / TAMBAH PLAN EKSPOR */}
      {isPlanModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setIsPlanModalOpen(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 14,
              maxWidth: 580,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              border: "1px solid #E2E8F0",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #E2E8F0", paddingBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
                  + Buat Jadwal &amp; Rencana Plan Ekspor
                </h3>
                <small style={{ color: "#64748B" }}>
                  Tambahkan action plan operasional agar jadwal pengapalan terlaksana tepat waktu.
                </small>
              </div>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94A3B8",
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Template Chips */}
            <div style={{ marginBottom: 16, padding: "10px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                Pilihan Cepat Rencana Ekspor:
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[
                  { title: "Stuffing Kontainer 40HC", category: "stuffing" as const, loc: "Gudang Belawan" },
                  { title: "Inspeksi Karantina & Fumigasi", category: "inspection" as const, loc: "Depo Kontainer" },
                  { title: "Closing PEB Bea Cukai", category: "peb" as const, loc: "Portal Ceisa 4.0" },
                  { title: "Pelunasan 70% L/C Buyer", category: "finance" as const, loc: "Bank Mandiri" },
                  { title: "ETD Kapal Kontainer", category: "vessel" as const, loc: "Pelabuhan Tanjung Priok" },
                  { title: "Rapat Koordinasi Buyer", category: "meeting" as const, loc: "Zoom Meeting" },
                ].map((tpl) => (
                  <button
                    key={tpl.title}
                    type="button"
                    onClick={() => handleApplyPlanTemplate(tpl.title, tpl.category, tpl.loc)}
                    style={{
                      padding: "3px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      border: "1px solid #CBD5E1",
                      background: "#FFFFFF",
                      color: "#334155",
                      cursor: "pointer",
                    }}
                  >
                    + {tpl.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePlan} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Judul Rencana */}
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Judul Rencana / Kegiatan Plan <span style={{ color: "#E11D48" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Stuffing 40HC Kopi Arabika, Uji Fumigasi, Closing PEB..."
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    fontSize: 13,
                  }}
                />
              </div>

              {/* Kategori Kegiatan */}
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Kategori Kegiatan <span style={{ color: "#E11D48" }}>*</span>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {Object.entries(CATEGORY_METAS).map(([key, meta]) => {
                    const isSelected = newPlanCategory === key;
                    const IconComp = meta.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNewPlanCategory(key as ExportPlan["category"])}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 10px",
                          borderRadius: 6,
                          border: isSelected ? `2px solid ${meta.color}` : "1px solid #E2E8F0",
                          background: isSelected ? meta.bgColor : "#FFFFFF",
                          color: isSelected ? meta.color : "#334155",
                          fontSize: 12,
                          fontWeight: isSelected ? 700 : 500,
                          cursor: "pointer",
                        }}
                      >
                        <IconComp size={14} />
                        <span>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tanggal & Waktu Pelaksanaan */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Tanggal Pelaksanaan <span style={{ color: "#E11D48" }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newPlanDate}
                    onChange={(e) => setNewPlanDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Jam / Waktu Pelaksanaan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 09:00 WIB"
                    value={newPlanTime}
                    onChange={(e) => setNewPlanTime(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              {/* Terkait Buyer / PO & Lokasi */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Terkait Pesanan / Buyer
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Global Coffee LLC / PO-2026/US/089"
                    value={newPlanBuyer}
                    onChange={(e) => setNewPlanBuyer(e.target.value)}
                    list="buyers-list"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                    }}
                  />
                  <datalist id="buyers-list">
                    {allTransactions.map((t) => (
                      <option key={t.id} value={`${t.buyer || ""} (${t.reference || ""})`} />
                    ))}
                    <option value="Global Coffee LLC / Amerika Serikat" />
                    <option value="Hamburg Roasters B.V. / Belanda" />
                    <option value="Al-Barakah Global Trading / UEA" />
                    <option value="Marubeni Specialty / Jepang" />
                    <option value="Nordic Pantry AB / Swedia" />
                    <option value="Van Dijk Furniture BV / Belanda" />
                    <option value="Siam Bio Agro Co. / Thailand" />
                  </datalist>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Lokasi / Fasilitas
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Gudang Belawan / Pelabuhan / Zoom"
                    value={newPlanLocation}
                    onChange={(e) => setNewPlanLocation(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              {/* Tingkat Prioritas */}
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Tingkat Prioritas
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    { key: "high" as const, label: "Prioritas Tinggi (Ketat)", color: "#E11D48" },
                    { key: "medium" as const, label: "Prioritas Sedang (Normal)", color: "#D97706" },
                    { key: "low" as const, label: "Prioritas Rendah (Fleksibel)", color: "#475569" },
                  ].map((p) => (
                    <label
                      key={p.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12.5,
                        cursor: "pointer",
                        color: newPlanPriority === p.key ? p.color : "#475569",
                        fontWeight: newPlanPriority === p.key ? 700 : 500,
                      }}
                    >
                      <input
                        type="radio"
                        name="priority"
                        checked={newPlanPriority === p.key}
                        onChange={() => setNewPlanPriority(p.key)}
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Catatan / Instruksi SOP */}
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Catatan Khusus / SOP Ekspor
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan dokumen pendukung, nomor segel, person-in-charge (PIC), dsb..."
                  value={newPlanNotes}
                  onChange={(e) => setNewPlanNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    fontSize: 12.5,
                  }}
                />
              </div>

              {/* Actions Footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid #E2E8F0",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    color: "#475569",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 18px",
                    borderRadius: 6,
                    border: "none",
                    background: "#0F2942",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Simpan &amp; Jadwalkan Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
