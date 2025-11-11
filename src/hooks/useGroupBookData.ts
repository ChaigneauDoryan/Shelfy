import { useQuery } from '@tanstack/react-query';
import { Book, GroupBook } from "@prisma/client";

interface Comment {
  id: string;
  userId: string;
  pageNumber: number;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface GroupBookData {
  progress: { currentPage: number; rating?: number | null } | null;
  comments: Comment[];
}

export function useGroupBookData(groupId: string, groupBookId: string, enabled = true) {
  return useQuery<GroupBookData>({
    queryKey: ['groupBookData', groupId, groupBookId],
    queryFn: async () => {
      const [progressRes, commentsRes] = await Promise.all([
        fetch(`/api/groups/${groupId}/books/${groupBookId}/progress`),
        fetch(`/api/groups/${groupId}/books/${groupBookId}/comments`),
      ]);

      if (!progressRes.ok) {
        const errorText = await progressRes.text();
        console.error('Failed to fetch progress data:', progressRes.status, errorText);
        throw new Error('Failed to fetch progress data');
      }
      if (!commentsRes.ok) {
        const errorText = await commentsRes.text();
        console.error('Failed to fetch comments data:', commentsRes.status, errorText);
        throw new Error('Failed to fetch comments data');
      }

      const progressData = await progressRes.json();
      const commentsData = await commentsRes.json();

      return {
        progress: progressData.progress,
        comments: commentsData.comments,
      };
    },
    enabled: enabled && !!groupId && !!groupBookId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refresh toutes les 30s
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}
