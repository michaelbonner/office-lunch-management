CREATE TABLE IF NOT EXISTS "invitation"(
    "id" text PRIMARY KEY NOT NULL,
    "organizationId" text NOT NULL,
    "email" text NOT NULL,
    "role" text,
    "status" text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "inviterId" text NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "member"(
    "id" text PRIMARY KEY NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    "role" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization"(
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "slug" text NOT NULL,
    "logo" text,
    "createdAt" timestamp with time zone NOT NULL,
    "metadata" text,
    CONSTRAINT "organization_slug_key" UNIQUE ("slug")
);

--> statement-breakpoint
ALTER TABLE "session"
    ADD COLUMN IF NOT EXISTS "activeOrganizationId" text;

--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS(
        SELECT
            1
        FROM
            pg_constraint
        WHERE
            conname = 'invitation_organizationId_fkey') THEN
    ALTER TABLE "invitation"
        ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
END IF;
END
$$;

--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS(
        SELECT
            1
        FROM
            pg_constraint
        WHERE
            conname = 'invitation_inviterId_fkey') THEN
    ALTER TABLE "invitation"
        ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY("inviterId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE NO action;
END IF;
END
$$;

--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS(
        SELECT
            1
        FROM
            pg_constraint
        WHERE
            conname = 'member_organizationId_fkey') THEN
    ALTER TABLE "member"
        ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE NO action;
END IF;
END
$$;

--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS(
        SELECT
            1
        FROM
            pg_constraint
        WHERE
            conname = 'member_userId_fkey') THEN
    ALTER TABLE "member"
        ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE NO action;
END IF;
END
$$;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invitation_email_idx" ON "invitation" USING btree("email" text_ops);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invitation_organizationId_idx" ON "invitation" USING btree("organizationId" text_ops);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "member_organizationId_idx" ON "member" USING btree("organizationId" text_ops);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "member_userId_idx" ON "member" USING btree("userId" text_ops);

--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS(
        SELECT
            1
        FROM
            pg_constraint
        WHERE
            conname = 'opt_out_user_id_organization_id_opt_out_date_unique') THEN
    ALTER TABLE "opt_out"
        ADD CONSTRAINT "opt_out_user_id_organization_id_opt_out_date_unique" UNIQUE("user_id", "organization_id", "opt_out_date");
END IF;
END
$$;

