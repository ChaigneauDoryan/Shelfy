
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Récupère la session de l'utilisateur côté serveur.
 * À utiliser dans les Server Components, les routes d'API et les `getServerSideProps`.
 */
export const getSession = () => {
  return getServerSession(authOptions);
};
