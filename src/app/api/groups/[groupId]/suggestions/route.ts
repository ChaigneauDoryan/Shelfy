import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { findOrCreateBook, fetchBookDetailsFromGoogleBooks } from '@/lib/book-utils';

export async function POST(request: Request, { params }: { params: { groupId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId } = await params;
  const { bookData } = await request.json();

  if (!bookData || !bookData.googleBooksId || !bookData.title || !bookData.author) {
    return NextResponse.json({ message: 'Book data (googleBooksId, title, author) is required.' }, { status: 400 });
  }

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

    // If coverUrl is missing, try to fetch full book details from Google Books API
    if (!bookData.coverUrl && bookData.googleBooksId) {
      const googleBookDetails = await fetchBookDetailsFromGoogleBooks(bookData.googleBooksId);
      if (googleBookDetails) {
        // Merge volumeInfo into bookData for findOrCreateBook to use
        bookData.volumeInfo = googleBookDetails;
      }
    }

    // Find or create the book in our database using the utility function
    const book = await findOrCreateBook(bookData, userId);

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

export async function GET(request: Request, { params }: { params: { groupId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { groupId } = params;

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
