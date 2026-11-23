import { boolean, check, index, integer, numeric, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Skema PostgreSQL (Supabase). Semua tabel mengaktifkan Row Level Security tanpa policy:
 * akses lewat API publik Supabase (anon/authenticated) ditolak, sedangkan server mengakses
 * database langsung lewat DATABASE_URL (role postgres melewati RLS).
 * Kolom memakai camelCase agar cocok dengan field TypeScript dan tipe hasil generate.
 */

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const workspaceRole = pgEnum("workspace_role", ["owner", "admin", "editor", "viewer"]);

const createdAt = () => timestamp("createdAt", { withTimezone: true }).defaultNow().notNull();
// Postgres tidak punya ON UPDATE CURRENT_TIMESTAMP; drizzle mengisi nilai ini pada setiap update lewat aplikasi.
const updatedAt = () => timestamp("updatedAt", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull();

export const users = pgTable("users", {
  /** Surrogate primary key untuk relasi antar tabel. */
  id: serial("id").primaryKey(),
  /** Identifier unik per user (OAuth openId atau akun lokal). */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  companyName: varchar("companyName", { length: 160 }),
  email: varchar("email", { length: 320 }),
  passwordHash: text("passwordHash"),
  emailVerifiedAt: timestamp("emailVerifiedAt", { withTimezone: true }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRole("role").default("user").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
}, table => [
  uniqueIndex("users_email_idx").on(table.email),
]).enableRLS();

export const emailVerificationCodes = pgTable("emailVerificationCodes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 320 }).notNull(),
  codeHash: varchar("codeHash", { length: 128 }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumedAt", { withTimezone: true }),
  createdAt: createdAt(),
}).enableRLS();

export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 160 }).notNull(),
  ownerUserId: integer("ownerUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, table => [
  uniqueIndex("workspaces_owner_name_idx").on(table.ownerUserId, table.name),
]).enableRLS();

export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = typeof workspaces.$inferInsert;

export const workspaceMembers = pgTable("workspaceMembers", {
  id: serial("id").primaryKey(),
  workspaceId: uuid("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: workspaceRole("role").default("editor").notNull(),
  createdAt: createdAt(),
}, table => [
  uniqueIndex("workspace_membership_idx").on(table.workspaceId, table.userId),
]).enableRLS();

export type WorkspaceMember = typeof workspaceMembers.$inferSelect;

export const shipments = pgTable("shipments", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  reference: varchar("reference", { length: 80 }).notNull(),
  status: varchar("status", { length: 40 }).notNull().default("Draft"),
  snapshotJson: text("snapshotJson").notNull(),
  version: integer("version").notNull().default(1),
  createdByUserId: integer("createdByUserId").notNull().references(() => users.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, table => [
  uniqueIndex("shipments_workspace_reference_idx").on(table.workspaceId, table.reference),
]).enableRLS();

export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = typeof shipments.$inferInsert;

export const shipmentLineItems = pgTable("shipmentLineItems", {
  id: serial("id").primaryKey(),
  shipmentId: uuid("shipmentId").notNull().references(() => shipments.id, { onDelete: "cascade" }),
  itemKey: varchar("itemKey", { length: 80 }).notNull(),
  itemJson: text("itemJson").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, table => [
  uniqueIndex("shipment_line_item_key_idx").on(table.shipmentId, table.itemKey),
]).enableRLS();

export const shipmentAuditLogs = pgTable("shipmentAuditLogs", {
  id: serial("id").primaryKey(),
  workspaceId: uuid("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  shipmentId: uuid("shipmentId").notNull().references(() => shipments.id, { onDelete: "cascade" }),
  actorUserId: integer("actorUserId").notNull().references(() => users.id),
  action: varchar("action", { length: 40 }).notNull(),
  version: integer("version").notNull(),
  detailJson: text("detailJson").notNull(),
  createdAt: createdAt(),
}).enableRLS();


/* =====================================================================
 * EksporFlow v2 (migrasi 0002_v2_foundation) — 100% aditif.
 * Semua tabel baru: ENABLE ROW LEVEL SECURITY (tanpa policy; akses hanya via server),
 * kolom tenant `workspaceId`, dan index komposit diawali `workspaceId`.
 * ===================================================================== */

export const masterBuyers = pgTable("masterBuyers", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  country: varchar("country", { length: 80 }).notNull().default(""),
  destination: varchar("destination", { length: 200 }).notNull().default(""),
  address: text("address"),
  picName: varchar("picName", { length: 160 }),
  picEmail: varchar("picEmail", { length: 320 }),
  picPhone: varchar("picPhone", { length: 60 }),
  defaultPaymentTerms: varchar("defaultPaymentTerms", { length: 200 }),
  screeningStatus: varchar("screeningStatus", { length: 30 }).notNull().default("unscreened"),
  notes: text("notes"),
  archivedAt: timestamp("archivedAt", { withTimezone: true }),
  version: integer("version").notNull().default(1),
  createdByUserId: integer("createdByUserId").notNull().references(() => users.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, table => [
  uniqueIndex("masterBuyers_workspace_name_idx").on(table.workspaceId, table.name),
  index("masterBuyers_workspace_country_idx").on(table.workspaceId, table.country),
]).enableRLS();

export const masterProducts = pgTable("masterProducts", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  sku: varchar("sku", { length: 80 }),
  name: varchar("name", { length: 200 }).notNull(),
  commodityPreset: varchar("commodityPreset", { length: 40 }),
  hsCode: varchar("hsCode", { length: 20 }).notNull().default(""),
  unit: varchar("unit", { length: 30 }).notNull().default("carton"),
  unitPrice: numeric("unitPrice", { precision: 14, scale: 4 }).notNull().default("0"),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  packagingType: varchar("packagingType", { length: 60 }).notNull().default("Karton box"),
  unitWeightKg: numeric("unitWeightKg", { precision: 12, scale: 3 }).notNull().default("0"),
  lengthCm: numeric("lengthCm", { precision: 10, scale: 2 }).notNull().default("0"),
  widthCm: numeric("widthCm", { precision: 10, scale: 2 }).notNull().default("0"),
  heightCm: numeric("heightCm", { precision: 10, scale: 2 }).notNull().default("0"),
  shrinkageRatePct: numeric("shrinkageRatePct", { precision: 5, scale: 2 }).notNull().default("0"),
  archivedAt: timestamp("archivedAt", { withTimezone: true }),
  version: integer("version").notNull().default(1),
  createdByUserId: integer("createdByUserId").notNull().references(() => users.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, table => [
  uniqueIndex("masterProducts_workspace_sku_idx").on(table.workspaceId, table.sku),
  index("masterProducts_workspace_hs_idx").on(table.workspaceId, table.hsCode),
  index("masterProducts_workspace_name_idx").on(table.workspaceId, table.name),
]).enableRLS();

export const knowledgeDocuments = pgTable("knowledgeDocuments", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 240 }).notNull(),
  scope: varchar("scope", { length: 120 }).notNull().default("general"),
  docVersion: varchar("docVersion", { length: 40 }).notNull().default("1.0"),
  governance: varchar("governance", { length: 240 }),
  /** draft | in_review | published | revoked */
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  sourceUrl: text("sourceUrl"),
  storageKey: text("storageKey"),
  licenseNote: text("licenseNote"),
  effectiveAt: timestamp("effectiveAt", { withTimezone: true }),
  expiresAt: timestamp("expiresAt", { withTimezone: true }),
  revokedAt: timestamp("revokedAt", { withTimezone: true }),
  createdByUserId: integer("createdByUserId").notNull().references(() => users.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, table => [
  index("knowledgeDocuments_workspace_status_exp_idx").on(table.workspaceId, table.status, table.expiresAt),
  check("knowledgeDocuments_status_chk", sql`${table.status} in ('draft','in_review','published','revoked')`),
]).enableRLS();

export const knowledgeChunks = pgTable("knowledgeChunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  documentId: uuid("documentId").notNull().references(() => knowledgeDocuments.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunkIndex").notNull(),
  content: text("content").notNull(),
  tokenCount: integer("tokenCount").notNull().default(0),
  contentHash: varchar("contentHash", { length: 64 }).notNull(),
  createdAt: createdAt(),
}, table => [
  uniqueIndex("knowledgeChunks_doc_chunk_idx").on(table.documentId, table.chunkIndex),
  index("knowledgeChunks_workspace_doc_idx").on(table.workspaceId, table.documentId),
]).enableRLS();

export const documentSnapshots = pgTable("documentSnapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  // RESTRICT: snapshot immutable tidak boleh hilang diam-diam karena transaksi dihapus.
  shipmentId: uuid("shipmentId").notNull().references(() => shipments.id, { onDelete: "restrict" }),
  documentType: varchar("documentType", { length: 40 }).notNull(),
  revision: integer("revision").notNull(),
  payloadJson: text("payloadJson").notNull(),
  contentHashSha256: varchar("contentHashSha256", { length: 64 }).notNull(),
  paperSize: varchar("paperSize", { length: 20 }).notNull().default("A4"),
  orientation: varchar("orientation", { length: 12 }).notNull().default("Portrait"),
  language: varchar("language", { length: 24 }).notNull().default("English"),
  template: varchar("template", { length: 40 }).notNull().default("Classic Trade"),
  threeWayStatus: varchar("threeWayStatus", { length: 20 }).notNull().default("unchecked"),
  overrideReason: text("overrideReason"),
  pdfStorageKey: text("pdfStorageKey"),
  pdfSizeBytes: integer("pdfSizeBytes"),
  createdByUserId: integer("createdByUserId").notNull().references(() => users.id),
  createdAt: createdAt(),
}, table => [
  uniqueIndex("documentSnapshots_ship_type_rev_idx").on(table.shipmentId, table.documentType, table.revision),
  index("documentSnapshots_workspace_ship_created_idx").on(table.workspaceId, table.shipmentId, table.createdAt),
]).enableRLS();

export const shipmentApprovals = pgTable("shipmentApprovals", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  shipmentId: uuid("shipmentId").notNull().references(() => shipments.id, { onDelete: "cascade" }),
  shipmentVersion: integer("shipmentVersion").notNull(),
  requesterUserId: integer("requesterUserId").notNull().references(() => users.id),
  reviewerUserId: integer("reviewerUserId").references(() => users.id),
  /** pending | revision_requested | approved | superseded */
  status: varchar("status", { length: 24 }).notNull().default("pending"),
  comment: text("comment"),
  reviewedOffer: numeric("reviewedOffer", { precision: 16, scale: 2 }),
  reviewedIncoterm: varchar("reviewedIncoterm", { length: 8 }),
  reviewedMarginPct: numeric("reviewedMarginPct", { precision: 5, scale: 2 }),
  selfApprovalDeclared: boolean("selfApprovalDeclared").notNull().default(false),
  decidedAt: timestamp("decidedAt", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, table => [
  index("shipmentApprovals_workspace_ship_created_idx").on(table.workspaceId, table.shipmentId, table.createdAt),
  index("shipmentApprovals_workspace_status_idx").on(table.workspaceId, table.status),
  check("shipmentApprovals_status_chk", sql`${table.status} in ('pending','revision_requested','approved','superseded')`),
  check("shipmentApprovals_sod_chk", sql`${table.reviewerUserId} is null or ${table.reviewerUserId} <> ${table.requesterUserId} or ${table.selfApprovalDeclared}`),
]).enableRLS();

export const workspaceInvitations = pgTable("workspaceInvitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 320 }).notNull(),
  role: workspaceRole("role").notNull().default("viewer"),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull(),
  /** pending | accepted | revoked | expired */
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  invitedByUserId: integer("invitedByUserId").notNull().references(() => users.id),
  acceptedByUserId: integer("acceptedByUserId").references(() => users.id),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("acceptedAt", { withTimezone: true }),
  createdAt: createdAt(),
}, table => [
  uniqueIndex("workspaceInvitations_token_idx").on(table.tokenHash),
  index("workspaceInvitations_workspace_email_idx").on(table.workspaceId, table.email),
  index("workspaceInvitations_workspace_status_idx").on(table.workspaceId, table.status),
  check("workspaceInvitations_status_chk", sql`${table.status} in ('pending','accepted','revoked','expired')`),
]).enableRLS();

export const aiInteractionLogs = pgTable("aiInteractionLogs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId: integer("userId").notNull().references(() => users.id),
  shipmentId: uuid("shipmentId").references(() => shipments.id, { onDelete: "set null" }),
  model: varchar("model", { length: 80 }),
  questionChars: integer("questionChars").notNull().default(0),
  questionSha256: varchar("questionSha256", { length: 64 }),
  redactionCount: integer("redactionCount").notNull().default(0),
  toolCallsJson: text("toolCallsJson"),
  citationsJson: text("citationsJson"),
  abstained: boolean("abstained").notNull().default(false),
  abstainReason: varchar("abstainReason", { length: 80 }),
  latencyMs: integer("latencyMs"),
  promptTokens: integer("promptTokens"),
  completionTokens: integer("completionTokens"),
  estimatedCostUsd: numeric("estimatedCostUsd", { precision: 10, scale: 6 }),
  status: varchar("status", { length: 16 }).notNull().default("ok"),
  errorCode: varchar("errorCode", { length: 60 }),
  createdAt: createdAt(),
}, table => [
  index("aiInteractionLogs_workspace_created_idx").on(table.workspaceId, table.createdAt),
  index("aiInteractionLogs_workspace_user_created_idx").on(table.workspaceId, table.userId, table.createdAt),
]).enableRLS();

export const aiFeedback = pgTable("aiFeedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  interactionId: uuid("interactionId").notNull().references(() => aiInteractionLogs.id, { onDelete: "cascade" }),
  userId: integer("userId").notNull().references(() => users.id),
  /** up | down */
  rating: varchar("rating", { length: 4 }).notNull(),
  reasonCode: varchar("reasonCode", { length: 40 }),
  comment: text("comment"),
  createdAt: createdAt(),
}, table => [
  uniqueIndex("aiFeedback_interaction_user_idx").on(table.interactionId, table.userId),
  index("aiFeedback_workspace_created_idx").on(table.workspaceId, table.createdAt),
  check("aiFeedback_rating_chk", sql`${table.rating} in ('up','down')`),
]).enableRLS();

export type MasterBuyer = typeof masterBuyers.$inferSelect;
export type MasterProduct = typeof masterProducts.$inferSelect;
export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;
export type DocumentSnapshot = typeof documentSnapshots.$inferSelect;
export const shipmentSnapshots = documentSnapshots;
export type ShipmentSnapshot = DocumentSnapshot;
export type InsertShipmentSnapshot = typeof documentSnapshots.$inferInsert;
export type ShipmentApproval = typeof shipmentApprovals.$inferSelect;
export type WorkspaceInvitation = typeof workspaceInvitations.$inferSelect;
export type AiInteractionLog = typeof aiInteractionLogs.$inferSelect;
export type AiFeedback = typeof aiFeedback.$inferSelect;
