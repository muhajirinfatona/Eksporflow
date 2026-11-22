-- EksporFlow v2 foundation (0002) — 100% ADITIF: hanya CREATE TABLE/INDEX/FUNCTION/TRIGGER baru.
-- Tidak menyentuh users, workspaces, workspaceMembers, shipments, shipmentLineItems, shipmentAuditLogs.
-- Semua tabel: ENABLE ROW LEVEL SECURITY (tanpa policy; akses via server/DATABASE_URL), index komposit diawali workspaceId.
-- Catatan: migrator Drizzle menjalankan semua statement dalam satu transaksi, sehingga CREATE INDEX CONCURRENTLY
-- tidak dapat dipakai; aman karena seluruh index dibuat pada tabel baru yang masih kosong.

CREATE TABLE IF NOT EXISTS "masterBuyers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspaceId" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
	"name" varchar(200) NOT NULL,
	"country" varchar(80) DEFAULT '' NOT NULL,
	"destination" varchar(200) DEFAULT '' NOT NULL,
	"address" text,
	"picName" varchar(160),
	"picEmail" varchar(320),
	"picPhone" varchar(60),
	"defaultPaymentTerms" varchar(200),
	"screeningStatus" varchar(30) DEFAULT 'unscreened' NOT NULL,
	"notes" text,
	"archivedAt" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"createdByUserId" integer NOT NULL REFERENCES "users"("id"),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "masterBuyers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "masterBuyers_workspace_name_idx" ON "masterBuyers" USING btree ("workspaceId","name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "masterBuyers_workspace_country_idx" ON "masterBuyers" USING btree ("workspaceId","country");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "masterProducts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspaceId" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
	"sku" varchar(80),
	"name" varchar(200) NOT NULL,
	"commodityPreset" varchar(40),
	"hsCode" varchar(20) DEFAULT '' NOT NULL,
	"unit" varchar(30) DEFAULT 'carton' NOT NULL,
	"unitPrice" numeric(14, 4) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"packagingType" varchar(60) DEFAULT 'Karton box' NOT NULL,
	"unitWeightKg" numeric(12, 3) DEFAULT '0' NOT NULL,
	"lengthCm" numeric(10, 2) DEFAULT '0' NOT NULL,
	"widthCm" numeric(10, 2) DEFAULT '0' NOT NULL,
	"heightCm" numeric(10, 2) DEFAULT '0' NOT NULL,
	"shrinkageRatePct" numeric(5, 2) DEFAULT '0' NOT NULL,
	"archivedAt" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"createdByUserId" integer NOT NULL REFERENCES "users"("id"),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "masterProducts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "masterProducts_workspace_sku_idx" ON "masterProducts" USING btree ("workspaceId","sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "masterProducts_workspace_hs_idx" ON "masterProducts" USING btree ("workspaceId","hsCode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "masterProducts_workspace_name_idx" ON "masterProducts" USING btree ("workspaceId","name");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "knowledgeDocuments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspaceId" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
	"title" varchar(240) NOT NULL,
	"scope" varchar(120) DEFAULT 'general' NOT NULL,
	"docVersion" varchar(40) DEFAULT '1.0' NOT NULL,
	"governance" varchar(240),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"sourceUrl" text,
	"storageKey" text,
	"licenseNote" text,
	"effectiveAt" timestamp with time zone,
	"expiresAt" timestamp with time zone,
	"revokedAt" timestamp with time zone,
	"createdByUserId" integer NOT NULL REFERENCES "users"("id"),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "knowledgeDocuments_status_chk" CHECK ("status" in ('draft','in_review','published','revoked'))
);--> statement-breakpoint
ALTER TABLE "knowledgeDocuments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledgeDocuments_workspace_status_exp_idx" ON "knowledgeDocuments" USING btree ("workspaceId","status","expiresAt");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "knowledgeChunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspaceId" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
	"documentId" uuid NOT NULL REFERENCES "knowledgeDocuments"("id") ON DELETE cascade,
	"chunkIndex" integer NOT NULL,
	"content" text NOT NULL,
	"tokenCount" integer DEFAULT 0 NOT NULL,
	"contentHash" varchar(64) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "knowledgeChunks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "knowledgeChunks_doc_chunk_idx" ON "knowledgeChunks" USING btree ("documentId","chunkIndex");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledgeChunks_workspace_doc_idx" ON "knowledgeChunks" USING btree ("workspaceId","documentId");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "documentSnapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspaceId" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
	"shipmentId" uuid NOT NULL REFERENCES "shipments"("id") ON DELETE restrict,
	"documentType" varchar(40) NOT NULL,
	"revision" integer NOT NULL,
	"payloadJson" text NOT NULL,
	"contentHashSha256" varchar(64) NOT NULL,
	"paperSize" varchar(20) DEFAULT 'A4' NOT NULL,
	"orientation" varchar(12) DEFAULT 'Portrait' NOT NULL,
	"language" varchar(24) DEFAULT 'English' NOT NULL,
	"template" varchar(40) DEFAULT 'Classic Trade' NOT NULL,
	"threeWayStatus" varchar(20) DEFAULT 'unchecked' NOT NULL,
	"overrideReason" text,
	"pdfStorageKey" text,
	"pdfSizeBytes" integer,
	"createdByUserId" integer NOT NULL REFERENCES "users"("id"),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "documentSnapshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "documentSnapshots_ship_type_rev_idx" ON "documentSnapshots" USING btree ("shipmentId","documentType","revision");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documentSnapshots_workspace_ship_created_idx" ON "documentSnapshots" USING btree ("workspaceId","shipmentId","createdAt");--> statement-breakpoint
CREATE OR REPLACE FUNCTION "documentSnapshots_block_update"() RETURNS trigger AS $fn$
BEGIN
	RAISE EXCEPTION 'documentSnapshots bersifat immutable (append-only); buat revisi baru.';
END;
$fn$ LANGUAGE plpgsql;--> statement-breakpoint
DROP TRIGGER IF EXISTS "documentSnapshots_immutable" ON "documentSnapshots";--> statement-breakpoint
CREATE TRIGGER "documentSnapshots_immutable" BEFORE UPDATE ON "documentSnapshots" FOR EACH ROW EXECUTE FUNCTION "documentSnapshots_block_update"();--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "shipmentApprovals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspaceId" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
	"shipmentId" uuid NOT NULL REFERENCES "shipments"("id") ON DELETE cascade,
	"shipmentVersion" integer NOT NULL,
	"requesterUserId" integer NOT NULL REFERENCES "users"("id"),
	"reviewerUserId" integer REFERENCES "users"("id"),
	"status" varchar(24) DEFAULT 'pending' NOT NULL,
	"comment" text,
	"reviewedOffer" numeric(16, 2),
	"reviewedIncoterm" varchar(8),
	"reviewedMarginPct" numeric(5, 2),
	"selfApprovalDeclared" boolean DEFAULT false NOT NULL,
	"decidedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipmentApprovals_status_chk" CHECK ("status" in ('pending','revision_requested','approved','superseded')),
	CONSTRAINT "shipmentApprovals_sod_chk" CHECK ("reviewerUserId" is null or "reviewerUserId" <> "requesterUserId" or "selfApprovalDeclared")
);--> statement-breakpoint
ALTER TABLE "shipmentApprovals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipmentApprovals_workspace_ship_created_idx" ON "shipmentApprovals" USING btree ("workspaceId","shipmentId","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipmentApprovals_workspace_status_idx" ON "shipmentApprovals" USING btree ("workspaceId","status");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "workspaceInvitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspaceId" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
	"email" varchar(320) NOT NULL,
	"role" "workspace_role" DEFAULT 'viewer' NOT NULL,
	"tokenHash" varchar(128) NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"invitedByUserId" integer NOT NULL REFERENCES "users"("id"),
	"acceptedByUserId" integer REFERENCES "users"("id"),
	"expiresAt" timestamp with time zone NOT NULL,
	"acceptedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspaceInvitations_status_chk" CHECK ("status" in ('pending','accepted','revoked','expired'))
);--> statement-breakpoint
ALTER TABLE "workspaceInvitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "workspaceInvitations_token_idx" ON "workspaceInvitations" USING btree ("tokenHash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspaceInvitations_workspace_email_idx" ON "workspaceInvitations" USING btree ("workspaceId","email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspaceInvitations_workspace_status_idx" ON "workspaceInvitations" USING btree ("workspaceId","status");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "aiInteractionLogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspaceId" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
	"userId" integer NOT NULL REFERENCES "users"("id"),
	"shipmentId" uuid REFERENCES "shipments"("id") ON DELETE set null,
	"model" varchar(80),
	"questionChars" integer DEFAULT 0 NOT NULL,
	"questionSha256" varchar(64),
	"redactionCount" integer DEFAULT 0 NOT NULL,
	"toolCallsJson" text,
	"citationsJson" text,
	"abstained" boolean DEFAULT false NOT NULL,
	"abstainReason" varchar(80),
	"latencyMs" integer,
	"promptTokens" integer,
	"completionTokens" integer,
	"estimatedCostUsd" numeric(10, 6),
	"status" varchar(16) DEFAULT 'ok' NOT NULL,
	"errorCode" varchar(60),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "aiInteractionLogs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aiInteractionLogs_workspace_created_idx" ON "aiInteractionLogs" USING btree ("workspaceId","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aiInteractionLogs_workspace_user_created_idx" ON "aiInteractionLogs" USING btree ("workspaceId","userId","createdAt");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "aiFeedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspaceId" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
	"interactionId" uuid NOT NULL REFERENCES "aiInteractionLogs"("id") ON DELETE cascade,
	"userId" integer NOT NULL REFERENCES "users"("id"),
	"rating" varchar(4) NOT NULL,
	"reasonCode" varchar(40),
	"comment" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "aiFeedback_rating_chk" CHECK ("rating" in ('up','down'))
);--> statement-breakpoint
ALTER TABLE "aiFeedback" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "aiFeedback_interaction_user_idx" ON "aiFeedback" USING btree ("interactionId","userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aiFeedback_workspace_created_idx" ON "aiFeedback" USING btree ("workspaceId","createdAt");
