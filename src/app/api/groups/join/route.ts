import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth'; // Helper à créer
import { joinGroup } from '@/lib/group-utils';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { invitationCode } = await request.json();

  if (!invitationCode) {
    return NextResponse.json({ message: 'Invitation code is required.' }, { status: 400 });
  }

  try {
    const result = await joinGroup(invitationCode, userId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error joining group:', error.message);
    if (error.message === "Code d'invitation invalide ou expiré.") {
      return NextResponse.json({ message: error.message }, { status: 400 });
    } else if (error.message === 'Vous êtes déjà membre de ce groupe.') {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to join group.' }, { status: 500 });
  }
}