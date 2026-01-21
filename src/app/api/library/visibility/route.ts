import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const visibilitySchema = z.object({
  isPublic: z.boolean(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { library_is_public: true },
  });

  if (!user) {
    return NextResponse.json({ message: 'User not found.' }, { status: 404 });
  }

  return NextResponse.json({ isPublic: user.library_is_public });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = visibilitySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid payload.' }, { status: 400 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: { library_is_public: parsed.data.isPublic },
    select: { library_is_public: true },
  });

  return NextResponse.json({ isPublic: updatedUser.library_is_public });
}
