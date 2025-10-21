'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { generateAvatarFromText } from '@/lib/avatar-utils';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

interface PendingRequest {
  id: string;
  groupId: string;
  group: {
    id: string;
    name: string;
    description?: string | null;
    avatar_url?: string | null;
    members_count: number;
  };
  createdAt: string;
}

export default function MyPendingGroupRequests() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const user = session?.user;

  const { data: pendingRequests, isLoading } = useQuery<PendingRequest[]>({ 
    queryKey: ['pendingGroupRequests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch('/api/groups/my-pending-requests');
      if (!response.ok) {
        throw new Error('Failed to fetch pending requests.');
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return <p>Chargement de vos demandes en attente...</p>;
  }

  if (!pendingRequests || pendingRequests.length === 0) {
    return null; // Don't render the section if there are no pending requests
  }

  return (
    <Card className="p-6">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-2xl font-semibold text-foreground">Mes Demandes en Attente</CardTitle>
        <p className="text-muted-foreground">Voici les groupes que vous avez demandé à rejoindre.</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {pendingRequests.map((request) => {
            const avatarSrc = request.group.avatar_url || (request.group.name ? generateAvatarFromText(request.group.name, 64) : undefined);
            return (
              <Card key={request.id} className="flex items-center p-4 space-x-4">
                <Image 
                  src={avatarSrc || 'https://via.placeholder.com/64'} 
                  alt={request.group.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                />
                <div>
                  <CardTitle className="text-lg font-semibold">{request.group.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Demande envoyée le {new Date(request.createdAt).toLocaleDateString()}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
