
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { groupId: string, suggestionId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId, suggestionId } = params;

  try {
    const member = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });

    if (!member) {
      return NextResponse.json({ message: 'Forbidden: You are not a member of this group.' }, { status: 403 });
    }

    const existingVote = await prisma.vote.findUnique({
      where: { group_book_id_user_id: { group_book_id: suggestionId, user_id: userId } },
    });

    if (existingVote) {
      return NextResponse.json({ message: 'You have already voted for this suggestion.' }, { status: 409 });
    }

    await prisma.vote.create({
      data: {
        group_book_id: suggestionId,
        user_id: userId,
      },
    });

    return NextResponse.json({ message: 'Successfully voted for the suggestion.' });
  } catch (error) {
    console.error('Error voting for a suggestion:', error);
    return NextResponse.json({ message: 'Failed to vote for a suggestion.' }, { status: 500 });
  }
}
