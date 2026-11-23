import { randomUUID } from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { isDuplicateEntryError } from "./dbErrors";
import { shipmentAuditLogs, shipmentLineItems, shipments, users, workspaceMembers, workspaces } from "../drizzle/schema";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;

type JsonRecord = Record<string, unknown>;

export const roleRank = { viewer: 1, editor: 2, admin: 3, owner: 4 } as const;
export type WorkspaceRole = keyof typeof roleRank;

export class ShipmentPersistenceError extends Error {
  constructor(public readonly code: "DATABASE_UNAVAILABLE" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT", message: string) {
    super(message);
  }
}

const DUPLICATE_REFERENCE_MESSAGE = "Referensi transaksi sudah dipakai di workspace ini.";

export function requireDatabase(db: Database | null): Database {
  if (!db) throw new ShipmentPersistenceError("DATABASE_UNAVAILABLE", "Database belum tersedia.");
  return db;
}

function parseJson(value: string): JsonRecord {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as JsonRecord : {};
  } catch {
    return {};
  }
}

async function findMemberWorkspace(db: Database, userId: number) {
  // Urutan membership tertua agar hasil deterministik bila user tergabung di beberapa workspace.
  const rows = await db.select({ workspace: workspaces })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(asc(workspaceMembers.id))
    .limit(1);
  return rows[0]?.workspace;
}

/**
 * Workspace aktif user: workspace dari membership tertua (termasuk workspace yang
 * dimiliki orang lain dan mengundang user). Jika user belum punya membership,
 * workspace pribadi dibuat bersama membership owner dalam satu transaksi.
 */
export async function resolveWorkspace(db: Database, userId: number, fallbackName?: string) {
  const existing = await findMemberWorkspace(db, userId);
  if (existing) return existing;

  // Perbaiki data lama: workspace milik user yang tidak punya baris membership.
  const owned = await db.select().from(workspaces).where(eq(workspaces.ownerUserId, userId)).limit(1);
  if (owned[0]) {
    try {
      await db.insert(workspaceMembers).values({ workspaceId: owned[0].id, userId, role: "owner" });
    } catch (error) {
      if (!isDuplicateEntryError(error)) throw error;
    }
    return owned[0];
  }

  const userRows = await db.select({ companyName: users.companyName, name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
  const resolvedName =
    fallbackName?.trim() ||
    userRows[0]?.companyName?.trim() ||
    (userRows[0]?.name?.trim() ? `Workspace ${userRows[0].name.trim()}` : "Workspace Ekspor");

  try {
    await db.transaction(async (tx) => {
      const id = randomUUID();
      await tx.insert(workspaces).values({ id, name: resolvedName, ownerUserId: userId });
      await tx.insert(workspaceMembers).values({ workspaceId: id, userId, role: "owner" });
    });
  } catch (error) {
    // Request paralel pertama kali dapat membuat workspace yang sama; pakai hasilnya.
    if (!isDuplicateEntryError(error)) throw error;
  }
  const created = await findMemberWorkspace(db, userId);
  if (!created) throw new ShipmentPersistenceError("DATABASE_UNAVAILABLE", "Workspace gagal dibuat.");
  return created;
}

export async function assertWorkspaceAccess(db: Database, workspaceId: string, userId: number, minimumRole: WorkspaceRole = "viewer") {
  const member = await db.select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .limit(1);
  const role = member[0]?.role as WorkspaceRole | undefined;
  if (!role || roleRank[role] < roleRank[minimumRole]) {
    throw new ShipmentPersistenceError("FORBIDDEN", "Anda tidak memiliki akses ke workspace ini.");
  }
  return role;
}

export async function listShipments(userId: number, input: { limit: number; offset: number }) {
  const db = requireDatabase(await getDb());
  const workspace = await resolveWorkspace(db, userId);
  await assertWorkspaceAccess(db, workspace.id, userId);
  const rows = await db.select({
    id: shipments.id,
    reference: shipments.reference,
    status: shipments.status,
    version: shipments.version,
    snapshotJson: shipments.snapshotJson,
    createdAt: shipments.createdAt,
    updatedAt: shipments.updatedAt,
  })
    .from(shipments)
    .where(eq(shipments.workspaceId, workspace.id))
    .orderBy(desc(shipments.updatedAt))
    .limit(input.limit)
    .offset(input.offset);

  return rows.map((r) => {
    const snap = parseJson(r.snapshotJson);
    return {
      id: r.id,
      reference: r.reference,
      status: r.status,
      version: r.version,
      buyer: typeof snap.buyer === "string" ? snap.buyer : "",
      buyerCountry: typeof snap.buyerCountry === "string" ? snap.buyerCountry : "",
      product: typeof snap.product === "string" ? snap.product : "",
      incoterm: typeof snap.incoterm === "string" ? snap.incoterm : "FOB",
      quantity: typeof snap.quantity === "number" ? snap.quantity : 20,
      unit: typeof snap.unit === "string" ? snap.unit : "MT",
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  });
}

export async function deleteShipment(userId: number, shipmentId: string) {
  const db = requireDatabase(await getDb());
  const rows = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
  const current = rows[0];
  if (!current) throw new ShipmentPersistenceError("NOT_FOUND", "Transaksi tidak ditemukan.");
  await assertWorkspaceAccess(db, current.workspaceId, userId, "editor");
  await db.transaction(async (tx) => {
    await tx.delete(shipmentLineItems).where(eq(shipmentLineItems.shipmentId, shipmentId));
    await tx.delete(shipmentAuditLogs).where(eq(shipmentAuditLogs.shipmentId, shipmentId));
    await tx.delete(shipments).where(eq(shipments.id, shipmentId));
  });
  return { success: true };
}

export async function getShipment(userId: number, shipmentId: string) {
  const db = requireDatabase(await getDb());
  const rows = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
  const shipment = rows[0];
  if (!shipment) throw new ShipmentPersistenceError("NOT_FOUND", "Transaksi tidak ditemukan.");
  await assertWorkspaceAccess(db, shipment.workspaceId, userId);
  const items = await db.select({ itemKey: shipmentLineItems.itemKey, itemJson: shipmentLineItems.itemJson })
    .from(shipmentLineItems)
    .where(eq(shipmentLineItems.shipmentId, shipment.id))
    .limit(200);
  return {
    ...shipment,
    snapshot: parseJson(shipment.snapshotJson),
    lineItems: items.map(item => ({ id: item.itemKey, ...parseJson(item.itemJson) })),
  };
}

export async function createShipment(userId: number, input: { reference: string; status: string; snapshot: JsonRecord; lineItems: JsonRecord[] }) {
  const db = requireDatabase(await getDb());
  const workspace = await resolveWorkspace(db, userId);
  await assertWorkspaceAccess(db, workspace.id, userId, "editor");
  const id = randomUUID();
  try {
    // Shipment, line item, dan audit log harus tersimpan bersama atau tidak sama sekali.
    await db.transaction(async (tx) => {
      await tx.insert(shipments).values({
        id,
        workspaceId: workspace.id,
        reference: input.reference,
        status: input.status,
        snapshotJson: JSON.stringify(input.snapshot),
        version: 1,
        createdByUserId: userId,
      });
      if (input.lineItems.length) {
        await tx.insert(shipmentLineItems).values(input.lineItems.map((item, index) => ({
          shipmentId: id,
          itemKey: String(item.id ?? `item-${index + 1}`),
          itemJson: JSON.stringify(item),
        })));
      }
      await tx.insert(shipmentAuditLogs).values({
        workspaceId: workspace.id,
        shipmentId: id,
        actorUserId: userId,
        action: "created",
        version: 1,
        detailJson: JSON.stringify({ reference: input.reference }),
      });
    });
  } catch (error) {
    if (isDuplicateEntryError(error)) throw new ShipmentPersistenceError("CONFLICT", DUPLICATE_REFERENCE_MESSAGE);
    throw error;
  }
  return getShipment(userId, id);
}

export async function updateShipment(userId: number, input: { id: string; version: number; reference: string; status: string; snapshot: JsonRecord; lineItems: JsonRecord[] }) {
  const db = requireDatabase(await getDb());
  const rows = await db.select().from(shipments).where(eq(shipments.id, input.id)).limit(1);
  const current = rows[0];
  if (!current) throw new ShipmentPersistenceError("NOT_FOUND", "Transaksi tidak ditemukan.");
  await assertWorkspaceAccess(db, current.workspaceId, userId, "editor");
  const nextVersion = input.version + 1;
  try {
    // Mengubah versi, mengganti line item, dan menulis audit log bersifat atomik. Jika versi
    // sudah berubah, error dilempar dari dalam transaksi sehingga semuanya di-rollback.
    await db.transaction(async (tx) => {
      const updated = await tx.update(shipments)
        .set({ reference: input.reference, status: input.status, snapshotJson: JSON.stringify(input.snapshot), version: nextVersion })
        .where(and(eq(shipments.id, input.id), eq(shipments.version, input.version)))
        .returning({ id: shipments.id });
      if (updated.length !== 1) throw new ShipmentPersistenceError("CONFLICT", "Transaksi sudah berubah. Muat ulang sebelum menyimpan lagi.");

      await tx.delete(shipmentLineItems).where(eq(shipmentLineItems.shipmentId, input.id));
      if (input.lineItems.length) {
        await tx.insert(shipmentLineItems).values(input.lineItems.map((item, index) => ({
          shipmentId: input.id,
          itemKey: String(item.id ?? `item-${index + 1}`),
          itemJson: JSON.stringify(item),
        })));
      }
      await tx.insert(shipmentAuditLogs).values({
        workspaceId: current.workspaceId,
        shipmentId: input.id,
        actorUserId: userId,
        action: "updated",
        version: nextVersion,
        detailJson: JSON.stringify({ reference: input.reference, itemCount: input.lineItems.length }),
      });
    });
  } catch (error) {
    if (isDuplicateEntryError(error)) throw new ShipmentPersistenceError("CONFLICT", DUPLICATE_REFERENCE_MESSAGE);
    throw error;
  }
  return getShipment(userId, input.id);
}
