import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedGetSession = vi.fn();
vi.mock('@/lib/auth', () => ({
  getSession: () => mockedGetSession(),
}));

const mockedGroupMemberFindUnique = vi.fn();
const mockedUserFindUnique = vi.fn();
const mockedUserBookFindMany = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    groupMember: {
      findUnique: (...args: unknown[]) => mockedGroupMemberFindUnique(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockedUserFindUnique(...args),
    },
    userBook: {
      findMany: (...args: unknown[]) => mockedUserBookFindMany(...args),
    },
  },
}));

import { GET } from '@/app/api/groups/[groupId]/members/[memberId]/library/route';

beforeEach(() => {
  mockedGetSession.mockReset();
  mockedGroupMemberFindUnique.mockReset();
  mockedUserFindUnique.mockReset();
  mockedUserBookFindMany.mockReset();
});

describe('/api/groups/[groupId]/members/[memberId]/library', () => {
  it('should respond 401 when user is not authenticated', async () => {
    mockedGetSession.mockResolvedValue(null);

    const response = await GET(new Request('https://example.com/api/groups/group-1/members/user-2/library'), {
      params: Promise.resolve({ groupId: 'group-1', memberId: 'user-2' }),
    });
    expect(response.status).toBe(401);
  });

  it('should respond 403 when requester is not a group member', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGroupMemberFindUnique.mockResolvedValue(null);

    const response = await GET(new Request('https://example.com/api/groups/group-1/members/user-2/library'), {
      params: Promise.resolve({ groupId: 'group-1', memberId: 'user-2' }),
    });
    expect(response.status).toBe(403);
  });

  it('should respond 404 when target user is not in the group', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGroupMemberFindUnique
      .mockResolvedValueOnce({ id: 'membership-1', user_id: 'user-1' })
      .mockResolvedValueOnce(null);

    const response = await GET(new Request('https://example.com/api/groups/group-1/members/user-2/library'), {
      params: Promise.resolve({ groupId: 'group-1', memberId: 'user-2' }),
    });
    expect(response.status).toBe(404);
  });

  it('should return all books when target library is public', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGroupMemberFindUnique
      .mockResolvedValueOnce({ id: 'membership-1', user_id: 'user-1' })
      .mockResolvedValueOnce({ id: 'membership-2', user_id: 'user-2' });
    mockedUserFindUnique.mockResolvedValue({ library_is_public: true });
    mockedUserBookFindMany.mockResolvedValue([{ id: 'book-1' }, { id: 'book-2' }]);

    const response = await GET(new Request('https://example.com/api/groups/group-1/members/user-2/library'), {
      params: Promise.resolve({ groupId: 'group-1', memberId: 'user-2' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(mockedUserBookFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: 'user-2' },
      })
    );
  });

  it('should return only public books when target library is private', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGroupMemberFindUnique
      .mockResolvedValueOnce({ id: 'membership-1', user_id: 'user-1' })
      .mockResolvedValueOnce({ id: 'membership-2', user_id: 'user-2' });
    mockedUserFindUnique.mockResolvedValue({ library_is_public: false });
    mockedUserBookFindMany.mockResolvedValue([{ id: 'book-1', is_public: true }]);

    const response = await GET(new Request('https://example.com/api/groups/group-1/members/user-2/library'), {
      params: Promise.resolve({ groupId: 'group-1', memberId: 'user-2' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(mockedUserBookFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: 'user-2', is_public: true },
      })
    );
  });

  it('should return all books when requester is the same user', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'user-2' } });
    mockedGroupMemberFindUnique
      .mockResolvedValueOnce({ id: 'membership-2', user_id: 'user-2' })
      .mockResolvedValueOnce({ id: 'membership-2', user_id: 'user-2' });
    mockedUserFindUnique.mockResolvedValue({ library_is_public: false });
    mockedUserBookFindMany.mockResolvedValue([{ id: 'book-1' }, { id: 'book-2' }]);

    const response = await GET(new Request('https://example.com/api/groups/group-1/members/user-2/library'), {
      params: Promise.resolve({ groupId: 'group-1', memberId: 'user-2' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(mockedUserBookFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: 'user-2' },
      })
    );
  });
});
