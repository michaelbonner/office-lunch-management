ALTER TABLE "user"
    ADD COLUMN "role" text;

ALTER TABLE "user"
    ADD COLUMN "banned" boolean;

ALTER TABLE "user"
    ADD COLUMN "banReason" text;

ALTER TABLE "user"
    ADD COLUMN "banExpires" timestamptz;

ALTER TABLE "session"
    ADD COLUMN "impersonatedBy" text;

