import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getUserBooks } from '@/lib/book-utils';

export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    const books = await getUserBooks(cookieStore, userId, status || undefined);
    return NextResponse.json(books);
  } catch (error: any) {
    console.error('Error fetching user books:', error.message);
    return NextResponse.json({ message: 'Failed to fetch user books.' }, { status: 500 });
  }
}
