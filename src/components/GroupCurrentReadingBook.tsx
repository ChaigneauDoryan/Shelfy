'use client';

import React, { useState, useEffect } from 'react';
import { useGroupBookData } from '@/hooks/useGroupBookData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Book, GroupBook, RoleInGroup } from "@prisma/client";
import { useGroupDetails } from '@/hooks/useGroupDetails';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Star, StarHalf } from 'lucide-react';
import GroupBookCommentTimeline from './GroupBookCommentTimeline'; // Import the new component

interface GroupCurrentReadingBookProps {
  groupId: string;
  groupBook: GroupBook & { book: Book, reading_end_date?: Date | null };
}

const MAX_COMMENT_LENGTH = 2000;

export default function GroupCurrentReadingBook({ groupId, groupBook }: GroupCurrentReadingBookProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const { data: groupDetails } = useGroupDetails(groupId);
  const isAdmin = groupDetails?.members.some(member => member.user.id === userId && member.role === RoleInGroup.ADMIN) || false;

  const [commentPageNumber, setCommentPageNumber] = useState(0);
  const [commentContent, setCommentContent] = useState('');
  const [readingEndDateInput, setReadingEndDateInput] = useState<string>(
    groupBook.reading_end_date ? format(new Date(groupBook.reading_end_date), "yyyy-MM-dd'T'HH:mm") : ''
  );
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number>(0);

  const { data, isLoading, error, refetch } = useGroupBookData(groupId, groupBook.id, !!userId);

  const addCommentMutation = useMutation({
    mutationFn: async ({ pageNumber, content }: { pageNumber: number, content: string }) => {
      const progressResponse = await fetch(`/api/groups/${groupId}/books/${groupBook.id}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPage: pageNumber }),
      });
      if (!progressResponse.ok) throw new Error('Failed to update progress');

      const commentResponse = await fetch(`/api/groups/${groupId}/books/${groupBook.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageNumber, content }),
      });
      if (!commentResponse.ok) throw new Error('Failed to add comment');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupBookData', groupId, groupBook.id] });
      toast({ title: 'Succès', description: 'Commentaire et progression mis à jour avec succès.' });
      setCommentContent('');
      setCommentPageNumber(0);
    },
    onError: (error: unknown) => {
      const description = error instanceof Error ? error.message : 'Impossible d’ajouter le commentaire.';
      toast({ title: 'Erreur', description, variant: 'destructive' });
    },
  });

  const updateReadingEndDateMutation = useMutation({
    mutationFn: async (dateString: string) => {
      const date = dateString ? new Date(dateString) : null;
      const response = await fetch(`/api/groups/${groupId}/books/${groupBook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reading_end_date: date ? date.toISOString() : null }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de la mise à jour de la date de fin de lecture.');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['groupBookData', groupId, groupBook.id] });
      queryClient.invalidateQueries({ queryKey: ['groupDetails', groupId] });
      toast({ title: 'Succès', description: 'Date de fin de lecture mise à jour.' });
      setReadingEndDateInput(data.groupBook.reading_end_date ? format(new Date(data.groupBook.reading_end_date), "yyyy-MM-dd'T'HH:mm") : '');
    },
    onError: (error: unknown) => {
      const description = error instanceof Error ? error.message : 'Impossible de mettre à jour la date de fin de lecture.';
      toast({ title: 'Erreur', description, variant: 'destructive' });
    },
  });

  const updateRatingMutation = useMutation({
    mutationFn: async (rating: number | null) => {
      const response = await fetch(`/api/groups/${groupId}/books/${groupBook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de la mise à jour de la note.');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['groupBookData', groupId, groupBook.id] });
      toast({ title: 'Succès', description: 'Note mise à jour avec succès.' });
      setUserRating(data.progress.rating);
    },
    onError: (error: unknown) => {
      const description = error instanceof Error ? error.message : 'Impossible de mettre à jour la note.';
      toast({ title: 'Erreur', description, variant: 'destructive' });
    },
  });

  const finishBookMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/groups/${groupId}/books/${groupBook.id}/finish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de la mise à jour du statut du livre.');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Le livre a été marqué comme terminé.' });
    },
    onError: (error: unknown) => {
      const description = error instanceof Error ? error.message : 'Impossible de terminer le livre.';
      toast({ title: 'Erreur', description, variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (groupBook.reading_end_date) {
      const endDate = new Date(groupBook.reading_end_date);
      const now = new Date();
      if (endDate > now) {
        const timeUntilEnd = endDate.getTime() - now.getTime();
        const timer = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['groupDetails', groupId] });
          finishBookMutation.mutate(); // Call the new mutation
        }, timeUntilEnd);
        return () => clearTimeout(timer);
      }
    }
  }, [groupBook.reading_end_date, groupId, queryClient, finishBookMutation]);

  useEffect(() => {
    if (data?.progress?.rating !== undefined) {
      setUserRating(data.progress.rating);
    }
  }, [data?.progress?.rating]);

  const currentPage = data?.progress?.currentPage || 0;

  const handleAddComment = () => {
    if (commentPageNumber <= 0 || commentPageNumber > (groupBook.book.page_count || 9999)) {
      toast({ title: 'Erreur', description: 'Veuillez entrer un numéro de page valide.', variant: 'destructive' });
      return;
    }
    if (commentContent.trim() === '') {
      toast({ title: 'Erreur', description: 'Le commentaire ne peut pas être vide.', variant: 'destructive' });
      return;
    }
    addCommentMutation.mutate({ pageNumber: commentPageNumber, content: commentContent });
  };

  const handleUpdateReadingEndDate = () => {
    updateReadingEndDateMutation.mutate(readingEndDateInput);
  };

  const handleRatingChange = (newRating: number) => {
    updateRatingMutation.mutate(newRating);
  }; // Add finishBookMutation to dependencies

  if (isLoading) {
    return <div>Chargement des données du livre...</div>;
  }

  if (error) {
    return <div>Erreur lors du chargement des données: {error.message}</div>;
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Livre en cours de lecture : {groupBook.book.title}</CardTitle>
        <CardDescription>{groupBook.book.author}</CardDescription>
        {groupBook.reading_end_date && (
          <p className="text-sm text-muted-foreground">
            Date de fin de lecture: {format(new Date(groupBook.reading_end_date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
          </p>
        )}
        {isAdmin && (
          <div className="flex items-center space-x-2 mt-4">
            <Label htmlFor="readingEndDate" className="whitespace-nowrap">Modifier la date de fin:</Label>
            <Input
              id="readingEndDate"
              type="datetime-local"
              value={readingEndDateInput}
              onChange={e => setReadingEndDateInput(e.target.value)}
              className="w-[240px]"
            />
            <Button onClick={handleUpdateReadingEndDate} disabled={updateReadingEndDateMutation.isPending}>
              {updateReadingEndDateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <img
            src={groupBook.book.cover_url || '/file.svg'}
            alt={groupBook.book.title}
            className="w-24 h-36 object-cover rounded-md shadow-sm"
          />
          <div>
            <p className="text-sm text-muted-foreground">{groupBook.book.description?.substring(0, 200)}...</p>
            <p className="text-sm text-muted-foreground">Pages: {groupBook.book.page_count || 'N/A'}</p>
          </div>
        </div>

        {/* Section de vote par étoiles */}
        {groupBook.reading_end_date && new Date() > new Date(groupBook.reading_end_date) && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Votre note</h3>
            {userRating ? (
              <>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((starIndex) => {
                    if (userRating >= starIndex) {
                      return <Star key={starIndex} className="h-6 w-6 text-yellow-500 fill-yellow-500" />;
                    }
                    if (userRating >= starIndex - 0.5) {
                      return <StarHalf key={starIndex} className="h-6 w-6 text-yellow-500 fill-yellow-500" />;
                    }
                    return <Star key={starIndex} className="h-6 w-6 text-gray-300" />;
                  })}
                </div>
                <p className="text-sm text-muted-foreground">Vous avez noté ce livre : {userRating}/5</p>
              </>
            ) : (
              <div className="flex items-center space-x-1" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  const ratingToShow = hoverRating || userRating || 0;
                  return (
                    <div
                      key={starIndex}
                      className="relative cursor-pointer"
                      onClick={() => {
                        if (hoverRating > 0) {
                          handleRatingChange(hoverRating);
                        }
                      }}
                    >
                      <div
                        className="absolute top-0 left-0 h-full w-1/2 z-10"
                        onMouseEnter={() => setHoverRating(starIndex - 0.5)}
                      />
                      <div
                        className="absolute top-0 right-0 h-full w-1/2 z-10"
                        onMouseEnter={() => setHoverRating(starIndex)}
                      />
                      {ratingToShow >= starIndex ? (
                        <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                      ) : ratingToShow >= starIndex - 0.5 ? (
                        <StarHalf className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <Star className="h-6 w-6 text-gray-300" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Section Commentaires */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Commentaires</h3>

          {(!groupBook.reading_end_date || new Date() < new Date(groupBook.reading_end_date)) && (
            <div className="space-y-4 p-4 border rounded-md bg-gray-50">
              <h4 className="font-medium text-lg">Ajouter un commentaire</h4>
              <div className="space-y-2">
                <Label htmlFor="commentPageNumber">Page du commentaire</Label>
                <Input
                  id="commentPageNumber"
                  type="number"
                  placeholder="Numéro de page"
                  value={commentPageNumber}
                  onChange={e => setCommentPageNumber(parseInt(e.target.value))}
                  min={1}
                  max={groupBook.book.page_count || 9999}
                  className="w-full md:w-32"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commentContent">Votre commentaire</Label>
                <Textarea
                  id="commentContent"
                  placeholder="Écrivez votre commentaire ici..."
                  value={commentContent}
                  onChange={e => {
                    if (e.target.value.length <= MAX_COMMENT_LENGTH) {
                      setCommentContent(e.target.value);
                    }
                  }}
                  rows={4}
                  maxLength={MAX_COMMENT_LENGTH}
                />
                <p className="text-sm text-muted-foreground text-right">
                  {commentContent.length} / {MAX_COMMENT_LENGTH}
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleAddComment} disabled={addCommentMutation.isPending}>
                  {addCommentMutation.isPending ? 'Publication...' : 'Poster le commentaire'}
                </Button>
              </div>
            </div>
          )}

          <GroupBookCommentTimeline comments={data?.comments || []} currentPage={currentPage} />
        </div>
      </CardContent>
    </Card>
  );
}
