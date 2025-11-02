
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RoleInGroup } from '@prisma/client';

export async function POST(request: Request, { params }: { params: { groupId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId } = params;
  const { groupBookIds, endDate } = await request.json();

  if (!groupBookIds || !Array.isArray(groupBookIds) || groupBookIds.length === 0) {
    return NextResponse.json({ message: 'At least one groupBookId is required.' }, { status: 400 });
  }

  if (!endDate) {
    return NextResponse.json({ message: 'End date is required.' }, { status: 400 });
  }

  try {
    const member = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });

    if (!member || member.role !== RoleInGroup.ADMIN) {
      return NextResponse.json({ message: 'Forbidden: You are not an admin of this group.' }, { status: 403 });
    }

    const newPoll = await prisma.poll.create({
      data: {
        group_id: groupId,
        end_date: new Date(endDate),
        options: {
          create: groupBookIds.map(groupBookId => ({
            group_book_id: groupBookId,
          })),
        },
      },
    });

    return NextResponse.json({ message: 'Poll created successfully.', poll: newPoll });
  } catch (error) {
    console.error('Error creating poll:', error);
    return NextResponse.json({ message: 'Failed to create poll.' }, { status: 500 });
  }
}
