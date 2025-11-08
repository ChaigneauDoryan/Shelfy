import { useQuery } from '@tanstack/react-query';
import { Group, User, Book, GroupBook, GroupMember, GroupJoinRequest } from "@prisma/client";

interface GroupDetails extends Group {
  members: (GroupMember & { user: User })[];
  books: (GroupBook & { book: Book })[];
  joinRequests: (GroupJoinRequest & { user: User })[];
  memberCount: number;
  adminCount: number;
}

export function useGroupDetails(groupId: string, enabled = true) {
  return useQuery<GroupDetails>({
    queryKey: ['groupDetails', groupId],
    queryFn: async () => {
      const response = await fetch(`/api/groups/${groupId}/details`);
      if (!response.ok) {
        throw new Error('Failed to fetch group details');
      }
      return response.json();
    },
    enabled: enabled && !!groupId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refresh toutes les 30s
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}
