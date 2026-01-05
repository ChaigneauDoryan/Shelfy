import type { Metadata } from 'next';
import { Suspense } from 'react';
import DashboardClient from './DashboardClient';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  pageTitle: 'Tableau de bord de lecture',
  description: 'Consultez vos clubs et lectures personnelles, découvrez vos tendances de lecture et réagissez à vos progrès sur Shelfy.',
  path: '/dashboard',
  keywords: ['tableau de bord', 'progression lecture', 'clubs de lecture'],
});

export default function DashboardPage() {
  return (
    <Suspense fallback={<p>Chargement du tableau de bord…</p>}>
      <DashboardClient />
    </Suspense>
  );
}
