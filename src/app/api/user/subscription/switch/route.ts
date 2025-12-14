import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { FREE_PLAN_ID, PREMIUM_PLAN_ID } from '@/lib/subscription-constants';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { newPlanId } = await request.json();

  if (![FREE_PLAN_ID, PREMIUM_PLAN_ID].includes(newPlanId)) {
    return NextResponse.json({ message: 'Invalid plan ID' }, { status: 400 });
  }

  try {
    // Annuler l'abonnement actuel (si premium)
    await prisma.subscription.updateMany({
      where: {
        userId: userId,
        status: 'active',
        planId: { not: newPlanId }, // Ne pas annuler si c'est le même plan
      },
      data: {
        status: 'canceled',
        endDate: new Date(),
      },
    });

    // Créer ou réactiver le nouvel abonnement
    const updatedSubscription = await prisma.subscription.upsert({
      where: {
        userId_planId: {
          userId: userId,
          planId: newPlanId,
        },
      },
      update: {
        status: 'active',
        startDate: new Date(),
        endDate: null,
      },
      create: {
        userId: userId,
        planId: newPlanId,
        status: 'active',
        startDate: new Date(),
      },
    });

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error('Error switching subscription:', error);
    return NextResponse.json({ message: 'Failed to switch subscription' }, { status: 500 });
  }
}
