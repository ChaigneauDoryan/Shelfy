import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
const BILLING_DISABLED = process.env.NEXT_PUBLIC_ENABLE_PREMIUM !== 'true';

export async function POST(_request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (BILLING_DISABLED) {
    return NextResponse.json(
      { message: 'Le changement de plan est désactivé pendant la bêta gratuite.' },
      { status: 501 }
    );
  }

  return NextResponse.json(
    { message: 'Plan switching is temporarily unavailable.' },
    { status: 501 }
  );
}
