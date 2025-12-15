'use client'

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import AvatarUpload from './components/AvatarUpload'
import { useToast } from "@/hooks/use-toast"
import ReadingActivityChart from '@/components/ReadingActivityChart'
import BadgeCard from '@/components/BadgeCard'
import WordCloud from '@/components/WordCloud'
import PaceDisplay from '@/components/PaceDisplay'
import useSWR from 'swr'
import { useSession } from 'next-auth/react';
import PageHeader from '@/components/ui/PageHeader';
import type { AwardedBadge } from '@/types/domain';

interface ProfileStatsResponse {
  profile?: {
    bio?: string | null;
    name?: string | null;
    image?: string | null;
  };
  stats?: {
    total_books_read: number;
    total_pages_read: number;
    average_rating: number;
  };
  badges: UserProfileBadge[];
  readingPace?: 'occasional' | 'regular' | 'passionate' | null;
  topGenres?: { name: string; count: number }[];
  topAuthors?: { name: string; count: number }[];
}

interface UserProfileBadge {
  id: string | number;
  name: string;
  description: string;
  icon_name?: string;
  icon_url?: string | null;
  unlocked_at?: string;
}

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Le nom d'utilisateur doit contenir au moins 2 caractères." }),
  bio: z.string().max(280, { message: "La biographie ne peut pas dépasser 280 caractères." }).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const { toast } = useToast();

  useEffect(() => {
    document.title = 'Shelfy - Mon Profil';
  }, []);

  const { data, error, isLoading, mutate } = useSWR<ProfileStatsResponse>(userId ? '/api/profile/stats' : null, fetcher);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: session?.user?.name ?? "",
      bio: "",
    },
  });

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(session?.user?.image ?? undefined);

  useEffect(() => {
    if (session?.user) {
      form.reset({
        name: session.user.name ?? "",
        bio: data?.profile?.bio || "",
      });
      setAvatarUrl(session.user.image ?? '');
    }
  }, [session, data, form]);

  useEffect(() => {
    const checkBadges = async () => {
      if (userId) {
        const response = await fetch('/api/profile/check-badges', { method: 'POST' });
        const badgeData: { awardedBadges?: AwardedBadge[] } = await response.json();
        if (badgeData.awardedBadges && Array.isArray(badgeData.awardedBadges)) {
          badgeData.awardedBadges.forEach((badge) => {
            toast({
              title: 'Nouveau badge débloqué !',
              description: `Vous avez obtenu le badge : ${badge.name}`,
            });
          });
        }
        mutate(); // Revalidate the data to show new badges
      }
    };
    checkBadges();
  }, [userId, mutate, toast]);

  async function onSubmit(values: ProfileFormValues) {
    if (!userId) return;

    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: values.name,
        bio: values.bio,
        image: avatarUrl, // L'avatar est géré par AvatarUpload et mis à jour ici
      }),
    });

    if (!response.ok) {
      toast({ title: 'Erreur', description: "La mise à jour du profil a échoué.", variant: 'destructive', duration: 5000 });
    } else {
      toast({ title: 'Succès', description: "Votre profil a été mis à jour avec succès.", duration: 5000 });
      mutate(); // Revalider les données après la mise à jour
    }
  }

  if (isLoading || status === 'loading') {
    return <div>Chargement du profil...</div>;
  }

  if (error) {
    return <div>Erreur lors du chargement du profil: {error.message}</div>;
  }

  if (!session?.user) {
    return <div>Veuillez vous connecter pour voir votre profil.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-8">
        <PageHeader
          title="Gestion du Profil"
          description="Mettez à jour vos informations personnelles."
        />
        <Card>
          <CardHeader>
            <CardTitle>Vos Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-around">
            <div className="text-center">
              <p className="text-2xl font-bold">{data?.stats?.total_books_read || 0}</p>
              <p className="text-sm text-gray-600">Livres Lus</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{data?.stats?.total_pages_read || 0}</p>
              <p className="text-sm text-gray-600">Pages Lues</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{data?.stats?.average_rating?.toFixed(1) || 'N/A'}</p>
              <p className="text-sm text-gray-600">Note Moyenne</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité de Lecture</CardTitle>
          </CardHeader>
          <CardContent>
            {/* ReadingActivityChart doit être mis à jour pour utiliser les nouvelles données */}
            <ReadingActivityChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mes Badges</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.badges && data.badges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {data.badges.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    badge={{
                      ...badge,
                      icon_name: badge.icon_name || '', // Provide a default empty string if undefined
                      unlocked_at: badge.unlocked_at || '', // Provide a default empty string if undefined
                    }}
                  />
                ))}
              </div>
            ) : (
              <p>Vous n'avez pas encore débloqué de badges. Continuez à lire !</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vos Préférences de Lecture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <WordCloud data={data?.topGenres || []} title="Genres Favoris" />
            <WordCloud data={data?.topAuthors || []} title="Auteurs Favoris" />
            <PaceDisplay pace={data?.readingPace || null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vos informations</CardTitle>
          </CardHeader>
          <CardContent>
            {userId && (
              <AvatarUpload
                userId={userId}
                initialAvatarUrl={avatarUrl}
                onUpload={(url: string) => {
                  setAvatarUrl(url);
                  mutate(); // Revalider les données après l'upload de l'avatar
                }}
              />
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom d'utilisateur</FormLabel>
                      <FormControl>
                        <Input placeholder="Votre pseudo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biographie</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Parlez-nous un peu de vous..." className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit">Mettre à jour le profil</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        
      </div>
    </div>
  );
}
