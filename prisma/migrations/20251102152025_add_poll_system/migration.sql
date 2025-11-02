/*
  Warnings:

  - You are about to drop the column `group_book_id` on the `Vote` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[poll_option_id,user_id]` on the table `Vote` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `poll_option_id` to the `Vote` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Vote" DROP CONSTRAINT "Vote_group_book_id_fkey";

-- DropIndex
DROP INDEX "public"."Vote_group_book_id_user_id_key";

-- AlterTable
ALTER TABLE "GroupBook" ADD COLUMN     "suggested_by_id" UUID;

-- AlterTable
ALTER TABLE "Vote" DROP COLUMN "group_book_id",
ADD COLUMN     "poll_option_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "Poll" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "group_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollOption" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "poll_id" UUID NOT NULL,
    "group_book_id" UUID NOT NULL,

    CONSTRAINT "PollOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vote_poll_option_id_user_id_key" ON "Vote"("poll_option_id", "user_id");

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollOption" ADD CONSTRAINT "PollOption_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollOption" ADD CONSTRAINT "PollOption_group_book_id_fkey" FOREIGN KEY ("group_book_id") REFERENCES "GroupBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_poll_option_id_fkey" FOREIGN KEY ("poll_option_id") REFERENCES "PollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
