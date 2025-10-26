'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from '@/hooks/use-debounce';

interface BookSearchDialogProps {
  onSelectBook: (book: any) => void;
}

export default function BookSearchDialog({ onSelectBook }: BookSearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
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

  const handleSelectBook = (book: any) => {
    onSelectBook(book);
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
