import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { groupId: string, groupBookId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId, groupBookId } = await params;
  const { currentPage } = await request.json();

  if (typeof currentPage !== 'number' || currentPage < 0) {
    return NextResponse.json({ message: 'La page actuelle doit être un nombre positif.' }, { status: 400 });
  }

  try {
    // 1. Vérifier si l'utilisateur est membre du groupe
    const groupMember = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });

    if (!groupMember) {
      return NextResponse.json({ message: 'Forbidden: Vous n\'êtes pas membre de ce groupe.' }, { status: 403 });
    }

    // 2. Vérifier si le groupBook existe et appartient à ce groupe
    const groupBook = await prisma.groupBook.findUnique({
      where: { id: groupBookId, group_id: groupId },
    });

    if (!groupBook) {
      return NextResponse.json({ message: 'Livre du groupe non trouvé.' }, { status: 404 });
    }

    // 3. Mettre à jour ou créer la progression de lecture du membre
    const updatedProgress = await prisma.groupMemberReadingProgress.upsert({
      where: {
        groupMemberId_groupBookId: {
          groupMemberId: groupMember.id,
          groupBookId: groupBook.id,
        },
      },
      update: {
        currentPage: currentPage,
        lastUpdated: new Date(),
      },
      create: {
        groupMemberId: groupMember.id,
        groupBookId: groupBook.id,
        currentPage: currentPage,
      },
    });

    return NextResponse.json({ message: 'Progression de lecture mise à jour avec succès.', progress: updatedProgress });
  } catch (error) {
    console.error('API Error (progress update):', error); // Plus détaillé
    return NextResponse.json({ message: 'Échec de la mise à jour de la progression de lecture.', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: { groupId: string, groupBookId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId, groupBookId } = await params;

  try {
    // 1. Vérifier si l'utilisateur est membre du groupe
    const groupMember = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });

    if (!groupMember) {
      return NextResponse.json({ message: 'Forbidden: Vous n\'êtes pas membre de ce groupe.' }, { status: 403 });
    }

    // 2. Récupérer la progression de lecture du membre pour ce livre
    const progress = await prisma.groupMemberReadingProgress.findUnique({
      where: {
        groupMemberId_groupBookId: {
          groupMemberId: groupMember.id,
          groupBookId: groupBookId,
        },
      },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('API Error (fetch progress):', error);
    return NextResponse.json({ message: 'Échec de la récupération de la progression de lecture.', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
