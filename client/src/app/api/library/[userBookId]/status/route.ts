import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { updateUserBookStatus } from '@/lib/book-utils';

export async function PATCH(request: Request, { params }: { params: { userBookId: string } }) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { userBookId } = params;
  const { status } = await request.json();

  if (!status) {
    return NextResponse.json({ message: 'Status is required.' }, { status: 400 });
  }

  try {
    const updatedBook = await updateUserBookStatus(userBookId, status, userId);
    return NextResponse.json(updatedBook);
  } catch (error: any) {
    console.error('Error updating user book status:', error.message);
    return NextResponse.json({ message: 'Failed to update book status.' }, { status: 500 });
  }
}
