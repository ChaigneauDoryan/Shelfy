'use client';

interface DashboardHeaderProps {
  username: string;
}

export function DashboardHeader({ username }: DashboardHeaderProps) {
  return (
    <header>
      <h1 className="text-3xl font-bold text-gray-800">
        Bonjour, {username} !
      </h1>
      <p className="text-gray-600">
        Ravi de vous revoir. Voici un aperçu de votre univers de lecture.
      </p>
    </header>
  );
}
