'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface ChapterSummaryFormProps {
  userBookId: string;
  chapters: Array<{ id: string; chapter_number: number; title?: string; page_start?: number; page_end?: number }>;
  onSummaryAdded: () => void; // Callback to refresh summaries list
}

export function ChapterSummaryForm({ userBookId, chapters, onSummaryAdded }: ChapterSummaryFormProps) {
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [summaryText, setSummaryText] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedChapterId || !summaryText.trim()) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un chapitre et saisir un résumé.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/user-books/${userBookId}/chapters/${selectedChapterId}/summaries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ summaryText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save summary.');
      }

      toast({ title: 'Succès', description: 'Résumé de chapitre enregistré.' });
      setSummaryText('');
      setSelectedChapterId('');
      onSummaryAdded(); // Refresh the list of summaries
    } catch (error: any) {
      console.error('Error saving chapter summary:', error);
      toast({ title: 'Erreur', description: error.message || 'Échec de l\'enregistrement du résumé.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="chapter-select">Sélectionner un Chapitre</Label>
      <Select onValueChange={setSelectedChapterId} value={selectedChapterId}>
        <SelectTrigger id="chapter-select">
          <SelectValue placeholder="Sélectionner un chapitre" />
        </SelectTrigger>
        <SelectContent>
          {chapters.map((chapter) => (
            <SelectItem key={chapter.id} value={chapter.id}>
              Chapitre {chapter.chapter_number}: {chapter.title || 'Sans titre'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Label htmlFor="summary-text" className="mt-4">Ajouter un Résumé</Label>
      <Textarea
        placeholder="Saisissez votre résumé ici."
        id="summary-text"
        value={summaryText}
        onChange={(e) => setSummaryText(e.target.value)}
        rows={5}
      />
      <Button onClick={handleSubmit} disabled={isSaving} className="mt-2">
        {isSaving ? 'Enregistrement...' : 'Enregistrer le Résumé'}
      </Button>
    </div>
  );
}
