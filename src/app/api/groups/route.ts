import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createGroup } from '@/lib/group-utils';

export async function POST(request: Request) {
  const supabase = await createClient(cookies());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const createGroupDto = await request.json();

  try {
    const group = await createGroup(supabase, createGroupDto, userId);
    return NextResponse.json(group);
  } catch (error: any) {
    console.error('Error creating group:', error.message);
    return NextResponse.json({ message: 'Failed to create group.' }, { status: 500 });
  }
}
