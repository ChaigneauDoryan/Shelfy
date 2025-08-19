import { cookies } from "next/headers";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserBooks } from "@/lib/book-utils";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CurrentlyReading, CurrentlyReadingSkeleton } from "@/components/dashboard/CurrentlyReading";
import { RecentlyFinished, RecentlyFinishedSkeleton } from "@/components/dashboard/RecentlyFinished";

// This component fetches and displays the user's currently reading books
async function CurrentlyReadingData() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <CurrentlyReading books={[]} />;

  // Assuming 'En cours' is the status name for reading. Adjust if necessary.
  const currentlyReadingBooks = await getUserBooks(supabase, user.id, 2, false);
  return <CurrentlyReading books={currentlyReadingBooks || []} />;
}

// This component fetches and displays the user's recently finished books
async function RecentlyFinishedData() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <RecentlyFinished books={[]} />;

  // Fetch by status ID 3 for 'finished'
  const recentlyFinishedBooks = await getUserBooks(supabase, user.id, 3, false);
  
  // Sort by finished_at date and take the latest 4
  const sortedBooks = (recentlyFinishedBooks || []).sort((a: any, b: any) => 
    new Date(b.finished_at).getTime() - new Date(a.finished_at).getTime()
  ).slice(0, 4);

  return <RecentlyFinished books={sortedBooks} />;
}

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user?.id)
    .single();

  return (
    <div className="space-y-8">
      <DashboardHeader username={profile?.username || 'lecteur'} />

      <Suspense fallback={<CurrentlyReadingSkeleton />}>
        <CurrentlyReadingData />
      </Suspense>

      <Suspense fallback={<RecentlyFinishedSkeleton />}>
        <RecentlyFinishedData />
      </Suspense>
    </div>
  );
}