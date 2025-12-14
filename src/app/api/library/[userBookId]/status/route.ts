import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth'; // Helper à créer
import { updateUserBookStatus } from '@/lib/book-utils';

import type { UserBookStatusRouteParams } from '@/types/api';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<UserBookStatusRouteParams> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const resolvedParams = await context.params;
  const { userBookId } = resolvedParams;
  const { status } = await request.json();

  if (!status) {
    return NextResponse.json({ message: 'Status is required.' }, { status: 400 });
  }

  try {
    const result = await updateUserBookStatus(userBookId, status, userId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating user book status:', message);
    return NextResponse.json({ message: 'Failed to update book status.' }, { status: 500 });
  }
}
