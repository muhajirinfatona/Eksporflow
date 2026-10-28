import { integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

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
