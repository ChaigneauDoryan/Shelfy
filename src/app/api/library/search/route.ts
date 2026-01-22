import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleBooksApiBook } from '@/types/book';
import { detectSearchLanguageFromTerms, filterGoogleBooksItems, normalizeSearchText } from '@/lib/google-books';

const searchSchema = z
  .object({
    title: z.string().min(1).optional(),
    author: z.string().min(1).optional(),
    isbn: z.string().min(1).optional(),
    genre: z.string().min(1).optional(),
  })
  .refine(
    ({ title, author, isbn, genre }) => Boolean(title || author || isbn || genre),
    { message: 'At least one search parameter is required.' }
  );

const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';
const MIN_RESULTS = 5;

const normalizeQueryParam = (value: string | null): string | undefined => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const validation = searchSchema.safeParse({
    title: normalizeQueryParam(searchParams.get('title')),
    author: normalizeQueryParam(searchParams.get('author')),
    isbn: normalizeQueryParam(searchParams.get('isbn')),
    genre: normalizeQueryParam(searchParams.get('genre')),
  });

  if (!validation.success) {
    const errorMessage = validation.error.issues[0]?.message ?? 'Invalid search parameters.';
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }

  const { title, author, isbn, genre } = validation.data;
  const languageDetection = detectSearchLanguageFromTerms(
    [title, author, genre, isbn].filter((value): value is string => Boolean(value))
  );
  if (languageDetection.isFallback) {
    console.info('Google Books language detection defaulted to', languageDetection.language);
  }

  const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
  if (!GOOGLE_BOOKS_API_KEY) {
    return NextResponse.json({ message: 'Google Books API Key not configured.' }, { status: 500 });
  }

  const buildQuery = (titleOverride?: string) => {
    const queryParts: string[] = [];
    const effectiveTitle = titleOverride ?? title;
    if (effectiveTitle) queryParts.push(effectiveTitle);
    if (author) queryParts.push(`inauthor:${author}`);
    if (isbn) queryParts.push(`isbn:${isbn}`);
    if (genre) queryParts.push(`subject:${genre}`);
    return queryParts.join('+');
  };

  try {
    // 1. Get user's existing book IDs
    const userBooks = await prisma.userBook.findMany({
      where: { user_id: userId },
      include: { book: true },
    });
    const existingGoogleBooksIds = new Set(
      userBooks
        .map(ub => ub.book.google_books_id)
        .filter((id): id is string => id !== null)
    );

    const fetchBooks = async (query: string) => {
      const url = new URL(GOOGLE_BOOKS_API_URL);
      url.searchParams.set('q', query);
      url.searchParams.set('maxResults', '40');
      url.searchParams.set('langRestrict', languageDetection.language);
      url.searchParams.set('printType', 'books');
      url.searchParams.set('key', GOOGLE_BOOKS_API_KEY);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch from Google Books API: ${response.statusText}`);
      }
      const data = await response.json();
      return {
        data,
        items: (Array.isArray(data.items) ? data.items : []) as GoogleBooksApiBook[],
      };
    };

    const { data, items } = await fetchBooks(buildQuery());
    let filteredItems = filterGoogleBooksItems(items, {
      preferredLanguage: languageDetection.language,
      existingGoogleBooksIds,
      strictLanguage: true,
    });

    if (filteredItems.length < MIN_RESULTS) {
      filteredItems = filterGoogleBooksItems(items, {
        preferredLanguage: languageDetection.language,
        existingGoogleBooksIds,
        strictLanguage: false,
      });
    }

    const fallbackTitles: string[] = [];
    if (title) {
      const normalizedTitle = normalizeSearchText(title);
      if (normalizedTitle && normalizedTitle !== title) {
        fallbackTitles.push(normalizedTitle);
      }
      const titleParts = normalizedTitle.split(' ').filter(Boolean);
      if (titleParts.length > 2) {
        fallbackTitles.push(titleParts.slice(0, -1).join(' '));
      }
    }

    for (const fallbackTitle of fallbackTitles) {
      if (filteredItems.length >= MIN_RESULTS) {
        break;
      }
      const fallbackResponse = await fetchBooks(buildQuery(fallbackTitle));
      const fallbackItems = filterGoogleBooksItems(fallbackResponse.items, {
        preferredLanguage: languageDetection.language,
        existingGoogleBooksIds,
        strictLanguage: false,
      });
      if (fallbackItems.length > filteredItems.length) {
        filteredItems = fallbackItems;
      }
    }

    return NextResponse.json({ ...data, items: filteredItems });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error searching Google Books:', message);
    return NextResponse.json({ message: 'Failed to search books from Google Books API.' }, { status: 500 });
  }
}
