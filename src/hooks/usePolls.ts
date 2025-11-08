import { useQuery } from '@tanstack/react-query';
import { Poll, PollOption, Vote, Book, GroupBook } from "@prisma/client";

interface PollWithDetails extends Poll {
  options: (PollOption & { groupBook: { book: Book }, votes: Vote[] })[];
}

export function usePolls(groupId: string, enabled = true) {
  return useQuery<PollWithDetails[]>({
    queryKey: ['polls', groupId],
    queryFn: async () => {
      const response = await fetch(`/api/groups/${groupId}/polls`);
      if (!response.ok) {
        throw new Error('Failed to fetch polls');
      }
      return response.json();
    },
    enabled: enabled && !!groupId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refresh toutes les 30s
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}
