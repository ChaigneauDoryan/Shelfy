import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaPlus, FaUsers, FaBookOpen } from 'react-icons/fa';

// Fonction pour récupérer les groupes de l'utilisateur
async function getUserGroups(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      groups (*)
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user groups:', error);
    return [];
  }

  // Extraire les données des groupes de la jointure
  return data.map((item: any) => item.groups);
}

export default async function GroupsPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  const myGroups = user ? await getUserGroups(supabase, user.id) : [];

  return (
    <div className="space-y-8 p-4">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">Vos Groupes de Lecture</h1>
          <p className="text-lg text-gray-600 mt-2">Connectez-vous avec d'autres passionnés de lecture.</p>
        </div>
        <div className="flex space-x-4">
          <Link href="/groups/invite">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md flex items-center">
              <FaPlus className="mr-2" /> Inviter un membre
            </Button>
          </Link>
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
              <Card key={group.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
                <CardHeader className="flex flex-row items-center space-x-4 p-4">
                  <img src={group.avatar_url || `https://via.placeholder.com/150/33FF57/FFFFFF?text=${group.name.substring(0, 2)}`} alt={group.name} className="w-16 h-16 rounded-full object-cover border-2 border-blue-500" />
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900">{group.name}</CardTitle>
                    {/* Note: Le nombre de membres n'est pas directement disponible, nous mettons un placeholder */}
                    <p className="text-sm text-gray-500 flex items-center"><FaUsers className="mr-1" /> N/A membres</p>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-gray-700 mb-3 line-clamp-2">{group.description || 'Aucune description.'}</p>
                  {/* Note: Le livre actuel n'est pas disponible, nous mettons un placeholder */}
                  <p className="text-sm text-gray-600 flex items-center"><FaBookOpen className="mr-1" /> Lecture actuelle: <span className="font-medium ml-1">Non défini</span></p>
                  <Button className="w-full mt-4 bg-green-500 hover:bg-green-600">Voir le groupe</Button>
                </CardContent>
              </Card>
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