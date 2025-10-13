
import { prisma } from './prisma';

// This function will be called when a user's book status is updated to 'finished'
export async function checkAndAwardBadges(userId: string) {
  const bookCountBadges = await checkAndAwardBookCountBadges(userId);
  const genreDiversityBadges = await checkAndAwardGenreDiversityBadge(userId);
  // Reading streak badge will be implemented separately as it's more complex

  const allAwardedBadges = [...bookCountBadges, ...genreDiversityBadges];
  return allAwardedBadges;
}

async function checkAndAwardBookCountBadges(userId: string) {
  const awardedBadges = [];

  const count = await prisma.userBook.count({
    where: {
      user_id: userId,
      status_id: 3, // Assuming status_id 3 is 'finished'
    },
  });

  if (count === null) {
    console.error('Error fetching finished book count.');
    return [];
  }

  if (count >= 1) {
    const badge = await awardBadge(userId, 1); // Premier Pas
    if (badge) awardedBadges.push(badge);
  }
  if (count >= 5) {
    const badge = await awardBadge(userId, 2); // Apprenti Lecteur
    if (badge) awardedBadges.push(badge);
  }
  if (count >= 20) {
    const badge = await awardBadge(userId, 3); // Rat de Bibliothèque
    if (badge) awardedBadges.push(badge);
  }

  return awardedBadges;
}

async function checkAndAwardGenreDiversityBadge(userId: string) {
  const awardedBadges = [];

  const userBooks = await prisma.userBook.findMany({
    where: {
      user_id: userId,
      status_id: 3, // Assuming status_id 3 is 'finished'
    },
    select: {
      book: {
        select: {
          genre: true,
        },
      },
    },
  });

  const allGenres: string[] = [];
  userBooks.forEach(item => {
    if (item.book?.genre) {
      allGenres.push(item.book.genre);
    }
  });

  const genres = new Set(allGenres);

  if (genres.size >= 3) {
    const badge = await awardBadge(userId, 5); // Curieux
    if (badge) awardedBadges.push(badge);
  }

  return awardedBadges;
}

async function awardBadge(userId: string, badgeId: number) {
  // Check if the user already has the badge
  const existingBadge = await prisma.userBadge.findUnique({
    where: {
      user_id_badge_id: {
        user_id: userId,
        badge_id: badgeId,
      },
    },
  });

  // If the badge doesn't exist, award it
  if (!existingBadge) {
    const awardedBadge = await prisma.userBadge.create({
      data: { user_id: userId, badge_id: badgeId },
      include: { badge: true }, // Inclure les détails du badge créé
    });

    return awardedBadge.badge; // Retourne les détails du badge
  }

  return null;
}
