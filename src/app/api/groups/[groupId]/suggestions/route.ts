import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { findOrCreateBook, fetchBookDetailsFromGoogleBooks } from '@/lib/book-utils';
import { BookData, GoogleBooksVolumeInfo, ManualBookData } from '@/types/book';
import { z } from 'zod';

import type { GroupSuggestionsRouteParams } from '@/types/api';

const bookSuggestionSchema = z.object({
  bookData: z.object({
    googleBooksId: z.string().min(1),
    title: z.string().min(1),
    author: z.string().min(1),
    coverUrl: z.string().url().optional(),
  }).passthrough(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<GroupSuggestionsRouteParams> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const resolvedParams = await context.params;
  const { groupId } = resolvedParams;
  const json = await request.json();
  const parsed = bookSuggestionSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid payload.', issues: parsed.error.issues }, { status: 400 });
  }

  const bookData = parsed.data.bookData as BookData & { googleBooksId: string; title: string; author: string; coverUrl?: string };

  try {
    const member = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });

    if (!member) {
      return NextResponse.json({ message: 'Forbidden: You are not a member of this group.' }, { status: 403 });
    }

    const userSuggestionsCount = await prisma.groupBook.count({
      where: {
        group_id: groupId,
        suggested_by_id: userId,
        status: 'SUGGESTED',
      },
    });

    if (userSuggestionsCount >= 3) {
      return NextResponse.json({ message: 'You can only suggest a maximum of 3 books per group.' }, { status: 400 });
    }

    let preparedBookData: BookData;
    let googleBookDetails: GoogleBooksVolumeInfo | null = null;

    const description = 'description' in bookData && typeof bookData.description === 'string' ? bookData.description : undefined;
    const genre = 'genre' in bookData && typeof bookData.genre === 'string' ? bookData.genre : undefined;

    if (bookData.googleBooksId) {
      // If coverUrl is missing, try to fetch full book details from Google Books API
      if (!bookData.coverUrl) {
        googleBookDetails = await fetchBookDetailsFromGoogleBooks(bookData.googleBooksId);
      }

      const volumeInfo: GoogleBooksVolumeInfo = googleBookDetails ?? {
        title: bookData.title,
        authors: [bookData.author],
        description,
        categories: genre ? [genre] : undefined,
        imageLinks: bookData.coverUrl ? { thumbnail: bookData.coverUrl } : undefined,
      };

      preparedBookData = {
        id: bookData.googleBooksId,
        volumeInfo,
      };
    } else {
      const manualBook: ManualBookData = {
        title: bookData.title,
        author: bookData.author,
        coverUrl: bookData.coverUrl,
        description,
        genre,
        isManual: true,
      };
      preparedBookData = manualBook;
    }

    // Find or create the book in our database using the utility function
    const book = await findOrCreateBook(preparedBookData, userId);

    await prisma.groupBook.create({
      data: {
        group_id: groupId,
        book_id: book.id,
        status: 'SUGGESTED',
        suggested_by_id: userId,
      },
    });
    return NextResponse.json({ message: 'Successfully suggested a book.' });
  } catch (error) {
    console.error('Detailed error suggesting a book:', error);
    return NextResponse.json({ message: 'Failed to suggest a book.', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<GroupSuggestionsRouteParams> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await context.params;
  const { groupId } = resolvedParams;

  try {
    const groupSuggestions = await prisma.groupBook.findMany({
      where: {
        group_id: groupId,
        status: 'SUGGESTED',
      },
      include: {
        book: true, // Inclure les détails du livre
        pollOptions: { // Inclure les options de sondage pour compter les votes
          include: {
            votes: true, // Inclure les votes pour chaque option
          },
        },
      },
    });

    // Calculer le nombre de votes pour chaque suggestion
    const suggestionsWithVoteCounts = groupSuggestions.map(suggestion => {
      const voteCount = suggestion.pollOptions.reduce((acc, option) => acc + option.votes.length, 0);
      return {
        ...suggestion,
        voteCount, // Ajouter le nombre de votes à l'objet suggestion
      };
    });

    return NextResponse.json(suggestionsWithVoteCounts);
  } catch (error) {
    console.error('Error fetching group suggestions:', error);
    return NextResponse.json({ message: 'Failed to fetch group suggestions.' }, { status: 500 });
  }
}
