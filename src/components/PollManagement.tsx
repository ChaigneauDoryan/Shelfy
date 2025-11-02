'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { GroupBook, Book, Poll, PollOption, Vote } from "@prisma/client";

interface PollManagementProps {
  groupId: string;
}

interface SuggestedBook extends GroupBook {
  book: Book;
  voteCount: number;
}

interface PollWithDetails extends Poll {
  options: (PollOption & { groupBook: { book: Book }, votes: Vote[] })[];
}

export default function PollManagement({ groupId }: PollManagementProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [suggestedBooks, setSuggestedBooks] = useState<SuggestedBook[]>([]);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [endDate, setEndDate] = useState<string>('');
  const [activePolls, setActivePolls] = useState<PollWithDetails[]>([]);
  const [pastPolls, setPastPolls] = useState<PollWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestionsAndPolls();
  }, [groupId]);

  const fetchSuggestionsAndPolls = async () => {
    setLoading(true);
    try {
      // Fetch suggested books
      const suggestionsResponse = await fetch(`/api/groups/${groupId}/suggestions`);
      if (!suggestionsResponse.ok) {
        throw new Error('Failed to fetch suggested books');
      }
      const suggestionsData: SuggestedBook[] = await suggestionsResponse.json();
      setSuggestedBooks(suggestionsData);

      // Fetch polls
      const pollsResponse = await fetch(`/api/groups/${groupId}/polls`);
      if (!pollsResponse.ok) {
        throw new Error('Failed to fetch polls');
      }
      const pollsData: PollWithDetails[] = await pollsResponse.json();

      const now = new Date();
      setActivePolls(pollsData.filter(poll => new Date(poll.end_date) > now));
      setPastPolls(pollsData.filter(poll => new Date(poll.end_date) <= now));

    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Échec du chargement des données.',
        variant: 'destructive',
      });
      console.error('Error fetching data for poll management:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (bookId: string) => {
    setSelectedBookIds(prev =>
      prev.includes(bookId) ? prev.filter(id => id !== bookId) : [...prev, bookId]
    );
  };

  const handleCreatePoll = async () => {
    if (selectedBookIds.length < 2) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner au moins deux livres pour le sondage.',
        variant: 'destructive',
      });
      return;
    }
    if (!endDate) {
      toast({
        title: 'Erreur',
        description: 'Veuillez définir une date butoir pour le sondage.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/polls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupBookIds: selectedBookIds,
          endDate: new Date(endDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de la création du sondage.');
      }

      toast({
        title: 'Succès',
        description: 'Sondage créé avec succès.',
      });
      setSelectedBookIds([]);
      setEndDate('');
      router.refresh(); // Re-fetch data
      fetchSuggestionsAndPolls(); // Refresh local state
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Échec de la création du sondage.',
        variant: 'destructive',
      });
      console.error('Error creating poll:', error);
    }
  };

  if (loading) {
    return <p>Chargement des sondages et suggestions...</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Créer un nouveau sondage</CardTitle>
          <CardDescription>Sélectionnez les livres et définissez une date butoir pour le vote.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="endDate">Date butoir du sondage</Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="space-y-2">
            <Label>Livres suggérés disponibles</Label>
            {suggestedBooks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun livre suggéré disponible pour un sondage.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestedBooks.map(suggestion => (
                  <div key={suggestion.id} className="flex items-center space-x-2 p-2 border rounded-md">
                    <Checkbox
                      id={suggestion.id}
                      checked={selectedBookIds.includes(suggestion.id)}
                      onCheckedChange={() => handleCheckboxChange(suggestion.id)}
                    />
                    <Label htmlFor={suggestion.id} className="flex items-center space-x-2 cursor-pointer">
                      <img src={suggestion.book.cover_url || '/file.svg'} alt={suggestion.book.title} className="w-10 h-14 object-cover" />
                      <div>
                        <p className="font-medium">{suggestion.book.title}</p>
                        <p className="text-sm text-muted-foreground">{suggestion.book.author}</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button onClick={handleCreatePoll} disabled={selectedBookIds.length < 2 || !endDate}>Créer le sondage</Button>
        </CardContent>
      </Card>
    </div>
  );
}
