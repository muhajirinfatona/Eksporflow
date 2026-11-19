import { createClient } from "@supabase/supabase-js";
import {
  type LineItem,
  type Shipment,
  hydrateShipment,
  toShipmentPersistencePayload,
} from "@shared/shipment";

export const SUPABASE_URL = "https://ymwsgjqjdaakmptndjua.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltd3NnanFqZGFha21wdG5kanVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxODg2OTUsImV4cCI6MjEwODc2NDY5NX0.txKEGTGvNMFE2KYsl9bYGcvwt6qM_msNwyGU9hESHLI";

export const DEFAULT_WORKSPACE_ID = "12306a7d-8ddc-4958-8f6b-eee2ad143f56";
export const DEFAULT_USER_ID = 4;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface SupabaseShipmentRecord {
  id: string;
  workspaceId: string;
  reference: string;
  status: string;
  snapshotJson: string;
  version: number;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
}

export async function fetchShipmentsFromSupabase(): Promise<SupabaseShipmentRecord[]> {
  try {
    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .order("updatedAt", { ascending: false });

    if (error) {
      console.warn("[Supabase] Failed to fetch shipments:", error);
      return [];
    }
    return (data as SupabaseShipmentRecord[]) || [];
  } catch (err) {
    console.warn("[Supabase] Exception fetching shipments:", err);
    return [];
  }
}

export async function getShipmentFromSupabase(id: string): Promise<{
  id: string;
  reference: string;
  status: string;
  version: number;
  snapshot: Record<string, unknown>;
  lineItems: LineItem[];
} | null> {
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  let snapshot: Record<string, unknown> = {};
  let lineItems: LineItem[] = [];
  try {
    const parsed = JSON.parse(data.snapshotJson);
    snapshot = parsed;
    if (Array.isArray(parsed.lineItems)) {
      lineItems = parsed.lineItems;
    }
  } catch (e) {
    console.error("Error parsing shipment snapshot:", e);
  }

  return {
    id: data.id,
    reference: data.reference,
    status: data.status,
    version: data.version,
    snapshot,
    lineItems,
  };
}

export async function saveShipmentToSupabase(
  shipment: Shipment,
  activeShipmentId: string | null,
  currentVersion: number,
): Promise<{ id: string; version: number; reference: string }> {
  const payload = toShipmentPersistencePayload(shipment);
  const now = new Date().toISOString();
  const ref = shipment.reference?.trim() || "Transaksi Ekspor";

  if (!activeShipmentId) {
    const newId = crypto.randomUUID();
    const newRecord = {
      id: newId,
      workspaceId: DEFAULT_WORKSPACE_ID,
      reference: ref,
      status: "Draft",
      snapshotJson: JSON.stringify({
        ...payload.snapshot,
        lineItems: payload.lineItems,
      }),
      version: 1,
      createdByUserId: DEFAULT_USER_ID,
      createdAt: now,
      updatedAt: now,
    };

    const { error } = await supabase.from("shipments").insert([newRecord]);
    if (error) {
      throw new Error(`Supabase insert error: ${error.message}`);
    }

    // Insert audit log
    await supabase.from("shipmentAuditLogs").insert([
      {
        workspaceId: DEFAULT_WORKSPACE_ID,
        shipmentId: newId,
        actorUserId: DEFAULT_USER_ID,
        action: "created",
        version: 1,
        detailJson: JSON.stringify({ reference: ref }),
        createdAt: now,
      },
    ]);

    return { id: newId, version: 1, reference: ref };
  } else {
    const nextVersion = currentVersion + 1;
    const updateRecord = {
      reference: ref,
      status: "Draft",
      snapshotJson: JSON.stringify({
        ...payload.snapshot,
        lineItems: payload.lineItems,
      }),
      version: nextVersion,
      updatedAt: now,
    };

    const { error } = await supabase
      .from("shipments")
      .update(updateRecord)
      .eq("id", activeShipmentId);

    if (error) {
      throw new Error(`Supabase update error: ${error.message}`);
    }

    // Insert audit log
    await supabase.from("shipmentAuditLogs").insert([
      {
        workspaceId: DEFAULT_WORKSPACE_ID,
        shipmentId: activeShipmentId,
        actorUserId: DEFAULT_USER_ID,
        action: "updated",
        version: nextVersion,
        detailJson: JSON.stringify({ reference: ref, version: nextVersion }),
        createdAt: now,
      },
    ]);

    return { id: activeShipmentId, version: nextVersion, reference: ref };
  }
}
