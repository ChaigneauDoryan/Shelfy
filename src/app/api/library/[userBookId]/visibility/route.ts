import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const visibilitySchema = z.object({
  isPublic: z.boolean(),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ userBookId: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = visibilitySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid payload.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { library_is_public: true },
  });

  if (!user) {
    return NextResponse.json({ message: 'User not found.' }, { status: 404 });
  }

  if (user.library_is_public) {
    return NextResponse.json({ message: 'Library is public; per-book visibility is disabled.' }, { status: 400 });
  }

  const { userBookId } = await context.params;
  const updateResult = await prisma.userBook.updateMany({
    where: { id: userBookId, user_id: session.user.id },
    data: { is_public: parsed.data.isPublic },
  });

  if (updateResult.count === 0) {
    return NextResponse.json({ message: 'Book not found.' }, { status: 404 });
  }

  return NextResponse.json({ id: userBookId, isPublic: parsed.data.isPublic });
}
