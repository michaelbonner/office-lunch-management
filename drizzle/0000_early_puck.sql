CREATE TABLE "restaurant" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"menu_link" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
