import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { canCreateMoreGroups } from '@/lib/subscription-utils';

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ canCreate: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const canCreate = await canCreateMoreGroups(session.user.id);
    return NextResponse.json({ canCreate });
  } catch (error) {
    console.error('Error checking group creation limit:', error);
    return NextResponse.json({ canCreate: false, message: 'Failed to check limit' }, { status: 500 });
  }
}
