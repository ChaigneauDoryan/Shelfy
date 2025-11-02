
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request, { params }: { params: { groupId: string, suggestionId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId, suggestionId } = params;

  try {
    const member = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });

    if (!member) {
      return NextResponse.json({ message: 'Forbidden: You are not a member of this group.' }, { status: 403 });
    }

    const suggestion = await prisma.groupBook.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion || suggestion.group_id !== groupId || suggestion.status !== 'SUGGESTED') {
      return NextResponse.json({ message: 'Suggestion not found or not a valid suggestion.' }, { status: 404 });
    }

    if (suggestion.suggested_by_id !== userId) {
      return NextResponse.json({ message: 'Forbidden: You can only delete your own suggestions.' }, { status: 403 });
    }

    await prisma.groupBook.delete({
      where: { id: suggestionId },
    });

    return NextResponse.json({ message: 'Suggestion successfully deleted.' });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    return NextResponse.json({ message: 'Failed to delete suggestion.' }, { status: 500 });
  }
}
