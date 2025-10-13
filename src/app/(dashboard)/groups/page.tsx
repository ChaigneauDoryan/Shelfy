'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaPlus } from 'react-icons/fa';
import GroupCard from '@/components/GroupCard';
import { useEffect, useState } from "react";
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

export default function GroupsPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitationCode, setInvitationCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchAndSetGroups = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await fetch('/api/groups/my-groups');
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      const data = await response.json();
      setMyGroups(data);
    } catch (error) {
      console.error('Error fetching user groups:', error);
      toast({ title: 'Erreur', description: 'Échec du chargement des groupes.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAndSetGroups();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [user, status]);

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
      fetchAndSetGroups(); // Re-fetch groups
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setIsJoining(false);
    }
  };

  if (loading || status === 'loading') {
    return <div>Chargement...</div>;
  }

  if (!user) {
    return <div>Veuillez vous connecter pour voir vos groupes.</div>;
  }

  return (
    <div className="space-y-8 p-4">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">Vos Groupes de Lecture</h1>
          <p className="text-lg text-gray-600 mt-2">Connectez-vous avec d'autres passionnés de lecture.</p>
        </div>
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
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Mes Groupes</h2>
        {myGroups && myGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGroups.map((group: any) => (
              <GroupCard key={group.id} group={group} currentUserId={user?.id || ''} onGroupChange={fetchAndSetGroups} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-gray-300 p-6 text-center">
            <CardHeader>
              <CardTitle className="text-gray-700">Vous n'êtes dans aucun groupe</CardTitle>
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
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Découvrir des Groupes</h2>
        <Card className="border-dashed border-2 border-gray-300 p-6 text-center">
          <CardHeader>
            <CardTitle className="text-gray-700">Bientôt disponible !</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Explorez et rejoignez de nouveaux groupes de lecture ici.</p>
            <Button variant="secondary" className="mt-4">Rechercher des groupes</Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}