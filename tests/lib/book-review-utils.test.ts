import { describe, expect, vi, beforeEach, it } from 'vitest';

import { prisma } from '@/lib/prisma';
import { getUserBookReview, upsertUserBookReview } from '@/lib/book-utils';

const findFirstMock = vi.fn();
const updateUserBookMock = vi.fn();
const upsertReviewMock = vi.fn();
const findReviewMock = vi.fn();
const readingStatusFindUniqueMock = vi.fn();

prisma.userBook.findFirst = findFirstMock;
prisma.userBook.update = updateUserBookMock;
prisma.userBookReview.upsert = upsertReviewMock;
prisma.userBookReview.findFirst = findReviewMock;
prisma.readingStatus.findUnique = readingStatusFindUniqueMock;

beforeEach(() => {
  findFirstMock.mockReset();
  updateUserBookMock.mockReset();
  upsertReviewMock.mockReset();
  findReviewMock.mockReset();
  readingStatusFindUniqueMock.mockReset().mockResolvedValue({ id: 3 });
});

describe('getUserBookReview', () => {
  it('should return the review when it exists and belongs to the user', async () => {
    const review = { id: 'rev-1', user_book_id: 'ub-1', rating: 4.5, comment_text: 'Super livre', updated_at: new Date().toISOString() };
    findReviewMock.mockResolvedValue(review);

    const result = await getUserBookReview('ub-1', 'user-1');
    expect(result).toBe(review);
    expect(findReviewMock).toHaveBeenCalledWith({
      where: {
        user_book_id: 'ub-1',
        userBook: { user_id: 'user-1' },
      },
    });
  });

  it('should return null when there is no review', async () => {
    findReviewMock.mockResolvedValue(null);
    const result = await getUserBookReview('ub-2', 'user-2');
    expect(result).toBeNull();
  });
});

describe('upsertUserBookReview', () => {
  it('should throw when the user book does not belong to the user', async () => {
    findFirstMock.mockResolvedValue(null);
    await expect(upsertUserBookReview('ub-1', 'user-1', 4, 'Commentaire')).rejects.toThrow('Livre introuvable');
  });

  it('should throw when the book is not finished', async () => {
    findFirstMock.mockResolvedValue({ id: 'ub-1', user_id: 'user-1', status_id: 2 });
    await expect(upsertUserBookReview('ub-1', 'user-1', 3.5, 'Top')).rejects.toThrow('Les livres terminés seulement');
  });

  it('should upsert the review and update the user book rating when valid', async () => {
    findFirstMock.mockResolvedValue({ id: 'ub-1', user_id: 'user-1', status_id: 3 });
    upsertReviewMock.mockResolvedValue({
      id: 'rev-1',
      user_book_id: 'ub-1',
      rating: 4,
      comment_text: 'Parfait',
      updated_at: new Date().toISOString(),
    });
    updateUserBookMock.mockResolvedValue({ rating: 4 });

    const review = await upsertUserBookReview('ub-1', 'user-1', 4, 'Parfait');
    expect(upsertReviewMock).toHaveBeenCalledWith({
      where: { user_book_id: 'ub-1' },
      create: {
        user_book_id: 'ub-1',
        rating: 4,
        comment_text: 'Parfait',
      },
      update: {
        rating: 4,
        comment_text: 'Parfait',
      },
    });
    expect(updateUserBookMock).toHaveBeenCalledWith({
      where: { id: 'ub-1' },
      data: { rating: 4 },
    });
    expect(review).toHaveProperty('rating', 4);
    expect(review).toHaveProperty('comment_text', 'Parfait');
  });
});
