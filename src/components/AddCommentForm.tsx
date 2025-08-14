'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface AddCommentFormProps {
  userBookId: string;
  onCommentAdded: () => void;
}

export default function AddCommentForm({ userBookId, onCommentAdded }: AddCommentFormProps) {
  const [pageNumber, setPageNumber] = useState<string>('');
  const [commentTitle, setCommentTitle] = useState<string>('');
  const [commentText, setCommentText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error("Utilisateur non authentifié.");
      }

      const response = await fetch(`/api/user-books/${userBookId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
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
      onCommentAdded(); // Notify parent to refresh comments
    } catch (e: any) {
      toast({
        title: 'Erreur',
        description: e.message,
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
