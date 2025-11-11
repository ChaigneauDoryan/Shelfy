import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 1. Récupérer les groupes de l'utilisateur
    const userGroups = await prisma.groupMember.findMany({
      where: { user_id: userId },
      select: { group_id: true },
    });

    const groupIds = userGroups.map(ug => ug.group_id);

    // 2. Récupérer les livres en cours de lecture ou lus dans ces groupes
    const groupBooks = await prisma.groupBook.findMany({
      where: {
        group_id: { in: groupIds },
        status: { in: ['CURRENT', 'FINISHED'] },
      },
      include: {
        book: true,
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        added_at: 'desc',
      },
    });

    // 3. Récupérer les livres personnels en cours de lecture ou lus
    const personalBooks = await prisma.userBook.findMany({
      where: {
        user_id: userId,
        status_id: { in: [2, 3] }, // Assuming 2 is 'in progress' and 3 is 'finished'
        is_archived: false,
      },
      include: {
        book: true,
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    return NextResponse.json({ groupBooks, personalBooks });
  } catch (error) {
    console.error('Error fetching user reading activity:', error);
    return NextResponse.json({ message: 'Échec de la récupération de l\'activité de lecture.', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
