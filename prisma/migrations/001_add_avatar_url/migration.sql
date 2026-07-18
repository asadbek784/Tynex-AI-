-- Add avatarUrl column to User table if it doesn't exist
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
