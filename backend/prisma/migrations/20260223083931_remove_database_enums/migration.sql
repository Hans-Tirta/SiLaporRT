/*
  Warnings:

  - The values [URGENT] on the enum `AnnouncementType` will be removed. If these variants are still used in the database, this will fail.
  - The values [URGENT] on the enum `Priority` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AnnouncementType_new" AS ENUM ('GENERAL', 'EVENT', 'MAINTENANCE', 'REGULATION', 'OTHER');
ALTER TABLE "public"."announcements" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "announcements" ALTER COLUMN "type" TYPE "AnnouncementType_new" USING ("type"::text::"AnnouncementType_new");
ALTER TYPE "AnnouncementType" RENAME TO "AnnouncementType_old";
ALTER TYPE "AnnouncementType_new" RENAME TO "AnnouncementType";
DROP TYPE "public"."AnnouncementType_old";
ALTER TABLE "announcements" ALTER COLUMN "type" SET DEFAULT 'GENERAL';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Priority_new" AS ENUM ('LOW', 'NORMAL', 'HIGH');
ALTER TABLE "public"."announcements" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "announcements" ALTER COLUMN "priority" TYPE "Priority_new" USING ("priority"::text::"Priority_new");
ALTER TYPE "Priority" RENAME TO "Priority_old";
ALTER TYPE "Priority_new" RENAME TO "Priority";
DROP TYPE "public"."Priority_old";
ALTER TABLE "announcements" ALTER COLUMN "priority" SET DEFAULT 'NORMAL';
COMMIT;
