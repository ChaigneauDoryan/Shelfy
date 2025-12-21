import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PREMIUM_PLAN_ID } from '@/lib/subscription-constants';

const BILLING_DISABLED = process.env.NEXT_PUBLIC_ENABLE_PREMIUM !== 'true';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripeClient = !BILLING_DISABLED && stripeSecret ? new Stripe(stripeSecret) : null;

export async function POST(req: Request) {
  if (BILLING_DISABLED) {
    return NextResponse.json(
      { message: 'La facturation Stripe est désactivée pendant notre bêta gratuite.' },
      { status: 501 }
    );
  }

  if (!stripeClient) {
    return NextResponse.json({ message: 'Stripe is not configured.' }, { status: 500 });
  }

  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { priceId } = await req.json(); // L'ID du prix Stripe pour le plan Premium

  if (!priceId) {
    return NextResponse.json({ message: 'Price ID is required.' }, { status: 400 });
  }

  try {
    // Récupérer l'utilisateur de la base de données
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    let stripeCustomerId = user.stripeCustomerId;

    // Si l'utilisateur n'a pas encore de customer ID Stripe, en créer un
    if (!stripeCustomerId) {
      const customer = await stripeClient.customers.create({
        email: user.email || undefined,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;

      // Mettre à jour l'utilisateur dans la base de données avec le nouveau customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: stripeCustomerId },
      });
    }

    // Créer une session Checkout
    const nextAuthUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

    const stripeSession = await stripeClient.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${nextAuthUrl}/subscription?success=true`,
      cancel_url: `${nextAuthUrl}/subscription?canceled=true`,
      metadata: {
        userId: userId,
        planId: PREMIUM_PLAN_ID,
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ message: 'Failed to create checkout session.' }, { status: 500 });
  }
}
