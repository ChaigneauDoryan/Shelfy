import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { regenerateInvitationCode } from '@/lib/group-utils';

export async function PATCH(request: NextRequest, context: any) {
  const supabase = await createClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId } = context.params;

  try {
    const result = await regenerateInvitationCode(supabase, groupId, userId);
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