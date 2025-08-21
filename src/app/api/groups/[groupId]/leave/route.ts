import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { leaveGroup } from '@/lib/group-utils';

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const supabase = await createClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Correction: passage du client supabase comme premier argument
    const result = await leaveGroup(supabase, groupId, userId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error leaving group:', error);
    let errorMessage = 'Failed to leave group.';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message === 'Vous n\'êtes pas membre de ce groupe ou le groupe n\'existe pas.') {
        errorMessage = error.message;
        statusCode = 404;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ message: errorMessage }, { status: statusCode });
  }
}