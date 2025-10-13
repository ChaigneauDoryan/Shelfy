-- AlterTable
ALTER TABLE "Badge" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Badge_id_seq";

-- AlterTable
ALTER TABLE "ReadingStatus" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "ReadingStatus_id_seq";
