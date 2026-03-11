CREATE TABLE "lunch_selection" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"restaurant_id" text NOT NULL,
	"selection_date" text NOT NULL,
	"selected_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lunch_selection_org_date_unique" UNIQUE("organization_id","selection_date")
);
--> statement-breakpoint
CREATE TABLE "restaurant_vote" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"restaurant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"vote_date" text NOT NULL,
	"vote_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "restaurant_vote_user_restaurant_org_date_unique" UNIQUE("user_id","restaurant_id","organization_id","vote_date")
);
--> statement-breakpoint
ALTER TABLE "lunch_selection" ADD CONSTRAINT "lunch_selection_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lunch_selection" ADD CONSTRAINT "lunch_selection_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lunch_selection" ADD CONSTRAINT "lunch_selection_selected_by_user_id_fkey" FOREIGN KEY ("selected_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_vote" ADD CONSTRAINT "restaurant_vote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_vote" ADD CONSTRAINT "restaurant_vote_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lunch_selection_org_date_idx" ON "lunch_selection" USING btree ("organization_id","selection_date");--> statement-breakpoint
CREATE INDEX "restaurant_vote_org_date_idx" ON "restaurant_vote" USING btree ("organization_id","vote_date");
