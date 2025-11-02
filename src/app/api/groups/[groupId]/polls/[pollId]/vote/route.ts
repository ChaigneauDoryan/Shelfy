import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { groupId: string, pollId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId, pollId } = await params;
  const { pollOptionId } = await request.json();

  if (!pollOptionId) {
    return NextResponse.json({ message: 'Poll option ID is required.' }, { status: 400 });
  }

  try {
    // Vérifier si l'utilisateur est membre du groupe
    const member = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });

    if (!member) {
      return NextResponse.json({ message: 'Forbidden: Vous n\'êtes pas membre de ce groupe.' }, { status: 403 });
    }

    // Vérifier si le sondage existe et est actif
    const poll = await prisma.poll.findUnique({
      where: { id: pollId, group_id: groupId },
      include: { options: true },
    });

    if (!poll) {
      return NextResponse.json({ message: 'Sondage non trouvé.' }, { status: 404 });
    }

    if (new Date(poll.end_date) <= new Date()) {
      return NextResponse.json({ message: 'Ce sondage est terminé.' }, { status: 400 });
    }

    // Vérifier si l'option de sondage appartient bien à ce sondage
    const pollOption = poll.options.find(option => option.id === pollOptionId);
    if (!pollOption) {
      return NextResponse.json({ message: 'Option de sondage invalide.' }, { status: 400 });
    }

    // Vérifier si l'utilisateur a déjà voté pour ce sondage
    const existingVote = await prisma.vote.findFirst({
      where: {
        user_id: userId,
        pollOption: {
          poll_id: pollId,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json({ message: 'Vous avez déjà voté pour ce sondage.' }, { status: 409 });
    }

    // Enregistrer le vote
    await prisma.vote.create({
      data: {
        poll_option_id: pollOptionId,
        user_id: userId,
      },
    });

    return NextResponse.json({ message: 'Vote enregistré avec succès.' });
  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json({ message: 'Échec de l\'enregistrement du vote.', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}