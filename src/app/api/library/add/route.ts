import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { findOrCreateBook, addUserBook } from '@/lib/book-utils';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const bookData = await request.json();

  try {
    const book = await findOrCreateBook(bookData, userId);
    const userBook = await addUserBook(userId, book.id);
    return NextResponse.json(userBook);
  } catch (error: any) {
    console.error('Error adding book to library:', error.message);
    if (error.message === 'Ce livre est déjà dans votre bibliothèque.') {
      return NextResponse.json({ message: error.message }, { status: 409 }); // Conflict
    }
    return NextResponse.json({ message: 'Failed to add book to library.' }, { status: 500 });
  }
}
