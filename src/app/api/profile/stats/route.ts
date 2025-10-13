
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
    // 1. Get user profile data
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, bio: true, image: true },
    });

    // 2. Get user stats
    const userBooks = await prisma.userBook.findMany({
      where: { user_id: userId, is_archived: false },
      include: { book: true },
    });

    const finishedBooks = userBooks.filter(ub => ub.status_id === 3); // Assuming status_id 3 is 'finished'

    const totalBooksRead = finishedBooks.length;
    const totalPagesRead = finishedBooks.reduce((sum, ub) => sum + (ub.book.page_count || 0), 0);
    const ratings = finishedBooks.map(ub => ub.rating).filter(r => r !== null) as number[];
    const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    const stats = {
      total_books_read: totalBooksRead,
      total_pages_read: totalPagesRead,
      average_rating: averageRating,
    };

    // 3. Get user badges
    const userBadges = await prisma.userBadge.findMany({
      where: { user_id: userId },
      include: { badge: true },
    });
    const badges = userBadges.map(ub => ub.badge);

    // 4. Calculate reading pace
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentBookCount = finishedBooks.filter(ub => ub.finished_at && new Date(ub.finished_at) > thirtyDaysAgo).length;
    let readingPace: string | null = null;
    if (recentBookCount >= 4) readingPace = 'passionate';
    else if (recentBookCount >= 2) readingPace = 'regular';
    else if (recentBookCount >= 1) readingPace = 'occasional';

    // 5. Calculate top genres and authors
    const genreCounts: { [key: string]: number } = {};
    const authorCounts: { [key: string]: number } = {};

    userBooks.forEach(ub => {
      if (ub.book.genre) {
        const genres = ub.book.genre.split(',').map(g => g.trim());
        genres.forEach(genre => { genreCounts[genre] = (genreCounts[genre] || 0) + 1; });
      }
      if (ub.book.author) {
        const authors = ub.book.author.split(',').map(a => a.trim());
        authors.forEach(author => { authorCounts[author] = (authorCounts[author] || 0) + 1; });
      }
    });

    const topGenres = Object.keys(genreCounts).map(name => ({ name, count: genreCounts[name] })).sort((a, b) => b.count - a.count);
    const topAuthors = Object.keys(authorCounts).map(name => ({ name, count: authorCounts[name] })).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      profile: userProfile,
      stats,
      badges,
      readingPace,
      topGenres,
      topAuthors,
    });

  } catch (error) {
    console.error('Error fetching profile stats:', error);
    return NextResponse.json({ message: 'Failed to fetch profile stats' }, { status: 500 });
  }
}
