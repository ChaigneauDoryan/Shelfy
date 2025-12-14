// src/app/api/groups/[groupId]/books/[groupBookId]/finish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  groupId: string;
  groupBookId: string;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ groupId: string; groupBookId: string; }> }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { groupId, groupBookId } = await context.params;

  try {
    const groupBook = await prisma.groupBook.findUnique({
      where: { id: groupBookId, group_id: groupId },
    });

    if (!groupBook) {
      return NextResponse.json({ message: 'Livre du groupe non trouvé.' }, { status: 404 });
    }

    // Ensure the reading_end_date has actually passed
    if (!groupBook.reading_end_date || new Date() < new Date(groupBook.reading_end_date)) {
      return NextResponse.json({ message: 'La date de fin de lecture n\'est pas encore passée.' }, { status: 400 });
    }

    // Ensure the book is not already finished
    if (groupBook.status === 'FINISHED') {
      return NextResponse.json({ message: 'Le livre est déjà terminé.' }, { status: 200 });
    }

    const updatedGroupBook = await prisma.groupBook.update({
      where: { id: groupBookId },
      data: {
        status: 'FINISHED',
        finished_at: groupBook.reading_end_date,
      },
    });

    return NextResponse.json({ message: 'Statut du livre mis à jour à "TERMINÉ".', groupBook: updatedGroupBook });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut du livre:', error);
    return NextResponse.json({ message: 'Échec de la mise à jour du statut du livre.' }, { status: 500 });
  }
}

