'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast'; // Import useToast

interface Comment {
  id: string;
  page_number: number;
  comment_text: string;
  created_at: string;
}

interface BookCommentTimelineProps {
  userBookId: string;
  totalBookPages: number;
  refreshKey: number;
}

export default function BookCommentTimeline({ userBookId, totalBookPages, refreshKey }: BookCommentTimelineProps) {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const { toast } = useToast(); // Initialize useToast

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      setError(null);
      try {
        if (status === 'loading') {
          setLoading(true); // Garder le loading state actif pendant le chargement de la session
          return;
        }
        if (status !== 'authenticated') {
          toast({
            title: 'Erreur d\'authentification',
            description: "Utilisateur non authentifié ou session expirée.",
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/user-books/${userBookId}/comments`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setComments(data);
      } catch (error: unknown) {
        const description =
          error instanceof Error ? error.message : 'Impossible de charger les commentaires pour le moment.';
        toast({
          title: 'Erreur de chargement des commentaires',
          description,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [userBookId, refreshKey, status, toast]); // Ajouter 'toast' aux dépendances

  if (loading) {
    return <p>Chargement des commentaires...</p>;
  }

  // L'erreur est maintenant gérée par le toast, donc pas besoin de l'afficher ici
  // if (error) {
  //   return <p className="text-red-500">Erreur lors du chargement des commentaires : {error}</p>;
  // }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Timeline des commentaires</h2>
      {comments.length === 0 ? (
        <p>Aucun commentaire pour ce livre.</p>
      ) : (
        <div className="relative">
          {/* Ligne verticale centrale */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gray-200 h-full"></div>

          {comments.map((comment, index) => {
            const isEven = index % 2 === 0; // Pour alterner gauche/droite
            return (
              <div key={comment.id} className={`mb-8 flex items-center w-full ${isEven ? 'justify-start' : 'justify-end'}`}>
                {/* Point sur la ligne */}
                <div className={`absolute z-10 w-4 h-4 bg-blue-500 rounded-full ${isEven ? 'left-1/2 -translate-x-1/2' : 'left-1/2 -translate-x-1/2'}`}></div>

                <div className={`w-5/12 ${isEven ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                  <Card className="w-full cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedComment(comment)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-lg">Page {comment.page_number}</h3>
                        <span className="text-sm text-gray-500">{format(new Date(comment.created_at), 'dd MMMM yyyy', { locale: fr })}</span>
                      </div>
                      <p className="text-gray-700 line-clamp-2">{comment.comment_text}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedComment && (
        <Card className="mt-8 p-4">
          <CardContent className="pt-4">
            <h3 className="font-semibold text-xl mb-2">Commentaire (Page {selectedComment.page_number})</h3>
            <p className="text-gray-700">{selectedComment.comment_text}</p>
            <p className="text-xs text-gray-500 mt-4">Créé le : {format(new Date(selectedComment.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
