'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { FaUsers, FaPaperPlane } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';
import { generateAvatarFromText } from '@/lib/avatar-utils';
import { useQueryClient } from '@tanstack/react-query';

interface PublicGroupCardProps {
  group: {
    id: string;
    name: string;
    description?: string | null;
    avatar_url?: string | null;
    _count: {
      members: number;
    };
  };
}

export default function PublicGroupCard({ group }: PublicGroupCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'sent'>('idle');

  const handleRequestToJoin = async () => {
    setRequestStatus('loading');
    try {
      const response = await fetch(`/api/groups/${group.id}/request-join`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send join request.');
      }

      setRequestStatus('sent');
      toast({ title: 'Succès', description: 'Votre demande pour rejoindre le groupe a été envoyée.' });
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      queryClient.invalidateQueries({ queryKey: ['pendingGroupRequests'] });
      queryClient.invalidateQueries({ queryKey: ['discoverGroups'] });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      setRequestStatus('idle');
      toast({ title: 'Erreur', description: errorMessage, variant: 'destructive' });
    }
  };

  const avatarSrc = group.avatar_url || (group.name ? generateAvatarFromText(group.name, 64) : undefined);

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col">
      <CardHeader className="flex flex-row items-center space-x-4 p-4">
        <Image 
          src={avatarSrc || 'https://via.placeholder.com/64'} 
          alt={group.name} 
          width={64}
          height={64}
          className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
        />
        <div className="flex-grow">
          <CardTitle className="text-xl font-semibold text-gray-900">{group.name}</CardTitle>
          <p className="text-sm text-gray-500 flex items-center">
            <FaUsers className="mr-1" /> {group._count.members} membre{group._count.members > 1 ? 's' : ''}
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow flex flex-col">
        <p className="text-gray-700 mb-4 line-clamp-2 flex-grow">{group.description || 'Aucune description.'}</p>
        <Button 
          onClick={handleRequestToJoin} 
          disabled={requestStatus !== 'idle'}
          className="w-full mt-auto"
        >
          <FaPaperPlane className="mr-2" />
          {requestStatus === 'idle' && 'Demander à rejoindre'}
          {requestStatus === 'loading' && 'Envoi en cours...'}
          {requestStatus === 'sent' && 'Demande envoyée'}
        </Button>
      </CardContent>
    </Card>
  );
}