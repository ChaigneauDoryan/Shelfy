import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripeClient = stripeSecret ? new Stripe(stripeSecret) : null;

export async function POST() {
  if (!stripeClient) {
    return NextResponse.json({ message: 'Stripe is not configured.' }, { status: 500 });
  }

  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.stripeCustomerId) {
      return NextResponse.json({ message: 'Stripe customer not found for this user.' }, { status: 404 });
    }

    const nextAuthUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

    const portalSession = await stripeClient.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${nextAuthUrl}/subscription`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json({ message: 'Failed to create portal session.' }, { status: 500 });
  }
}
