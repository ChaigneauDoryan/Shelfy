
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { groupId: string, pollId: string, pollOptionId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId, pollId, pollOptionId } = params;

  try {
    const member = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });

    if (!member) {
      return NextResponse.json({ message: 'Forbidden: You are not a member of this group.' }, { status: 403 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll || poll.group_id !== groupId) {
      return NextResponse.json({ message: 'Poll not found.' }, { status: 404 });
    }

    if (poll.end_date < new Date()) {
      return NextResponse.json({ message: 'Poll has ended.' }, { status: 400 });
    }

    const existingVote = await prisma.vote.findUnique({
      where: { poll_option_id_user_id: { poll_option_id: pollOptionId, user_id: userId } },
    });

    if (existingVote) {
      return NextResponse.json({ message: 'You have already voted for this option.' }, { status: 409 });
    }

    await prisma.vote.create({
      data: {
        poll_option_id: pollOptionId,
        user_id: userId,
      },
    });

    return NextResponse.json({ message: 'Successfully voted for the option.' });
  } catch (error) {
    console.error('Error voting for an option:', error);
    return NextResponse.json({ message: 'Failed to vote for an option.' }, { status: 500 });
  }
}
