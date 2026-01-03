import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth'; // Notre nouveau helper
import { getUserBookById } from '@/lib/book-utils'; // Nos fonctions Prisma
import BookDetailsClientWrapper from '@/components/BookDetailsClientWrapper';
import type { UserBookWithBook, UserBookWithBookForClient } from '@/types/domain';

interface BookDetailPageProps {
  params: Promise<{
    userBookId: string;
  }>;
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { userBookId } = await params;

  if (!userBookId) {
    notFound();
  }
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const userId = session.user.id;

  let userBook: UserBookWithBook | null = null;

  try {
    userBook = await getUserBookById(userBookId, userId);
    if (!userBook) {
      notFound();
    }
  } catch (error) {
    console.error('Error fetching book details:', error);
    notFound();
  }

  const serializedUserBook: UserBookWithBookForClient = {
    ...userBook,
    review: userBook.review
      ? {
          id: userBook.review.id,
          rating: userBook.review.rating,
          comment_text: userBook.review.comment_text,
          updated_at: userBook.review.updated_at.toISOString(),
        }
      : null,
  };

  return (
    <div className="container mx-auto py-8">
      <BookDetailsClientWrapper userBookId={userBookId} userBook={serializedUserBook} />
    </div>
  );
}
