import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedGetSession = vi.fn();
vi.mock('@/lib/auth', () => ({
  getSession: () => mockedGetSession(),
}));

const mockGetReadingStatusId = vi.fn();
vi.mock('@/lib/book-utils', () => ({
  getReadingStatusId: (statusName: string) => mockGetReadingStatusId(statusName),
}));

import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/user-books/[userBookId]/comments/route';

const mockUserBookFind = vi.fn();
const mockTransaction = vi.fn();

(prisma.userBook.findFirst as unknown) = mockUserBookFind;
(prisma.$transaction as unknown) = mockTransaction;

const createContext = (userBookId = 'ub-1') => ({
  params: Promise.resolve({ userBookId }),
});

const FINISHED_COMMENT_ERROR_MESSAGE = 'Impossible d’ajouter un commentaire sur un livre terminé.';

beforeEach(() => {
  mockedGetSession.mockReset();
  mockGetReadingStatusId.mockReset().mockImplementation((statusName: string) => {
    if (statusName === 'finished') {
      return Promise.resolve(3);
    }
    return Promise.resolve(2);
  });
  mockUserBookFind.mockReset();
  mockTransaction.mockReset();
});

describe('/api/user-books/[userBookId]/comments', () => {
  it('returns 401 when unauthenticated', async () => {
    mockedGetSession.mockResolvedValue(null);

    const response = await POST(
      new Request('https://example.com', { method: 'POST', body: JSON.stringify({ page_number: 1, comment_text: 'ok' }), headers: { 'Content-Type': 'application/json' } }),
      createContext()
    );

    expect(response.status).toBe(401);
  });

  it('returns 403 when the book is finished', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockUserBookFind.mockResolvedValue({
      id: 'ub-1',
      user_id: 'user-1',
      status_id: 3,
      _count: { comments: 1 },
    });

    const response = await POST(
      new Request('https://example.com', { method: 'POST', body: JSON.stringify({ page_number: 1, comment_text: 'ok' }), headers: { 'Content-Type': 'application/json' } }),
      createContext()
    );

    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.error).toBe(FINISHED_COMMENT_ERROR_MESSAGE);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('allows adding a comment when the book is not finished', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockUserBookFind.mockResolvedValue({
      id: 'ub-1',
      user_id: 'user-1',
      status_id: 2,
      _count: { comments: 0 },
    });

    const createdComment = { id: 'c-1', page_number: 5, comment_text: 'Great' };
    const mockCreate = vi.fn().mockResolvedValue(createdComment);
    const mockUpdate = vi.fn().mockResolvedValue({});
    const txMock = {
      userBookComment: { create: mockCreate },
      userBook: { update: mockUpdate },
    };

    mockTransaction.mockImplementation(async (transactionCallback) => transactionCallback(txMock as any));

    const response = await POST(
      new Request('https://example.com', { method: 'POST', body: JSON.stringify({ page_number: 5, comment_text: 'Great' }), headers: { 'Content-Type': 'application/json' } }),
      createContext()
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual(createdComment);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        user_book_id: 'ub-1',
        page_number: 5,
        comment_text: 'Great',
      },
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'ub-1' },
      data: {
        current_page: 5,
        status_id: 2,
      },
    });
  });
});
