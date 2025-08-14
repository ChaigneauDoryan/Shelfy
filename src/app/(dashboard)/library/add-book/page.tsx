'use client';

import { useState, useEffect } from 'react';
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
  id?: string | null;
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

import { useDebounce } from '@/hooks/use-debounce';

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

interface ChapterInput {
  id: number; // Unique ID for React key, not for DB
  chapter_number: number;
  title: string;
  page_start: number;
  page_end: number;
}

export default function AddBookPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500); // Debounce for 500ms
  const [results, setResults] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingBookId, setAddingBookId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [chaptersInput, setChaptersInput] = useState<ChapterInput[]>([]);
  let nextChapterId = 0;
  const supabase = createClient();
  const { toast } = useToast();

  const handleAddChapter = () => {
    setChaptersInput(prev => [...prev, { id: nextChapterId++, chapter_number: prev.length + 1, title: '', page_start: 0, page_end: 0 }]);
  };

  const handleRemoveChapter = (id: number) => {
    setChaptersInput(prev => prev.filter(chapter => chapter.id !== id));
  };

  const handleChapterChange = (id: number, field: keyof ChapterInput, value: any) => {
    setChaptersInput(prev => prev.map(chapter =>
      chapter.id === id ? { ...chapter, [field]: value } : chapter
    ));
  };

  const manualForm = useForm<ManualBookFormValues>({
    resolver: zodResolver(manualBookSchema),
    defaultValues: {
      title: '',
      author: '',
      description: '',
      cover_url: '',
      page_count: '',
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

            const response = await fetch(`/api/library/search?query=${encodeURIComponent(query)}`, {
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

  useEffect(() => {
    if (debouncedQuery) {
      handleSearch();
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const addBookToLibrary = async (bookData: any, bookIdForLoading: string | null = null) => {
    setLoading(true);
    setAddingBookId(bookIdForLoading);
    console.log('Book data being sent from frontend:', bookData); // Add this log
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error("Utilisateur non authentifié.");
      }

            console.log('Book data being sent from frontend:', bookData); // Debug log
            const response = await fetch('/api/library/add', {
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
      setAddingBookId(null); // Réinitialiser l\'ID du livre en cours d\'ajout
    }
  };

  const handleAddFromSearch = async (book: BookResult) => {
    if (!book || !book.id || typeof book.id !== 'string' || book.id.trim() === '') {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le livre : ID du livre manquant ou invalide.',
        variant: 'destructive',
      });
      return;
    }
    console.log('Book data being sent to backend:', book); // Add this line
    addBookToLibrary(book, book.id); // Passer l\'ID du livre pour le chargement
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

    setLoading(true);
    setAddingBookId(null); // For manual books, no Google Books ID

    const bookToAdd = {
      isManual: true, // Flag for manual entry
      googleBooksId: null, // No Google Books ID for manual entry
      isbn: values.isbn || null,
      title: values.title,
      author: values.author || null,
      description: values.description || null,
      coverUrl: values.cover_url || null,
      pageCount: pageCount,
      genre: values.genre || null,
      publishedDate: values.published_date || null,
      publisher: values.publisher || null,
    };

    console.log('Book data being sent from frontend (manual):', bookToAdd);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error("Utilisateur non authentifié.");
      }

      const response = await fetch('/api/library/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(bookToAdd),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de l\'ajout du livre à la bibliothèque.');
      }

      toast({ title: 'Succès', description: 'Livre ajouté à votre bibliothèque !' });
      // Reset form and state after successful submission
      manualForm.reset();
      setChaptersInput([]); // Clear chapters input
      setShowManualForm(false);
      // No need to setQuery or setResults as this is manual form
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
      setAddingBookId(null);
    }
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
        <Button disabled={loading}>
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
                  <Button
                    onClick={() => handleAddFromSearch(book)}
                    className="w-full"
                    disabled={loading && addingBookId === book.id || !book.id || typeof book.id !== 'string' || book.id.trim() === ''}
                    title={!book.id || typeof book.id !== 'string' || book.id.trim() === '' ? 'Impossible d\'ajouter ce livre : ID manquant ou invalide.' : ''}
                  >
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

                {/* Chapter Input Section */}
                <h3 className="text-lg font-semibold mt-6 mb-2">Chapitres (Optionnel)</h3>
                {chaptersInput.map((chapter, index) => (
                  <Card key={chapter.id} className="mb-4 p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Chapitre {index + 1}</h4>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveChapter(chapter.id)}>Supprimer</Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormItem>
                        <FormLabel>Numéro de Chapitre</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={chapter.chapter_number}
                            onChange={(e) => handleChapterChange(chapter.id, 'chapter_number', Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormLabel>Titre du Chapitre</FormLabel>
                        <FormControl>
                          <Input
                            value={chapter.title}
                            onChange={(e) => handleChapterChange(chapter.id, 'title', e.target.value)}
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormLabel>Page de Début</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={chapter.page_start}
                            onChange={(e) => handleChapterChange(chapter.id, 'page_start', Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormLabel>Page de Fin</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={chapter.page_end}
                            onChange={(e) => handleChapterChange(chapter.id, 'page_end', Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    </div>
                  </Card>
                ))}
                <Button type="button" variant="outline" onClick={handleAddChapter} className="w-full mt-2">Ajouter un Chapitre</Button>

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
