import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, context: { params: Promise<{ groupId: string; memberId: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { groupId, memberId } = await context.params;
  const requesterId = session.user.id;

  const requesterMembership = await prisma.groupMember.findUnique({
    where: { group_id_user_id: { group_id: groupId, user_id: requesterId } },
  });

  if (!requesterMembership) {
    return NextResponse.json({ message: 'Forbidden: Vous n\'êtes pas membre de ce groupe.' }, { status: 403 });
  }

  const targetMembership = await prisma.groupMember.findUnique({
    where: { group_id_user_id: { group_id: groupId, user_id: memberId } },
  });

  if (!targetMembership) {
    return NextResponse.json({ message: 'Member not found in group.' }, { status: 404 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: memberId },
    select: { library_is_public: true },
  });

  if (!targetUser) {
    return NextResponse.json({ message: 'User not found.' }, { status: 404 });
  }

  const shouldFilter = !targetUser.library_is_public && memberId !== requesterId;

  const books = await prisma.userBook.findMany({
    where: {
      user_id: memberId,
      ...(shouldFilter ? { is_public: true } : {}),
    },
    include: {
      book: true,
      review: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  return NextResponse.json(books);
}
