import { useQuery } from '@tanstack/react-query';
import { Book, Group, GroupBook } from "@prisma/client";

interface GroupBookWithDetails extends GroupBook {
  book: Book;
  group: {
    id: string;
    name: string;
  };
}

interface ReadingActivityData {
  groupBooks: GroupBookWithDetails[];
  personalBooks: any[];
}

export function useReadingActivity(enabled = true) {
  return useQuery<ReadingActivityData>({
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
