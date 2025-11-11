'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePolls } from '@/hooks/usePolls';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Ajouté précédemment
import { Label } from "@/components/ui/label"; // Nouvelle ligne
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { GroupBook, Book, Poll, PollOption, Vote } from "@prisma/client";
import { useSession } from "next-auth/react";

interface PollDisplayProps {
  groupId: string;
  isAdmin: boolean;
  currentlyReadingGroupBookId: string | null; // Nouvelle prop
}

interface PollWithDetails extends Poll {
  options: (PollOption & { groupBook: { book: Book }, votes: Vote[] })[];
}

export default function PollDisplay({ groupId, isAdmin, currentlyReadingGroupBookId }: PollDisplayProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [selectedReadingEndDate, setSelectedReadingEndDate] = useState('');

  const { data: pollsData, isLoading, error } = usePolls(groupId, !!userId);

  const { activePolls, pastPolls, userVotes } = useMemo(() => {
    if (!pollsData) return { activePolls: [], pastPolls: [], userVotes: {} };

    const now = new Date();
    const active = pollsData.filter(poll => new Date(poll.end_date) > now);
    const past = pollsData.filter(poll => new Date(poll.end_date) <= now);

    const votes: Record<string, boolean> = {};
    active.forEach(poll => {
      const hasVoted = poll.options.some(option =>
        option.votes.some(vote => vote.user_id === userId)
      );
      votes[poll.id] = hasVoted;
    });

    return { activePolls: active, pastPolls: past, userVotes: votes };
  }, [pollsData, userId]);

  const queryClient = useQueryClient();

  const voteMutation = useMutation({
    mutationFn: async ({ pollId, pollOptionId }: { pollId: string, pollOptionId: string }) => {
      const response = await fetch(`/api/groups/${groupId}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollOptionId }),
      });
      if (!response.ok) throw new Error('Failed to vote');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', groupId] });
      toast({ title: 'Succès', description: 'Votre vote a été enregistré.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const handleVote = (pollId: string, pollOptionId: string) => {
    if (!userId) {
      toast({ title: 'Erreur', description: 'Vous devez être connecté pour voter.', variant: 'destructive' });
      return;
    }
    voteMutation.mutate({ pollId, pollOptionId });
  };

  const setCurrentReadingMutation = useMutation({
    mutationFn: async ({ pollId, readingEndDate }: { pollId: string, readingEndDate: string }) => {
      const response = await fetch(`/api/groups/${groupId}/polls/${pollId}/set-current-reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readingEndDate }),
      });
      if (!response.ok) throw new Error('Failed to set current reading book');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groupBookData'] }); // Invalidate group book data as well
      toast({ title: 'Succès', description: 'Le livre gagnant a été défini comme lecture en cours.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const handleSetCurrentReading = (pollId: string) => {
    if (!userId) {
      toast({ title: 'Erreur', description: 'Vous devez être connecté pour effectuer cette action.', variant: 'destructive' });
      return;
    }
    if (!selectedReadingEndDate) {
      toast({ title: 'Erreur', description: 'Veuillez définir une date de fin de lecture.', variant: 'destructive' });
      return;
    }
    setCurrentReadingMutation.mutate({ pollId, readingEndDate: selectedReadingEndDate });
  };

  if (isLoading) {
    return <p>Chargement des sondages...</p>;
  }

  if (error) {
    return <p>Erreur lors du chargement des sondages: {error.message}</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sondage actif</CardTitle>
        </CardHeader>
        <CardContent>
          {activePolls.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun sondage actif pour le moment.</p>
          ) : (
            activePolls.map(poll => (
              <Card key={poll.id} className="p-4">
                <CardTitle className="text-lg">Sondage jusqu'au {new Date(poll.end_date).toLocaleString()}</CardTitle>
                <div className="mt-2 space-y-2">
                  {poll.options
                    .sort((a, b) => b.votes.length - a.votes.length) // Sort by vote count descending
                    .map(option => (
                    <div key={option.id} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center space-x-2">
                        <img src={option.groupBook.book.cover_url || '/file.svg'} alt={option.groupBook.book.title} className="w-10 h-14 object-cover" />
                        <div>
                          <p className="font-medium">{option.groupBook.book.title} ({option.votes.length} votes)</p>
                          <p className="text-sm text-muted-foreground">{option.groupBook.book.author}</p>
                        </div>
                      </div>
                      {!userVotes[poll.id] && (
                        <Button onClick={() => handleVote(poll.id, option.id)} size="sm">
                          Voter
                        </Button>
                      )}
                      {userVotes[poll.id] && (
                        <span className="text-sm text-muted-foreground">Vous avez voté</span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des sondages</CardTitle>
        </CardHeader>
        <CardContent>
          {pastPolls.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun sondage passé.</p>
          ) : (
            <div className="space-y-4">
              {pastPolls.map(poll => {
                const maxVotes = Math.max(...poll.options.map(option => option.votes.length));
                const winners = poll.options.filter(option => option.votes.length === maxVotes);

                return (
                  <Card key={poll.id} className="p-4 opacity-70">
                    <CardTitle className="text-lg">Sondage terminé le {new Date(poll.end_date).toLocaleString()}</CardTitle>
                    <div className="mt-2 space-y-2">
                      {winners.length === 1 ? (
                        <p className="font-semibold text-green-600">Livre gagnant: {winners[0].groupBook.book.title}</p>
                      ) : (
                        <p className="font-semibold text-yellow-600">Égalité entre: {winners.map(w => w.groupBook.book.title).join(', ')}</p>
                      )}
                      {isAdmin && winners.length === 1 && (
                        <>
                          <div className="mt-4">
                            <Label htmlFor={`readingEndDate-${poll.id}`}>Date de fin de lecture (optionnel)</Label>
                            <Input
                              id={`readingEndDate-${poll.id}`}
                              type="datetime-local"
                              value={selectedReadingEndDate}
                              onChange={e => setSelectedReadingEndDate(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <Button
                            onClick={() => handleSetCurrentReading(poll.id)}
                            className="mt-2"
                            size="sm"
                            disabled={winners[0].groupBook.id === currentlyReadingGroupBookId} // Nouvelle prop utilisée ici
                          >
                            Définir comme lecture en cours
                          </Button>
                        </>
                      )}
                      {poll.options.map(option => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <img src={option.groupBook.book.cover_url || '/file.svg'} alt={option.groupBook.book.title} className="w-8 h-12 object-cover" />
                          <p>{option.groupBook.book.title} ({option.votes.length} votes)</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
