TRUNCATE TABLE "shipmentAuditLogs", "shipmentLineItems", "shipments", "workspaceMembers", "workspaces", "users" RESTART IDENTITY CASCADE;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "companyName" varchar(160);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordHash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "emailVerificationCodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"email" varchar(320) NOT NULL,
	"codeHash" varchar(128) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"consumedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "emailVerificationCodes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "emailVerificationCodes" ADD CONSTRAINT "emailVerificationCodes_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
