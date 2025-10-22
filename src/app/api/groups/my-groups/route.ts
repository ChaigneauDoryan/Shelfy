
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: Request) {
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
            members: true,
            _count: {
              select: { members: true },
            },
          },
        },
      },
    });

    const formattedGroups = myGroups.map(member => {
      const adminCount = member.group.members.filter(m => m.role === 'ADMIN').length;
      const memberCount = member.group.members.length;

      return {
        ...member.group,
        members_count: member.group._count.members,
        user_role: member.role,
        adminCount,
        memberCount,
      };
    });

    return NextResponse.json(formattedGroups);
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return NextResponse.json({ message: 'Failed to fetch user groups' }, { status: 500 });
  }
}
