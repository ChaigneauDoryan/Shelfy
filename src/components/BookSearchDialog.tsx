'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from '@/hooks/use-debounce';
import type { BookSelectionPayload, GoogleBookSearchResult } from '@/types/domain';

interface BookSearchDialogProps {
  onSelectBook: (book: BookSelectionPayload) => void;
}

export default function BookSearchDialog({ onSelectBook }: BookSearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GoogleBookSearchResult[]>([]);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (debouncedSearchQuery) {
      fetch(`/api/library/search?title=${debouncedSearchQuery}`)
        .then(res => res.json())
        .then(data => {
          setSearchResults(data.items || []);
        });
    }
  }, [debouncedSearchQuery]);

  const handleSelectBook = (book: GoogleBookSearchResult) => {
    console.log('Full book object on select:', book); // Ajout du console.log

    if (!book.id || !book.volumeInfo?.title || !book.volumeInfo?.authors?.length) {
      // Afficher un message d'erreur à l'utilisateur
      // Utiliser un toast ou une alerte
      alert('Impossible de sélectionner ce livre: informations manquantes (ID, titre ou auteur).');
      return;
    }

    const bookData: BookSelectionPayload = {
      googleBooksId: String(book.id), // S'assurer que c'est une chaîne
      title: book.volumeInfo.title,
      author: book.volumeInfo.authors.join(', '), // authors est garanti d'être un tableau non vide ici
      coverUrl: book.volumeInfo.imageLinks?.thumbnail || undefined,
      description: book.volumeInfo.description,
      pageCount: book.volumeInfo.pageCount,
      publishedDate: book.volumeInfo.publishedDate,
      publisher: book.volumeInfo.publisher,
      genre: book.volumeInfo.categories?.[0],
    };
    onSelectBook(bookData);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Sélectionner un livre</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechercher un livre</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Rechercher par titre..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <div className="mt-4 max-h-64 overflow-y-auto">
          {searchResults.map(book => (
            <div key={book.id} className="flex items-center space-x-2 p-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleSelectBook(book)}>
              <img src={book.volumeInfo.imageLinks?.thumbnail || ''} alt={book.volumeInfo.title} className="w-12 h-16 object-cover" />
              <div>
                <p className="font-semibold">{book.volumeInfo.title}</p>
                <p className="text-sm text-gray-500">{book.volumeInfo.authors?.join(', ')}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
