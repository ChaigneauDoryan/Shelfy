'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';

interface AddCommentFormProps {
  userBookId: string;
  onCommentAdded: (pageNumber: number) => void;
}

export default function AddCommentForm({ userBookId, onCommentAdded }: AddCommentFormProps) {
  const { data: session, status } = useSession();
  const [pageNumber, setPageNumber] = useState<string>('');
  const [commentTitle, setCommentTitle] = useState<string>('');
  const [commentText, setCommentText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (status !== 'authenticated') {
        throw new Error("Utilisateur non authentifié.");
      }

      const response = await fetch(`/api/user-books/${userBookId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_number: parseInt(pageNumber),
          comment_title: commentTitle,
          comment_text: commentText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      toast({
        title: 'Succès',
        description: 'Commentaire ajouté avec succès !',
      });
      setPageNumber('');
      setCommentTitle('');
      setCommentText('');
      onCommentAdded(Number(pageNumber)); // Notify parent to refresh comments
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'Impossible d’ajouter le commentaire.';
      toast({
        title: 'Erreur',
        description,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Ajouter un commentaire d'avancement</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pageNumber">Page actuelle</Label>
            <Input
              id="pageNumber"
              type="number"
              value={pageNumber}
              onChange={(e) => setPageNumber(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="commentTitle">Titre du commentaire</Label>
            <Input
              id="commentTitle"
              type="text"
              value={commentTitle}
              onChange={(e) => setCommentTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="commentText">Commentaire</Label>
            <Textarea
              id="commentText"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Ajout en cours...' : 'Ajouter le commentaire'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
