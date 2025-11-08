import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { groupId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId } = await params;

  try {
    // Vérifier si l'utilisateur est membre du groupe
    const groupMember = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });

    if (!groupMember) {
      return NextResponse.json({ message: 'Forbidden: Vous n\'êtes pas membre de ce groupe.' }, { status: 403 });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: { user: true },
        },
        books: {
          include: { book: true },
        },
        joinRequests: {
          include: { user: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ message: 'Groupe non trouvé.' }, { status: 404 });
    }

    // Ajouter des compteurs pour les membres et admins
    const memberCount = group.members.length;
    const adminCount = group.members.filter(m => m.role === 'ADMIN').length;

    return NextResponse.json({ ...group, memberCount, adminCount });
  } catch (error) {
    console.error('Error fetching group details:', error);
    return NextResponse.json({ message: 'Échec de la récupération des détails du groupe.', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
