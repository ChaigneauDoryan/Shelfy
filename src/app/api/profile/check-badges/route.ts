import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  checkAndAwardGroupCreationBadges,
  checkAndAwardGroupMembershipBadges,
  checkAndAwardGroupActivityBadges,
  checkAndAwardInvitationBadges,
} from '@/lib/badge-utils';
import type { AwardedBadge } from '@/types/domain';

export async function POST() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const awardedBadges: AwardedBadge[] = [];
    const groupCreationBadges = await checkAndAwardGroupCreationBadges(userId);
    const groupMembershipBadges = await checkAndAwardGroupMembershipBadges(userId);
    const groupActivityBadges = await checkAndAwardGroupActivityBadges(userId);
    const invitationBadges = await checkAndAwardInvitationBadges(userId);

    awardedBadges.push(...groupCreationBadges, ...groupMembershipBadges, ...groupActivityBadges, ...invitationBadges);

    return NextResponse.json({ awardedBadges });
  } catch (error) {
    console.error('Error checking badges:', error);
    return NextResponse.json({ message: 'Failed to check badges.' }, { status: 500 });
  }
}
