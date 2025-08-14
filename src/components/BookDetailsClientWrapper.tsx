'use client';

import { useState } from 'react';
import AddCommentForm from '@/components/AddCommentForm';
import BookCommentTimeline from '@/components/BookCommentTimeline';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Keep Button for "Ajouter un commentaire"

interface BookDetailsClientWrapperProps {
  userBookId: string;
  userBook: any; // Pass the entire userBook object
}

export default function BookDetailsClientWrapper({ userBookId, userBook }: BookDetailsClientWrapperProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCommentForm, setShowCommentForm] = useState(false); // State for form visibility

  const handleCommentAdded = () => {
    setRefreshKey(prevKey => prevKey + 1);
    setShowCommentForm(false); // Hide form after comment is added
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{userBook.book.title}</CardTitle>
        <CardDescription>{userBook.book.author}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start space-x-4">
          {userBook.book.cover_url && (
            <img
              src={userBook.book.cover_url}
              alt={`Couverture de ${userBook.book.title}`}
              className="w-32 h-48 object-contain flex-shrink-0"
            />
          )}
          <div>
            <p className="text-sm text-gray-600 mb-4">{userBook.book.description}</p>
            <p className="text-sm">Statut : {userBook.status_id}</p>
            <p className="text-sm">Page actuelle : {userBook.current_page}</p>
            {/* Add more book details as needed */}
          </div>
        </div>
      </CardContent>
      <div className="p-4">
        <div className="flex justify-end mb-4"> {/* Adjusted for delete button */}
          <Button onClick={() => setShowCommentForm(!showCommentForm)}>
            {showCommentForm ? 'Annuler' : 'Ajouter un commentaire'}
          </Button>
        </div>
        {showCommentForm && ( // Conditionally render the form
          <AddCommentForm userBookId={userBookId} onCommentAdded={handleCommentAdded} />
        )}
        {userBook.book.page_count && (
          <BookCommentTimeline
            userBookId={userBookId}
            totalBookPages={userBook.book.page_count}
            refreshKey={refreshKey}
          />
        )}
      </div>
    </Card>
  );
}
