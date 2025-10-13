import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const readingStatuses = [
    { id: 1, status_name: 'to_read' },
    { id: 2, status_name: 'reading' },
    { id: 3, status_name: 'finished' },
  ];

  for (const status of readingStatuses) {
    await prisma.readingStatus.upsert({
      where: { id: status.id },
      update: {},
      create: status,
    });
    console.log(`Upserted ReadingStatus: ${status.status_name}`);
  }

  // Vous pouvez ajouter des badges par défaut ici si nécessaire
  const defaultBadges = [
    { id: 1, name: 'Premier Pas', description: 'Terminer votre premier livre.', icon_url: null },
    { id: 2, name: 'Apprenti Lecteur', description: 'Terminer 5 livres.', icon_url: null },
    { id: 3, name: 'Rat de Bibliothèque', description: 'Terminer 20 livres.', icon_url: null },
    { id: 5, name: 'Curieux', description: 'Terminer des livres de 3 genres différents.', icon_url: null },
  ];

  for (const badge of defaultBadges) {
    await prisma.badge.upsert({
      where: { id: badge.id },
      update: {},
      create: badge,
    });
    console.log(`Upserted Badge: ${badge.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });