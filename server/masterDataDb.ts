import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, asc, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import { isDuplicateEntryError } from "./dbErrors";
import {
  masterBuyers,
  masterProducts,
  users,
  workspaceInvitations,
  workspaceMembers,
  workspaces,
  type MasterBuyer,
  type MasterProduct,
  type WorkspaceInvitation,
} from "../drizzle/schema";
import {
  assertWorkspaceAccess,
  requireDatabase,
  resolveWorkspace,
  ShipmentPersistenceError,
} from "./shipmentDb";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export class MasterDataError extends Error {
  constructor(
    public readonly code: "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "BAD_REQUEST" | "DATABASE_UNAVAILABLE",
    message: string,
  ) {
    super(message);
  }
}

function handleDbError(error: unknown, duplicateMessage: string): never {
  if (isDuplicateEntryError(error)) {
    throw new MasterDataError("CONFLICT", duplicateMessage);
  }
  if (error instanceof ShipmentPersistenceError) {
    throw new MasterDataError(error.code, error.message);
  }
  if (error instanceof MasterDataError) {
    throw error;
  }
  console.error("Master data database operation failed:", error);
  throw new MasterDataError("DATABASE_UNAVAILABLE", "Operasi database data utama gagal.");
}

/* =====================================================================
 * MASTER BUYERS
 * ===================================================================== */

export async function listMasterBuyers(
  userId: number,
  options: { limit?: number; offset?: number; search?: string; includeArchived?: boolean } = {},
) {
  const db = requireDatabase(await getDb());
  const workspace = await resolveWorkspace(db, userId);
  await assertWorkspaceAccess(db, workspace.id, userId, "viewer");

  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);

  const conditions = [eq(masterBuyers.workspaceId, workspace.id)];

  if (!options.includeArchived) {
    conditions.push(isNull(masterBuyers.archivedAt));
  }

  if (options.search?.trim()) {
    const q = `%${options.search.trim()}%`;
    conditions.push(
      or(
        ilike(masterBuyers.name, q),
        ilike(masterBuyers.country, q),
        ilike(masterBuyers.destination, q),
        ilike(masterBuyers.picName, q),
      )!,
    );
  }

  return await db
    .select()
    .from(masterBuyers)
    .where(and(...conditions))
    .orderBy(desc(masterBuyers.updatedAt))
    .limit(limit)
    .offset(offset);
}

export async function getMasterBuyer(userId: number, id: string) {
  const db = requireDatabase(await getDb());
  const rows = await db.select().from(masterBuyers).where(eq(masterBuyers.id, id)).limit(1);
  const buyer = rows[0];
  if (!buyer) throw new MasterDataError("NOT_FOUND", "Data buyer tidak ditemukan.");
  await assertWorkspaceAccess(db, buyer.workspaceId, userId, "viewer");
  return buyer;
}

export async function createMasterBuyer(
  userId: number,
  input: {
    name: string;
    country?: string;
    destination?: string;
    address?: string;
    picName?: string;
    picEmail?: string;
    picPhone?: string;
    defaultPaymentTerms?: string;
    screeningStatus?: string;
    notes?: string;
  },
) {
  const db = requireDatabase(await getDb());
  const workspace = await resolveWorkspace(db, userId);
  await assertWorkspaceAccess(db, workspace.id, userId, "editor");

  const id = randomUUID();
  try {
    const [created] = await db
      .insert(masterBuyers)
      .values({
        id,
        workspaceId: workspace.id,
        name: input.name.trim(),
        country: input.country?.trim() || "",
        destination: input.destination?.trim() || "",
        address: input.address?.trim() || null,
        picName: input.picName?.trim() || null,
        picEmail: input.picEmail?.trim() || null,
        picPhone: input.picPhone?.trim() || null,
        defaultPaymentTerms: input.defaultPaymentTerms?.trim() || "30% DP / 70% before shipment",
        screeningStatus: input.screeningStatus || "unscreened",
        notes: input.notes?.trim() || null,
        version: 1,
        createdByUserId: userId,
      })
      .returning();
    return created;
  } catch (error) {
    handleDbError(error, "Nama buyer sudah terdaftar di workspace ini.");
  }
}

export async function updateMasterBuyer(
  userId: number,
  input: {
    id: string;
    version: number;
    name: string;
    country?: string;
    destination?: string;
    address?: string;
    picName?: string;
    picEmail?: string;
    picPhone?: string;
    defaultPaymentTerms?: string;
    screeningStatus?: string;
    notes?: string;
  },
) {
  const db = requireDatabase(await getDb());
  const existing = await getMasterBuyer(userId, input.id);
  await assertWorkspaceAccess(db, existing.workspaceId, userId, "editor");

  const nextVersion = input.version + 1;
  try {
    const [updated] = await db
      .update(masterBuyers)
      .set({
        name: input.name.trim(),
        country: input.country?.trim() || "",
        destination: input.destination?.trim() || "",
        address: input.address?.trim() || null,
        picName: input.picName?.trim() || null,
        picEmail: input.picEmail?.trim() || null,
        picPhone: input.picPhone?.trim() || null,
        defaultPaymentTerms: input.defaultPaymentTerms?.trim() || null,
        screeningStatus: input.screeningStatus || existing.screeningStatus,
        notes: input.notes?.trim() || null,
        version: nextVersion,
      })
      .where(and(eq(masterBuyers.id, input.id), eq(masterBuyers.version, input.version)))
      .returning();

    if (!updated) {
      throw new MasterDataError(
        "CONFLICT",
        "Data buyer telah diperbarui oleh pengguna lain. Silakan muat ulang.",
      );
    }
    return updated;
  } catch (error) {
    handleDbError(error, "Nama buyer sudah terdaftar di workspace ini.");
  }
}

export async function archiveMasterBuyer(userId: number, id: string, archive: boolean = true) {
  const db = requireDatabase(await getDb());
  const existing = await getMasterBuyer(userId, id);
  await assertWorkspaceAccess(db, existing.workspaceId, userId, "editor");

  const [updated] = await db
    .update(masterBuyers)
    .set({
      archivedAt: archive ? new Date() : null,
      version: existing.version + 1,
    })
    .where(eq(masterBuyers.id, id))
    .returning();
  return updated;
}

export async function deleteMasterBuyer(userId: number, id: string) {
  const db = requireDatabase(await getDb());
  const existing = await getMasterBuyer(userId, id);
  await assertWorkspaceAccess(db, existing.workspaceId, userId, "admin");

  await db.delete(masterBuyers).where(eq(masterBuyers.id, id));
  return { success: true };
}

/* =====================================================================
 * MASTER PRODUCTS
 * ===================================================================== */

export async function listMasterProducts(
  userId: number,
  options: {
    limit?: number;
    offset?: number;
    search?: string;
    commodityPreset?: string;
    includeArchived?: boolean;
  } = {},
) {
  const db = requireDatabase(await getDb());
  const workspace = await resolveWorkspace(db, userId);
  await assertWorkspaceAccess(db, workspace.id, userId, "viewer");

  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);

  const conditions = [eq(masterProducts.workspaceId, workspace.id)];

  if (!options.includeArchived) {
    conditions.push(isNull(masterProducts.archivedAt));
  }

  if (options.commodityPreset?.trim()) {
    conditions.push(eq(masterProducts.commodityPreset, options.commodityPreset.trim()));
  }

  if (options.search?.trim()) {
    const q = `%${options.search.trim()}%`;
    conditions.push(
      or(
        ilike(masterProducts.name, q),
        ilike(masterProducts.sku, q),
        ilike(masterProducts.hsCode, q),
      )!,
    );
  }

  return await db
    .select()
    .from(masterProducts)
    .where(and(...conditions))
    .orderBy(desc(masterProducts.updatedAt))
    .limit(limit)
    .offset(offset);
}

export async function getMasterProduct(userId: number, id: string) {
  const db = requireDatabase(await getDb());
  const rows = await db.select().from(masterProducts).where(eq(masterProducts.id, id)).limit(1);
  const prod = rows[0];
  if (!prod) throw new MasterDataError("NOT_FOUND", "Data produk tidak ditemukan.");
  await assertWorkspaceAccess(db, prod.workspaceId, userId, "viewer");
  return prod;
}

export async function createMasterProduct(
  userId: number,
  input: {
    sku?: string;
    name: string;
    commodityPreset?: string;
    hsCode?: string;
    unit?: string;
    unitPrice?: number;
    currency?: string;
    packagingType?: string;
    unitWeightKg?: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    shrinkageRatePct?: number;
  },
) {
  const db = requireDatabase(await getDb());
  const workspace = await resolveWorkspace(db, userId);
  await assertWorkspaceAccess(db, workspace.id, userId, "editor");

  const id = randomUUID();
  try {
    const [created] = await db
      .insert(masterProducts)
      .values({
        id,
        workspaceId: workspace.id,
        sku: input.sku?.trim() || null,
        name: input.name.trim(),
        commodityPreset: input.commodityPreset?.trim() || null,
        hsCode: input.hsCode?.trim() || "",
        unit: input.unit?.trim() || "carton",
        unitPrice: String(input.unitPrice ?? 0),
        currency: input.currency?.trim() || "USD",
        packagingType: input.packagingType?.trim() || "Karton box",
        unitWeightKg: String(input.unitWeightKg ?? 0),
        lengthCm: String(input.lengthCm ?? 0),
        widthCm: String(input.widthCm ?? 0),
        heightCm: String(input.heightCm ?? 0),
        shrinkageRatePct: String(input.shrinkageRatePct ?? 0),
        version: 1,
        createdByUserId: userId,
      })
      .returning();
    return created;
  } catch (error) {
    handleDbError(error, "SKU produk sudah terdaftar di workspace ini.");
  }
}

export async function updateMasterProduct(
  userId: number,
  input: {
    id: string;
    version: number;
    sku?: string;
    name: string;
    commodityPreset?: string;
    hsCode?: string;
    unit?: string;
    unitPrice?: number;
    currency?: string;
    packagingType?: string;
    unitWeightKg?: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    shrinkageRatePct?: number;
  },
) {
  const db = requireDatabase(await getDb());
  const existing = await getMasterProduct(userId, input.id);
  await assertWorkspaceAccess(db, existing.workspaceId, userId, "editor");

  const nextVersion = input.version + 1;
  try {
    const [updated] = await db
      .update(masterProducts)
      .set({
        sku: input.sku?.trim() || null,
        name: input.name.trim(),
        commodityPreset: input.commodityPreset?.trim() || null,
        hsCode: input.hsCode?.trim() || "",
        unit: input.unit?.trim() || "carton",
        unitPrice: String(input.unitPrice ?? 0),
        currency: input.currency?.trim() || "USD",
        packagingType: input.packagingType?.trim() || "Karton box",
        unitWeightKg: String(input.unitWeightKg ?? 0),
        lengthCm: String(input.lengthCm ?? 0),
        widthCm: String(input.widthCm ?? 0),
        heightCm: String(input.heightCm ?? 0),
        shrinkageRatePct: String(input.shrinkageRatePct ?? 0),
        version: nextVersion,
      })
      .where(and(eq(masterProducts.id, input.id), eq(masterProducts.version, input.version)))
      .returning();

    if (!updated) {
      throw new MasterDataError(
        "CONFLICT",
        "Data produk telah diperbarui oleh pengguna lain. Silakan muat ulang.",
      );
    }
    return updated;
  } catch (error) {
    handleDbError(error, "SKU produk sudah terdaftar di workspace ini.");
  }
}

export async function archiveMasterProduct(userId: number, id: string, archive: boolean = true) {
  const db = requireDatabase(await getDb());
  const existing = await getMasterProduct(userId, id);
  await assertWorkspaceAccess(db, existing.workspaceId, userId, "editor");

  const [updated] = await db
    .update(masterProducts)
    .set({
      archivedAt: archive ? new Date() : null,
      version: existing.version + 1,
    })
    .where(eq(masterProducts.id, id))
    .returning();
  return updated;
}

export async function deleteMasterProduct(userId: number, id: string) {
  const db = requireDatabase(await getDb());
  const existing = await getMasterProduct(userId, id);
  await assertWorkspaceAccess(db, existing.workspaceId, userId, "admin");

  await db.delete(masterProducts).where(eq(masterProducts.id, id));
  return { success: true };
}

/* =====================================================================
 * WORKSPACE INVITATIONS
 * ===================================================================== */

export async function listWorkspaceInvitations(userId: number) {
  const db = requireDatabase(await getDb());
  const workspace = await resolveWorkspace(db, userId);
  await assertWorkspaceAccess(db, workspace.id, userId, "admin");

  return await db
    .select({
      id: workspaceInvitations.id,
      email: workspaceInvitations.email,
      role: workspaceInvitations.role,
      status: workspaceInvitations.status,
      expiresAt: workspaceInvitations.expiresAt,
      createdAt: workspaceInvitations.createdAt,
      acceptedAt: workspaceInvitations.acceptedAt,
    })
    .from(workspaceInvitations)
    .where(eq(workspaceInvitations.workspaceId, workspace.id))
    .orderBy(desc(workspaceInvitations.createdAt));
}

export async function createWorkspaceInvitation(
  userId: number,
  input: { email: string; role: "admin" | "editor" | "viewer" },
) {
  const db = requireDatabase(await getDb());
  const workspace = await resolveWorkspace(db, userId);
  await assertWorkspaceAccess(db, workspace.id, userId, "admin");

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 hari

  const id = randomUUID();
  try {
    const [invitation] = await db
      .insert(workspaceInvitations)
      .values({
        id,
        workspaceId: workspace.id,
        email: input.email.trim().toLowerCase(),
        role: input.role,
        tokenHash,
        status: "pending",
        invitedByUserId: userId,
        expiresAt,
      })
      .returning();

    return {
      invitation,
      rawToken, // Dikembalikan sekali untuk link undangan
    };
  } catch (error) {
    handleDbError(error, "Undangan untuk email ini sudah dibuat.");
  }
}

export async function revokeWorkspaceInvitation(userId: number, invitationId: string) {
  const db = requireDatabase(await getDb());
  const rows = await db
    .select()
    .from(workspaceInvitations)
    .where(eq(workspaceInvitations.id, invitationId))
    .limit(1);
  const inv = rows[0];
  if (!inv) throw new MasterDataError("NOT_FOUND", "Undangan tidak ditemukan.");
  await assertWorkspaceAccess(db, inv.workspaceId, userId, "admin");

  const [updated] = await db
    .update(workspaceInvitations)
    .set({ status: "revoked" })
    .where(eq(workspaceInvitations.id, invitationId))
    .returning();
  return updated;
}
