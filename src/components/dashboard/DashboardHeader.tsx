'use client';

import PageHeader from '@/components/ui/PageHeader'; // Import PageHeader

interface DashboardHeaderProps {
  username: string;
}

export function DashboardHeader({ username }: DashboardHeaderProps) {
  return (
    <PageHeader
      title={`Bonjour, ${username} !`}
      description="Ravi de vous revoir. Voici un aperçu de votre univers de lecture."
    />
  );
}
