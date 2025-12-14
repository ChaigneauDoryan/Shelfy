
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RoleInGroup } from '@prisma/client';
import { getUserSubscription, isPremium } from '@/lib/subscription-utils';

import type { PromoteMemberRouteParams } from '@/types/api';

export async function PATCH(request: NextRequest, context: { params: Promise<{ groupId: string; memberId: string; }> }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId, memberId } = await context.params;

  try {
    // Check subscription status
    const subscription = await getUserSubscription(userId);
    if (!isPremium(subscription)) {
      return NextResponse.json({ message: 'Cette fonctionnalité est réservée aux membres Premium.' }, { status: 402 });
    }

    // Verify the current user is an admin of the group
    const adminMember = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });

    if (!adminMember || adminMember.role !== RoleInGroup.ADMIN) {
      return NextResponse.json({ message: 'Forbidden: You are not an admin of this group.' }, { status: 403 });
    }

    // Promote the target member to MODERATOR
    await prisma.groupMember.update({
      where: { id: memberId },
      data: { role: 'MODERATOR' },
    });

    return NextResponse.json({ message: 'Membre promu modérateur avec succès.' });
  } catch (error) {
    console.error('Error promoting member:', error);
    return NextResponse.json({ message: 'Failed to promote member.' }, { status: 500 });
  }
}
