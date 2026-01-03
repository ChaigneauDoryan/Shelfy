-- CreateTable
CREATE TABLE "UserBookReview" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_book_id" UUID NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBookReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserBookReview_user_book_id_key" ON "UserBookReview"("user_book_id");

-- AddForeignKey
ALTER TABLE "UserBookReview" ADD CONSTRAINT "UserBookReview_user_book_id_fkey" FOREIGN KEY ("user_book_id") REFERENCES "UserBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
