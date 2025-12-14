import type { Badge, Prisma } from '@prisma/client';
import type { GoogleBooksApiBook } from './book';

export type UserBookWithBook = Prisma.UserBookGetPayload<{
  include: { book: true };
}>;

export type GroupBookWithGroupSummary = Prisma.GroupBookGetPayload<{
  include: {
    book: true;
    group: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

export type GroupBookWithProgress = Prisma.GroupBookGetPayload<{
  include: {
    book: true;
    readingProgress: {
      select: {
        rating: true;
      };
    };
  };
}>;

export type GroupMemberWithUser = Prisma.GroupMemberGetPayload<{
  include: { user: true };
}>;

export type GroupJoinRequestWithUser = Prisma.GroupJoinRequestGetPayload<{
  include: { user: true };
}>;

export type GroupDetailsEntity = Prisma.GroupGetPayload<{
  include: {
    members: {
      include: { user: true };
    };
    books: {
      include: {
        book: true;
        readingProgress: {
          select: { rating: true };
        };
      };
    };
    joinRequests: {
      include: { user: true };
    };
  };
}>;

export type GroupBookWithAverageRating = GroupBookWithProgress & {
  averageRating: number | null;
  voterCount?: number;
};

export type GroupDetails = Omit<GroupDetailsEntity, 'books'> & {
  books: GroupBookWithAverageRating[];
  memberCount: number;
  adminCount: number;
};

export type GroupSuggestionWithVotes = Prisma.GroupBookGetPayload<{
  include: {
    book: true;
    pollOptions: {
      include: {
        votes: true;
      };
    };
  };
}> & { voteCount: number };

export type ReadingActivityResponse = {
  groupBooks: GroupBookWithGroupSummary[];
  personalBooks: UserBookWithBook[];
};

export type GoogleBookSearchResult = GoogleBooksApiBook;

export interface BookSelectionPayload {
  googleBooksId: string;
  title: string;
  author: string;
  coverUrl?: string;
  description?: string;
  pageCount?: number;
  publishedDate?: string;
  publisher?: string;
  genre?: string;
}

export type AwardedBadge = Badge;

export interface ApiErrorResponse {
  message: string;
  error?: string;
}

export interface ReadingActivityPoint {
  finished_at: string | null;
  books_count: number;
}
