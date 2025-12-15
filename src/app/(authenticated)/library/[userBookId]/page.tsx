
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth'; // Notre nouveau helper
import { getUserBookById } from '@/lib/book-utils'; // Nos fonctions Prisma
import BookDetailsClientWrapper from '@/components/BookDetailsClientWrapper';
import type { UserBookWithBook } from '@/types/domain';

export default async function BookDetailPage(props: { params: { userBookId: string } }) {
  const { params } = await Promise.resolve(props);
  const resolvedParams = await params; // Await the params Promise
  const { userBookId } = resolvedParams;

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

  return (
    <div className="container mx-auto py-8">
      <BookDetailsClientWrapper userBookId={userBookId} userBook={userBook} />
    </div>
  );
}
