import { NextResponse } from 'next/server';

// Interface pour le contexte de la route avec params comme Promise
interface RouteContext {
  params: Promise<{ bookId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  // Attendre la résolution de params
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
  } catch (error: any) {
    console.error('Error fetching book details:', error.message);
    return NextResponse.json({ message: 'Failed to fetch book details from Google Books API.' }, { status: 500 });
  }
}