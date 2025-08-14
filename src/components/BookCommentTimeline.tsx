'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';

interface Comment {
  id: string;
  page_number: number;
  comment_text: string;
  created_at: string;
  updated_at: string;
  comment_title: string;
}

interface BookCommentTimelineProps {
  userBookId: string;
  totalBookPages: number;
  refreshKey: number; // New prop
}

export default function BookCommentTimeline({ userBookId, totalBookPages, refreshKey }: BookCommentTimelineProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const supabase = createClient(); // Client-side Supabase client

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session }, } = await supabase.auth.getSession();

        if (!session || !session.access_token) { // Check for session and access_token
          setError("Utilisateur non authentifié ou session expirée.");
          setLoading(false);
          return;
        }
        const accessToken = session.access_token;

        const response = await fetch(`/api/user-books/${userBookId}/comments`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setComments(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [userBookId, supabase, refreshKey]);

  if (loading) {
    return <p>Chargement des commentaires...</p>;
  }

  if (error) {
    return <p className="text-red-500">Erreur lors du chargement des commentaires : {error}</p>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Timeline des commentaires</h2>
      <div className="relative w-full h-4 bg-gray-200 rounded-full mb-8">
        {/* Timeline bar */}
        {comments.map((comment) => {
          const position = (comment.page_number / totalBookPages) * 100;
          return (
            <div
              key={comment.id}
              className="absolute w-4 h-4 bg-blue-500 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 top-1/2"
              style={{ left: `${position}%` }}
              onClick={() => setSelectedComment(comment)}
              title={comment.comment_title} // Use comment_title for title
            ></div>
          );
        })}
      </div>

      {selectedComment && (
        <Card className="mt-4">
          <CardContent className="pt-4">
            <h3 className="font-semibold text-lg mb-2">{selectedComment.comment_title} (Page {selectedComment.page_number})</h3>
            <p className="text-gray-700">{selectedComment.comment_text}</p>
            <p className="text-xs text-gray-500 mt-2">Créé le : {new Date(selectedComment.created_at).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      )}

      {comments.length === 0 && (
        <p>Aucun commentaire pour ce livre.</p>
      )}
    </div>
  );
}
