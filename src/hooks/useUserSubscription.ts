import { useMemo } from 'react';

import { buildFreeSubscriptionSnapshot, type SubscriptionSnapshot } from '@/lib/subscription-constants';

type UseUserSubscriptionResult = {
  data: SubscriptionSnapshot;
  isLoading: boolean;
};

export function useUserSubscription(userId?: string, _enabled = true): UseUserSubscriptionResult {
  const snapshot = useMemo(
    () => buildFreeSubscriptionSnapshot(userId ?? 'guest'),
    [userId]
  );

  return {
    data: snapshot,
    isLoading: false,
  };
}
