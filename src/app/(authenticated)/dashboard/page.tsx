'use client';

import { Suspense, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReadingActivity } from '@/hooks/useReadingActivity';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { actionLinkStore } from '@/lib/action-link-store';

function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirectRef = useRef(false);
  const { data, isLoading, error } = useReadingActivity(!!session?.user?.id);

  const groupReadingActivity = data?.groupBooks || [];
  const personalReadingActivity = data?.personalBooks || [];

  useEffect(() => {
    if (status !== 'unauthenticated' || redirectRef.current) {
      return;
    }
    const queryString = searchParams.toString();
    const nextPath = `${pathname}${queryString ? `?${queryString}` : ''}`;
    actionLinkStore.setPendingLink(nextPath);
    redirectRef.current = true;
    router.replace(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  }, [searchParams, pathname, router, status]);

  if (isLoading) {
    return <p>Chargement de l'activité de lecture...</p>;
  }

  if (error) {
    return <p>Erreur lors du chargement de l'activité de lecture: {error.message}</p>;
  }

  return (
    <div className="w-full max-w-4xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Activité de lecture dans vos groupes</CardTitle>
        </CardHeader>
        <CardContent>
          {groupReadingActivity.length === 0 ? (
            <p>Aucune activité de lecture dans vos groupes pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupReadingActivity.map(groupBook => (
                <Card key={groupBook.id} className="flex flex-col items-center text-center p-4">
                  <img src={groupBook.book.cover_url || '/file.svg'} alt={groupBook.book.title} className="w-24 h-36 object-cover mb-2" />
                  <h3 className="font-semibold text-md">{groupBook.book.title}</h3>
                  <p className="text-sm text-muted-foreground">{groupBook.book.author}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {groupBook.status === 'CURRENT' ? 'En cours de lecture' : 'Lu'} dans le groupe : {groupBook.group.name}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activité de lecture personnelle</CardTitle>
        </CardHeader>
        <CardContent>
          {personalReadingActivity.length === 0 ? (
            <p>Aucune activité de lecture personnelle pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {personalReadingActivity.map(userBook => (
                <Card key={userBook.id} className="flex flex-col items-center text-center p-4">
                  <img src={userBook.book.cover_url || '/file.svg'} alt={userBook.book.title} className="w-24 h-36 object-cover mb-2" />
                  <h3 className="font-semibold text-md">{userBook.book.title}</h3>
                  <p className="text-sm text-muted-foreground">{userBook.book.author}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {userBook.status_id === 2 ? 'En cours de lecture' : 'Lu'}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<p>Chargement...</p>}>
      <Dashboard />
    </Suspense>
  );
}