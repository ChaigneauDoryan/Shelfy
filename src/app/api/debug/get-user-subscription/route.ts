import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized - Not logged in' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        subscriptions: true, // Inclure tous les abonnements
      },
    });

    if (!user) {
      return NextResponse.json({ error: `User with ID ${userId} not found.` }, { status: 404 });
    }

    // Renvoyer l'objet utilisateur complet avec ses abonnements
    return NextResponse.json(user);

  } catch (error) {
    console.error('Error fetching debug info:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch debug info.', details: errorMessage }, { status: 500 });
  }
}
