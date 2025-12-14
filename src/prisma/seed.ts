import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
    { id: 6, name: 'Initiateur', description: 'Créer votre premier groupe.', icon_url: null },
    { id: 7, name: 'Bâtisseur', description: 'Créer 3 groupes.', icon_url: null },
    { id: 8, name: 'Architecte', description: 'Créer 5 groupes.', icon_url: null },
    { id: 9, name: 'Social', description: 'Rejoindre votre premier groupe.', icon_url: null },
    { id: 10, name: 'Explorateur', description: 'Rejoindre 3 groupes différents.', icon_url: null },
    { id: 11, name: 'Collectionneur', description: 'Rejoindre 5 groupes différents.', icon_url: null },
    { id: 12, name: 'Actif', description: 'Être membre d\'un groupe pendant plus d\'un mois.', icon_url: null },
    { id: 13, name: 'Engagé', description: 'Être membre d\'un groupe pendant plus de 3 mois.', icon_url: null },
    { id: 14, name: 'Pilier de la communauté', description: 'Être membre d\'un groupe pendant plus d\'un an.', icon_url: null },
    { id: 15, name: 'Recruteur', description: 'Inviter 5 membres dans un groupe.', icon_url: null },
    { id: 16, name: 'Ambassadeur', description: 'Inviter 10 membres dans un groupe.', icon_url: null }
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
