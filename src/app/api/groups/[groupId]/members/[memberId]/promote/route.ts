
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RoleInGroup } from '@prisma/client';

export async function PATCH(request: Request, { params }: { params: { groupId: string, memberId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId, memberId } = params;

  try {
    const member = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });

    if (!member || member.role !== RoleInGroup.ADMIN) {
      return NextResponse.json({ message: 'Forbidden: You are not an admin of this group.' }, { status: 403 });
    }

    await prisma.groupMember.update({
      where: { id: memberId },
      data: { role: 'ADMIN' },
    });

    return NextResponse.json({ message: 'Successfully promoted member to admin.' });
  } catch (error) {
    console.error('Error promoting member:', error);
    return NextResponse.json({ message: 'Failed to promote member.' }, { status: 500 });
  }
}
