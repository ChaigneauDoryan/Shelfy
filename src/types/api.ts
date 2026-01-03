import type { AwardedBadge, UserBookReviewSummary, UserBookWithBook } from './domain';

export interface UpdateStatusResponse {
  updatedBook: UserBookWithBook;
  awardedBadges: AwardedBadge[];
}

export interface UserBookCommentsRouteParams {
  userBookId: string;
}

export interface UserBookCommentsPostRequestBody {
  page_number: number;
  comment_text: string;
}

export interface SetCurrentReadingRouteParams {
  groupId: string;
  pollId: string;
}

export interface SetCurrentReadingPostRequestBody {
  readingEndDate?: string | null;
}

export interface GroupPollsRouteParams {
  groupId: string;
}

export interface RegenerateCodeRouteParams {
  groupId: string;
}

export interface RequestJoinRouteParams {
  groupId: string;
}

export interface GroupRouteParams {
  groupId: string;
}

export interface GroupPatchRequestBody {
  name?: string;
  description?: string;
  avatar_url?: string;
}

export interface SuggestionRouteParams {
  groupId: string;
  suggestionId: string;
}

export interface GroupSuggestionsRouteParams {
  groupId: string;
}

export interface UserBookStatusRouteParams {
  userBookId: string;
}

export interface UserBookReviewRouteParams {
  userBookId: string;
}

export interface UserBookReviewPatchRequestBody {
  rating: number;
  comment_text: string;
}

export interface UserBookReviewResponse {
  review: UserBookReviewSummary | null;
}

export interface GroupBookCommentsRouteParams {
  groupId: string;
  groupBookId: string;
}

export interface GroupBookCommentsPostRequestBody {
  pageNumber: number;
  content: string;
}

export interface FinishGroupBookRouteParams {
  groupId: string;
  groupBookId: string;
}

export interface GroupBookProgressRouteParams {
  groupId: string;
  groupBookId: string;
}

export interface GroupBookProgressPatchRequestBody {
  currentPage: number;
}

export interface GroupBookRouteParams {
  groupId: string;
  groupBookId: string;
}

export interface GroupBookPatchRequestBody {
  reading_end_date?: string | null;
  rating?: number;
}

export interface CurrentlyReadingRouteParams {
  groupId: string;
}

export interface CurrentlyReadingPostRequestBody {
  bookId: string;
}

export interface GroupDetailsRouteParams {
  groupId: string;
}

export interface JoinRequestRouteParams {
  groupId: string;
  requestId: string;
}

export interface JoinRequestPutRequestBody {
  action: 'accept' | 'decline';
}

export interface GroupJoinRequestsRouteParams {
  groupId: string;
}

export interface LeaveGroupRouteParams {
  groupId: string;
}

export interface PromoteMemberRouteParams {
  groupId: string;
  memberId: string;
}

export interface GroupMemberRouteParams {
  groupId: string;
  memberId: string;
}
