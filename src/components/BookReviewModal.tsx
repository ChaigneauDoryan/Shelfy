'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import BookReviewForm from '@/components/BookReviewForm';
import type { UserBookReviewSummary } from '@/types/domain';

interface BookReviewModalProps {
  userBookId: string | null;
  isOpen: boolean;
  initialReview?: UserBookReviewSummary | null;
  onClose: () => void;
  onSaved: (review: UserBookReviewSummary) => void;
}

export default function BookReviewModal({
  userBookId,
  isOpen,
  initialReview,
  onClose,
  onSaved,
}: BookReviewModalProps) {
  const { toast } = useToast();
  const [review, setReview] = useState<UserBookReviewSummary | null>(initialReview ?? null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setReview(initialReview ?? null);
  }, [initialReview]);

  useEffect(() => {
    if (!isOpen || !userBookId || initialReview) {
      return;
    }

    const abortController = new AbortController();
    const fetchReview = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/library/${userBookId}/review`, {
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error('Impossible de charger l’avis existant.');
        }
        const data = await response.json();
        setReview(data.review ?? null);
      } catch (error: unknown) {
        const description = error instanceof Error ? error.message : 'Erreur lors du chargement de l’avis.';
        toast({
          title: 'Erreur',
          description,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReview();
    return () => abortController.abort();
  }, [isOpen, userBookId, initialReview, toast]);

  const handleSaved = (nextReview: UserBookReviewSummary) => {
    setReview(nextReview);
    onSaved(nextReview);
  };

  const content = useMemo(
    () => (
      <BookReviewForm
        userBookId={userBookId ?? ''}
        initialReview={review}
        onSaved={handleSaved}
        onCancel={onClose}
      />
    ),
    [userBookId, onClose, review]
  );

  if (!userBookId) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Donne ton avis global</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        ) : (
          content
        )}
      </DialogContent>
    </Dialog>
  );
}
