import type { FormEvent, ReactElement } from 'react';

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, StarHalf } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import type { UserBookReviewSummary } from '@/types/domain';

interface BookReviewFormProps {
  userBookId: string;
  initialReview?: UserBookReviewSummary | null;
  onSaved: (review: UserBookReviewSummary) => void;
  onCancel?: () => void;
}

const STAR_COUNT = 5;

const renderStars = (rating: number) => {
  const elements: ReactElement[] = [];
  for (let index = 1; index <= STAR_COUNT; index++) {
    const floor = index - 1;
    if (rating >= index) {
      elements.push(<Star key={`full-${index}`} className="text-amber-500" />);
    } else if (rating > floor) {
      elements.push(<StarHalf key={`half-${index}`} className="text-amber-500" />);
    } else {
      elements.push(<Star key={`empty-${index}`} className="text-muted-foreground" />);
    }
  }
  return elements;
};

export default function BookReviewForm({ userBookId, initialReview, onSaved, onCancel }: BookReviewFormProps) {
  const [rating, setRating] = useState(initialReview?.rating ?? 3);
  const [comment, setComment] = useState(initialReview?.comment_text ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rating < 0.5 || comment.trim().length === 0) {
      toast({
        title: 'Erreur',
        description: 'Merci de renseigner une note et un commentaire.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/library/${userBookId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment_text: comment.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Impossible de sauvegarder votre avis.');
      }

      const data = await response.json();
      if (data.review) {
        onSaved(data.review);
        toast({
          title: 'Succès',
          description: 'Votre avis a été enregistré.',
        });
      }
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'Impossible d\'enregistrer votre avis.';
      toast({
        title: 'Erreur',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRatingChange = (value: number) => {
    const normalized = Math.max(0.5, Math.min(5, value));
    setRating(normalized);
  };

  return (
    <Card className="mb-6 border border-border">
      <CardHeader>
        <CardTitle>Ajouter / modifier mon avis</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Note</Label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0.5}
                max={5}
                step={0.5}
                value={rating}
                onChange={event => handleRatingChange(Number(event.target.value))}
                className="flex-1 accent-amber-500"
              />
              <span className="text-sm font-semibold">{rating.toFixed(1)}/5</span>
            </div>
            <div className="flex gap-1 text-lg">{renderStars(rating)}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-comment">Commentaire</Label>
            <Textarea
              id="review-comment"
              minLength={10}
              maxLength={2000}
              rows={4}
              value={comment}
              onChange={event => setComment(event.target.value)}
              placeholder="Décris ce que tu as aimé ou retenu de cette lecture."
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            {onCancel && (
              <Button variant="outline" type="button" onClick={onCancel} disabled={isSaving}>
                Annuler
              </Button>
            )}
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer mon avis'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
