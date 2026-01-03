'use client';

import type { ReactElement } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, StarHalf } from 'lucide-react';

import type { UserBookReviewSummary } from '@/types/domain';

interface BookReviewSummaryProps {
  review: UserBookReviewSummary;
  onEdit?: () => void;
}

const renderStars = (rating: number) => {
  const stars: ReactElement[] = [];
  for (let index = 1; index <= 5; index++) {
    const lowerBound = index - 1;
    if (rating >= index) {
      stars.push(<Star key={`star-${index}`} className="text-amber-500" />);
    } else if (rating > lowerBound) {
      stars.push(<StarHalf key={`star-half-${index}`} className="text-amber-500" />);
    } else {
      stars.push(<Star key={`star-empty-${index}`} className="text-muted-foreground" />);
    }
  }
  return stars;
};

export default function BookReviewSummary({ review, onEdit }: BookReviewSummaryProps) {
  const rating = review.rating;

  return (
    <Card className="mb-6">
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle className="text-base">Mon avis</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{rating.toFixed(1)} / 5</span>
            <span>&middot;</span>
            <span>Mis à jour le {format(new Date(review.updated_at), 'dd MMMM yyyy', { locale: fr })}</span>
          </div>
        </div>
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Modifier
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">{renderStars(rating)}</div>
        <p className="text-sm text-foreground whitespace-pre-line">{review.comment_text}</p>
      </CardContent>
    </Card>
  );
}
