'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import GroupBookCommentTimeline from './GroupBookCommentTimeline'; // Import the new timeline component

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

interface GroupFinishedBookDetailsProps {
  groupId: string;
  groupBookId: string;
  bookTitle: string;
  bookAuthor: string;
}

async function fetchGroupBookComments(groupId: string, groupBookId: string): Promise<Comment[]> {
  const response = await fetch(`/api/groups/${groupId}/books/${groupBookId}/comments`);
  if (!response.ok) {
    throw new Error('Failed to fetch comments');
  }
  const data = await response.json();
  return data.comments;
}

export default function GroupFinishedBookDetails({
  groupId,
  groupBookId,
  bookTitle,
  bookAuthor,
}: GroupFinishedBookDetailsProps) {
  const { data: comments, isLoading, error } = useQuery<Comment[]>({
    queryKey: ['groupBookComments', groupId, groupBookId],
    queryFn: () => fetchGroupBookComments(groupId, groupBookId),
  });

  if (isLoading) {
    return <p>Chargement des commentaires...</p>;
  }

  if (error) {
    return <p className="text-red-500">Erreur lors du chargement des commentaires: {error.message}</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{bookTitle}</CardTitle>
          <CardDescription>{bookAuthor}</CardDescription>
        </CardHeader>
      </Card>

      <h3 className="text-xl font-semibold mt-8 mb-4">Timeline des commentaires</h3>
      
      {/* Use the new timeline component */}
      <GroupBookCommentTimeline 
        comments={comments || []} 
        currentPage={Infinity} // Pass Infinity to ensure no comments are blurred
      />
    </div>
  );
}
