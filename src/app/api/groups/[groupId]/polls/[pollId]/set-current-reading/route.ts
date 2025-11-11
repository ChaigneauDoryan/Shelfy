import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RoleInGroup } from '@prisma/client';

export async function POST(request: Request, { params }: { params: { groupId: string, pollId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId, pollId } = await params;
  const { readingEndDate } = await request.json();

  try {
    // 1. Vérifier si l'utilisateur est administrateur du groupe
    const member = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });

    if (!member || member.role !== RoleInGroup.ADMIN) {
      return NextResponse.json({ message: 'Forbidden: Seuls les administrateurs peuvent définir la lecture en cours.' }, { status: 403 });
    }

    // 2. Vérifier que le sondage existe, est terminé et a un gagnant unique
    const poll = await prisma.poll.findUnique({
      where: { id: pollId, group_id: groupId },
      include: {
        options: {
          include: {
            groupBook: true,
            votes: true,
          },
        },
      },
    });

    if (!poll) {
      return NextResponse.json({ message: 'Sondage non trouvé.' }, { status: 404 });
    }
    if (new Date(poll.end_date) > new Date()) {
      return NextResponse.json({ message: 'Ce sondage n\'est pas encore terminé.' }, { status: 400 });
    }

    const maxVotes = Math.max(...poll.options.map(option => option.votes.length));
    const winners = poll.options.filter(option => option.votes.length === maxVotes);

    if (winners.length !== 1) {
      return NextResponse.json({ message: 'Impossible de définir la lecture en cours: il n\'y a pas de gagnant unique (égalité ou aucun vote).' }, { status: 400 });
    }

    const winningGroupBookId = winners[0].groupBook.id;

    // Utiliser une transaction pour s'assurer que toutes les opérations réussissent ou échouent ensemble
    await prisma.$transaction(async (tx) => {
      // 3. Mettre à jour le statut de tous les autres livres "CURRENT" du groupe à "FINISHED"
      await tx.groupBook.updateMany({
        where: {
          group_id: groupId,
          status: 'CURRENT',
          NOT: {
            id: winningGroupBookId, // Ne pas modifier le livre gagnant s'il était déjà en lecture
          },
        },
        data: {
          status: 'FINISHED',
        },
      });

      // 4. Mettre à jour le statut du livre gagnant à "CURRENT"
      await tx.groupBook.update({
        where: { id: winningGroupBookId },
        data: {
          status: 'CURRENT',
          reading_end_date: readingEndDate ? new Date(readingEndDate) : null, // Nouvelle ligne
        },
      });

      // 5. Archiver les autres suggestions qui étaient dans ce sondage (les perdants)
      const losingGroupBookIds = poll.options
        .filter(option => option.groupBook.id !== winningGroupBookId)
        .map(option => option.groupBook.id);

      if (losingGroupBookIds.length > 0) {
        await tx.groupBook.updateMany({
          where: {
            id: { in: losingGroupBookIds },
            group_id: groupId,
            status: 'SUGGESTED', // S'assurer qu'on n'archive que les suggestions
          },
          data: { status: 'ARCHIVED' },
        });
      }
    });

    return NextResponse.json({ message: 'Livre gagnant défini comme lecture en cours et suggestions mises à jour.' });
  } catch (error) {
    console.error('Error setting current reading book from poll:', error);
    return NextResponse.json({ message: 'Échec de la définition du livre de lecture en cours.', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
