
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth'; // Notre nouveau helper
import { getUserBookById } from '@/lib/book-utils'; // Nos fonctions Prisma
import BookDetailsClientWrapper from '@/components/BookDetailsClientWrapper';

interface PageProps {
  params: { userBookId: string };
}

export default async function BookDetailPage({ params }: PageProps) {
  const { userBookId } = params;
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const userId = session.user.id;

  let userBook: any = null;

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
