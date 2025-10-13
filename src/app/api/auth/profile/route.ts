import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Retourne l'utilisateur de la session NextAuth
  return NextResponse.json({ message: 'Vous êtes authentifié !', user: session.user });
}