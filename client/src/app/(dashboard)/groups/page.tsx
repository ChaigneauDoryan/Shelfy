'use client';

import { createClient } from "@/lib/supabase/client";
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

export default function GroupsPage() {
  const supabase = createClient();
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [invitationCode, setInvitationCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false); // Nouvel état pour la modale
  const { toast } = useToast();

  const fetchAndSetGroups = async (userId: string) => {
    const { data, error } = await supabase
      .from('group_members')
      .select(
        `
          role,
          groups (*,
            group_members(count),
            invitation_code
          )
        `
      )
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user groups:', error);
    } else {
      const groups = data.map((item: any) => ({
        ...item.groups,
        members_count: item.groups.group_members[0]?.count || 0,
        user_role: item.role,
      }));
      setMyGroups(groups);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchAndSetGroups(user.id);
      }
      setLoading(false);
    };

    fetchUser();
  }, [supabase]);

  const handleJoinGroup = async () => {
    if (!invitationCode) {
      toast({ title: 'Erreur', description: 'Veuillez saisir un code d\'invitation.', variant: 'destructive' });
      return;
    }
    setIsJoining(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('Utilisateur non authentifié.');
      }

      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ invitationCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec pour rejoindre le groupe.');
      }

      toast({ title: 'Succès', description: 'Vous avez rejoint le groupe !' });
      setIsJoinModalOpen(false); // Fermer la modale en cas de succès
      setInvitationCode(''); // Réinitialiser le champ du code
      if (user) {
        await fetchAndSetGroups(user.id); // Re-fetch groups
      }
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-8 p-4">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">Vos Groupes de Lecture</h1>
          <p className="text-lg text-gray-600 mt-2">Connectez-vous avec d'autres passionnés de lecture.</p>
        </div>
        <div className="flex space-x-4">
          <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}> {/* Contrôlé par l'état */}
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

      {/* Section Mes Groupes */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Mes Groupes</h2>
        {myGroups && myGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGroups.map((group: any) => (
              <GroupCard key={group.id} group={group} currentUserId={user?.id || ''} onGroupChange={() => user && fetchAndSetGroups(user.id)} />
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

      {/* Section Découvrir des Groupes (Placeholder) */}
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
