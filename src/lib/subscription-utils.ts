import 'server-only';

import type { Subscription } from '@prisma/client';

import { prisma } from './prisma';
import { FREE_PLAN_ID } from './subscription-constants';

export async function getUserSubscription(userId: string): Promise<Subscription> {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    await tx.subscription.deleteMany({
      where: {
        userId,
        planId: {
          not: FREE_PLAN_ID,
        },
      },
    });

    const stripeIdentifiers = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!stripeIdentifiers) {
      throw new Error(`User ${userId} not found while syncing subscription.`);
    }

    if (stripeIdentifiers.stripeCustomerId || stripeIdentifiers.stripeSubscriptionId) {
      await tx.user.update({
        where: { id: userId },
        data: {
          stripeCustomerId: null,
          stripeSubscriptionId: null,
        },
      });
    }

    const subscription = await tx.subscription.upsert({
      where: {
        userId_planId: {
          userId,
          planId: FREE_PLAN_ID,
        },
      },
      update: {
        status: 'active',
        startDate: now,
        endDate: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripePriceId: null,
      },
      create: {
        userId,
        planId: FREE_PLAN_ID,
        status: 'active',
        startDate: now,
      },
    });

    return subscription;
  });
}

export function isPremium(_: { planId: string } | null) {
  return false;
}

export function isFree(_: { planId: string } | null) {
  return true;
}

export async function canCreateMoreGroups(_userId?: string) {
  return true;
}

export async function canAddMoreMembers(_groupId?: string, _userId?: string) {
  return true;
}

export async function canAddMorePersonalBooks(_userId?: string) {
  return true;
}
