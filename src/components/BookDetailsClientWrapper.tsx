'use client';

import { useEffect, useState } from 'react';
import AddCommentForm from '@/components/AddCommentForm';
import BookCommentTimeline from '@/components/BookCommentTimeline';
import BookReviewSummary from '@/components/BookReviewSummary';
import BookReviewModal from '@/components/BookReviewModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components
import { useToast } from '@/hooks/use-toast'; // Import useToast
import Link from 'next/link';
import type {
  AwardedBadge,
  UserBookReviewSummary,
  UserBookWithBook,
  UserBookWithBookForClient,
  ReadingStatus,
} from '@/types/domain';

import type { UpdateStatusResponse } from '@/types/api';

interface BookDetailsClientWrapperProps {
  userBookId: string;
  userBook: UserBookWithBookForClient;
}

const normalizeReview = (review: UserBookWithBook['review']): UserBookReviewSummary | null => {
  if (!review) {
    return null;
  }
  return {
    id: review.id,
    rating: review.rating,
    comment_text: review.comment_text,
    updated_at: typeof review.updated_at === 'string' ? review.updated_at : review.updated_at.toISOString(),
  };
};

const toClientUserBook = (book: UserBookWithBook): UserBookWithBookForClient => ({
  ...book,
  review: normalizeReview(book.review),
});

export default function BookDetailsClientWrapper({ userBookId, userBook: initialUserBook }: BookDetailsClientWrapperProps) {
  const [userBook, setUserBook] = useState<UserBookWithBookForClient>(initialUserBook); // Use state for userBook
  const [review, setReview] = useState<UserBookReviewSummary | null>(initialUserBook.review ?? null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isFinalizingStatus, setIsFinalizingStatus] = useState(false);
  const { toast } = useToast(); // Initialize useToast
  const isBookFinished = userBook.status_id === 3;

  useEffect(() => {
    if (isBookFinished && showCommentForm) {
      setShowCommentForm(false);
    }
  }, [isBookFinished, showCommentForm]);

  const handleCommentAdded = (pageNumber: number) => {
    setRefreshKey(prevKey => prevKey + 1);
    setShowCommentForm(false);
    if (userBook.book.page_count && pageNumber >= userBook.book.page_count) {
      finalizeAndOpenReview();
    }
  };

  const finalizeAndOpenReview = async () => {
    if (isFinalizingStatus) {
      return;
    }

    if (userBook.status_id === 3) {
      openReviewModal();
      return;
    }

    setIsFinalizingStatus(true);
    try {
      const response = await fetch(`/api/library/${userBookId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'finished' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Impossible de terminer le livre.');
      }

      const { updatedBook } = (await response.json()) as UpdateStatusResponse;
      setUserBook(toClientUserBook(updatedBook));
      openReviewModal();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossible de marquer le livre comme terminé.';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsFinalizingStatus(false);
    }
  };

  const handleStatusChange = async (newStatus: ReadingStatus) => {
    try {
      const response = await fetch(`/api/library/${userBookId}/status`, {
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

      const { updatedBook, awardedBadges } = (await response.json()) as UpdateStatusResponse;
      setUserBook(toClientUserBook(updatedBook)); // Update the book details
      if (newStatus === 'finished') {
        openReviewModal();
      }

      // Display toast for awarded badges
      if (awardedBadges && awardedBadges.length > 0) {
        awardedBadges.forEach((badge) => {
          toast({
            title: 'Nouveau badge débloqué !',
            description: `Vous avez obtenu le badge : ${badge.name}`,
          });
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossible de mettre à jour le statut du livre.';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const canReview = userBook.status_id === 3;
  const openReviewModal = () => setIsReviewModalOpen(true);
  const closeReviewModal = () => setIsReviewModalOpen(false);
  const handleReviewSaved = (nextReview: UserBookReviewSummary) => {
    setReview(nextReview);
    setRefreshKey(prev => prev + 1);
    setUserBook(prev => ({
      ...prev,
      rating: nextReview.rating,
    }));
    closeReviewModal();
  };

  return (
    <Card>
      <div className="px-6 pt-6">
        <Button asChild variant="secondary">
          <Link href="/library">Retour à ma bibliothèque</Link>
        </Button>
      </div>
      <CardHeader>
        <CardTitle>{userBook.book.title}</CardTitle>
        <CardDescription>{userBook.book.author}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start">
          {userBook.book.cover_url && (
            <img
              src={userBook.book.cover_url}
              alt={`Couverture de ${userBook.book.title}`}
              className="w-32 h-48 object-contain flex-shrink-0 self-center sm:self-start"
            />
          )}
          <div className="w-full">
            <p className="text-sm text-gray-600 mb-4">{userBook.book.description}</p>
            <div className="flex items-center space-x-2">
              <p className="text-sm">Statut :</p>
              <Select onValueChange={handleStatusChange} defaultValue={userBook.status_id === 1 ? 'to_read' : userBook.status_id === 2 ? 'reading' : 'finished'}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to_read">À lire</SelectItem>
                  <SelectItem value="reading">En cours</SelectItem>
                  <SelectItem value="finished">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm">Page actuelle : {userBook.current_page}</p>
            {/* Add more book details as needed */}
          </div>
        </div>
      </CardContent>
      <div className="p-4">
        <div className="flex flex-col items-center gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            onClick={() => {
              if (isBookFinished) {
                return;
              }
              setShowCommentForm(prev => !prev);
            }}
            disabled={isBookFinished}
          >
            {showCommentForm ? 'Annuler' : 'Ajouter un commentaire'}
          </Button>
          {isBookFinished && (
            <p className="text-sm text-muted-foreground sm:ml-4">
              Les commentaires d’avancement ne sont plus disponibles pour un livre terminé.
            </p>
          )}
        </div>
        {showCommentForm && (
          <AddCommentForm
            userBookId={userBookId}
            onCommentAdded={handleCommentAdded}
            isBookFinished={isBookFinished}
          />
        )}
        {review && <BookReviewSummary review={review} onEdit={openReviewModal} />}
        {canReview && (
          <div className="mb-4 flex justify-end">
            <Button variant="outline" onClick={openReviewModal}>
              {review ? 'Modifier mon avis global' : 'Ajouter un avis global'}
            </Button>
          </div>
        )}
        {userBook.book.page_count && (
          <BookCommentTimeline
            userBookId={userBookId}
            totalBookPages={userBook.book.page_count}
            refreshKey={refreshKey}
          />
        )}
      </div>
      <BookReviewModal
        isOpen={isReviewModalOpen}
        userBookId={userBookId}
        initialReview={review}
        onClose={closeReviewModal}
        onSaved={handleReviewSaved}
      />
    </Card>
  );
}
