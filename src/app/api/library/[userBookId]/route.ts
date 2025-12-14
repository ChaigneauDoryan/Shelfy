import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth'; // Helper à créer
import { getUserBookById, deleteUserBook, updateUserBookArchiveStatus } from '@/lib/book-utils';

// GET /api/library/[userBookId]
export async function GET(request: NextRequest, context: { params: Promise<{ userBookId: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { userBookId } = await context.params;

  try {
    const book = await getUserBookById(userBookId, userId);
    return NextResponse.json(book);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching user book by ID:', message);
    return NextResponse.json({ message: 'Failed to fetch user book.' }, { status: 404 });
  }
}

// DELETE /api/library/[userBookId]
export async function DELETE(request: NextRequest, context: { params: Promise<{ userBookId: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { userBookId } = await context.params;

  try {
    const result = await deleteUserBook(userBookId, userId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting user book:', message);
    return NextResponse.json({ message: 'Failed to delete user book.' }, { status: 500 });
  }
}

// PUT /api/library/[userBookId] - Mettre à jour le statut d'archivage
export async function PUT(request: NextRequest, context: { params: Promise<{ userBookId: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { userBookId } = await context.params;

  try {
    const { is_archived } = await request.json();

    if (is_archived === undefined || typeof is_archived !== 'boolean') {
      return NextResponse.json({ error: 'Missing or invalid is_archived status' }, { status: 400 });
    }

    const updatedUserBook = await updateUserBookArchiveStatus(userBookId, userId, is_archived);
    return NextResponse.json(updatedUserBook);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unexpected error updating archive status:', message);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
