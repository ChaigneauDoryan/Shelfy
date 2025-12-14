/*
  Warnings:

  - You are about to drop the column `emailVerificationToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerificationTokenExpires` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."User_emailVerificationToken_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerificationToken",
DROP COLUMN "emailVerificationTokenExpires";

-- CreateTable
CREATE TABLE "GroupBook" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "group_id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "GroupBook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupBook_group_id_book_id_key" ON "GroupBook"("group_id", "book_id");

-- AddForeignKey
ALTER TABLE "GroupBook" ADD CONSTRAINT "GroupBook_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupBook" ADD CONSTRAINT "GroupBook_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
