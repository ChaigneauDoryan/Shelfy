
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth'; // Helper à créer
import { leaveGroup } from '@/lib/group-utils';

interface RouteParams {
  groupId: string;
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ groupId: string; }> }) {
  const { groupId } = await context.params;
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const result = await leaveGroup(groupId, userId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error leaving group:', error);
    let errorMessage = 'Failed to leave group.';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message === "Vous n'êtes pas membre de ce groupe ou le groupe n'existe pas.") {
        errorMessage = error.message;
        statusCode = 404;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ message: errorMessage }, { status: statusCode });
  }
}
