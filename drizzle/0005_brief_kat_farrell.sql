ALTER TABLE "opt_out" RENAME TO "opt_in";

--> statement-breakpoint
ALTER TABLE "opt_in" RENAME COLUMN "opt_out_date" TO "opt_in_date";

--> statement-breakpoint
ALTER TABLE "opt_in"
    DROP CONSTRAINT "opt_out_user_id_organization_id_opt_out_date_unique";

--> statement-breakpoint
ALTER TABLE "opt_in"
    DROP CONSTRAINT "opt_out_userId_fkey";

--> statement-breakpoint
ALTER TABLE "member"
    ALTER COLUMN "createdAt" SET DEFAULT now();

--> statement-breakpoint
ALTER TABLE "organization"
    ALTER COLUMN "createdAt" SET DEFAULT now();

--> statement-breakpoint
ALTER TABLE "restaurant"
    ADD COLUMN "organization_id" text NOT NULL;

--> statement-breakpoint
ALTER TABLE "opt_in"
    ADD CONSTRAINT "opt_in_userId_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE NO action;

--> statement-breakpoint
ALTER TABLE "restaurant"
    ADD CONSTRAINT "restaurant_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE NO action;

--> statement-breakpoint
CREATE INDEX "restaurant_organizationId_idx" ON "restaurant" USING btree("organization_id" text_ops);

--> statement-breakpoint
ALTER TABLE "opt_in"
    ADD CONSTRAINT "opt_in_user_id_organization_id_opt_in_date_unique" UNIQUE ("user_id", "organization_id", "opt_in_date");

