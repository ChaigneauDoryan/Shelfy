'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaPlus } from 'react-icons/fa';
import GroupCard from '@/components/GroupCard';
import { useCallback, useEffect, useState } from "react";
import { Group, RoleInGroup } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useSession } from 'next-auth/react';
import DiscoverGroups from '@/components/DiscoverGroups';
import MyPendingGroupRequests from '@/components/MyPendingGroupRequests';
import PageHeader from '@/components/ui/PageHeader';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type GroupWithMembership = Group & {
  members_count: number;
  user_role: RoleInGroup;
  adminCount: number;
  memberCount: number;
};

export default function GroupsPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const queryClient = useQueryClient();
  const [invitationCode, setInvitationCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchAndSetGroups = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['myGroups', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['pendingGroupRequests', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['discoverGroups'] });
  }, [queryClient, user?.id]);

  useEffect(() => {
    document.title = 'Shelfy - Groups';
    fetchAndSetGroups();
  }, [fetchAndSetGroups]);

  const { data: myGroups, isLoading: isLoadingMyGroups } = useQuery<GroupWithMembership[]>({
    queryKey: ['myGroups', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch('/api/groups/my-groups');
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  const handleJoinGroup = async () => {
    if (!invitationCode) {
      toast({ title: 'Erreur', description: 'Veuillez saisir un code d\'invitation.', variant: 'destructive' });
      return;
    }
    setIsJoining(true);
    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec pour rejoindre le groupe.');
      }

      toast({ title: 'Succès', description: 'Vous avez rejoint le groupe !' });
      setIsJoinModalOpen(false);
      setInvitationCode('');
      queryClient.invalidateQueries({ queryKey: ['myGroups', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['pendingGroupRequests', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['discoverGroups'] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast({ title: 'Erreur', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoadingMyGroups || status === 'loading') {
    return <div>Chargement...</div>;
  }

  if (!user) {
    return <div>Veuillez vous connecter pour voir vos groupes.</div>;
  }


  return (
    <div className="space-y-8 p-4">
      <header className="flex justify-between items-center mb-6">
        <PageHeader
          title="Vos Groupes de Lecture"
          description="Connectez-vous avec d'autres passionnés de lecture."
        />
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full">
          <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md flex items-center">
                <FaPlus className="mr-2" /> Rejoindre un groupe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rejoindre un groupe</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input
                  placeholder="Saisissez le code d'invitation"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Annuler
                  </Button>
                </DialogClose>
                <Button onClick={handleJoinGroup} disabled={isJoining}>
                  {isJoining ? 'Rejoindre...' : 'Rejoindre'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Link href="/groups/create">
            <Button variant="outline" className="px-6 py-3 rounded-lg shadow-md flex items-center">
              <FaPlus className="mr-2" /> Créer un groupe
            </Button>
          </Link>
        </div>
      </header>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Mes Groupes</h2>
        {myGroups && myGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGroups.map((group) => (
              <GroupCard key={group.id} group={group} currentUserId={user?.id || ''} onGroupChange={fetchAndSetGroups} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-gray-300 p-6 text-center">
            <CardHeader>
              <CardTitle className="text-gray-700">Vous n&apos;êtes dans aucun groupe</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Créez un nouveau groupe ou rejoignez-en un pour commencer à discuter !</p>
              <Link href="/groups/create">
                <Button variant="secondary" className="mt-4">Créer un groupe</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="mt-10">
        <MyPendingGroupRequests />
      </section>

      <section className="mt-10">
        <DiscoverGroups />
      </section>
    </div>
  );
}
