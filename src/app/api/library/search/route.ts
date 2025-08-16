import { NextResponse } from 'next/server';

export async function GET(request: Request) {
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
    const response = await fetch(`${GOOGLE_BOOKS_API_URL}?q=${encodeURIComponent(query)}&maxResults=40&lang=fr&key=${GOOGLE_BOOKS_API_KEY}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch from Google Books API: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error searching Google Books:', error.message);
    return NextResponse.json({ message: 'Failed to search books from Google Books API.' }, { status: 500 });
  }
}
