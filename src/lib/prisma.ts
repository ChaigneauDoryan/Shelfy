
import { PrismaClient } from '@prisma/client';

// Déclare une variable globale pour stocker le client Prisma
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Crée une instance unique du client Prisma.
// En développement, Next.js recharge les fichiers, ce qui peut créer de multiples instances.
// Ce code évite cela en stockant le client dans la variable globale.
export const prisma =
  (globalThis as any).prisma ||
  new PrismaClient({
    log: [],
  });

if (process.env.NODE_ENV !== 'production') {
  (globalThis as any).prisma = prisma;
}
