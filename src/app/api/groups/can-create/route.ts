import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ canCreate: false, message: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ canCreate: true });
}
