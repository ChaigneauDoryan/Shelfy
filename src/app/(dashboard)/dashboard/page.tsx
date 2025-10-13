
import { Suspense } from "react";
import { getSession } from "@/lib/auth"; // Notre nouveau helper
import { getUserBooks, getReadingStatusId } from "@/lib/book-utils"; // Nos fonctions Prisma

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CurrentlyReading, CurrentlyReadingSkeleton } from "@/components/dashboard/CurrentlyReading";
import { RecentlyFinished, RecentlyFinishedSkeleton } from "@/components/dashboard/RecentlyFinished";
import { redirect } from "next/navigation";

// Ce composant récupère et affiche les livres en cours de lecture
async function CurrentlyReadingData() {
  const session = await getSession();
  if (!session?.user?.id) return <CurrentlyReading books={[]} />;

  const readingStatusId = await getReadingStatusId('reading');
  const currentlyReadingBooks = await getUserBooks(session.user.id, readingStatusId, false);
  return <CurrentlyReading books={currentlyReadingBooks || []} />;
}

// Ce composant récupère et affiche les livres récemment terminés
async function RecentlyFinishedData() {
  const session = await getSession();
  if (!session?.user?.id) return <RecentlyFinished books={[]} />;

  const finishedStatusId = await getReadingStatusId('finished');
  const recentlyFinishedBooks = await getUserBooks(session.user.id, finishedStatusId, false);
  
  const sortedBooks = (recentlyFinishedBooks || []).sort((a: any, b: any) => 
    new Date(b.finished_at).getTime() - new Date(a.finished_at).getTime()
  ).slice(0, 4);

  return <RecentlyFinished books={sortedBooks} />;
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    // Normalement géré par le middleware, mais c'est une sécurité supplémentaire
    redirect('/auth/login');
  }

  return (
    <div className="space-y-8">
      <DashboardHeader username={session.user.name || 'lecteur'} />

      <Suspense fallback={<CurrentlyReadingSkeleton />}>
        <CurrentlyReadingData />
      </Suspense>

      <Suspense fallback={<RecentlyFinishedSkeleton />}>
        <RecentlyFinishedData />
      </Suspense>
    </div>
  );
}
