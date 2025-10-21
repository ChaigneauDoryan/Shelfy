'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import PublicGroupCard from './PublicGroupCard';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useQuery } from '@tanstack/react-query';

interface GroupSearchResult {
  id: string;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  _count: {
    members: number;
  };
}

export default function DiscoverGroups() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: results, isLoading } = useQuery<GroupSearchResult[]>({ 
    queryKey: ['discoverGroups', debouncedSearchTerm],
    queryFn: async () => {
      const response = await fetch(`/api/groups/search?q=${debouncedSearchTerm}`);
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      return response.json();
    },
  });

  return (
    <Card className="p-6">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-2xl font-semibold text-foreground">Découvrir des Groupes</CardTitle>
        <p className="text-muted-foreground">Voici quelques groupes que vous pourriez aimer, ou recherchez-en un spécifiquement.</p>
      </CardHeader>
      <CardContent className="p-0">
        <Input 
          placeholder="Rechercher par nom..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        {isLoading && <p>Chargement des groupes...</p>}
        {!isLoading && results?.length === 0 && (
          <p>
            {debouncedSearchTerm 
              ? `Aucun groupe trouvé pour "${debouncedSearchTerm}".`
              : "Aucun groupe public à afficher pour le moment."
            }
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {results?.map((group) => (
            <PublicGroupCard key={group.id} group={group} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}