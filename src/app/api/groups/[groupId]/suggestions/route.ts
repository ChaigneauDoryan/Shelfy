
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    if (!member) {
      return NextResponse.json({ message: 'Forbidden: You are not a member of this group.' }, { status: 403 });
    }

    await prisma.groupBook.create({
      data: {
        group_id: groupId,
        book_id: bookId,
        status: 'SUGGESTED',
      },
    });

    return NextResponse.json({ message: 'Successfully suggested a book.' });
  } catch (error) {
    console.error('Error suggesting a book:', error);
    return NextResponse.json({ message: 'Failed to suggest a book.' }, { status: 500 });
  }
}
