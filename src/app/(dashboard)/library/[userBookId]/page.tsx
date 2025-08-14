import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserBookById } from '@/lib/book-utils';
import BookDetailsClientWrapper from '@/components/BookDetailsClientWrapper';

interface PageProps {
  params: Promise<{ userBookId: string }>; // params est maintenant une Promise
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>; // searchParams aussi
}

export default async function BookDetailPage({ params, searchParams }: PageProps) {
  // Attendre la résolution de params
  const { userBookId } = await params;
  console.log('BookDetailPage component rendered for userBookId:', userBookId);

  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound(); // Or redirect to login
  }

  const userId = user.id;

  let userBook: any = null;

  try {
    userBook = await getUserBookById(supabase, userBookId, userId);
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