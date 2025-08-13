import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // In a real application, you would fetch the user's profile data from your database here
  // For now, we'll return a simple success message as in the original NestJS controller
  return NextResponse.json({ message: 'Vous êtes authentifié !', user: session.user });
}
