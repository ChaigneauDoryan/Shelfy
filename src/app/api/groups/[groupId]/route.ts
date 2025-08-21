import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { deleteGroup, updateGroup } from '@/lib/group-utils';

export async function DELETE(
  request: Request, 
  { params }: { params: Promise<{ groupId: string }> }
) {
  const supabase = await createClient(cookies());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const { groupId } = await params;

  try {
    await deleteGroup(supabase, groupId, userId);
    return NextResponse.json({ message: 'Groupe supprimé avec succès.' });
  } catch (error: any) {
    console.error('Error deleting group:', error.message);
    return NextResponse.json({ message: error.message }, { status: 403 });
  }
}

export async function PATCH(
  request: Request, 
  { params }: { params: Promise<{ groupId: string }> }
) {
  const supabase = await createClient(cookies());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { groupId } = await params;
  const updateGroupDto = await request.json();

  try {
    const group = await updateGroup(supabase, groupId, updateGroupDto);
    return NextResponse.json(group);
  } catch (error: any) {
    console.error('Error updating group:', error.message);
    return NextResponse.json({ message: 'Failed to update group.' }, { status: 500 });
  }
}