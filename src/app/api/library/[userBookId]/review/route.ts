import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getSession } from '@/lib/auth';
import { getUserBookReview, upsertUserBookReview } from '@/lib/book-utils';
import type { UserBookReviewResponse } from '@/types/api';

const reviewPayloadSchema = z.object({
  rating: z
    .number()
    .min(0.5)
    .max(5)
    .refine(value => Number.isInteger(value * 2), {
      message: 'La note doit progresser par pas de 0.5.',
    }),
  comment_text: z.string().trim().min(1).max(2000),
});

type ReviewEntity = Awaited<ReturnType<typeof getUserBookReview>>;
const formatReviewDate = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : value;
const toReviewSummary = (review: ReviewEntity | null): UserBookReviewResponse['review'] => {
  if (!review) {
    return null;
  }
  return {
    id: review.id,
    rating: review.rating,
    comment_text: review.comment_text,
    updated_at: formatReviewDate(review.updated_at),
  };
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ userBookId: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { userBookId } = await context.params;

  try {
    const review = await getUserBookReview(userBookId, session.user.id);
    return NextResponse.json<UserBookReviewResponse>({ review: toReviewSummary(review) });
  } catch (error: unknown) {
    console.error('Error fetching review:', error);
    return NextResponse.json({ message: 'Unable to load review.' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userBookId: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { userBookId } = await context.params;

  let parsedBody;
  try {
    parsedBody = reviewPayloadSchema.parse(await request.json());
  } catch (error: unknown) {
    const message =
      error instanceof z.ZodError ? error.issues[0]?.message ?? 'Payload invalide.' : 'Payload invalide.';
    return NextResponse.json({ message }, { status: 400 });
  }

  try {
    const review = await upsertUserBookReview(
      userBookId,
      session.user.id,
      parsedBody.rating,
      parsedBody.comment_text
    );
    return NextResponse.json<UserBookReviewResponse>({ review: toReviewSummary(review) });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('terminés')) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes('introuvable')) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error('Error updating review:', error);
    return NextResponse.json({ message: 'Failed to save review.' }, { status: 500 });
  }
}
