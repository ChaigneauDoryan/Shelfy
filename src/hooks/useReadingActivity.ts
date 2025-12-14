import { useQuery } from '@tanstack/react-query';
import type { ReadingActivityResponse } from '@/types/domain';

export function useReadingActivity(enabled = true) {
  return useQuery<ReadingActivityResponse>({
    queryKey: ['readingActivity'],
    queryFn: async () => {
      const response = await fetch('/api/user/reading-activity');
      if (!response.ok) {
        throw new Error('Failed to fetch reading activity');
      }
      return response.json();
    },
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}
