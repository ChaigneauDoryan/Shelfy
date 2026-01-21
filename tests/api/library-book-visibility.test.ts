import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedGetSession = vi.fn();
vi.mock('@/lib/auth', () => ({
  getSession: () => mockedGetSession(),
}));

const mockedUserFindUnique = vi.fn();
const mockedUserBookUpdateMany = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockedUserFindUnique(...args),
    },
    userBook: {
      updateMany: (...args: unknown[]) => mockedUserBookUpdateMany(...args),
    },
  },
}));

import { PATCH } from '@/app/api/library/[userBookId]/visibility/route';

const createRequest = (body?: Record<string, unknown>) =>
  new Request('https://example.com/api/library/book-1/visibility', {
    method: 'PATCH',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

beforeEach(() => {
  mockedGetSession.mockReset();
  mockedUserFindUnique.mockReset();
  mockedUserBookUpdateMany.mockReset();
});

describe('/api/library/[userBookId]/visibility', () => {
  it('should respond 401 when user is not authenticated', async () => {
    mockedGetSession.mockResolvedValue(null);

    const response = await PATCH(createRequest({ isPublic: true }), {
      params: Promise.resolve({ userBookId: 'book-1' }),
    });
    expect(response.status).toBe(401);
  });

  it('should respond 400 when payload is invalid', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'user-1' } });

    const response = await PATCH(createRequest({ isPublic: 'non' }), {
      params: Promise.resolve({ userBookId: 'book-1' }),
    });
    expect(response.status).toBe(400);
  });

  it('should respond 400 when library is public', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedUserFindUnique.mockResolvedValue({ library_is_public: true });

    const response = await PATCH(createRequest({ isPublic: false }), {
      params: Promise.resolve({ userBookId: 'book-1' }),
    });
    expect(response.status).toBe(400);
  });

  it('should respond 404 when the book does not belong to the user', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedUserFindUnique.mockResolvedValue({ library_is_public: false });
    mockedUserBookUpdateMany.mockResolvedValue({ count: 0 });

    const response = await PATCH(createRequest({ isPublic: true }), {
      params: Promise.resolve({ userBookId: 'book-1' }),
    });
    expect(response.status).toBe(404);
  });

  it('should update book visibility when library is private', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedUserFindUnique.mockResolvedValue({ library_is_public: false });
    mockedUserBookUpdateMany.mockResolvedValue({ count: 1 });

    const response = await PATCH(createRequest({ isPublic: true }), {
      params: Promise.resolve({ userBookId: 'book-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ id: 'book-1', isPublic: true });
    expect(mockedUserBookUpdateMany).toHaveBeenCalledWith({
      where: { id: 'book-1', user_id: 'user-1' },
      data: { is_public: true },
    });
  });
});
