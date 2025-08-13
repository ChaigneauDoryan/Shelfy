import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getUserBookById, deleteUserBook } from '@/lib/book-utils';

export async function GET(request: Request, context: any) {
  const supabase = createClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { userBookId } = context.params;

  try {
    const book = await getUserBookById(cookies(), userBookId, userId);
    return NextResponse.json(book);
  } catch (error: any) {
    console.error('Error fetching user book by ID:', error.message);
    return NextResponse.json({ message: 'Failed to fetch user book.' }, { status: 404 });
  }
}

export async function DELETE(request: Request, context: any) {
  const supabase = createClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { userBookId } = context.params;

  try {
    const result = await deleteUserBook(cookies(), userBookId, userId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error deleting user book:', error.message);
    return NextResponse.json({ message: 'Failed to delete user book.' }, { status: 500 });
  }
}

