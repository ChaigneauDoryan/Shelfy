import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth'; // Helper à créer
import { updateUserBookStatus } from '@/lib/book-utils';

export async function PATCH(request: Request, { params }: { params: { userBookId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { userBookId } = params;
  const { status } = await request.json();

  if (!status) {
    return NextResponse.json({ message: 'Status is required.' }, { status: 400 });
  }

  try {
    const result = await updateUserBookStatus(userBookId, status, userId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating user book status:', error.message);
    return NextResponse.json({ message: 'Failed to update book status.' }, { status: 500 });
  }
}