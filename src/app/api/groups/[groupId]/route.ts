import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { deleteGroup, updateGroup } from '@/lib/group-utils';

export async function DELETE(request: Request, context: any) {
  const supabase = createClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId } = context.params;

  try {
    await deleteGroup(groupId, userId);
    return NextResponse.json({ message: 'Groupe supprimé avec succès.' });
  } catch (error: any) {
    console.error('Error deleting group:', error.message);
    return NextResponse.json({ message: 'Failed to delete group or not authorized.' }, { status: 403 });
  }
}

export async function PATCH(request: Request, context: any) {
  const supabase = createClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { groupId } = context.params;
  const updateGroupDto = await request.json();

  try {
    const group = await updateGroup(groupId, updateGroupDto);
    return NextResponse.json(group);
  } catch (error: any) {
    console.error('Error updating group:', error.message);
    return NextResponse.json({ message: 'Failed to update group.' }, { status: 500 });
  }
}
