'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { Book, GroupBook } from "@prisma/client";

interface GroupCurrentReadingBookProps {
  groupId: string;
  groupBook: GroupBook & { book: Book, reading_end_date?: Date | null };
}

interface Comment {
  id: string;
  userId: string;
  pageNumber: number;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

const MAX_COMMENT_LENGTH = 2000;

export default function GroupCurrentReadingBook({ groupId, groupBook }: GroupCurrentReadingBookProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data, isLoading, error } = useGroupBookData(groupId, groupBook.id, !!userId);

  const currentPage = data?.progress?.currentPage || 0;
  const groupedComments = useMemo(() => {
    if (!data?.comments) return {};
    return data.comments.reduce((acc, comment) => {
      const page = comment.pageNumber;
      if (!acc[page]) acc[page] = [];
      acc[page].push(comment);
      return acc;
    }, {} as Record<number, Comment[]>);
  }, [data?.comments]);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ pageNumber, content }: { pageNumber: number, content: string }) => {
      // 1. Mettre à jour la progression
      const progressResponse = await fetch(`/api/groups/${groupId}/books/${groupBook.id}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPage: pageNumber }),
      });
      if (!progressResponse.ok) throw new Error('Failed to update progress');

      // 2. Poster le commentaire
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
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const handleAddComment = () => {
    if (commentPageNumber <= 0 || commentPageNumber > (groupBook.book.page_count || 9999)) {
      toast({ title: 'Erreur', description: 'Veuillez entrer un numéro de page valide.', variant: 'destructive' });
      return;
    }
    if (commentContent.trim() === '') {
      toast({ title: 'Erreur', description: 'Le commentaire ne peut pas être vide.', variant: 'destructive' });
      return;
    }
    mutation.mutate({ pageNumber: commentPageNumber, content: commentContent });
  };

  const timelineItems = (() => {
    let left = true;
    return Object.keys(groupedComments)
      .sort((a, b) => parseInt(b) - parseInt(a))
      .map(pageNumber => {
        const commentsForPage = groupedComments[parseInt(pageNumber)];
        const direction = left ? 'left' : 'right';
        left = !left;
        return {
          id: pageNumber,
          title: `Page ${pageNumber}`,
          direction: direction,
          description: (
            <div className="space-y-3">
              {commentsForPage.map(comment => {
                const isBlurred = comment.pageNumber > currentPage;
                return (
                  <div key={comment.id} className={`pl-4 border-l-2 border-gray-200 ${isBlurred ? 'blur-sm' : ''}`}>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">{comment.user.name}</p>
                      <p className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString()}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                  </div>
                );
              })}
            </div>
          ),
        };
      });
  })();

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
            Date de fin de lecture: {new Date(groupBook.reading_end_date).toLocaleDateString()}
          </p>
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

        {/* Section Commentaires */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Commentaires</h3>

          {/* Formulaire d’ajout */}
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
              <Button onClick={handleAddComment}>Poster le commentaire</Button>
            </div>
          </div>

          <div className="relative">
            {/* ligne verticale centrale */}
            <div className="absolute left-1/2 top-0 transform -translate-x-1/2 h-full w-1 bg-slate-200" />

            <div className="flex flex-col space-y-16 mt-6">
              {timelineItems.map((item, idx) => {
                const isLeft = item.direction === 'left';
                return (
                  <div
                    key={item.id}
                    className={`relative flex items-center justify-between md:justify-normal md:gap-8 ${
                      isLeft ? 'md:flex-row-reverse' : 'md:flex-row'
                    }`}
                  >
                    {/* bloc commentaire */}
                    <div
                      className={`bg-white shadow-md hover:shadow-lg transition-shadow duration-200 rounded-2xl p-4 md:w-[45%] ${
                        isLeft ? 'md:ml-auto' : 'md:mr-auto'
                      }`}
                    >
                      <h4 className="font-semibold text-sm md:text-base mb-2">{item.title}</h4>
                      {item.description}
                    </div>

                    {/* point central */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-5 h-5 bg-blue-500 rounded-full border-4 border-white shadow-md" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
