import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { calculateContainer } from "@shared/container";
import { calculatePricing } from "@shared/pricing";
import {
  applyLineItemsUpdate,
  applyShipmentFieldUpdate,
  applyShipmentNumberUpdate,
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

const LOCAL_DRAFT_KEY = "eksporflow-shipment";

function readLocalDraft(): Shipment {
  try {
    const raw = localStorage.getItem(LOCAL_DRAFT_KEY);
    if (!raw) return initialShipment;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return hydrateShipment({ snapshot: parsed });
  } catch {
    return initialShipment;
  }
}

export function useActiveShipment() {
  const utils = trpc.useUtils();
  const [shipment, setShipment] = useState<Shipment>(readLocalDraft);
  const [activeShipmentId, setActiveShipmentId] = useState<string | null>(null);
  const [version, setVersion] = useState<number>(1);
  const [saveState, setSaveState] = useState<PersistenceSaveState>("local-draft");
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [devLoginEnabled, setDevLoginEnabled] = useState<boolean>(false);
  const autoLoadedRef = useRef(false);

  const authQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const user = authQuery.data ?? null;

  useEffect(() => {
    let active = true;
    fetch("/api/dev/status", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { enabled: false }))
      .then((data: { enabled?: boolean }) => {
        if (active) setDevLoginEnabled(Boolean(data.enabled));
      })
      .catch(() => {
        if (active) setDevLoginEnabled(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const shipmentsQuery = trpc.shipments.list.useQuery(
    { limit: 50, offset: 0 },
    {
      enabled: Boolean(user),
      retry: false,
      refetchOnWindowFocus: false,
    },
  );

  const createMutation = trpc.shipments.create.useMutation();
  const updateMutation = trpc.shipments.update.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  // Simpan salinan draft lokal sebagai cadangan bila koneksi putus, tetapi jangan pernah
  // dipresentasikan sebagai cloud source of record.
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(shipment));
    } catch {
      // Abaikan bila kuota localStorage penuh.
    }
  }, [shipment]);

  const loadShipment = useCallback(
    async (id: string, silent = false) => {
      try {
        const record = await utils.shipments.get.fetch({ id });
        const hydrated = hydrateShipment({
          reference: record.reference,
          status: record.status,
          snapshot: record.snapshot,
          lineItems: record.lineItems,
        });
        setShipment(hydrated);
        setActiveShipmentId(record.id);
        setVersion(record.version);
        setSaveState("saved");
        setStatusNote(null);
        if (!silent) {
          toast.success(`Transaksi ${record.reference} dimuat`, {
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
    [utils.shipments.get],
  );

  // Saat user login pertama kali dan punya shipment di cloud, muat transaksi terbaru otomatis
  // bila belum ada draft baru yang sedang diedit.
  useEffect(() => {
    if (!user || autoLoadedRef.current) return;
    const list = shipmentsQuery.data;
    if (!list) return;
    autoLoadedRef.current = true;
    if (list.length > 0 && !activeShipmentId && shipment.reference === initialShipment.reference) {
      void loadShipment(list[0].id, true);
    } else if (!activeShipmentId) {
      setSaveState("unsaved");
    }
  }, [user, shipmentsQuery.data, activeShipmentId, shipment.reference, loadShipment]);

  const markDirty = useCallback(() => {
    setSaveState((prev) => (prev === "conflict" ? "conflict" : user ? "unsaved" : "local-draft"));
  }, [user]);

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

  const saveShipment = useCallback(async () => {
    if (!user) {
      setSaveState("local-draft");
      toast("Tersimpan sebagai draft browser lokal", {
        description: "Masuk akun terlebih dahulu untuk menyimpan transaksi ke database cloud (Supabase).",
      });
      return;
    }

    setSaveState("saving");
    setStatusNote(null);
    const payload = toShipmentPersistencePayload(shipment);

    try {
      if (!activeShipmentId) {
        const created = await createMutation.mutateAsync(payload);
        setActiveShipmentId(created.id);
        setVersion(created.version);
        setSaveState("saved");
        await utils.shipments.list.invalidate();
        toast.success("Transaksi tersimpan ke Cloud", {
          description: `${created.reference} · v${created.version} tercatat di audit log.`,
        });
      } else {
        const updated = await updateMutation.mutateAsync({
          id: activeShipmentId,
          version,
          ...payload,
        });
        setVersion(updated.version);
        setSaveState("saved");
        await utils.shipments.list.invalidate();
        toast.success("Perubahan tersimpan ke Cloud", {
          description: `${updated.reference} · naik ke v${updated.version}.`,
        });
      }
    } catch (error) {
      const code = error instanceof TRPCClientError ? error.data?.code : undefined;
      const message = error instanceof Error ? error.message : "Gagal menyimpan transaksi.";
      if (code === "CONFLICT") {
        setSaveState("conflict");
        setStatusNote(message);
        toast.error("Konflik penyimpanan terdeteksi", {
          description: message,
        });
      } else {
        setSaveState("error");
        setStatusNote(message);
        toast.error("Penyimpanan gagal", { description: message });
      }
    }
  }, [user, shipment, activeShipmentId, version, createMutation, updateMutation, utils.shipments.list]);

  const reloadLatest = useCallback(async () => {
    if (!activeShipmentId) return;
    await loadShipment(activeShipmentId, false);
  }, [activeShipmentId, loadShipment]);

  const createNewDraft = useCallback(
    (customRef?: string) => {
      const suffix = String(Math.floor(100 + Math.random() * 900));
      const nextRef = customRef?.trim() || `EXP-${new Date().getFullYear()}-${suffix}`;
      setShipment({
        ...initialShipment,
        reference: nextRef,
        shipmentStatus: "Draft",
        documentRevision: 1,
        bookingNumber: "",
        containerNumber: "",
        sealNumber: "",
        attachments: [],
      });
      setActiveShipmentId(null);
      setVersion(1);
      setSaveState(user ? "unsaved" : "local-draft");
      setStatusNote(null);
      toast.success(`Draft baru ${nextRef} siap diisi`, {
        description: user ? "Klik Simpan ke Cloud untuk mencatat transaksi baru di workspace." : "Mode draft lokal aktif.",
      });
    },
    [user],
  );

  const resetTransaction = useCallback(() => {
    setShipment(initialShipment);
    setActiveShipmentId(null);
    setVersion(1);
    setSaveState(user ? "unsaved" : "local-draft");
    setStatusNote(null);
    toast("Draft dikembalikan ke contoh awal");
  }, [user]);

  const login = useCallback(async () => {
    if (devLoginEnabled) {
      try {
        const res = await fetch("/api/dev/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: "Arif · Workspace Owner" }),
        });
        const data = (await res.json()) as { success?: boolean; error?: string };
        if (!res.ok || !data.success) {
          toast.error("Login lokal belum siap", {
            description: data.error || "Periksa konfigurasi DATABASE_URL di .env.",
          });
          return;
        }
        autoLoadedRef.current = false;
        await utils.auth.me.invalidate();
        await utils.shipments.list.invalidate();
        toast.success("Berhasil masuk (Mode Dev Lokal)", {
          description: "Penyimpanan cloud PostgreSQL / Supabase kini aktif.",
        });
      } catch {
        toast.error("Tidak dapat menghubungi server lokal.");
      }
      return;
    }
    await startLogin();
  }, [devLoginEnabled, utils.auth.me, utils.shipments.list]);

  const logout = useCallback(async () => {
    try {
      if (devLoginEnabled) {
        await fetch("/api/dev/logout", { method: "POST", credentials: "include" }).catch(() => undefined);
      }
      await logoutMutation.mutateAsync();
      setActiveShipmentId(null);
      setSaveState("local-draft");
      autoLoadedRef.current = false;
      await utils.auth.me.invalidate();
      toast("Anda telah keluar dari sesi cloud");
    } catch {
      toast.error("Gagal keluar sesi");
    }
  }, [devLoginEnabled, logoutMutation, utils.auth.me]);

  const pricing = useMemo(() => calculatePricing(shipment), [shipment]);
  const container = useMemo(() => calculateContainer(shipment), [shipment]);

  return {
    user,
    devLoginEnabled,
    shipment,
    activeShipmentId,
    version,
    saveState,
    statusNote,
    shipmentsList: shipmentsQuery.data ?? [],
    isLoadingList: shipmentsQuery.isLoading,
    pricing,
    container,
    update,
    updateNumber,
    updateLineItems,
    saveShipment,
    loadShipment,
    reloadLatest,
    createNewDraft,
    resetTransaction,
    login,
    logout,
  };
}
