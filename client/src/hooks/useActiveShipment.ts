import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { calculateContainer } from "@shared/container";
import { calculatePricing } from "@shared/pricing";
import {
  applyLineItemsUpdate,
  applyShipmentFieldUpdate,
  applyShipmentNumberUpdate,
  createEmptyShipment,
  hydrateShipment,
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
    return hydrateShipment({ snapshot: parsed });
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
  const user = authQuery.data ?? null;

  const [shipment, setShipment] = useState<Shipment>(() => createEmptyShipment());
  const [activeShipmentId, setActiveShipmentId] = useState<string | null>(null);
  const [version, setVersion] = useState<number>(1);
  const [saveState, setSaveState] = useState<PersistenceSaveState>("unsaved");
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const loadedForUserIdRef = useRef<number | null>(null);

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

  // Saat sesi user aktif, muat transaksi cloud terbaru milik user atau siapkan form kosong bersih.
  useEffect(() => {
    if (!user) {
      loadedForUserIdRef.current = null;
      return;
    }
    if (loadedForUserIdRef.current === user.id) return;
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
  }, [user, shipmentsQuery.isLoading, shipmentsQuery.data, loadShipment]);

  // Simpan cadangan draft lokal terisolasi per user bila sedang mengedit sebelum klik Simpan ke Cloud.
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(getDraftStorageKey(user.id), JSON.stringify(shipment));
    } catch {
      // Abaikan bila kuota localStorage penuh.
    }
  }, [shipment, user]);

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
      toast.error("Silakan masuk ke akun Anda terlebih dahulu.");
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
          description: `${created.reference} · v${created.version} tercatat di audit log Supabase.`,
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
      toast.success(
        nextRef ? `Transaksi baru ${nextRef} siap diisi` : "Formulir transaksi baru siap diisi",
        {
          description: "Silakan masukkan nomor referensi internal dan data buyer Anda.",
        },
      );
    },
    [shipment.exporter, user?.companyName],
  );

  const resetTransaction = useCallback(() => {
    const clean = createEmptyShipment({
      exporter: user?.companyName || "",
      reference: shipment.reference || `EXP-${new Date().getFullYear()}-001`,
    });
    setShipment(clean);
    setActiveShipmentId(null);
    setVersion(1);
    setSaveState("unsaved");
    setStatusNote(null);
    if (user) {
      try {
        localStorage.removeItem(getDraftStorageKey(user.id));
      } catch {
        // Abaikan
      }
    }
    toast("Formulir transaksi dikosongkan untuk input baru");
  }, [shipment.reference, user]);

  const refreshAuth = useCallback(async () => {
    loadedForUserIdRef.current = null;
    await utils.auth.me.invalidate();
    await utils.shipments.list.invalidate();
  }, [utils.auth.me, utils.shipments.list]);

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
      loadedForUserIdRef.current = null;
      setActiveShipmentId(null);
      setShipment(createEmptyShipment());
      setVersion(1);
      setSaveState("unsaved");
      await utils.auth.me.invalidate();
      toast("Anda telah keluar dari akun EksporFlow");
    } catch {
      toast.error("Gagal keluar sesi");
    }
  }, [logoutMutation, utils.auth.me]);

  const pricing = useMemo(() => calculatePricing(shipment), [shipment]);
  const container = useMemo(() => calculateContainer(shipment), [shipment]);

  return {
    user,
    isAuthLoading: authQuery.isLoading,
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
    refreshAuth,
    logout,
  };
}
