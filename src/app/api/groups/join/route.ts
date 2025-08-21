import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { joinGroup } from '@/lib/group-utils';

export async function POST(request: Request) {
  const supabase = await createClient(cookies());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const { invitationCode } = await request.json();

  try {
    const result = await joinGroup(supabase, invitationCode, userId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error joining group:', error.message);
    if (error.message === 'Code d\'invitation invalide ou expiré.') {
      return NextResponse.json({ message: error.message }, { status: 400 });
    } else if (error.message === 'Vous êtes déjà membre de ce groupe.') {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to join group.' }, { status: 500 });
  }
}
