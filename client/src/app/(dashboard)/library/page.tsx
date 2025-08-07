import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LibraryPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ma Bibliothèque</h1>
        <Link href="/library/add-book">
          <Button>Ajouter un Nouveau Livre</Button>
        </Link>
      </div>

      <p className="text-lg text-gray-600">Votre collection personnelle de livres apparaîtra ici.</p>
      <p className="text-sm text-gray-500 mt-2">Actuellement, cette page est un espace réservé. Les livres ajoutés via la page "Ajouter un Nouveau Livre" ne sont pas encore sauvegardés dans votre bibliothèque.</p>

      {/* Placeholder for book list */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Example of a book card (will be dynamically loaded later) */}
        {/*
        <div className="border p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold">Book Title Example</h2>
          <p className="text-gray-700">Author Name</p>
          <p className="text-sm text-gray-500">Description snippet...</p>
        </div>
        */}
      </div>
    </div>
  );
}