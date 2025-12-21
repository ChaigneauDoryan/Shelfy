'use client';

import { Compass } from 'lucide-react';

export default function DiscoverPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-6 text-center">
      <Compass className="h-16 w-16 text-blue-600" />
      <div className="space-y-4 max-w-2xl">
        <p className="text-sm uppercase tracking-wide text-blue-500 font-semibold">Bientôt disponible</p>
        <h1 className="text-3xl font-bold text-gray-900">La découverte de livres arrive bientôt</h1>
        <p className="text-gray-600">
          Nous travaillons sur un nouvel espace pour vous aider à trouver les meilleurs livres pour vos clubs de lecture. Tous les utilisateurs auront accès à cette fonctionnalité dès qu'elle sera prête.
        </p>
      </div>
      <p className="text-sm text-gray-500">
        Restez à l'écoute, nous communiquerons dès que la section sera prête !
      </p>
    </div>
  );
}
