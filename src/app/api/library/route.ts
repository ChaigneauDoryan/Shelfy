import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getUserBooks } from '@/lib/book-utils';

export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const archived = searchParams.get('archived'); // Get archived status

  let isArchived: boolean | undefined;
  if (archived === 'true') {
    isArchived = true;
  } else if (archived === 'false') {
    isArchived = false;
  }
  // If 'archived' param is not present, getUserBooks will default to non-archived

  try {
    const books = await getUserBooks(supabase, userId, status || undefined, isArchived); // Pass isArchived
    return NextResponse.json(books);
  } catch (error: any) {
    console.error('Error fetching user books:', error.message);
    return NextResponse.json({ message: 'Failed to fetch user books.' }, { status: 500 });
  }
}
