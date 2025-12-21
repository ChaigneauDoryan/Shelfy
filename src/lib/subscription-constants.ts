export const FREE_PLAN_ID = 'free';
export const PREMIUM_PLAN_ID = 'premium';

export type SubscriptionSnapshot = {
  id: string;
  userId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
};

export const buildFreeSubscriptionSnapshot = (userId = 'guest'): SubscriptionSnapshot => ({
  id: `free-${userId}`,
  userId,
  planId: FREE_PLAN_ID,
  status: 'active',
  startDate: new Date().toISOString(),
  endDate: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  stripePriceId: null,
});
