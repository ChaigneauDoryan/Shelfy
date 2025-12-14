import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth'; // Helper à créer
import { getUserBooks, getReadingStatusId } from '@/lib/book-utils';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const archived = searchParams.get('archived');

  try {
    const statusId = status ? await getReadingStatusId(status) : undefined;

    let isArchived: boolean | undefined;
    if (archived === 'true') {
      isArchived = true;
    } else if (archived === 'false') {
      isArchived = false;
    }

    const books = await getUserBooks(userId, statusId, isArchived);
    return NextResponse.json(books);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching user books:', message);
    return NextResponse.json({ message: 'Failed to fetch user books.' }, { status: 500 });
  }
}
