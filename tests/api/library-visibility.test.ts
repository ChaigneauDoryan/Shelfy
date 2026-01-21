import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedGetSession = vi.fn();
vi.mock('@/lib/auth', () => ({
  getSession: () => mockedGetSession(),
}));

const mockedUserFindUnique = vi.fn();
const mockedUserUpdate = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockedUserFindUnique(...args),
      update: (...args: unknown[]) => mockedUserUpdate(...args),
    },
  },
}));

import { GET, PATCH } from '@/app/api/library/visibility/route';

const createRequest = (body?: Record<string, unknown>) =>
  new Request('https://example.com/api/library/visibility', {
    method: 'PATCH',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

beforeEach(() => {
  mockedGetSession.mockReset();
  mockedUserFindUnique.mockReset();
  mockedUserUpdate.mockReset();
});

describe('/api/library/visibility', () => {
  it('should respond 401 when user is not authenticated', async () => {
    mockedGetSession.mockResolvedValue(null);

    const response = await GET(new Request('https://example.com/api/library/visibility'));
    expect(response.status).toBe(401);
  });

  it('should return the current library visibility when user is authenticated', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedUserFindUnique.mockResolvedValue({ library_is_public: false });

    const response = await GET(new Request('https://example.com/api/library/visibility'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ isPublic: false });
  });

  it('should respond 401 when updating visibility without authentication', async () => {
    mockedGetSession.mockResolvedValue(null);

    const response = await PATCH(createRequest({ isPublic: true }));
    expect(response.status).toBe(401);
  });

  it('should respond 400 when payload is invalid', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'user-1' } });

    const response = await PATCH(createRequest({ isPublic: 'oui' }));
    expect(response.status).toBe(400);
  });

  it('should update library visibility when payload is valid', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedUserUpdate.mockResolvedValue({ library_is_public: true });

    const response = await PATCH(createRequest({ isPublic: true }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ isPublic: true });
    expect(mockedUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { library_is_public: true },
      select: { library_is_public: true },
    });
  });
});
