
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RoleInGroup } from '@prisma/client';

export async function POST(request: Request, { params }: { params: { groupId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId } = params;
  const { bookId } = await request.json();

  if (!bookId) {
    return NextResponse.json({ message: 'Book ID is required.' }, { status: 400 });
  }

  try {
    const member = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });

    if (!member || member.role !== RoleInGroup.ADMIN) {
      return NextResponse.json({ message: 'Forbidden: You are not an admin of this group.' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.groupBook.updateMany({
        where: {
          group_id: groupId,
          status: 'CURRENT',
        },
        data: {
          status: 'FINISHED',
          finished_at: new Date(),
        },
      });

      await tx.groupBook.create({
        data: {
          group_id: groupId,
          book_id: bookId,
          status: 'CURRENT',
        },
      });
    });

    return NextResponse.json({ message: 'Successfully set currently reading book.' });
  } catch (error) {
    console.error('Error setting currently reading book:', error);
    return NextResponse.json({ message: 'Failed to set currently reading book.' }, { status: 500 });
  }
}
