import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: Request, { params }: { params: { userBookId: string } }) {
  const { userBookId } = await params;
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: comments, error } = await supabase
      .from('user_book_comments')
      .select('id, page_number, comment_text, created_at, updated_at, comment_title')
      .eq('user_book_id', userBookId)
      .order('page_number', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Unexpected error fetching comments:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { userBookId: string } }) {
  const { userBookId } = await params;
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { page_number, comment_title, comment_text } = await request.json();

    if (!page_number || !comment_title || !comment_text) {
      return NextResponse.json({ error: 'Missing required fields: page_number, comment_title, comment_text' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('user_book_comments')
      .insert({
        user_book_id: userBookId,
        page_number,
        comment_title,
        comment_text,
        created_at: new Date().toISOString(), // Set created_at
        updated_at: new Date().toISOString(), // Set updated_at
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting comment:', error);
      return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error adding comment:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}