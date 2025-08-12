'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Book {
  id: string;
  status_id: number;
  rating: number | null;
  started_at: string | null;
  finished_at: string | null;
  book: {
    id: string;
    title: string;
    author: string | null;
    description: string | null;
    cover_url: string | null;
    page_count: number | null;
    genre: string | null;
  };
}

const READING_STATUSES = [
  { name: 'all', label: 'Tous les livres' },
  { name: 'to_read', label: 'À lire' },
  { name: 'reading', label: 'En cours' },
  { name: 'finished', label: 'Terminés' },
];

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const supabase = createClient();
  const { toast } = useToast();

  const fetchBooks = async (status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error("Utilisateur non authentifié.");
      }

            const url = status && status !== 'all' ? `/api/library?status=${status}` : '/api/library';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setBooks(data);
    } catch (e: any) {
      setError(e.message);
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks(filterStatus);
  }, [filterStatus]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ma Bibliothèque</h1>
        <Link href="/library/add-book">
          <Button>Ajouter un Nouveau Livre</Button>
        </Link>
      </div>

      <div className="mb-6">
        <Select onValueChange={setFilterStatus} defaultValue={filterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            {READING_STATUSES.map((status) => (
              <SelectItem key={status.name} value={status.name}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && <p>Chargement de votre bibliothèque...</p>}
      {error && <p className="text-red-500">Erreur : {error}</p>}

      {!loading && !error && books.length === 0 && (
        <p className="text-lg text-gray-600">Votre bibliothèque est vide. Ajoutez votre premier livre !</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!loading && !error && books.map((userBook) => (
          <Card key={userBook.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{userBook.book.title}</CardTitle>
              {userBook.book.author && (
                <p className="text-sm text-gray-500">par {userBook.book.author}</p>
              )}
            </CardHeader>
            <CardContent className="flex-grow">
              {userBook.book.cover_url && (
                <img
                  src={userBook.book.cover_url}
                  alt={userBook.book.title}
                  className="float-left mr-4 mb-4 w-24 h-auto object-contain"
                />
              )}
              <p className="text-sm line-clamp-4">{userBook.book.description || 'Aucune description disponible.'}</p>
              <p className="text-sm text-gray-600 mt-2">Statut: {READING_STATUSES.find(s => s.name === (userBook.status_id === 1 ? 'to_read' : userBook.status_id === 2 ? 'reading' : 'finished'))?.label || 'Inconnu'}</p>
              {userBook.rating !== null && (
                <p className="text-sm text-gray-600">Note: {userBook.rating}/5</p>
              )}
            </CardContent>
            <div className="p-4 pt-0">
              <Button className="w-full">Voir les détails</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
