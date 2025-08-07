
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user?.id)
    .single();

  // Données factices pour l'instant
  const readingNow = [
    { title: "Dune", author: "Frank Herbert", progress: 75 },
    { title: "Le Problème à trois corps", author: "Cixin Liu", progress: 40 },
  ];

  const recentActivity = [
    "Vous avez ajouté 'Dune' à votre bibliothèque.",
    "Vous avez terminé 'Project Hail Mary'.",
    "Vous avez noté 'Le Nom du vent' 5 étoiles.",
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-800">Bonjour, {profile?.username || 'lecteur'} !</h1>
        <p className="text-gray-600">Ravi de vous revoir. Voici un aperçu de votre univers de lecture.</p>
      </header>

      {/* Section Mes Lectures en Cours */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Mes Lectures en Cours</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {readingNow.map((book) => (
            <Card key={book.title}>
              <CardHeader>
                <CardTitle>{book.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">par {book.author}</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${book.progress}%` }}></div>
                </div>
                <p className="text-right text-sm text-gray-600 mt-2">{book.progress}%</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section Activité Récente */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Activité Récente</h2>
        <Card>
          <CardContent className="p-6">
            <ul className="space-y-4">
              {recentActivity.map((activity, index) => (
                <li key={index} className="text-gray-700">{activity}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
