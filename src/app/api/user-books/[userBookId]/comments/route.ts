
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth'; // Helper à créer
import { prisma } from '@/lib/prisma';
import { getReadingStatusId } from '@/lib/book-utils';

// GET /api/user-books/[userBookId]/comments
export async function GET(request: Request, { params }: { params: { userBookId: string } }) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { userBookId } = params;

  try {
    // Vérifier que l'utilisateur a le droit de voir ce userBook
    const userBook = await prisma.userBook.findFirst({
      where: { id: userBookId, user_id: session.user.id },
    });

    if (!userBook) {
      return NextResponse.json({ message: 'Not found or forbidden' }, { status: 404 });
    }

    const comments = await prisma.userBookComment.findMany({
      where: { user_book_id: userBookId },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST /api/user-books/[userBookId]/comments
export async function POST(request: Request, { params }: { params: { userBookId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { userBookId } = params;

  try {
    const { page_number, comment_text } = await request.json();

    if (page_number === undefined || !comment_text) {
      return NextResponse.json({ error: 'Missing required fields: page_number, comment_text' }, { status: 400 });
    }

    const newComment = await prisma.$transaction(async (tx) => {
      // 1. Vérifier que l'utilisateur est propriétaire du userBook
      const userBook = await tx.userBook.findFirst({
        where: { id: userBookId, user_id: session.user.id },
        include: { _count: { select: { comments: true } } },
      });

      if (!userBook) {
        throw new Error('Not found or forbidden');
      }

      // 2. Créer le commentaire
      const createdComment = await tx.userBookComment.create({
        data: {
          user_book_id: userBookId,
          page_number: page_number,
          comment_text: comment_text,
        },
      });

      // 3. Mettre à jour le userBook (statut et page actuelle)
      const isFirstComment = userBook._count.comments === 0;
      let statusUpdate = {};

      if (isFirstComment) {
        const readingStatusId = await getReadingStatusId('reading');
        statusUpdate = { status_id: readingStatusId };
      }

      await tx.userBook.update({
        where: { id: userBookId },
        data: {
          current_page: page_number,
          ...statusUpdate,
        },
      });

      return createdComment;
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error: any) {
    console.error('Unexpected error adding comment:', error);
    if (error.message === 'Not found or forbidden') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
