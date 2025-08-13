'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const ALL_GENRES = [
  'Science-Fiction', 'Fantaisie', 'Biographie', 'Histoire', 'Horreur', 
  'Thriller', 'Roman', 'Jeunesse', 'Manga', 'Développement Personnel'
];

interface GenreSelectorProps {
  initialGenres: string[];
  onGenresChange: (genres: string[]) => void;
}

export default function GenreSelector({ initialGenres, onGenresChange }: GenreSelectorProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenres || []);

  const handleGenreClick = (genre: string) => {
    const newSelectedGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter(g => g !== genre)
      : [...selectedGenres, genre].slice(0, 5); // Limite à 5 genres
    
    setSelectedGenres(newSelectedGenres);
    onGenresChange(newSelectedGenres);
  };

  useEffect(() => {
    setSelectedGenres(initialGenres || []);
  }, [initialGenres]);

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_GENRES.map(genre => (
        <Button
          key={genre}
          variant={selectedGenres.includes(genre) ? 'default' : 'outline'}
          onClick={() => handleGenreClick(genre)}
          className="transition-all duration-200"
        >
          {genre}
        </Button>
      ))}
    </div>
  );
}
