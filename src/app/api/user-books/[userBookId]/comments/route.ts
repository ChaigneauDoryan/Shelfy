import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getReadingStatusId } from '@/lib/book-utils';

// Interface pour le contexte de la route avec params comme Promise
interface RouteContext {
  params: Promise<{ userBookId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { userBookId } = await context.params;
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

export async function POST(request: Request, context: RouteContext) {
  const { userBookId } = await context.params;
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

    // Check if this is the first comment for this user_book_id
    const { count: commentsCount, error: countError } = await supabase
      .from('user_book_comments')
      .select('id', { count: 'exact' })
      .eq('user_book_id', userBookId);

    if (countError) {
      console.error('Error counting comments before insert:', countError);
      // Proceed without status update if count fails
    }

    const isFirstComment = (commentsCount || 0) === 0; // If count is 0, this is the first comment

    // Insert the comment
    const { data: newComment, error: commentError } = await supabase
      .from('user_book_comments')
      .insert({
        user_book_id: userBookId,
        page_number,
        comment_title,
        comment_text,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (commentError) {
      console.error('Error inserting comment:', commentError);
      return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
    }

    let updateData: any = {
      current_page: page_number,
      updated_at: new Date().toISOString(),
    };

    // If it's the first comment, update status to "reading"
    if (isFirstComment) {
      const readingStatusId = await getReadingStatusId(supabase, 'reading');
      updateData.status_id = readingStatusId;
    }

    // Update user_books table
    const { error: updateError } = await supabase
      .from('user_books')
      .update(updateData)
      .eq('id', userBookId);

    if (updateError) {
      console.error('Error updating user_book:', updateError);
      // Continue without failing the comment addition
    }

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Unexpected error adding comment:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}