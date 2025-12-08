CREATE TABLE "order" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"restaurant_id" text NOT NULL,
	"order_details" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_user_id_restaurant_id_unique" UNIQUE("user_id","restaurant_id")
);
--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;