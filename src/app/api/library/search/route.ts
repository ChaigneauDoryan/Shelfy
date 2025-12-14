import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleBooksApiBook } from '@/types/book';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title');
  const author = searchParams.get('author');
  const isbn = searchParams.get('isbn');
  const genre = searchParams.get('genre');

  if (!title && !author && !isbn && !genre) {
    return NextResponse.json({ message: 'At least one search parameter is required.' }, { status: 400 });
  }

  const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
  if (!GOOGLE_BOOKS_API_KEY) {
    return NextResponse.json({ message: 'Google Books API Key not configured.' }, { status: 500 });
  }

  const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

  let queryParts: string[] = [];
  if (title) queryParts.push(`intitle:${title}`);
  if (author) queryParts.push(`inauthor:${author}`);
  if (isbn) queryParts.push(`isbn:${isbn}`);
  if (genre) queryParts.push(`subject:${genre}`);
  const query = queryParts.join('+');

  try {
    // 1. Get user's existing book IDs
    const userBooks = await prisma.userBook.findMany({
      where: { user_id: userId },
      include: { book: true },
    });
    const existingGoogleBooksIds = new Set(
      userBooks.map(ub => ub.book.google_books_id).filter(id => id !== null)
    );

    // 2. Fetch from Google Books API
    const response = await fetch(`${GOOGLE_BOOKS_API_URL}?q=${encodeURIComponent(query)}&maxResults=40&lang=fr&key=${GOOGLE_BOOKS_API_KEY}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch from Google Books API: ${response.statusText}`);
    }
    const data = await response.json();

    // 3. Filter results
    if (data.items) {
      data.items = data.items.filter((book: GoogleBooksApiBook) => !existingGoogleBooksIds.has(book.id));
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error searching Google Books:', message);
    return NextResponse.json({ message: 'Failed to search books from Google Books API.' }, { status: 500 });
  }
}
