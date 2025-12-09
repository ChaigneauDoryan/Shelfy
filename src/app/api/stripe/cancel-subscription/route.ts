import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Récupérer l'abonnement de l'utilisateur depuis la base de données
    const userSubscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        planId: 'premium',
        status: 'active',
      },
    });

    if (!userSubscription || !userSubscription.stripeSubscriptionId) {
      return NextResponse.json({ message: 'No active subscription found to cancel.' }, { status: 400 });
    }

    // Annuler l'abonnement à la fin de la période de facturation en cours
    const canceledSubscription = await stripe.subscriptions.update(
      userSubscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    // Mettre à jour le statut dans notre base de données pour refléter l'annulation programmée
    // Note : Le webhook 'customer.subscription.updated' pourrait aussi gérer cela.
    // Pour une réactivité immédiate de l'UI, on peut le faire ici.
    await prisma.subscription.update({
      where: {
        id: userSubscription.id,
      },
      data: {
        status: 'canceled_at_period_end',
        endDate: new Date(canceledSubscription.cancel_at * 1000), // Enregistrer la date de fin
      },
    });

    const periodEndDate = new Date(canceledSubscription.cancel_at * 1000);
    const formattedDate = periodEndDate.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return NextResponse.json({ message: `Votre abonnement sera annulé le ${formattedDate}.`, periodEndDate: formattedDate });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json({ message: 'Failed to cancel subscription.' }, { status: 500 });
  }
}
