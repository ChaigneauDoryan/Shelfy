import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth'; // Notre nouveau helper
import { getUserBookById } from '@/lib/book-utils'; // Nos fonctions Prisma
import BookDetailsClientWrapper from '@/components/BookDetailsClientWrapper';
import type { UserBookWithBook, UserBookWithBookForClient } from '@/types/domain';
import { createPageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

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

export async function generateMetadata({ params }: BookDetailPageProps): Promise<Metadata> {
  const { userBookId } = await params;
  const fallbackDescription = 'Consultez les détails et le suivi de lecture de votre livre sur Shelfy.';

  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return createPageMetadata({
        pageTitle: 'Livre',
        description: fallbackDescription,
        path: `/library/${userBookId}`,
      });
    }

    const userBook = await getUserBookById(userBookId, session.user.id);
    if (!userBook) {
      return createPageMetadata({
        pageTitle: 'Livre introuvable',
        description: 'Ce livre n’est pas présent dans votre bibliothèque personnelle.',
        path: `/library/${userBookId}`,
      });
    }

    const authorLabel = userBook.book.author ?? 'Auteur inconnu';
    const formattedTitle = `${userBook.book.title}${userBook.book.author ? ` - ${authorLabel}` : ''}`;
    const description = (userBook.book.description ?? fallbackDescription).slice(0, 160);

    return createPageMetadata({
      pageTitle: formattedTitle,
      description,
      path: `/library/${userBookId}`,
      keywords: [userBook.book.title, authorLabel, 'bibliothèque personnelle', 'suivi de lecture'],
      type: 'article',
    });
  } catch (error) {
    console.error('Failed to compute metadata for user book detail:', error);
    return createPageMetadata({
      pageTitle: 'Livre',
      description: fallbackDescription,
      path: `/library/${userBookId}`,
    });
  }
}
