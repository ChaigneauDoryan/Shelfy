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

export async function checkAndAwardGroupCreationBadges(userId: string) {
  const awardedBadges = [];

  const count = await prisma.group.count({
    where: {
      created_by_id: userId,
    },
  });

  if (count === null) {
    console.error('Error fetching created group count.');
    return [];
  }

  if (count >= 1) {
    const badge = await awardBadge(userId, 6); // Initiateur
    if (badge) awardedBadges.push(badge);
  }
  if (count >= 3) {
    const badge = await awardBadge(userId, 7); // Bâtisseur
    if (badge) awardedBadges.push(badge);
  }
  if (count >= 5) {
    const badge = await awardBadge(userId, 8); // Architecte
    if (badge) awardedBadges.push(badge);
  }

  return awardedBadges;
}

export async function checkAndAwardGroupMembershipBadges(userId: string) {
  const awardedBadges = [];

  const count = await prisma.groupMember.count({
    where: {
      user_id: userId,
    },
  });

  if (count === null) {
    console.error('Error fetching group membership count.');
    return [];
  }

  if (count >= 1) {
    const badge = await awardBadge(userId, 9); // Social
    if (badge) awardedBadges.push(badge);
  }
  if (count >= 3) {
    const badge = await awardBadge(userId, 10); // Explorateur
    if (badge) awardedBadges.push(badge);
  }
  if (count >= 5) {
    const badge = await awardBadge(userId, 11); // Collectionneur
    if (badge) awardedBadges.push(badge);
  }

  return awardedBadges;
}

export async function checkAndAwardGroupActivityBadges(userId: string) {
  const awardedBadges = [];

  const memberships = await prisma.groupMember.findMany({
    where: {
      user_id: userId,
    },
    orderBy: {
      joined_at: 'asc',
    },
  });

  if (memberships.length > 0) {
    const now = new Date();
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    const threeMonths = 3 * oneMonth;
    const oneYear = 12 * oneMonth;

    for (const membership of memberships) {
      const duration = now.getTime() - new Date(membership.joined_at).getTime();

      if (duration >= oneMonth) {
        const badge = await awardBadge(userId, 12); // Actif
        if (badge) awardedBadges.push(badge);
      }
      if (duration >= threeMonths) {
        const badge = await awardBadge(userId, 13); // Engagé
        if (badge) awardedBadges.push(badge);
      }
      if (duration >= oneYear) {
        const badge = await awardBadge(userId, 14); // Pilier de la communauté
        if (badge) awardedBadges.push(badge);
      }
    }
  }

  return awardedBadges;
}

export async function checkAndAwardInvitationBadges(userId: string) {
  const awardedBadges = [];

  const count = await prisma.groupMember.count({
    where: {
      invited_by_id: userId,
    },
  });

  if (count === null) {
    console.error('Error fetching invitation count.');
    return [];
  }

  if (count >= 5) {
    const badge = await awardBadge(userId, 15); // Recruteur
    if (badge) awardedBadges.push(badge);
  }
  if (count >= 10) {
    const badge = await awardBadge(userId, 16); // Ambassadeur
    if (badge) awardedBadges.push(badge);
  }

  return awardedBadges;
}