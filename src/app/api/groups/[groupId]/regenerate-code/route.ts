import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { regenerateInvitationCode } from '@/lib/group-utils';

export async function PATCH(request: Request, { params }: { params: { groupId: string } }) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { groupId } = params;

  try {
    const result = await regenerateInvitationCode(groupId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error regenerating invitation code:', error.message);
    return NextResponse.json({ message: 'Failed to regenerate invitation code.' }, { status: 500 });
  }
}
