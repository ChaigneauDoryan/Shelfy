
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth'; // Helper à créer
import { prisma } from '@/lib/prisma';
import { getReadingStatusId } from '@/lib/book-utils';

import type { UserBookCommentsRouteParams, UserBookCommentsPostRequestBody } from '@/types/api';

const FINISHED_COMMENT_ERROR_MESSAGE = 'Impossible d’ajouter un commentaire sur un livre terminé.';

// GET /api/user-books/[userBookId]/comments
export async function GET(
  request: NextRequest,
  context: { params: Promise<UserBookCommentsRouteParams> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await context.params;
  const { userBookId } = resolvedParams;

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
export async function POST(
  request: NextRequest,
  context: { params: Promise<UserBookCommentsRouteParams> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await context.params;
  const { userBookId } = resolvedParams;

  try {
    const { page_number, comment_text }: UserBookCommentsPostRequestBody = await request.json();

    if (page_number === undefined || !comment_text) {
      return NextResponse.json({ error: 'Missing required fields: page_number, comment_text' }, { status: 400 });
    }

    const finishedStatusId = await getReadingStatusId('finished');
    const userBook = await prisma.userBook.findFirst({
      where: { id: userBookId, user_id: session.user.id },
      include: { _count: { select: { comments: true } } },
    });

    if (!userBook) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
    }

    if (userBook.status_id === finishedStatusId) {
      return NextResponse.json({ error: FINISHED_COMMENT_ERROR_MESSAGE }, { status: 403 });
    }

    const isFirstComment = userBook._count.comments === 0;
    const readingStatusId = isFirstComment ? await getReadingStatusId('reading') : undefined;

    const newComment = await prisma.$transaction(async (tx) => {
      const createdComment = await tx.userBookComment.create({
        data: {
          user_book_id: userBookId,
          page_number: page_number,
          comment_text: comment_text,
        },
      });

      const updateData: { current_page: number; status_id?: number } = { current_page: page_number };
      if (typeof readingStatusId === 'number') {
        updateData.status_id = readingStatusId;
      }

      await tx.userBook.update({
        where: { id: userBookId },
        data: updateData,
      });

      return createdComment;
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error: unknown) {
    console.error('Unexpected error adding comment:', error);
    if (error instanceof Error && error.message === 'Not found or forbidden') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
