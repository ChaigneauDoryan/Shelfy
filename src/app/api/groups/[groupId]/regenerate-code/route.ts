
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth'; // Helper à créer
import { regenerateInvitationCode } from '@/lib/group-utils';

interface RouteParams {
  groupId: string;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const resolvedParams = await context.params;
  const { groupId } = resolvedParams;

  try {
    const result = await regenerateInvitationCode(groupId, userId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error regenerating invitation code:', error);
    let errorMessage = 'Failed to regenerate invitation code.';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes('Unauthorized')) {
        statusCode = 403;
      }
    }
    return NextResponse.json({ message: errorMessage }, { status: statusCode });
  }
}
