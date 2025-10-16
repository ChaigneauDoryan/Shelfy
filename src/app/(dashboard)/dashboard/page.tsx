
import { Suspense } from "react";
import { getSession } from "@/lib/auth"; // Notre nouveau helper
import { getUserBooks, getReadingStatusId } from "@/lib/book-utils"; // Nos fonctions Prisma

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CurrentlyReading, CurrentlyReadingSkeleton } from "@/components/dashboard/CurrentlyReading";
import { RecentlyFinished, RecentlyFinishedSkeleton } from "@/components/dashboard/RecentlyFinished";
import { redirect } from "next/navigation";

async function CurrentlyReadingData() {
  try {
    const session = await getSession();
    if (!session?.user?.id) return <CurrentlyReading books={[]} />;

    const readingStatusId = await getReadingStatusId('reading');
    const currentlyReadingBooks = await getUserBooks(session.user.id, readingStatusId, false);
    return <CurrentlyReading books={currentlyReadingBooks || []} />;
  } catch (error) {
    console.error("Error in CurrentlyReadingData:", error);
    return <div>Error loading currently reading books.</div>;
  }
}

// Ce composant récupère et affiche les livres récemment terminés
async function RecentlyFinishedData() {
  try {
    const session = await getSession();
    if (!session?.user?.id) return <RecentlyFinished books={[]} />;

    const finishedStatusId = await getReadingStatusId('finished');
    const recentlyFinishedBooks = await getUserBooks(session.user.id, finishedStatusId, false);
    
    const sortedBooks = (recentlyFinishedBooks || []).sort((a: any, b: any) => {
      const dateA = a.finished_at ? new Date(a.finished_at).getTime() : 0;
      const dateB = b.finished_at ? new Date(b.finished_at).getTime() : 0;
      return dateB - dateA;
    }).slice(0, 4);

    return <RecentlyFinished books={sortedBooks} />;
  } catch (error) {
    console.error("Error in RecentlyFinishedData:", error);
    return <div>Error loading recently finished books.</div>;
  }
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
