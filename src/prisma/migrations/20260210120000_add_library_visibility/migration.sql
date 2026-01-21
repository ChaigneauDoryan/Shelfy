-- AlterTable
ALTER TABLE "User" ADD COLUMN "library_is_public" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserBook" ADD COLUMN "is_public" BOOLEAN NOT NULL DEFAULT false;
