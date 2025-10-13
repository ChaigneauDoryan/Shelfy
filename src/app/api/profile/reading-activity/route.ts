
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const userBooks = await prisma.userBook.findMany({
      where: {
        user_id: userId,
        finished_at: { not: null },
      },
      select: {
        finished_at: true,
      },
    });

    const formattedData = userBooks.map(ub => ({
      finished_at: ub.finished_at?.toISOString().split('T')[0],
      books_count: 1, // Chaque entrée représente un livre terminé
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching reading activity:', error);
    return NextResponse.json({ message: 'Failed to fetch reading activity' }, { status: 500 });
  }
}
