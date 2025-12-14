import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, context: { params: Promise<{ bookId: string; }> }) {
  const { bookId } = await context.params;

  if (!bookId) {
    return NextResponse.json({ message: 'Book ID is required.' }, { status: 400 });
  }

  const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

  if (!GOOGLE_BOOKS_API_KEY) {
    return NextResponse.json({ message: 'Google Books API Key not configured.' }, { status: 500 });
  }

  const GOOGLE_BOOKS_API_URL = `https://www.googleapis.com/books/v1/volumes/${bookId}`;

  try {
    const response = await fetch(`${GOOGLE_BOOKS_API_URL}?lang=fr&key=${GOOGLE_BOOKS_API_KEY}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch from Google Books API: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching book details:', message);
    return NextResponse.json({ message: 'Failed to fetch book details from Google Books API.' }, { status: 500 });
  }
}
