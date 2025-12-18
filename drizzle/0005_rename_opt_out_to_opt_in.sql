-- Rename opt_out table to opt_in
ALTER TABLE "opt_out" RENAME TO "opt_in";

--> statement-breakpoint
-- Rename opt_out_date column to opt_in_date
ALTER TABLE "opt_in" RENAME COLUMN "opt_out_date" TO "opt_in_date";

--> statement-breakpoint
-- Drop old constraint
ALTER TABLE "opt_in" DROP CONSTRAINT IF EXISTS "opt_out_user_id_organization_id_opt_out_date_unique";

--> statement-breakpoint
-- Drop old foreign key constraint
ALTER TABLE "opt_in" DROP CONSTRAINT IF EXISTS "opt_out_userId_fkey";

--> statement-breakpoint
-- Add new unique constraint
DO $$
BEGIN
    IF NOT EXISTS(
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'opt_in_user_id_organization_id_opt_in_date_unique'
    ) THEN
        ALTER TABLE "opt_in"
            ADD CONSTRAINT "opt_in_user_id_organization_id_opt_in_date_unique"
            UNIQUE("user_id", "organization_id", "opt_in_date");
    END IF;
END
$$;

--> statement-breakpoint
-- Add new foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS(
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'opt_in_userId_fkey'
    ) THEN
        ALTER TABLE "opt_in"
            ADD CONSTRAINT "opt_in_userId_fkey"
            FOREIGN KEY("user_id") REFERENCES "public"."user"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END
$$;
