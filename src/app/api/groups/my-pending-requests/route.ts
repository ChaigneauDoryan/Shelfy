
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
    const pendingRequests = await prisma.groupJoinRequest.findMany({
      where: {
        userId: userId,
        status: 'PENDING',
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            avatar_url: true,
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Format the output to match what GroupCard or PublicGroupCard expects
    const formattedRequests = pendingRequests.map(req => ({
      id: req.id,
      groupId: req.groupId,
      group: {
        ...req.group,
        members_count: req.group._count.members,
      },
      createdAt: req.createdAt,
    }));

    return NextResponse.json(formattedRequests);

  } catch (error) {
    console.error('Error fetching pending join requests:', error);
    return NextResponse.json({ message: 'An error occurred while fetching pending requests.' }, { status: 500 });
  }
}
