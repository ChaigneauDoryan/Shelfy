import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { leaveGroup } from '@/lib/group-utils';

export async function DELETE(request: Request, { params }: { params: { groupId: string } }) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId } = params;

  try {
    const result = await leaveGroup(groupId, userId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error leaving group:', error.message);
    if (error.message === 'Vous n\'êtes pas membre de ce groupe ou le groupe n\'existe pas.') {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to leave group.' }, { status: 500 });
  }
}
