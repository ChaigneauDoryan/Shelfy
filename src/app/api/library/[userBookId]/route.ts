import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getUserBookById, deleteUserBook } from '@/lib/book-utils';

export async function GET(request: Request, context: any) {
  const supabase = await createClient(cookies());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const { userBookId } = await context.params;

  try {
    const book = await getUserBookById(supabase, userBookId, userId);
    return NextResponse.json(book);
  } catch (error: any) {
    console.error('Error fetching user book by ID:', error.message);
    return NextResponse.json({ message: 'Failed to fetch user book.' }, { status: 404 });
  }
}

export async function DELETE(request: Request, context: any) {
  const supabase = await createClient(cookies());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const { userBookId } = await context.params;

  try {
    const result = await deleteUserBook(supabase, userBookId, userId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error deleting user book:', error.message);
    return NextResponse.json({ message: 'Failed to delete user book.' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: any) {
  const supabase = await createClient(cookies());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const { userBookId } = await context.params;

  try {
    const requestBody = await request.json(); // Log the raw request body
    const { is_archived } = requestBody; // Destructure from the logged body

    if (is_archived === undefined || typeof is_archived !== 'boolean') {
      console.error('Invalid is_archived:', is_archived); // Log the invalid value
      return NextResponse.json({ error: 'Missing or invalid is_archived status' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('user_books')
      .update({ is_archived: is_archived, updated_at: new Date().toISOString() })
      .eq('id', userBookId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating archive status:', error);
      return NextResponse.json({ message: 'Failed to update archive status.' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Unexpected error updating archive status:', error.message);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}