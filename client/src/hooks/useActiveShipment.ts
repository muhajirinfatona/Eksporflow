import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import {
  fetchShipmentsFromSupabase,
  getShipmentFromSupabase,
  saveShipmentToSupabase,
  supabase,
} from "@/lib/supabaseClient";
import {
  getCurrentUser,
  logoutFromSupabase,
  startDemoSession,
  type UserSession,
} from "@/lib/supabaseAuth";
import { calculateContainer } from "@shared/container";
import { calculatePricing } from "@shared/pricing";
import {
  applyLineItemsUpdate,
  applyShipmentFieldUpdate,
  applyShipmentNumberUpdate,
  createEmptyShipment,
  hydrateShipment,
  initialShipment,
  toShipmentPersistencePayload,
  type LineItem,
  type Shipment,
} from "@shared/shipment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export type PersistenceSaveState =
  | "local-draft"
  | "unsaved"
  | "saving"
  | "saved"
  | "conflict"
  | "error";

const DEMO_DRAFT_STORAGE_KEY = "eksporflow-draft-v2-demo";

function createInitialDemoShipment(): Shipment {
  const baseDate = new Date();
  const in18Days = new Date(baseDate.getTime() + 18 * 86400000).toISOString().slice(0, 10);
  const in75Days = new Date(baseDate.getTime() + 75 * 86400000).toISOString().slice(0, 10);
  const in7Days = new Date(baseDate.getTime() + 7 * 86400000).toISOString().slice(0, 10);
  const in5Days = new Date(baseDate.getTime() + 5 * 86400000).toISOString().slice(0, 10);

  return {
    ...initialShipment,
    reference: "DEMO-2026-001",
    exporter: "UMKM Nusantara Ekspor (Demo)",
    letterheadText:
      "UMKM NUSANTARA EKSPOR\nIndonesian Organic Agricultural & Coconut Commodities Exporter\nJl. Pettarani No. 18, Makassar, Sulawesi Selatan 90222 · Indonesia",
    signatoryName: "Tim Ekspor UMKM (Demo)",
    buyerPicName: "Erik Lindqvist",
    buyerEmail: "procurement@nordicpantry.se",
    poNumber: "PO-SE-2026-084",
    exportPermits: {
      quarantineNumber: "KT-12/2026/MKS-991",
      quarantineExpiry: in18Days,
      cooNumber: "e-SKA-ID-SE-4402",
      cooExpiry: in75Days,
      lartasLicenseNumber: "PE-NONLARTAS-BTKI1702",
      lartasExpiry: in75Days,
    },
    preShipmentSchedule: {
      etdDate: in7Days,
      pebClosingDate: in5Days,
      completedIds: ["h7_contract_dp"],
    },
    preTransactionData: {
      docType: "quotation",
      tone: "formal",
      prospectCompany: "Nordic Pantry AB",
      prospectCountry: "Swedia",
      prospectEmail: "procurement@nordicpantry.se",
      buyerVerifiedChecklist: ["reg_checked", "domain_checked"],
    },
    subscriptionPlan: "growth",
  };
}

function readDemoDraft(): Shipment {
  try {
    const raw = localStorage.getItem(DEMO_DRAFT_STORAGE_KEY);
    if (!raw) {
      return createInitialDemoShipment();
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return hydrateShipment({ snapshot: parsed });
  } catch {
    return createInitialDemoShipment();
  }
}

function getDraftStorageKey(userId?: number | null): string {
  return `eksporflow-draft-v2-${userId ? `u${userId}` : "guest"}`;
}

function readUserDraft(userId?: number | null, companyName?: string | null): Shipment {
  try {
    // Bersihkan sisa key lama yang dulu menyimpan data contoh mentah
    localStorage.removeItem("eksporflow-shipment");
    const raw = localStorage.getItem(getDraftStorageKey(userId));
    if (!raw) {
      return createEmptyShipment({ exporter: companyName || "" });
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const hydrated = hydrateShipment({ snapshot: parsed });
    if (hydrated.reference === "EXP-2026-001" || hydrated.reference === "EXP-2026-084") {
      hydrated.reference = "";
    }
    return hydrated;
  } catch {
    return createEmptyShipment({ exporter: companyName || "" });
  }
}

export function useActiveShipment() {
  const utils = trpc.useUtils();

  const authQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const [supabaseUser, setSupabaseUser] = useState<UserSession | null>(() => getCurrentUser());
  const user = authQuery.data ?? (supabaseUser as any) ?? null;
  const isDemoUser = Boolean((user as UserSession | null)?.isDemo);

  const [shipment, setShipment] = useState<Shipment>(() => createEmptyShipment());
  const [activeShipmentId, setActiveShipmentId] = useState<string | null>(null);
  const [version, setVersion] = useState<number>(1);
  const [saveState, setSaveState] = useState<PersistenceSaveState>("unsaved");
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [supabaseList, setSupabaseList] = useState<any[]>([]);
  const loadedForUserIdRef = useRef<number | null>(null);
  const isSavingRef = useRef(false);

  const shipmentsQuery = trpc.shipments.list.useQuery(
    { limit: 50, offset: 0 },
    {
      enabled: Boolean(user && !isDemoUser),
      retry: false,
      refetchOnWindowFocus: false,
    },
  );

  const createMutation = trpc.shipments.create.useMutation();
  const updateMutation = trpc.shipments.update.useMutation();
  const deleteMutation = trpc.shipments.delete.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  const loadShipment = useCallback(
    async (id: string, silent = false) => {
      try {
        let record: {
          id: string;
          reference: string;
          status: string;
          version: number;
          snapshot: Record<string, unknown>;
          lineItems: LineItem[];
        } | null = null;

        if (user) {
          try {
            record = (await utils.shipments.get.fetch({ id })) as any;
          } catch {
            // fallback ke Supabase langsung jika tRPC gagal
          }
        }
        if (!record) {
          record = await getShipmentFromSupabase(id);
        }

        if (!record) {
          throw new Error("Transaksi tidak ditemukan di database Supabase.");
        }

        const isDefaultMock = record.reference === "EXP-2026-001" || record.reference === "EXP-2026-084";
        const hydrated = hydrateShipment({
          reference: isDefaultMock ? "" : record.reference,
          status: record.status,
          snapshot: record.snapshot,
          lineItems: record.lineItems,
        });
        if (isDefaultMock) {
          hydrated.reference = "";
        }
        setShipment(hydrated);
        setActiveShipmentId(record.id);
        setVersion(record.version);
        setSaveState("saved");
        setStatusNote(null);
        if (!silent) {
          const displayLabel = !isDefaultMock && record.reference ? `Transaksi ${record.reference}` : "Transaksi";
          toast.success(`${displayLabel} dimuat dari Cloud`, {
            description: `Versi cloud v${record.version} aktif di workspace.`,
          });
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Gagal memuat transaksi dari server.";
        setSaveState("error");
        setStatusNote(msg);
        toast.error("Gagal memuat transaksi", { description: msg });
      }
    },
    [user, utils.shipments.get],
  );

  // Inisialisasi sinkronisasi data langsung dengan Cloud Supabase (hanya untuk akun terautentikasi non-demo)
  useEffect(() => {
    if (!user || isDemoUser) return;
    let active = true;
    async function syncSupabase() {
      try {
        const list = await fetchShipmentsFromSupabase();
        if (active && list.length > 0) {
          setSupabaseList(list);
          if (!activeShipmentId) {
            void loadShipment(list[0].id, true);
          }
        }
      } catch (e) {
        console.warn("[Supabase] Auto-sync list error:", e);
      }
    }
    void syncSupabase();
    return () => {
      active = false;
    };
  }, [user?.id, isDemoUser]);

  // Saat sesi user aktif, muat transaksi cloud terbaru milik user atau siapkan sandbox demo / form kosong.
  useEffect(() => {
    if (!user) {
      loadedForUserIdRef.current = null;
      return;
    }
    if (loadedForUserIdRef.current === user.id) return;

    if (isDemoUser) {
      loadedForUserIdRef.current = user.id;
      setShipment(readDemoDraft());
      setActiveShipmentId(null);
      setSupabaseList([]);
      setVersion(1);
      setSaveState("local-draft");
      setStatusNote("Mode Uji Coba Demo 3 Hari (Sandbox Lokal)");
      return;
    }

    if (shipmentsQuery.isLoading) return;

    loadedForUserIdRef.current = user.id;
    const list = shipmentsQuery.data ?? [];
    if (list.length > 0) {
      void loadShipment(list[0].id, true);
    } else {
      const cleanDraft = readUserDraft(user.id, user.companyName);
      setShipment(cleanDraft);
      setActiveShipmentId(null);
      setVersion(1);
      setSaveState("unsaved");
      setStatusNote(null);
    }
  }, [user, isDemoUser, shipmentsQuery.isLoading, shipmentsQuery.data, loadShipment]);

  // Simpan cadangan draft lokal terisolasi per user / sandbox demo
  useEffect(() => {
    if (!user) return;
    try {
      const storageKey = isDemoUser ? DEMO_DRAFT_STORAGE_KEY : getDraftStorageKey(user.id);
      localStorage.setItem(storageKey, JSON.stringify(shipment));
    } catch {
      // Abaikan bila kuota localStorage penuh.
    }
  }, [shipment, user, isDemoUser]);

  const markDirty = useCallback(() => {
    setSaveState((prev) =>
      isDemoUser ? "local-draft" : prev === "conflict" ? "conflict" : user ? "unsaved" : "local-draft",
    );
  }, [user, isDemoUser]);

  const update = useCallback(
    <K extends keyof Shipment>(key: K, value: Shipment[K]) => {
      setShipment((current) => applyShipmentFieldUpdate(current, key, value));
      markDirty();
    },
    [markDirty],
  );

  const updateNumber = useCallback(
    (key: keyof Shipment, rawValue: string) => {
      setShipment((current) => applyShipmentNumberUpdate(current, key, rawValue));
      markDirty();
    },
    [markDirty],
  );

  const updateLineItems = useCallback(
    (items: LineItem[]) => {
      setShipment((current) => applyLineItemsUpdate(current, items));
      markDirty();
    },
    [markDirty],
  );

  const saveShipment = useCallback(
    async (isAutoSave = false) => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;

      if (!user || isDemoUser) {
        try {
          const storageKey = isDemoUser ? DEMO_DRAFT_STORAGE_KEY : getDraftStorageKey(null);
          localStorage.setItem(storageKey, JSON.stringify(shipment));
          setSaveState("local-draft");
          if (!isAutoSave && isDemoUser) {
            toast.info("Tersimpan di Sandbox Demo Lokal", {
              description: "Mode Demo 3 Hari tersimpan aman di browser Anda tanpa mengubah database Cloud produksi.",
            });
          }
        } catch {
          setSaveState("error");
        } finally {
          isSavingRef.current = false;
        }
        return;
      }

      setSaveState("saving");
      setStatusNote(null);
      const payload = toShipmentPersistencePayload(shipment);

      // Jalur 1: Coba simpan via tRPC jika sesi lokal / backend aktif
      if (user) {
        try {
          if (!activeShipmentId) {
            const created = await createMutation.mutateAsync(payload);
            setActiveShipmentId(created.id);
            setVersion(created.version);
            setSaveState("saved");
            await utils.shipments.list.invalidate();
            if (!isAutoSave) {
              toast.success("Transaksi tersimpan ke Cloud", {
                description: `${created.reference} · v${created.version} tercatat di audit log Supabase.`,
              });
            }
            return;
          } else {
            const updated = await updateMutation.mutateAsync({
              id: activeShipmentId,
              version,
              ...payload,
            });
            setVersion(updated.version);
            setSaveState("saved");
            await utils.shipments.list.invalidate();
            if (!isAutoSave) {
              toast.success("Perubahan tersimpan ke Cloud", {
                description: `${updated.reference} · naik ke v${updated.version}.`,
              });
            }
            return;
          }
        } catch (error) {
          const code = error instanceof TRPCClientError ? error.data?.code : undefined;
          if (code === "CONFLICT") {
            const msg = error instanceof Error ? error.message : "Konflik versi.";
            setSaveState("conflict");
            setStatusNote(msg);
            if (!isAutoSave) {
              toast.error("Konflik penyimpanan", { description: msg });
            }
            return;
          }
          console.warn("[tRPC] Backend unavailable, switching to direct Supabase Cloud:", error);
        }
      }

      // Jalur 2: Direct Online Sync ke Cloud Supabase secara instan
      try {
        const saved = await saveShipmentToSupabase(shipment, activeShipmentId, version);
        setActiveShipmentId(saved.id);
        setVersion(saved.version);
        setSaveState("saved");
        const freshList = await fetchShipmentsFromSupabase();
        setSupabaseList(freshList);
        localStorage.setItem(getDraftStorageKey(null), JSON.stringify(shipment));
        if (!isAutoSave) {
          toast.success("Tersimpan ke Cloud Supabase", {
            description: `${saved.reference} · v${saved.version} aman tersimpan di database online.`,
          });
        }
      } catch (err) {
        // Jalur 3: Fallback ke local draft jika koneksi jaringan offline
        try {
          localStorage.setItem(getDraftStorageKey(null), JSON.stringify(shipment));
          localStorage.setItem("eksporflow-user-draft-manual", JSON.stringify(shipment));
          setSaveState("local-draft");
          if (!isAutoSave) {
            toast.info("Draft tersimpan lokal di perangkat.");
          }
        } catch {
          const message = err instanceof Error ? err.message : "Gagal menyimpan transaksi.";
          setSaveState("error");
          setStatusNote(message);
          if (!isAutoSave) {
            toast.error("Penyimpanan gagal", { description: message });
          }
        }
      } finally {
        isSavingRef.current = false;
      }
    },
    [user, isDemoUser, shipment, activeShipmentId, version, createMutation, updateMutation, utils.shipments.list],
  );

  // Auto-Save Otomatis: Menyimpan perubahan transaksi & revisi dokumen secara otomatis setelah jeda ketik 1 detik
  useEffect(() => {
    if (saveState !== "unsaved") return;

    const timer = setTimeout(() => {
      void saveShipment(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [saveState, saveShipment]);

  const reloadLatest = useCallback(async () => {
    if (!activeShipmentId) return;
    await loadShipment(activeShipmentId, false);
  }, [activeShipmentId, loadShipment]);

  const createNewDraft = useCallback(
    (customRef?: string) => {
      const nextRef = customRef?.trim() || "";
      const empty = createEmptyShipment({
        exporter: user?.companyName || shipment.exporter || "",
        reference: nextRef,
      });
      setShipment(empty);
      setActiveShipmentId(null);
      setVersion(1);
      setSaveState("unsaved");
      setStatusNote(null);
      try {
        localStorage.removeItem("eksporflow_last_po_screening");
      } catch {
        // Abaikan
      }
      toast.success(
        nextRef ? `Transaksi baru ${nextRef} siap diisi` : "Formulir transaksi baru siap diisi",
        {
          description: "Silakan masukkan nomor PO dan data buyer baru.",
        },
      );
    },
    [shipment.exporter, user?.companyName],
  );

  const resetTransaction = useCallback(() => {
    const clean = createEmptyShipment({
      exporter: user?.companyName || "",
      reference: "",
    });
    setShipment(clean);
    setActiveShipmentId(null);
    setVersion(1);
    setSaveState("unsaved");
    setStatusNote(null);
    try {
      localStorage.removeItem("eksporflow_last_po_screening");
    } catch {
      // Abaikan
    }
    if (user) {
      try {
        const storageKey = isDemoUser ? DEMO_DRAFT_STORAGE_KEY : getDraftStorageKey(user.id);
        localStorage.removeItem(storageKey);
      } catch {
        // Abaikan
      }
    }
  }, [user, isDemoUser]);

  const deleteShipment = useCallback(
    async (id: string) => {
      if (isDemoUser) {
        resetTransaction();
        toast.success("Data demo berhasil di-reset");
        return true;
      }
      try {
        if (user) {
          try {
            await deleteMutation.mutateAsync({ id });
            await utils.shipments.list.invalidate();
          } catch {}
        }
        await supabase.from("shipments").delete().eq("id", id);
        setSupabaseList((prev) => prev.filter((s) => s.id !== id));
        if (activeShipmentId === id) {
          resetTransaction();
        }
        toast.success("Transaksi berhasil dihapus");
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal menghapus transaksi.";
        toast.error("Gagal menghapus transaksi", { description: message });
        return false;
      }
    },
    [deleteMutation, utils.shipments.list, activeShipmentId, resetTransaction, user, isDemoUser],
  );

  const loadCustomShipment = useCallback((next: Shipment, customId?: string | null) => {
    setShipment(next);
    setActiveShipmentId(customId ?? null);
    setVersion(1);
    setSaveState("unsaved");
    setStatusNote(null);
    toast.success(
      next.reference ? `Transaksi ${next.reference} dibuka` : "Transaksi dibuka",
      {
        description: next.buyer ? `Buyer: ${next.buyer} (${next.buyerCountry || "-"})` : "Data transaksi siap dikelola.",
      },
    );
  }, []);

  const refreshAuth = useCallback(async () => {
    loadedForUserIdRef.current = null;
    setSupabaseUser(getCurrentUser());
    try {
      await utils.auth.me.invalidate();
      await utils.shipments.list.invalidate();
    } catch {
      // Abaikan jika tRPC offline
    }
  }, [utils.auth.me, utils.shipments.list]);

  const enterDemoMode = useCallback(() => {
    loadedForUserIdRef.current = null;
    const demoUser = startDemoSession();
    setSupabaseUser(demoUser);
    toast.success("Mode Demo 3 Hari Aktif!", {
      description: "Data sandbox siap dicoba selama 72 jam tanpa menulis ke database Cloud produksi.",
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      const wasDemo = isDemoUser;
      logoutFromSupabase();
      setSupabaseUser(null);
      if (!wasDemo) {
        try {
          await logoutMutation.mutateAsync();
        } catch {
          // Abaikan jika tRPC offline
        }
      }
      loadedForUserIdRef.current = null;
      setActiveShipmentId(null);
      setShipment(createEmptyShipment());
      setVersion(1);
      setSaveState("unsaved");
      if (!wasDemo) {
        try {
          await utils.auth.me.invalidate();
        } catch {
          // Abaikan
        }
      }
      toast(wasDemo ? "Anda keluar dari Mode Demo EksporFlow" : "Anda telah keluar dari akun EksporFlow");
    } catch {
      toast.error("Gagal keluar sesi");
    }
  }, [isDemoUser, logoutMutation, utils.auth.me]);

  const pricing = useMemo(() => calculatePricing(shipment), [shipment]);
  const container = useMemo(() => calculateContainer(shipment), [shipment]);

  const effectiveShipmentsList = useMemo(() => {
    if (isDemoUser) return [];
    if (shipmentsQuery.data && shipmentsQuery.data.length > 0) {
      return shipmentsQuery.data;
    }
    return supabaseList.map((item) => ({
      id: item.id,
      reference: item.reference,
      status: item.status,
      version: item.version,
      updatedAt: item.updatedAt,
      createdAt: item.createdAt,
    }));
  }, [isDemoUser, shipmentsQuery.data, supabaseList]);

  return {
    user,
    isDemoUser,
    isAuthLoading: Boolean(!supabaseUser && authQuery.isLoading),
    shipment,
    activeShipmentId,
    version,
    saveState,
    statusNote,
    shipmentsList: effectiveShipmentsList,
    isLoadingList: shipmentsQuery.isLoading,
    pricing,
    container,
    update,
    updateNumber,
    updateLineItems,
    saveShipment,
    loadShipment,
    loadCustomShipment,
    reloadLatest,
    createNewDraft,
    deleteShipment,
    resetTransaction,
    refreshAuth,
    enterDemoMode,
    logout,
  };
}
