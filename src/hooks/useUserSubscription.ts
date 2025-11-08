import { useQuery } from '@tanstack/react-query';
import { Subscription } from '@prisma/client';

export function useUserSubscription(userId: string | undefined, enabled = true) {
  return useQuery<Subscription>({
    queryKey: ['userSubscription', userId],
    queryFn: async () => {
      if (!userId) {
        // Retourner un abonnement gratuit par défaut si l'utilisateur n'est pas connecté
        return {
          id: 'default-free',
          userId: 'guest',
          planId: 'free',
          status: 'active',
          startDate: new Date(),
          endDate: null,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
        } as Subscription;
      }
      const response = await fetch('/api/user/subscription');
      if (!response.ok) {
        throw new Error('Failed to fetch user subscription');
      }
      return response.json();
    },
    enabled: enabled, // Le hook est toujours activé pour les non-connectés aussi
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
