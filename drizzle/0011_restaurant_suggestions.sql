CREATE TABLE "restaurant_suggestion" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"requested_by_user_id" text NOT NULL,
	"reviewed_by_user_id" text,
	"restaurant_id" text,
	"name" text NOT NULL,
	"menu_link" text NOT NULL,
	"notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewer_notes" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "restaurant_suggestion" ADD CONSTRAINT "restaurant_suggestion_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "restaurant_suggestion" ADD CONSTRAINT "restaurant_suggestion_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "restaurant_suggestion" ADD CONSTRAINT "restaurant_suggestion_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "restaurant_suggestion" ADD CONSTRAINT "restaurant_suggestion_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "restaurant_suggestion_organization_id_idx" ON "restaurant_suggestion" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "restaurant_suggestion_status_idx" ON "restaurant_suggestion" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "restaurant_suggestion_requested_by_user_id_idx" ON "restaurant_suggestion" USING btree ("requested_by_user_id");
