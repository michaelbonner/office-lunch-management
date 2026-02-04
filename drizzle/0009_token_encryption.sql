-- Add columns to store encrypted token and preview for show/hide feature
ALTER TABLE "api_token" ADD COLUMN "encrypted_token" text;
ALTER TABLE "api_token" ADD COLUMN "token_preview" text;
