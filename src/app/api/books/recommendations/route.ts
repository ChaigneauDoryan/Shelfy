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
    // 1. Get user's read books (personal and group)
    const userBooks = await prisma.userBook.findMany({
      where: { user_id: userId, is_archived: false },
      include: { book: true },
    });
    const userGroups = await prisma.groupMember.findMany({
      where: { user_id: userId },
      select: { group_id: true },
    });
    const groupIds = userGroups.map(ug => ug.group_id);
    const groupBooks = await prisma.groupBook.findMany({
      where: {
        group_id: { in: groupIds },
        status: 'FINISHED',
      },
      include: { book: true },
    });
    const allReadBooks = [
      ...userBooks.filter(ub => ub.status_id === 3),
      ...groupBooks,
    ];
    const readBookIds = allReadBooks.map(b => b.book.id);

    // 2. Get user's top genres and authors
    const genreCounts: { [key: string]: number } = {};
    const authorCounts: { [key: string]: number } = {};
    allReadBooks.forEach(ub => {
      if (ub.book.genre) {
        const genres = ub.book.genre.split(',').map(g => g.trim());
        genres.forEach(genre => { genreCounts[genre] = (genreCounts[genre] || 0) + 1; });
      }
      if (ub.book.author) {
        const authors = ub.book.author.split(',').map(a => a.trim());
        authors.forEach(author => { authorCounts[author] = (authorCounts[author] || 0) + 1; });
      }
    });
    const topGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]).slice(0, 3);
    const topAuthors = Object.keys(authorCounts).sort((a, b) => authorCounts[b] - authorCounts[a]).slice(0, 3);

    // 3. Find recommendations
    const recommendations = await prisma.book.findMany({
      where: {
        AND: [
          {
            id: { notIn: readBookIds }, // Exclude already read books
          },
          {
            OR: [
              { genre: { in: topGenres, mode: 'insensitive' } },
              { author: { in: topAuthors, mode: 'insensitive' } },
            ],
          },
        ],
      },
      take: 10, // Limit to 10 recommendations
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ message: 'Failed to fetch recommendations' }, { status: 500 });
  }
}
