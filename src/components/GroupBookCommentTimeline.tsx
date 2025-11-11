'use client';

import React, { useMemo } from 'react';

interface Comment {
  id: string;
  userId: string;
  pageNumber: number;
  content: string;
  createdAt: string;
  user: {
    id:string;
    name: string | null;
    image: string | null;
  };
}

interface GroupBookCommentTimelineProps {
  comments: Comment[];
  currentPage: number;
}

export default function GroupBookCommentTimeline({ comments, currentPage }: GroupBookCommentTimelineProps) {
  const groupedComments = useMemo(() => {
    if (!comments) return {};
    return comments.reduce((acc, comment) => {
      const page = comment.pageNumber;
      if (!acc[page]) acc[page] = [];
      acc[page].push(comment);
      return acc;
    }, {} as Record<number, Comment[]>);
  }, [comments]);

  const timelineItems = useMemo(() => {
    let left = true;
    return Object.keys(groupedComments)
      .sort((a, b) => parseInt(b) - parseInt(a)) // Sort by page number descending for the timeline
      .map(pageNumber => {
        const commentsForPage = groupedComments[parseInt(pageNumber)];
        const direction = left ? 'left' : 'right';
        left = !left;
        return {
          id: pageNumber,
          title: `Page ${pageNumber}`,
          direction: direction,
          description: (
            <div className="space-y-3">
              {commentsForPage.map(comment => {
                const isBlurred = comment.pageNumber > currentPage;
                return (
                  <div key={comment.id} className={`pl-4 border-l-2 border-gray-200 ${isBlurred ? 'blur-sm' : ''}`}>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">{comment.user.name}</p>
                      <p className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString()}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                  </div>
                );
              })}
            </div>
          ),
        };
      });
  }, [groupedComments, currentPage]);

  if (comments.length === 0) {
    return <p>Aucun commentaire pour ce livre.</p>;
  }

  return (
    <div className="relative">
      {/* Central vertical line */}
      <div className="absolute left-1/2 top-0 transform -translate-x-1/2 h-full w-1 bg-slate-200" />

      <div className="flex flex-col space-y-16 mt-6">
        {timelineItems.map((item) => {
          const isLeft = item.direction === 'left';
          return (
            <div
              key={item.id}
              className={`relative flex items-center justify-between md:justify-normal md:gap-8 ${
                isLeft ? 'md:flex-row-reverse' : 'md:flex-row'
              }`}
            >
              {/* Comment block */}
              <div
                className={`bg-white shadow-md hover:shadow-lg transition-shadow duration-200 rounded-2xl p-4 md:w-[45%] ${
                  isLeft ? 'md:ml-auto' : 'md:mr-auto'
                }`}
              >
                <h4 className="font-semibold text-sm md:text-base mb-2">{item.title}</h4>
                {item.description}
              </div>

              {/* Central point */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-5 h-5 bg-blue-500 rounded-full border-4 border-white shadow-md" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
