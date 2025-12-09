--> statement-breakpoint
ALTER TABLE "opt_out"
    DROP CONSTRAINT "opt_out_user_id_organization_id_opt_out_date_unique";

--> statement-breakpoint
ALTER TABLE "opt_out"
    ADD CONSTRAINT "opt_out_userId_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE NO action;

