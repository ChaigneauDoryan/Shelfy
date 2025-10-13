
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
    const myGroups = await prisma.groupMember.findMany({
      where: { user_id: userId },
      include: {
        group: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
    });

    const formattedGroups = myGroups.map(member => ({
      ...member.group,
      members_count: member.group._count.members,
      user_role: member.role,
    }));

    return NextResponse.json(formattedGroups);
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return NextResponse.json({ message: 'Failed to fetch user groups' }, { status: 500 });
  }
}
