'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface PageCommentFormProps {
  userBookId: string;
  onCommentAdded: () => void; // Callback to refresh comments list
}

export function PageCommentForm({ userBookId, onCommentAdded }: PageCommentFormProps) {
  const [pageNumber, setPageNumber] = useState<number | string>('');
  const [chapterNumber, setChapterNumber] = useState<number | string>(''); // New state
  const [chapterTitle, setChapterTitle] = useState<string>(''); // New state
  const [commentText, setCommentText] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!commentText.trim()) { // Comment text is always required
      toast({ title: 'Erreur', description: 'Veuillez saisir un commentaire.', variant: 'destructive' });
      return;
    }

    // Validate pageNumber if provided
    const parsedPageNumber = pageNumber ? Number(pageNumber) : undefined;
    if (pageNumber !== '' && (isNaN(parsedPageNumber as number) || (parsedPageNumber as number) <= 0)) {
      toast({ title: 'Erreur', description: 'Numéro de page invalide.', variant: 'destructive' });
      return;
    }

    // Validate chapterNumber if provided
    const parsedChapterNumber = chapterNumber ? Number(chapterNumber) : undefined;
    if (chapterNumber !== '' && (isNaN(parsedChapterNumber as number) || (parsedChapterNumber as number) <= 0)) {
      toast({ title: 'Erreur', description: 'Numéro de chapitre invalide.', variant: 'destructive' });
      return;
    }

    // Ensure at least pageNumber OR chapterNumber/chapterTitle is provided
    if (parsedPageNumber === undefined && parsedChapterNumber === undefined && !chapterTitle.trim()) {
      toast({ title: 'Erreur', description: 'Veuillez saisir un numéro de page OU un numéro/titre de chapitre.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/user-books/${userBookId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageNumber: parsedPageNumber,
          chapterNumber: parsedChapterNumber,
          chapterTitle: chapterTitle.trim() || undefined,
          commentText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save comment.');
      }

      toast({ title: 'Succès', description: 'Commentaire enregistré.' });
      setPageNumber('');
      setChapterNumber('');
      setChapterTitle('');
      setCommentText('');
      onCommentAdded(); // Refresh the list of comments
    } catch (error: any) {
      console.error('Error saving page comment:', error);
      toast({ title: 'Erreur', description: error.message || 'Échec de l\'enregistrement du commentaire.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="page-number">Numéro de Page (Optionnel)</Label>
      <Input
        type="number"
        id="page-number"
        placeholder="Ex: 42"
        value={pageNumber}
        onChange={(e) => setPageNumber(e.target.value)}
      />

      <Label htmlFor="chapter-number" className="mt-4">Numéro de Chapitre (Optionnel)</Label>
      <Input
        type="number"
        id="chapter-number"
        placeholder="Ex: 3"
        value={chapterNumber}
        onChange={(e) => setChapterNumber(e.target.value)}
      />

      <Label htmlFor="chapter-title" className="mt-4">Titre du Chapitre (Optionnel)</Label>
      <Input
        type="text"
        id="chapter-title"
        placeholder="Ex: L'aventure commence"
        value={chapterTitle}
        onChange={(e) => setChapterTitle(e.target.value)}
      />

      <Label htmlFor="comment-text" className="mt-4">Commentaire</Label>
      <Textarea
        placeholder="Saisissez votre commentaire ici."
        id="comment-text"
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        rows={5}
      />
      <Button onClick={handleSubmit} disabled={isSaving} className="mt-2">
        {isSaving ? 'Enregistrement...' : 'Enregistrer le Commentaire'}
      </Button>
    </div>
  );
}
