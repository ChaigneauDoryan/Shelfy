'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmModal } from '@/components/ui/ConfirmModal'; // Import ConfirmModal
import { useRouter } from 'next/navigation'; // Import useRouter

interface Book {
  id: string;
  status_id: number;
  rating: number | null;
  started_at: string | null;
  finished_at: string | null;
  current_page: number | null; // Added current_page
  is_archived?: boolean; // Added is_archived property
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
  { name: 'all', label: 'Tous les livres', bgColorClass: 'bg-gray-400' },
  { name: 'to_read', label: 'À lire', bgColorClass: 'bg-blue-500' },
  { name: 'reading', label: 'En cours', bgColorClass: 'bg-yellow-500' },
  { name: 'finished', label: 'Terminés', bgColorClass: 'bg-green-500' },
];

const ARCHIVE_STATUSES = [
  { name: 'all', label: 'Tous les livres (Archive)', queryValue: undefined }, // undefined means don't send 'archived' param
  { name: 'non_archived', label: 'Non archivés', queryValue: false },
  { name: 'archived', label: 'Archivés', queryValue: true },
];

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterArchiveStatus, setFilterArchiveStatus] = useState<string>('all'); // New state for archive filter
  const [showConfirmModal, setShowConfirmModal] = useState(false); // State for confirmation modal
  const [bookToDeleteId, setBookToDeleteId] = useState<string | null>(null); // State to store ID of book to delete
  const [showArchiveConfirmModal, setShowArchiveConfirmModal] = useState(false); // State for archive confirmation modal
  const [bookToArchiveId, setBookToArchiveId] = useState<string | null>(null); // State to store ID of book to archive/unarchive
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const fetchBooks = async (status?: string, archivedStatus?: boolean | undefined) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error("Utilisateur non authentifié.");
      }

      let url = `/api/library?`;
      if (status && status !== 'all') {
        url += `status=${status}&`;
      }
      if (archivedStatus !== undefined) {
        url += `archived=${archivedStatus}&`;
      }
      url = url.slice(0, -1); // Remove trailing '&' or '?'

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

  const handleDeleteBook = async () => {
    if (!bookToDeleteId) return;

    setShowConfirmModal(false); // Close modal after confirmation
    try {
      const response = await fetch(`/api/library/${bookToDeleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      toast({
        title: 'Succès',
        description: 'Livre supprimé avec succès de votre bibliothèque.',
      });
      setBookToDeleteId(null); // Clear the book to delete ID
      fetchBooks(filterStatus, ARCHIVE_STATUSES.find(s => s.name === filterArchiveStatus)?.queryValue); // Refresh the list of books
    } catch (e: any) {
      toast({
        title: 'Erreur',
        description: e.message,
        variant: 'destructive',
      });
    }
  };

  const handleArchiveBook = async (bookId: string) => {
    if (!bookId) return;

    setShowArchiveConfirmModal(false); // Close modal after confirmation
    
    try {
      // Find the book to determine its current archive status
      const book = books.find(b => b.id === bookId);
      const newArchiveStatus = !book?.is_archived;

      const response = await fetch(`/api/library/${bookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_archived: newArchiveStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      toast({
        title: 'Succès',
        description: `Livre ${newArchiveStatus ? 'archivé' : 'désarchivé'} avec succès.`,
      });
      setBookToArchiveId(null); // Clear the book to archive ID
      fetchBooks(filterStatus, ARCHIVE_STATUSES.find(s => s.name === filterArchiveStatus)?.queryValue); // Refresh the list of books
    } catch (e: any) {
      toast({
        title: 'Erreur',
        description: e.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const selectedArchiveStatus = ARCHIVE_STATUSES.find(s => s.name === filterArchiveStatus)?.queryValue;
    fetchBooks(filterStatus, selectedArchiveStatus);
  }, [filterStatus, filterArchiveStatus]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ma Bibliothèque</h1>
        <Link href="/library/add-book">
          <Button>Ajouter un Nouveau Livre</Button>
        </Link>
      </div>

      <div className="mb-6 flex space-x-4"> {/* Added flex and space-x-4 */}
        <Select onValueChange={setFilterStatus} defaultValue={filterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            {READING_STATUSES.map((status) => (
              <SelectItem key={status.name} value={status.name}>
                <div className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${status.bgColorClass}`}></span>
                  {status.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={setFilterArchiveStatus} defaultValue={filterArchiveStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par archive" />
          </SelectTrigger>
          <SelectContent>
            {ARCHIVE_STATUSES.map((status) => (
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
        <p className="text-lg text-gray-600">
          {filterStatus === 'all'
            ? 'Votre bibliothèque est vide. Ajoutez votre premier livre !'
            : `Aucun livre dans le statut "${READING_STATUSES.find(s => s.name === filterStatus)?.label}" pour l'instant.`
          }
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!loading && !error && books.map((userBook) => {
          const bookToArchive = books.find(b => b.id === userBook.id);
          const isCurrentlyArchived = bookToArchive?.is_archived || false;
          
          return (
            <Card key={userBook.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{userBook.book.title}</span>
                  {isCurrentlyArchived && (
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">Archivé</span>
                  )}
                </CardTitle>
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
                <p className="text-sm mt-2 text-gray-800 flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${READING_STATUSES.find(s => s.name === (userBook.status_id === 1 ? 'to_read' : userBook.status_id === 2 ? 'reading' : 'finished'))?.bgColorClass || 'bg-gray-400'}`}></span>
                  Statut: {READING_STATUSES.find(s => s.name === (userBook.status_id === 1 ? 'to_read' : userBook.status_id === 2 ? 'reading' : 'finished'))?.label || 'Inconnu'}
                </p>
                {userBook.book.page_count && userBook.current_page !== null && (
                  <p className="text-sm text-gray-600 mt-1">
                    Avancement: {Math.round((userBook.current_page / userBook.book.page_count) * 100)}% ({userBook.current_page} / {userBook.book.page_count} pages)
                  </p>
                )}
                {userBook.rating !== null && (
                  <p className="text-sm text-gray-600">Note: {userBook.rating}/5</p>
                )}
              </CardContent>
              <div className="p-4 pt-0 flex justify-between items-center space-x-2">
                <Link href={`/library/${userBook.id}`} className="flex-1">
                  <Button className="w-full">Voir les détails</Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent navigation
                    setBookToArchiveId(userBook.id);
                    setShowArchiveConfirmModal(true);
                  }}
                >
                  {isCurrentlyArchived ? 'Désarchiver' : 'Archiver'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent navigation
                    setBookToDeleteId(userBook.id);
                    setShowConfirmModal(true);
                  }}
                >
                  Supprimer
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleDeleteBook}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer ce livre de votre bibliothèque ? Cette action est irréversible."
      />

      {/* Calcul de l'état d'archivage pour le modal */}
      {(() => {
        const bookToArchive = books.find(b => b.id === bookToArchiveId);
        const isCurrentlyArchived = bookToArchive?.is_archived || false;
        
        return (
          <ConfirmModal
            isOpen={showArchiveConfirmModal}
            onClose={() => setShowArchiveConfirmModal(false)}
            onConfirm={() => handleArchiveBook(bookToArchiveId!)}
            title={isCurrentlyArchived ? "Confirmer le désarchivage" : "Confirmer l'archivage"}
            message={isCurrentlyArchived 
              ? "Êtes-vous sûr de vouloir désarchiver ce livre ?" 
              : "Êtes-vous sûr de vouloir archiver ce livre ? Il sera masqué de la vue par défaut."
            }
          />
        );
      })()}
    </div>
  );
}