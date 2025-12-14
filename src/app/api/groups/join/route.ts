import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth'; // Helper à créer
import { joinGroup } from '@/lib/group-utils';
import { checkAndAwardGroupMembershipBadges, checkAndAwardInvitationBadges } from '@/lib/badge-utils';

interface PostRequestBody {
  invitationCode: string;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { invitationCode }: PostRequestBody = await request.json();

  if (!invitationCode) {
    return NextResponse.json({ message: 'Invitation code is required.' }, { status: 400 });
  }

  try {
    const result = await joinGroup(invitationCode, userId);
    await checkAndAwardGroupMembershipBadges(userId);
    if (result.inviterId) {
      await checkAndAwardInvitationBadges(result.inviterId);
    }
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error joining group:', message);
    if (message === "Code d'invitation invalide ou expiré.") {
      return NextResponse.json({ message }, { status: 400 });
    } else if (message === 'Vous êtes déjà membre de ce groupe.') {
      return NextResponse.json({ message }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to join group.' }, { status: 500 });
  }
}
