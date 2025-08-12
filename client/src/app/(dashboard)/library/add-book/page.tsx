'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface BookResult {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    imageLinks?: {
      thumbnail?: string;
    };
    description?: string;
    pageCount?: number;
    categories?: string[];
    publishedDate?: string;
    publisher?: string;
    industryIdentifiers?: { type: string; identifier: string }[];
  };
}

const manualBookSchema = z.object({
  title: z.string().min(1, "Le titre est requis."),
  author: z.string().optional(),
  description: z.string().optional(),
  cover_url: z.string().url("URL de couverture invalide.").optional().or(z.literal('')),
    page_count: z.string().optional(),
  genre: z.string().optional(),
  isbn: z.string().optional(),
  published_date: z.string().optional(),
  publisher: z.string().optional(),
});

type ManualBookFormValues = z.infer<typeof manualBookSchema>;

export default function AddBookPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingBookId, setAddingBookId] = useState<string | null>(null); // Nouvel état pour le livre en cours d'ajout
  const [error, setError] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  const manualForm = useForm<ManualBookFormValues>({
    resolver: zodResolver(manualBookSchema),
    defaultValues: {
      title: '',
      author: '',
      description: '',
      cover_url: '',
      page_count: '', // Changer à une chaîne vide
      genre: '',
      isbn: '',
      published_date: '',
      publisher: '',
    },
  });

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setShowManualForm(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error("Utilisateur non authentifié.");
      }

      const response = await fetch(`/library/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setResults(data.items || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const addBookToLibrary = async (bookData: any, bookIdForLoading: string | null = null) => {
    setLoading(true);
    setAddingBookId(bookIdForLoading); // Définir l'ID du livre en cours d'ajout
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error("Utilisateur non authentifié.");
      }

      const response = await fetch('/library/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(bookData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de l\'ajout du livre à la bibliothèque.');
      }

      toast({ title: 'Succès', description: 'Livre ajouté à votre bibliothèque !' });
      setQuery('');
      setResults([]);
      setShowManualForm(false);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
      setAddingBookId(null); // Réinitialiser l'ID du livre en cours d'ajout
    }
  };

  const handleAddFromSearch = (book: BookResult) => {
    const bookToAdd = {
      googleBooksId: book.id,
      isbn: book.volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier ||
            book.volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier ||
            null,
      title: book.volumeInfo.title,
      author: book.volumeInfo.authors?.join(', ') || null,
      description: book.volumeInfo.description || null,
      coverUrl: book.volumeInfo.imageLinks?.thumbnail || null,
      pageCount: book.volumeInfo.pageCount || null,
      genre: book.volumeInfo.categories?.join(', ') || null,
      publishedDate: book.volumeInfo.publishedDate || null,
      publisher: book.volumeInfo.publisher || null,
    };
    addBookToLibrary(bookToAdd, book.id); // Passer l'ID du livre pour le chargement
  };

  const handleManualSubmit = async (values: ManualBookFormValues) => {
    let pageCount: number | null = null;
    if (values.page_count) {
      const parsedPageCount = Number(values.page_count);
      if (!isNaN(parsedPageCount) && Number.isInteger(parsedPageCount) && parsedPageCount > 0) {
        pageCount = parsedPageCount;
      } else {
        toast({
          title: 'Erreur de validation',
          description: 'Le nombre de pages doit être un entier positif.',
          variant: 'destructive',
        });
        return;
      }
    }

    const bookToAdd = {
      title: values.title,
      author: values.author || null,
      description: values.description || null,
      coverUrl: values.cover_url || null,
      pageCount: pageCount,
      genre: values.genre || null,
      isbn: values.isbn || null,
      publishedDate: values.published_date || null,
      publisher: values.publisher || null,
    };
    addBookToLibrary(bookToAdd);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl font-bold">Ajouter un Nouveau Livre</h1>
      </div>
      <div className="flex space-x-2 mb-6">
        <Input
          type="text"
          placeholder="Rechercher des livres par titre, auteur, ISBN..."
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

      {results.length > 0 && !showManualForm && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Résultats de la recherche</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((book) => (
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
                      className="float-left mr-4 mb-4 w-24 h-auto object-contain"
                    />
                  )}
                  <p className="text-sm line-clamp-4">{book.volumeInfo.description || 'Aucune description disponible.'}</p>
                </CardContent>
                <div className="p-4 pt-0">
                  <Button onClick={() => handleAddFromSearch(book)} className="w-full" disabled={loading && addingBookId === book.id}>
                    {loading && addingBookId === book.id ? 'Ajout...' : 'Ajouter à la Bibliothèque'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <div className="text-center mt-6">
            <Button variant="outline" onClick={() => setShowManualForm(true)}>Ajouter manuellement</Button>
          </div>
        </div>
      )}

      {(results.length === 0 && query && !loading && !showManualForm) && (
        <div className="text-center mb-6">
          <p className="text-gray-600">Aucun résultat trouvé pour "{query}".</p>
          <Button variant="outline" onClick={() => setShowManualForm(true)} className="mt-4">Ajouter manuellement</Button>
        </div>
      )}

      {showManualForm && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Ajouter un livre manuellement</CardTitle>
            <CardDescription>Saisissez les informations du livre si la recherche n'a rien donné.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...manualForm}>
              <form onSubmit={manualForm.handleSubmit(handleManualSubmit)} className="space-y-4">
                <FormField
                  control={manualForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={manualForm.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auteur(s)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Jane Doe, John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={manualForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={manualForm.control}
                  name="cover_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de la couverture (Optionnel)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={manualForm.control}
                  name="page_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de pages (Optionnel)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={manualForm.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genre (Optionnel)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={manualForm.control}
                  name="isbn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ISBN (Optionnel)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={manualForm.control}
                  name="published_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de publication (AAAA-MM-JJ) (Optionnel)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={manualForm.control}
                  name="publisher"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Éditeur (Optionnel)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Ajout en cours...' : 'Ajouter le livre'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowManualForm(false)} className="w-full mt-2">
                  Annuler
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
