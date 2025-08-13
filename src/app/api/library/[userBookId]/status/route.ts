import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { updateUserBookStatus } from '@/lib/book-utils';

export async function PATCH(request: Request, context: any) {
  const supabase = createClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { userBookId } = context.params;
  const { status } = await request.json();

  if (!status) {
    return NextResponse.json({ message: 'Status is required.' }, { status: 400 });
  }

  try {
    const updatedBook = await updateUserBookStatus(cookies(), userBookId, status, userId);
    return NextResponse.json(updatedBook);
  } catch (error: any) {
    console.error('Error updating user book status:', error.message);
    return NextResponse.json({ message: 'Failed to update book status.' }, { status: 500 });
  }
}
