'use client'

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface AuthorTagsProps {
  initialAuthors: string[];
  onAuthorsChange: (authors: string[]) => void;
}

export default function AuthorTags({ initialAuthors, onAuthorsChange }: AuthorTagsProps) {
  const [authors, setAuthors] = useState<string[]>(initialAuthors || []);
  const [inputValue, setInputValue] = useState('');

  const handleAddAuthor = () => {
    if (inputValue && !authors.includes(inputValue) && authors.length < 5) {
      const newAuthors = [...authors, inputValue];
      setAuthors(newAuthors);
      onAuthorsChange(newAuthors);
      setInputValue('');
    }
  };

  const handleRemoveAuthor = (authorToRemove: string) => {
    const newAuthors = authors.filter(author => author !== authorToRemove);
    setAuthors(newAuthors);
    onAuthorsChange(newAuthors);
  };

  useEffect(() => {
    setAuthors(initialAuthors || []);
  }, [initialAuthors]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Input 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ajouter un auteur..."
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAuthor())}
        />
        <Button onClick={handleAddAuthor} type="button">Ajouter</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {authors.map(author => (
          <div key={author} className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-sm">
            {author}
            <button onClick={() => handleRemoveAuthor(author)} className="ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
