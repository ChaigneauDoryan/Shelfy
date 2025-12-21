
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth'; // Helper à créer
import { findOrCreateBook, addUserBook } from '@/lib/book-utils';
import { BookData, AddUserBookData } from '@/types/book';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  let book: BookData & AddUserBookData;
  try {
    book = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!book) {
    return NextResponse.json({ error: 'Book data is missing' }, { status: 400 });
  }

  try {
    // 1. Find or create the book in the 'Book' table
    const bookData = await findOrCreateBook(book, userId);
    const bookId = bookData.id;

    // 2. Add the book to the user's library in 'UserBook' table
    const userBookData = await addUserBook(userId, bookId, book);
    const userBookId = userBookData.id;

    return NextResponse.json({ message: 'Book added successfully', userBookId }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unexpected error in add book API:', message);
    if (error instanceof Error && error.message === 'Ce livre est déjà dans votre bibliothèque.') {
      return NextResponse.json({ error: error.message }, { status: 409 }); // Conflict
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
