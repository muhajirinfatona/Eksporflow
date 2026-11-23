import { eq, desc, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  aiInteractionLogs,
  aiFeedback,
  type AiInteractionLog,
  type AiFeedback,
} from "../drizzle/schema";
import {
  assertWorkspaceAccess,
  requireDatabase,
  resolveWorkspace,
  ShipmentPersistenceError,
} from "./shipmentDb";

export interface LogAiInteractionParams {
  shipmentId?: string | null;
  model: string;
  questionChars: number;
  questionSha256: string;
  redactionCount: number;
  toolCallsJson?: string | null;
  citationsJson?: string | null;
  abstained?: boolean;
  abstainReason?: string | null;
  latencyMs?: number | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  estimatedCostUsd?: string | null;
  status?: "ok" | "error" | "abstained";
  errorCode?: string | null;
}

export interface SubmitAiFeedbackParams {
  interactionId: string;
  rating: "up" | "down";
  reasonCode?: string;
  comment?: string;
}

/**
 * Mencatat interaksi AI ke tabel `aiInteractionLogs` untuk keperluan audit keamanan,
 * monitoring biaya token, pelacakan latensi, dan kepatuhan redaksi PII.
 */
export async function logAiInteraction(
  userId: number,
  params: LogAiInteractionParams,
): Promise<AiInteractionLog> {
  const db = requireDatabase(await getDb());
  const workspace = await resolveWorkspace(db, userId);

  const [inserted] = await db
    .insert(aiInteractionLogs)
    .values({
      workspaceId: workspace.id,
      userId,
      shipmentId: params.shipmentId || null,
      model: params.model,
      questionChars: params.questionChars,
      questionSha256: params.questionSha256,
      redactionCount: params.redactionCount,
      toolCallsJson: params.toolCallsJson || null,
      citationsJson: params.citationsJson || null,
      abstained: params.abstained ?? false,
      abstainReason: params.abstainReason || null,
      latencyMs: params.latencyMs || null,
      promptTokens: params.promptTokens || null,
      completionTokens: params.completionTokens || null,
      estimatedCostUsd: params.estimatedCostUsd || null,
      status: params.status || (params.abstained ? "abstained" : "ok"),
      errorCode: params.errorCode || null,
    })
    .returning();

  return inserted;
}

/**
 * Menyimpan atau memperbarui umpan balik pengguna (thumbs up/down) terhadap respons AI.
 */
export async function recordAiFeedback(
  userId: number,
  params: SubmitAiFeedbackParams,
): Promise<AiFeedback> {
  const db = requireDatabase(await getDb());
  const workspace = await resolveWorkspace(db, userId);

  // Verifikasi bahwa interaksi AI ada dan berada di workspace yang sama
  const interactions = await db
    .select()
    .from(aiInteractionLogs)
    .where(and(eq(aiInteractionLogs.id, params.interactionId), eq(aiInteractionLogs.workspaceId, workspace.id)))
    .limit(1);

  if (interactions.length === 0) {
    throw new ShipmentPersistenceError("NOT_FOUND", "Log interaksi AI tidak ditemukan atau tidak memiliki akses.");
  }

  // Gunakan upsert pada (interactionId, userId)
  const existingFeedback = await db
    .select()
    .from(aiFeedback)
    .where(and(eq(aiFeedback.interactionId, params.interactionId), eq(aiFeedback.userId, userId)))
    .limit(1);

  if (existingFeedback.length > 0) {
    const [updated] = await db
      .update(aiFeedback)
      .set({
        rating: params.rating,
        reasonCode: params.reasonCode || null,
        comment: params.comment || null,
      })
      .where(eq(aiFeedback.id, existingFeedback[0].id))
      .returning();
    return updated;
  }

  const [inserted] = await db
    .insert(aiFeedback)
    .values({
      workspaceId: workspace.id,
      interactionId: params.interactionId,
      userId,
      rating: params.rating,
      reasonCode: params.reasonCode || null,
      comment: params.comment || null,
    })
    .returning();

  return inserted;
}

/**
 * Mengambil histori interaksi AI terbaru untuk keperluan dashboard audit.
 */
export async function listAiInteractionLogs(
  userId: number,
  limit = 20,
): Promise<AiInteractionLog[]> {
  const db = requireDatabase(await getDb());
  const workspace = await resolveWorkspace(db, userId);
  await assertWorkspaceAccess(db, workspace.id, userId, "viewer");

  const safeLimit = Math.min(Math.max(limit, 1), 100);

  return db
    .select()
    .from(aiInteractionLogs)
    .where(eq(aiInteractionLogs.workspaceId, workspace.id))
    .orderBy(desc(aiInteractionLogs.createdAt))
    .limit(safeLimit);
}
