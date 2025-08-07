'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AddBookPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setResults(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Ajouter un Nouveau Livre</h1>
      <div className="flex space-x-2 mb-6">
        <Input
          type="text"
          placeholder="Rechercher des livres..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          className="flex-grow"
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? 'Recherche...' : 'Rechercher'}
        </Button>
      </div>

      {error && <p className="text-red-500 mb-4">Erreur : {error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.length > 0 ? (
          results.map((book) => (
            <Card key={book.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{book.volumeInfo.title}</CardTitle>
                {book.volumeInfo.authors && (
                  <p className="text-sm text-gray-500">par {book.volumeInfo.authors.join(', ')}</p>
                )}
              </CardHeader>
              <CardContent className="flex-grow">
                {book.volumeInfo.imageLinks?.thumbnail && (
                  <img
                    src={book.volumeInfo.imageLinks.thumbnail}
                    alt={book.volumeInfo.title}
                    className="float-left mr-4 mb-4"
                  />
                )}
                <p className="text-sm line-clamp-4">{book.volumeInfo.description || 'Aucune description disponible.'}</p>
              </CardContent>
              <div className="p-4 pt-0">
                <Button className="w-full">Ajouter à la Bibliothèque</Button>
              </div>
            </Card>
          ))
        ) : (
          !loading && query && <p>Aucun résultat trouvé pour "{query}".</p>
        )}
      </div>
    </div>
  );
}
