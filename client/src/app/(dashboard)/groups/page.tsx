import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaPlus, FaUsers, FaBookOpen } from 'react-icons/fa';
import GroupCard from '@/components/GroupCard';

// Fonction pour récupérer les groupes de l'utilisateur
async function getUserGroups(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      role,
      groups (*,
        group_members(count),
        group_invitations(count)
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user groups:', error);
    return [];
  }

  // Extraire les données des groupes, le count des membres et le rôle de l'utilisateur
  return data.map((item: any) => ({
    ...item.groups,
    members_count: item.groups.group_members[0]?.count || 0,
    pending_invitations_count: item.groups.group_invitations[0]?.count || 0,
    user_role: item.role, // Ajouter le rôle de l'utilisateur dans ce groupe
  }));
}

export default async function GroupsPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  const myGroups = user ? await getUserGroups(supabase, user.id) : [];
  const canInvite = myGroups.some((group: any) => group.user_role === 'admin');

  return (
    <div className="space-y-8 p-4">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">Vos Groupes de Lecture</h1>
          <p className="text-lg text-gray-600 mt-2">Connectez-vous avec d'autres passionnés de lecture.</p>
        </div>
        <div className="flex space-x-4">
          {canInvite && (
            <Link href="/groups/invite">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md flex items-center">
                <FaPlus className="mr-2" /> Inviter un membre
              </Button>
            </Link>
          )}
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
              <GroupCard key={group.id} group={group} currentUserId={user?.id || ''} />
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