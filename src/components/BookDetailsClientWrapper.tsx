'use client';

import { useState } from 'react';
import AddCommentForm from '@/components/AddCommentForm';
import BookCommentTimeline from '@/components/BookCommentTimeline';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components
import { useToast } from '@/hooks/use-toast'; // Import useToast
import type { AwardedBadge, UserBookWithBook } from '@/types/domain';

interface BookDetailsClientWrapperProps {
  userBookId: string;
  userBook: UserBookWithBook;
}

interface UpdateStatusResponse {
  updatedBook: UserBookWithBook;
  awardedBadges: AwardedBadge[];
}

type ReadingStatus = 'to_read' | 'reading' | 'finished';

export default function BookDetailsClientWrapper({ userBookId, userBook: initialUserBook }: BookDetailsClientWrapperProps) {
  const [userBook, setUserBook] = useState<UserBookWithBook>(initialUserBook); // Use state for userBook
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const { toast } = useToast(); // Initialize useToast

  const handleCommentAdded = () => {
    setRefreshKey(prevKey => prevKey + 1);
    setShowCommentForm(false);
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
      setUserBook(updatedBook); // Update the book details

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{userBook.book.title}</CardTitle>
        <CardDescription>{userBook.book.author}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start space-x-4">
          {userBook.book.cover_url && (
            <img
              src={userBook.book.cover_url}
              alt={`Couverture de ${userBook.book.title}`}
              className="w-32 h-48 object-contain flex-shrink-0"
            />
          )}
          <div>
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
        <div className="flex justify-end mb-4">
          <Button onClick={() => setShowCommentForm(!showCommentForm)}>
            {showCommentForm ? 'Annuler' : 'Ajouter un commentaire'}
          </Button>
        </div>
        {showCommentForm && (
          <AddCommentForm userBookId={userBookId} onCommentAdded={handleCommentAdded} />
        )}
        {userBook.book.page_count && (
          <BookCommentTimeline
            userBookId={userBookId}
            totalBookPages={userBook.book.page_count}
            refreshKey={refreshKey}
          />
        )}
      </div>
    </Card>
  );
}
