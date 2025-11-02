'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { GroupBook, Book, Poll, PollOption, Vote } from "@prisma/client";
import { useSession } from "next-auth/react";

interface PollDisplayProps {
  groupId: string;
  isAdmin: boolean; // Nouvelle prop
}

interface PollWithDetails extends Poll {
  options: (PollOption & { groupBook: { book: Book }, votes: Vote[] })[];
}

export default function PollDisplay({ groupId, isAdmin }: PollDisplayProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [activePolls, setActivePolls] = useState<PollWithDetails[]>([]);
  const [pastPolls, setPastPolls] = useState<PollWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({}); // pollId -> hasVoted

  useEffect(() => {
    fetchPolls();
    console.log('Current userId:', userId);
    console.log('Current userVotes state:', userVotes);
  }, [groupId, userId]);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const pollsResponse = await fetch(`/api/groups/${groupId}/polls`);
      if (!pollsResponse.ok) {
        throw new Error('Failed to fetch polls');
      }
      const pollsData: PollWithDetails[] = await pollsResponse.json();

      const now = new Date();
      const active = pollsData.filter(poll => new Date(poll.end_date) > now);
      const past = pollsData.filter(poll => new Date(poll.end_date) <= now);

      setActivePolls(active);
      setPastPolls(past);

      // Check user's votes for active polls
      const votes: Record<string, boolean> = {};
      active.forEach(poll => {
        const hasVoted = poll.options.some(option =>
          option.votes.some(vote => vote.user_id === userId)
        );
        votes[poll.id] = hasVoted;
      });
      setUserVotes(votes);

    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Échec du chargement des sondages.',
        variant: 'destructive',
      });
      console.error('Error fetching polls for display:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: string, pollOptionId: string) => {
    if (!userId) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour voter.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pollOptionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec du vote.');
      }

      toast({
        title: 'Succès',
        description: 'Votre vote a été enregistré.',
      });
      router.refresh(); // Re-fetch data
      fetchPolls(); // Refresh local state
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Échec du vote.',
        variant: 'destructive',
      });
      console.error('Error voting:', error);
    }
  };

  const handleSetCurrentReading = async (pollId: string) => {
    if (!userId) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour effectuer cette action.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/polls/${pollId}/set-current-reading`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de la définition de la lecture en cours.');
      }

      toast({
        title: 'Succès',
        description: 'Le livre gagnant a été défini comme lecture en cours.',
      });
      router.refresh(); // Re-fetch data for the whole page
      fetchPolls(); // Refresh local state
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Échec de la définition de la lecture en cours.',
        variant: 'destructive',
      });
      console.error('Error setting current reading book:', error);
    }
  };

  if (loading) {
    return <p>Chargement des sondages...</p>;
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
                        <Button
                          onClick={() => handleSetCurrentReading(poll.id)}
                          className="mt-2"
                          size="sm"
                        >
                          Définir comme lecture en cours
                        </Button>
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
