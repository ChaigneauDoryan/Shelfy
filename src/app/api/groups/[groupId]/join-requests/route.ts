
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RoleInGroup } from '@prisma/client';

export async function GET(request: Request, { params }: { params: { groupId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const groupId = params.groupId;

  try {
    // Check if the user is an admin of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        group_id_user_id: {
          group_id: groupId,
          user_id: userId,
        },
      },
    });

    if (!membership || membership.role !== RoleInGroup.ADMIN) {
      return NextResponse.json({ message: 'Forbidden: You are not an admin of this group.' }, { status: 403 });
    }

    // Fetch pending join requests for the group
    const joinRequests = await prisma.groupJoinRequest.findMany({
      where: {
        groupId: groupId,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(joinRequests);

  } catch (error) {
    console.error('Failed to fetch join requests:', error);
    return NextResponse.json({ message: 'An internal error occurred.' }, { status: 500 });
  }
}
