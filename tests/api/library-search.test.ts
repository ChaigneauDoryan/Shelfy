import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedGetSession = vi.fn();
vi.mock('@/lib/auth', () => ({
  getSession: () => mockedGetSession(),
}));

const mockedFindMany = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    userBook: {
      findMany: () => mockedFindMany(),
    },
  },
}));

import { GET } from '@/app/api/library/search/route';

const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();

const createRequest = (params: Record<string, string> = {}) =>
  new Request(`https://example.com/api/library/search?${new URLSearchParams(params)}`);

beforeEach(() => {
  fetchMock.mockReset();
  mockedFindMany.mockReset();
  mockedGetSession.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  process.env.GOOGLE_BOOKS_API_KEY = 'test-key';
});

describe('/api/library/search', () => {
  it('should respond 401 when the user is not authenticated', async () => {
    mockedGetSession.mockResolvedValue(null);

    const response = await GET(createRequest({ title: 'test' }));
    expect(response.status).toBe(401);
  });

  it('should respond 400 when no search parameters are provided', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'user-1' } });

    const response = await GET(createRequest());
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toContain('At least one search parameter');
  });

  it('should include langRestrict matching the detected language', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedFindMany.mockResolvedValue([]);

    const mockData = { totalItems: 1, items: [] };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(mockData), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const response = await GET(createRequest({ title: 'Le monde enchanté' }));
    await response.json();

    const fetchCall = fetchMock.mock.calls[0][0];
    const calledUrl = fetchCall instanceof URL ? fetchCall : new URL(fetchCall as string);
    expect(calledUrl.searchParams.get('langRestrict')).toBe('fr');
  });

  it('should remove duplicates and user-owned google books from the response', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedFindMany.mockResolvedValue([
      { book: { google_books_id: 'existing-book' } },
    ]);

    const duplicateComplete = {
      id: 'duplicate-complete',
      volumeInfo: {
        title: 'La recherche',
        authors: ['Auteur'],
        description: 'Complet',
        publisher: 'Editions Test',
        language: 'fr',
        imageLinks: { thumbnail: 'https://example.com/cover.jpg' },
      },
    };

    const duplicateIncomplete = {
      id: 'duplicate-incomplete',
      volumeInfo: {
        title: 'La recherche',
        authors: ['Auteur'],
        description: undefined,
        publisher: 'Editions Test',
        language: 'fr',
        imageLinks: { thumbnail: 'https://example.com/cover.jpg' },
      },
    };

    const existingBook = {
      id: 'existing-book',
      volumeInfo: {
        title: 'Livre déjà présent',
        authors: ['Auteur'],
        description: 'Déjà en bibliothèque',
        publisher: 'Editions Test',
        language: 'fr',
        imageLinks: { thumbnail: 'https://example.com/cover.jpg' },
      },
    };

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ totalItems: 3, items: [duplicateComplete, duplicateIncomplete, existingBook] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const response = await GET(createRequest({ title: 'La recherche' }));
    const body = await response.json();

    expect(body.items).toHaveLength(1);
    expect(body.items[0].id).toBe('duplicate-complete');
  });
});
