
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/components/layout/PageContainer';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import type { Book } from '@prisma/client';
import type { AwardedBadge, UserLibraryBook } from '@/types/domain';
import BookReviewModal from '@/components/BookReviewModal';

// Composant modal custom pour éviter les problèmes avec ConfirmModal
const CustomConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message 
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) => {
  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Empêcher le scroll du body
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      {/* Overlay cliquable */}
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
      
      {/* Contenu de la modal */}
      <div className="relative mx-4 w-full max-w-md rounded-lg bg-card p-6 text-card-foreground shadow-lg">
        {/* Bouton de fermeture */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Titre */}
        <h2 className="text-lg font-semibold mb-4 pr-8">{title}</h2>
        
        {/* Message */}
        <p className="mb-6 text-muted-foreground">{message}</p>
        
        {/* Boutons */}
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Confirmer
          </Button>
        </div>
      </div>
    </div>
  );
};

const READING_STATUSES = [
  { name: 'all', label: 'Tous les livres', bgColorClass: 'bg-gray-400' },
  { name: 'to_read', label: 'À lire', bgColorClass: 'bg-blue-500' },
  { name: 'reading', label: 'En cours', bgColorClass: 'bg-yellow-500' },
  { name: 'finished', label: 'Terminé', bgColorClass: 'bg-green-500' },
];

const ARCHIVE_STATUSES = [
  { name: 'all', label: 'Tous les livres (Archive)', queryValue: undefined },
  { name: 'non_archived', label: 'Non archivés', queryValue: false },
  { name: 'archived', label: 'Archivés', queryValue: true },
];

export default function LibraryPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [books, setBooks] = useState<UserLibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterArchiveStatus, setFilterArchiveStatus] = useState<string>('all');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewModalBookId, setReviewModalBookId] = useState<string | null>(null);
  
  // États pour les modales
  const [modals, setModals] = useState({
    delete: { isOpen: false, bookId: null as string | null },
    archive: { isOpen: false, bookId: null as string | null }
  });

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    document.title = 'Shelfy - Mes Livres';
  }, []);

  const fetchBooks = async (statusFilter?: string, archivedFilter?: boolean | undefined) => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      let url = `/api/library?`;
      if (statusFilter && statusFilter !== 'all') {
        url += `status=${statusFilter}&`;
      }
      if (archivedFilter !== undefined) {
        url += `archived=${archivedFilter}&`;
      }
      url = url.slice(0, -1);

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: UserLibraryBook[] = await response.json();
      setBooks(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossible de charger les livres.';
      setError(message);
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Fonctions pour gérer les modales
  const closeModal = (type: 'delete' | 'archive') => {
    setModals(prev => ({
      ...prev,
      [type]: { isOpen: false, bookId: null }
    }));
  };

  const openModal = (type: 'delete' | 'archive', bookId: string) => {
    setModals(prev => ({
      ...prev,
      [type]: { isOpen: true, bookId }
    }));
  };

  const getArchiveFilterValue = () => ARCHIVE_STATUSES.find(s => s.name === filterArchiveStatus)?.queryValue;
  const reloadLibrary = async () => {
    const archiveFilter = getArchiveFilterValue();
    await fetchBooks(filterStatus, archiveFilter);
  };

  const openReviewModal = (bookId: string) => {
    setReviewModalBookId(bookId);
    setIsReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
  };

  const handleReviewSaved = async () => {
    await reloadLibrary();
    closeReviewModal();
  };

  const handleDeleteBook = async () => {
    const bookId = modals.delete.bookId;
    if (!bookId) return;

    try {
      const response = await fetch(`/api/library/${bookId}`, {
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
      
      // Recharger les données
      await reloadLibrary();
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossible de supprimer le livre.';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleArchiveBook = async () => {
    const bookId = modals.archive.bookId;
    if (!bookId) return;

    try {
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
      
      // Recharger les données
      await reloadLibrary();
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossible de modifier l’archive.';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (bookId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/library/${bookId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update book status.');
      }

      const { awardedBadges } = (await response.json()) as { awardedBadges?: AwardedBadge[] };

      if (awardedBadges && awardedBadges.length > 0) {
        awardedBadges.forEach((badge) => {
          toast({
            title: 'Nouveau badge débloqué !',
            description: `Vous avez obtenu le badge : ${badge.name}`,
            // icon: badge.icon_name, // L'icône n'est pas gérée ici
          });
        });
      }

      await reloadLibrary();
      if (newStatus === 'finished') {
        openReviewModal(bookId);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossible de mettre à jour le statut.';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (user?.id) {
      reloadLibrary();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [filterStatus, filterArchiveStatus, user, status]);

  // Obtenir les infos du livre pour l'archivage
  const getArchiveBookInfo = () => {
    if (!modals.archive.bookId) return { isCurrentlyArchived: false };
    const book = books.find(b => b.id === modals.archive.bookId);
    return { isCurrentlyArchived: book?.is_archived || false };
  };

  if (loading || status === 'loading') {
    return <p>Chargement de votre bibliothèque...</p>;
  }

  if (!user) {
    return <div>Veuillez vous connecter pour voir votre bibliothèque.</div>;
  }

  return (
    <PageContainer className="pb-32 md:pb-12">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Ma Bibliothèque</h1>
        <Link href="/library/add-book" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">Ajouter un Nouveau Livre</Button>
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
        <Select onValueChange={setFilterStatus} defaultValue={filterStatus}>
          <SelectTrigger className="w-full md:w-[200px]">
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
          <SelectTrigger className="w-full md:w-[200px]">
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

      {!loading && !error && books.length === 0 && (
        <p className="text-lg text-muted-foreground">
          {filterStatus === 'all'
            ? 'Votre bibliothèque est vide. Ajoutez votre premier livre !'
            : `Aucun livre dans le statut "${READING_STATUSES.find(s => s.name === filterStatus)?.label}" pour l'instant.`
          }
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {!loading && !error && books.map((userBook) => {
          const isCurrentlyArchived = userBook?.is_archived || false;
          
          return (
            <Card key={userBook.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{userBook.book.title}</span>
                  {isCurrentlyArchived && (
                    <span className="text-xs rounded bg-muted px-2 py-1 text-muted-foreground">Archivé</span>
                  )}
                </CardTitle>
                {userBook.book.author && (
                  <p className="text-sm text-muted-foreground">par {userBook.book.author}</p>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-col gap-4 sm:flex-row">
                  {userBook.book.cover_url && (
                    <img
                      src={userBook.book.cover_url}
                      alt={userBook.book.title}
                      className="h-48 w-full rounded-md object-cover sm:h-44 sm:w-36"
                    />
                  )}
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="line-clamp-4 text-foreground">
                      {userBook.book.description || 'Aucune description disponible.'}
                    </p>
                    <p className="text-sm font-medium text-foreground flex items-center">
                      <span className={`mr-2 h-2 w-2 rounded-full ${READING_STATUSES.find(s => s.name === (userBook.status_id === 1 ? 'to_read' : userBook.status_id === 2 ? 'reading' : 'finished'))?.bgColorClass || 'bg-gray-400'}`} />
                      Statut : {READING_STATUSES.find(s => s.name === (userBook.status_id === 1 ? 'to_read' : userBook.status_id === 2 ? 'reading' : 'finished'))?.label || 'Inconnu'}
                    </p>
                    {userBook.book.page_count && userBook.current_page !== null && (
                      <p className="text-sm text-muted-foreground">
                        Avancement : {Math.round((userBook.current_page / userBook.book.page_count) * 100)}% ({userBook.current_page} / {userBook.book.page_count} pages)
                      </p>
                    )}
                    {userBook.rating !== null && (
                      <p className="text-sm text-muted-foreground">Note : {userBook.rating}/5</p>
                    )}
                  </div>
                </div>
              </CardContent>
              <div className="flex flex-col gap-2 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <Link href={`/library/${userBook.id}`} className="w-full sm:w-auto">
                  <Button className="w-full">Voir les détails</Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Modifier le statut</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onSelect={() => handleStatusChange(userBook.id, 'to_read')}>
                          <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full mr-2 bg-blue-500"></span>
                            À lire
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleStatusChange(userBook.id, 'reading')}>
                          <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full mr-2 bg-yellow-500"></span>
                            En cours
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleStatusChange(userBook.id, 'finished')}>
                          <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full mr-2 bg-green-500"></span>
                            Terminé
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem onSelect={() => openModal('archive', userBook.id)}>
                      {isCurrentlyArchived ? 'Désarchiver' : 'Archiver'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => openModal('delete', userBook.id)}>
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal de suppression avec composant custom */}
      <CustomConfirmModal
        isOpen={modals.delete.isOpen}
        onClose={() => closeModal('delete')}
        onConfirm={handleDeleteBook}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer ce livre de votre bibliothèque ? Cette action est irréversible."
      />

      {/* Modal d'archivage avec composant custom */}
      <CustomConfirmModal
        isOpen={modals.archive.isOpen}
        onClose={() => closeModal('archive')}
        onConfirm={handleArchiveBook}
        title={getArchiveBookInfo().isCurrentlyArchived ? "Confirmer le désarchivage" : "Confirmer l'archivage"}
        message={getArchiveBookInfo().isCurrentlyArchived 
          ? "Êtes-vous sûr de vouloir désarchiver ce livre ?" 
          : "Êtes-vous sûr de vouloir archiver ce livre ? Il sera masqué de la vue par défaut."
        }
      />
      <BookReviewModal
        isOpen={isReviewModalOpen}
        userBookId={reviewModalBookId}
        onClose={closeReviewModal}
        onSaved={handleReviewSaved}
      />
    </PageContainer>
  );
}
