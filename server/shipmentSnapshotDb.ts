import { randomUUID } from "node:crypto";
import { and, desc, eq, max } from "drizzle-orm";
import { getDb } from "./db";
import { isDuplicateEntryError } from "./dbErrors";
import {
  documentSnapshots,
  shipmentAuditLogs,
  shipments,
  type DocumentSnapshot,
} from "../drizzle/schema";
import {
  assertWorkspaceAccess,
  requireDatabase,
  ShipmentPersistenceError,
} from "./shipmentDb";
import {
  buildDocumentSnapshotPayload,
  canonicalJsonStringify,
  computePayloadHash,
  verifyPayloadHash,
  type DocumentSnapshotPayload,
} from "@shared/documentEngine";

export class DocumentSnapshotError extends Error {
  constructor(
    public readonly code: "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "BAD_REQUEST" | "DATABASE_UNAVAILABLE",
    message: string,
  ) {
    super(message);
  }
}

/**
 * Membuat snapshot dokumen immutable yang terkunci dengan hash SHA-256.
 * Setiap dokumen yang difinalisasi disimpan sebagai versi revisi baru (append-only)
 * dan dilindungi trigger database agar tidak dapat ditimpa.
 */
export async function createDocumentSnapshot(
  userId: number,
  input: {
    shipmentId: string;
    documentType: string;
    payload?: DocumentSnapshotPayload | Record<string, unknown>;
    paperSize?: string;
    orientation?: string;
    language?: string;
    template?: string;
    threeWayStatus?: string;
    overrideReason?: string;
    pdfStorageKey?: string;
    pdfSizeBytes?: number;
  },
) {
  const db = requireDatabase(await getDb());

  // 1. Verifikasi eksistensi shipment dan otorisasi akses (role editor+)
  const [shipment] = await db.select().from(shipments).where(eq(shipments.id, input.shipmentId)).limit(1);
  if (!shipment) {
    throw new DocumentSnapshotError("NOT_FOUND", "Transaksi ekspor tidak ditemukan.");
  }
  await assertWorkspaceAccess(db, shipment.workspaceId, userId, "editor");

  // 2. Hitung revisi berikutnya secara deterministik untuk jenis dokumen ini
  const existingRevisions = await db
    .select({ maxRev: max(documentSnapshots.revision) })
    .from(documentSnapshots)
    .where(
      and(
        eq(documentSnapshots.shipmentId, input.shipmentId),
        eq(documentSnapshots.documentType, input.documentType),
      ),
    );
  const nextRevision = (existingRevisions[0]?.maxRev ?? 0) + 1;

  // 3. Masukkan revisi ke payload jika payload mendukung properti revision atau bangun otomatis
  const payloadToStore = input.payload
    ? {
        ...input.payload,
        revision: nextRevision,
      }
    : buildDocumentSnapshotPayload(input.documentType, shipment as any, nextRevision);

  const canonicalPayload = canonicalJsonStringify(payloadToStore);
  const contentHashSha256 = computePayloadHash(payloadToStore);

  const snapshotId = randomUUID();

  try {
    const created = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(documentSnapshots)
        .values({
          id: snapshotId,
          workspaceId: shipment.workspaceId,
          shipmentId: input.shipmentId,
          documentType: input.documentType,
          revision: nextRevision,
          payloadJson: canonicalPayload,
          contentHashSha256,
          paperSize: input.paperSize || "A4",
          orientation: input.orientation || "Portrait",
          language: input.language || "English",
          template: input.template || "Classic Trade",
          threeWayStatus: input.threeWayStatus || "verified",
          overrideReason: input.overrideReason || null,
          pdfStorageKey: input.pdfStorageKey || null,
          pdfSizeBytes: input.pdfSizeBytes || null,
          createdByUserId: userId,
        })
        .returning();

      // Catat ke audit trail transaksi
      await tx.insert(shipmentAuditLogs).values({
        workspaceId: shipment.workspaceId,
        shipmentId: input.shipmentId,
        actorUserId: userId,
        action: "document_snapshot_finalized",
        version: shipment.version,
        detailJson: JSON.stringify({
          snapshotId,
          documentType: input.documentType,
          revision: nextRevision,
          contentHashSha256,
        }),
      });

      return inserted;
    });

    return created;
  } catch (error) {
    if (isDuplicateEntryError(error)) {
      throw new DocumentSnapshotError(
        "CONFLICT",
        `Snapshot ${input.documentType} revisi ${nextRevision} sudah ada di database.`,
      );
    }
    console.error("Failed to create document snapshot:", error);
    throw new DocumentSnapshotError("DATABASE_UNAVAILABLE", "Gagal menyimpan snapshot dokumen immutable.");
  }
}

/**
 * Mengambil riwayat seluruh snapshot yang pernah difinalisasi untuk transaksi tertentu.
 */
export async function listDocumentSnapshots(
  userId: number,
  shipmentId: string,
  documentType?: string,
) {
  const db = requireDatabase(await getDb());

  const [shipment] = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
  if (!shipment) {
    throw new DocumentSnapshotError("NOT_FOUND", "Transaksi ekspor tidak ditemukan.");
  }
  await assertWorkspaceAccess(db, shipment.workspaceId, userId, "viewer");

  const conditions = [eq(documentSnapshots.shipmentId, shipmentId)];
  if (documentType) {
    conditions.push(eq(documentSnapshots.documentType, documentType));
  }

  const rows = await db
    .select()
    .from(documentSnapshots)
    .where(and(...conditions))
    .orderBy(desc(documentSnapshots.createdAt));

  return rows.map((r) => {
    let parsedPayload: unknown = null;
    try {
      parsedPayload = JSON.parse(r.payloadJson);
    } catch {
      parsedPayload = null;
    }
    const isIntegrityValid = parsedPayload ? verifyPayloadHash(parsedPayload, r.contentHashSha256) : false;

    return {
      ...r,
      payload: parsedPayload,
      isIntegrityValid,
    };
  });
}

/**
 * Mengambil satu snapshot dokumen lengkap dan memvalidasi keaslian hash SHA-256.
 */
export async function getDocumentSnapshot(userId: number, snapshotId: string) {
  const db = requireDatabase(await getDb());

  const [snapshot] = await db
    .select()
    .from(documentSnapshots)
    .where(eq(documentSnapshots.id, snapshotId))
    .limit(1);

  if (!snapshot) {
    throw new DocumentSnapshotError("NOT_FOUND", "Snapshot dokumen tidak ditemukan.");
  }
  await assertWorkspaceAccess(db, snapshot.workspaceId, userId, "viewer");

  let parsedPayload: unknown = null;
  try {
    parsedPayload = JSON.parse(snapshot.payloadJson);
  } catch {
    parsedPayload = null;
  }

  const isIntegrityValid = parsedPayload ? verifyPayloadHash(parsedPayload, snapshot.contentHashSha256) : false;

  return {
    ...snapshot,
    payload: parsedPayload,
    isIntegrityValid,
  };
}

// Re-export shipmentSnapshots alias helper
export { documentSnapshots as shipmentSnapshots };
