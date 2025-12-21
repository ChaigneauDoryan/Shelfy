import { NextResponse } from 'next/server';
import { createGroup } from '@/lib/group-utils';
import { getSession } from '@/lib/auth'; // Assumant que vous aurez un helper pour la session
import { checkAndAwardGroupCreationBadges } from '@/lib/badge-utils';

export async function POST(request: Request) {
  // La récupération de l'utilisateur se fera via votre nouvelle solution d'authentification (ex: NextAuth.js)
  // Voici un exemple de ce à quoi cela pourrait ressembler.
  // Vous devrez créer ce helper `getSession`.
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const createGroupDto = await request.json();

  try {
    
    const group = await createGroup(createGroupDto, userId);
    await checkAndAwardGroupCreationBadges(userId);
    return NextResponse.json(group);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating group:', message);
    return NextResponse.json({ message: 'Failed to create group.' }, { status: 500 });
  }
}
