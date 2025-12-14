
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RoleInGroup } from '@prisma/client';

interface RouteParams {
  groupId: string;
  memberId: string;
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ groupId: string; memberId: string; }> }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const removerUserId = session.user.id;
  const { groupId, memberId } = await context.params;

  try {
    // Get the role of the user performing the action
    const remover = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: removerUserId } },
    });

    if (!remover) {
      return NextResponse.json({ message: 'Forbidden: You are not a member of this group.' }, { status: 403 });
    }

    // Get the target member to be removed
    const removee = await prisma.groupMember.findUnique({
      where: { id: memberId },
    });

    if (!removee) {
      return NextResponse.json({ message: 'Member to be removed not found.' }, { status: 404 });
    }
    
    // A user cannot remove themselves using this endpoint
    if (remover.id === removee.id) {
        return NextResponse.json({ message: 'You cannot remove yourself from the group.' }, { status: 400 });
    }

    let hasPermission = false;

    if (remover.role === RoleInGroup.ADMIN) {
      // Admins can remove anyone (MODERATOR or MEMBER)
      if (removee.role === RoleInGroup.MODERATOR || removee.role === RoleInGroup.MEMBER) {
        hasPermission = true;
      }
    } else if (remover.role === RoleInGroup.MODERATOR) {
      // Moderators can only remove members
      if (removee.role === RoleInGroup.MEMBER) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to remove this member.' }, { status: 403 });
    }

    await prisma.groupMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ message: 'Successfully removed member from the group.' });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ message: 'Failed to remove member.' }, { status: 500 });
  }
}
