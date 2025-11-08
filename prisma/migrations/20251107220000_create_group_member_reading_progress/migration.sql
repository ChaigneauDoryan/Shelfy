-- CreateTable
CREATE TABLE "GroupMemberReadingProgress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "groupMemberId" UUID NOT NULL,
    "groupBookId" UUID NOT NULL,
    "currentPage" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMemberReadingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupMemberReadingProgress_groupMemberId_groupBookId_key" ON "GroupMemberReadingProgress"("groupMemberId", "groupBookId");

-- AddForeignKey
ALTER TABLE "GroupMemberReadingProgress" ADD CONSTRAINT "GroupMemberReadingProgress_groupMemberId_fkey" FOREIGN KEY ("groupMemberId") REFERENCES "GroupMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMemberReadingProgress" ADD CONSTRAINT "GroupMemberReadingProgress_groupBookId_fkey" FOREIGN KEY ("groupBookId") REFERENCES "GroupBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
