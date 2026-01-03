import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockedGetSession = vi.fn();
vi.mock('@/lib/auth', () => ({
  getSession: () => mockedGetSession(),
}));

const mockedGetUserBookReview = vi.fn();
const mockedUpsertUserBookReview = vi.fn();
vi.mock('@/lib/book-utils', () => ({
  getUserBookReview: (userBookId: string, userId: string) =>
    mockedGetUserBookReview(userBookId, userId),
  upsertUserBookReview: (userBookId: string, userId: string, rating: number, commentText: string) =>
    mockedUpsertUserBookReview(userBookId, userId, rating, commentText),
}));

import { GET, PATCH } from '@/app/api/library/[userBookId]/review/route';

const createContext = (userBookId = 'ub-1') => ({
  params: Promise.resolve({ userBookId }),
});

beforeEach(() => {
  mockedGetSession.mockReset();
  mockedGetUserBookReview.mockReset();
  mockedUpsertUserBookReview.mockReset();
});

describe('/api/library/[userBookId]/review', () => {
  it('returns 401 when the user is not authenticated', async () => {
    mockedGetSession.mockResolvedValue(null);
    const response = await GET(new Request('https://example.com'), createContext());
    expect(response.status).toBe(401);
  });

  it('returns the review when it exists', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetUserBookReview.mockResolvedValue({
      id: 'rev-1',
      rating: 4,
      comment_text: 'Parfait',
      updated_at: '2024-01-01T00:00:00.000Z',
    });

    const response = await GET(new Request('https://example.com'), createContext());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.review).toHaveProperty('rating', 4);
  });

  it('returns 400 when the payload is invalid', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    const response = await PATCH(
      new Request('https://example.com', { method: 'PATCH', body: JSON.stringify({ rating: 6, comment_text: '' }), headers: { 'Content-Type': 'application/json' } }),
      createContext()
    );
    expect(response.status).toBe(400);
  });

  it('upserts the review when payload is valid', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedUpsertUserBookReview.mockResolvedValue({
      id: 'rev-1',
      rating: 5,
      comment_text: 'Excellent',
      updated_at: '2024-01-01T00:00:00.000Z',
    });

    const response = await PATCH(
      new Request('https://example.com', { method: 'PATCH', body: JSON.stringify({ rating: 5, comment_text: 'Excellent' }), headers: { 'Content-Type': 'application/json' } }),
      createContext()
    );

    expect(mockedUpsertUserBookReview).toHaveBeenCalledWith('ub-1', 'user-1', 5, 'Excellent');
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.review).toHaveProperty('rating', 5);
  });
});
