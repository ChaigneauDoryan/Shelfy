'use client';

import { useState } from 'react';
import AddCommentForm from '@/components/AddCommentForm';
import BookCommentTimeline from '@/components/BookCommentTimeline';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Added Card, CardHeader, CardTitle, CardDescription

interface BookDetailsClientWrapperProps {
  userBookId: string;
  userBook: any; // Pass the entire userBook object
}

export default function BookDetailsClientWrapper({ userBookId, userBook }: BookDetailsClientWrapperProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCommentAdded = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <Card> {/* Wrap everything in a Card */}
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
      {/* Add the AddCommentForm and BookCommentTimeline below the CardContent */}
      <div className="p-4"> {/* Add padding for the forms */}
        <AddCommentForm userBookId={userBookId} onCommentAdded={handleCommentAdded} />
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
