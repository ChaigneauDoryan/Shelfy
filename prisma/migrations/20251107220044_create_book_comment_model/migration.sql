-- CreateTable
CREATE TABLE "BookComment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "groupBookId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookComment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BookComment" ADD CONSTRAINT "BookComment_groupBookId_fkey" FOREIGN KEY ("groupBookId") REFERENCES "GroupBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookComment" ADD CONSTRAINT "BookComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
