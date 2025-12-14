
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  try {
    // Find groups the user is already a member of
    const userMemberships = await prisma.groupMember.findMany({
      where: { user_id: session.user.id },
      select: { group_id: true },
    });
    const memberGroupIds = userMemberships.map(m => m.group_id);

    // Find groups for which the user has a pending join request
    const pendingJoinRequests = await prisma.groupJoinRequest.findMany({
      where: { userId: session.user.id, status: 'PENDING' },
      select: { groupId: true },
    });
    const pendingGroupIds = pendingJoinRequests.map(r => r.groupId);

    const excludedGroupIds = [...memberGroupIds, ...pendingGroupIds];

    const whereClause: Prisma.GroupWhereInput = {
      id: {
        notIn: excludedGroupIds,
      },
    };

    if (query) {
      whereClause.name = {
        contains: query,
        mode: 'insensitive',
      };
    }

    const groups = await prisma.group.findMany({
      where: whereClause,
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatar_url: true,
        _count: {
          select: { members: true },
        },
      },
      take: query ? 20 : 6, // Take 6 for default, 20 for search
    });

    return NextResponse.json(groups);

  } catch (error) {
    console.error('Error searching groups:', error);
    return NextResponse.json({ message: 'An error occurred while searching for groups.' }, { status: 500 });
  }
}
