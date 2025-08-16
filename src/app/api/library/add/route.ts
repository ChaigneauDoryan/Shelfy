import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { findOrCreateBook, addUserBook } from '@/lib/book-utils';

export async function POST(request: Request) {
  const supabase = await createClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let book: any;
  try {
    book = await request.json();
  } catch (e) {
    console.error('Error parsing request body:', e);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!book) {
    return NextResponse.json({ error: 'Book data is missing in request body' }, { status: 400 });
  }

  // Si ce n'est pas un ajout manuel, mais que l'ID Google Books est manquant,
  // nous le traitons comme un ajout manuel.
  if ((book.isManual === undefined || book.isManual === false) && (!book.id || typeof book.id !== 'string' || book.id.trim() === '')) {
    book.isManual = true;
    book.id = null; // S'assurer que l'ID Google Books est nul pour l'insertion
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  try {
    // 1. Find or create the book in the 'books' table
    const { data: bookData, error: bookError } = await findOrCreateBook(supabase, book, userId);
    if (bookError) {
      console.error('Error finding or creating book:', bookError);
      return NextResponse.json({ error: 'Error processing book data' }, { status: 500 });
    }
    const bookId = bookData.id;

    // 2. Add the book to the user's library in 'user_books' table
    const userBookData = await addUserBook(supabase, userId, bookId, book);
    if (!userBookData) {
      console.error('Error adding book to user library: No data returned');
      return NextResponse.json({ error: 'Error adding book to your library' }, { status: 500 });
    }
    const userBookId = userBookData.id;

    

    return NextResponse.json({ message: 'Book added successfully', userBookId }, { status: 200 });
  } catch (error: any) {
    console.error('Unexpected error in add book API:', error);
    if (error.message === 'Ce livre est déjà dans votre bibliothèque.') {
      return NextResponse.json({ error: error.message }, { status: 409 }); // Conflict
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}