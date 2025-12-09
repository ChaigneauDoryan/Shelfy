import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { PREMIUM_PLAN_ID, FREE_PLAN_ID } from '@/lib/subscription-utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ message: 'No stripe-signature header found.' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ message: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const eventType = event.type;

  try {
    switch (eventType) {
      case 'checkout.session.completed':
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const userId = checkoutSession.metadata?.userId;
        const planId = checkoutSession.metadata?.planId;
        const stripeCustomerId = checkoutSession.customer as string;
        const stripeSubscriptionId = checkoutSession.subscription as string;

        if (!userId || !planId || !stripeCustomerId || !stripeSubscriptionId) {
          console.error('Missing metadata in checkout session:', checkoutSession);
          return NextResponse.json({ message: 'Missing metadata in checkout session.' }, { status: 400 });
        }

        // Utiliser une transaction pour assurer la cohérence des données
        await prisma.$transaction(async (tx) => {
          // 1. Désactiver tous les abonnements existants pour cet utilisateur
          await tx.subscription.updateMany({
            where: {
              userId: userId,
            },
            data: {
              status: 'canceled',
              endDate: new Date(),
            },
          });

          // 2. Créer le nouvel abonnement Premium
          await tx.subscription.create({
            data: {
              userId: userId,
              planId: PREMIUM_PLAN_ID,
              status: 'active',
              startDate: new Date(),
              stripeCustomerId: stripeCustomerId,
              stripeSubscriptionId: stripeSubscriptionId,
              stripePriceId: checkoutSession.line_items?.data[0]?.price?.id,
            },
          });

          // 3. Mettre à jour l'utilisateur avec son ID client Stripe
          await tx.user.update({
            where: { id: userId },
            data: { stripeCustomerId: stripeCustomerId },
          });
        });

        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        // Mettre à jour le statut de l'abonnement dans votre base de données
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscriptionId },
          data: { status: 'active' },
        });
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        const failedSubscriptionId = failedInvoice.subscription as string;

        // Mettre à jour le statut de l'abonnement comme échoué
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: failedSubscriptionId },
          data: { status: 'past_due' }, // Ou 'canceled' selon votre logique
        });
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        const deletedSubscriptionId = deletedSubscription.id;

        // Trouver l'utilisateur associé
        const subscription = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: deletedSubscriptionId },
          select: { userId: true },
        });

        if (subscription?.userId) {
          await prisma.$transaction([
            // Supprimer l'ancien abonnement premium
            prisma.subscription.deleteMany({
              where: {
                stripeSubscriptionId: deletedSubscriptionId,
              },
            }),
            // Créer le nouvel abonnement gratuit
            prisma.subscription.create({
              data: {
                userId: subscription.userId,
                planId: 'free',
                status: 'active',
              },
            }),
          ]);

          // Logique d'archivage des groupes
          const userId = subscription.userId;
          const FREE_PLAN_GROUP_LIMIT = 2;

          const userGroups = await prisma.group.findMany({
            where: {
              created_by_id: userId,
              is_archived: false,
            },
            orderBy: {
              created_at: 'asc',
            },
          });

          if (userGroups.length > FREE_PLAN_GROUP_LIMIT) {
            const groupsToArchive = userGroups.slice(0, userGroups.length - FREE_PLAN_GROUP_LIMIT);
            const groupIdsToArchive = groupsToArchive.map(group => group.id);

            await prisma.group.updateMany({
              where: {
                id: { in: groupIdsToArchive },
              },
              data: {
                is_archived: true,
              },
            });
          }
        }
        break;

      // Gérer d'autres types d'événements si nécessaire
      default:
        console.log(`Unhandled event type ${eventType}`);
    }

    return NextResponse.json({ message: 'Webhook received' }, { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ message: 'Error processing webhook.' }, { status: 500 });
  }
}
