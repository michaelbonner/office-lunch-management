CREATE TABLE "opt_out"(
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "organization_id" text NOT NULL,
    "opt_out_date" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "opt_out_user_id_organization_id_opt_out_date_unique" UNIQUE ("user_id", "organization_id", "opt_out_date")
);

