import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserSubscription } from '@/lib/subscription-utils';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const subscription = await getUserSubscription(session.user.id);
    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return NextResponse.json({ message: 'Failed to fetch user subscription' }, { status: 500 });
  }
}
