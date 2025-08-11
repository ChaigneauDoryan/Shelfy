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
import { createClient } from "@/lib/supabase/client"
import { Textarea } from "@/components/ui/textarea"
import AvatarUpload from '@/components/AvatarUpload'
import { useToast } from "@/hooks/use-toast"
import ReadingActivityChart from '@/components/ReadingActivityChart'
import BadgeCard from '@/components/BadgeCard'
import WordCloud from '@/components/WordCloud'
import PaceDisplay from '@/components/PaceDisplay'

const profileFormSchema = z.object({
  username: z.string().min(2, { message: "Le nom d'utilisateur doit contenir au moins 2 caractères." }),
  bio: z.string().max(280, { message: "La biographie ne peut pas dépasser 280 caractères." }).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [topGenres, setTopGenres] = useState<any[]>([]);
  const [topAuthors, setTopAuthors] = useState<any[]>([]);
  const [readingPace, setReadingPace] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      
      bio: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error(error);
        } else if (data) {
          setProfile(data);
          form.reset({
            username: data.username,
            bio: data.bio || "",
            favorite_genres: data.favorite_genres || [],
            favorite_authors: data.favorite_authors || [],
            reading_pace: data.reading_pace || 'regular',
          });
          setAvatarUrl(data.avatar_url || '');
        }

        // Fetch stats
        const { data: statsData, error: statsError } = await supabase.rpc('get_user_stats', { p_user_id: user.id });
        if (statsError) {
          console.error('Error fetching stats:', statsError);
        } else {
          setStats(statsData[0]);
        }

        // Fetch badges
        const { data: badgesData, error: badgesError } = await supabase
          .from('user_badges')
          .select(`
            unlocked_at,
            badges (*)
          `)
          .eq('user_id', user.id);

        if (badgesError) {
          console.error('Error fetching badges:', badgesError);
        } else {
          const formattedBadges = badgesData.map((item: any) => ({ ...item.badges, unlocked_at: item.unlocked_at }));
          setBadges(formattedBadges);
        }

        // Fetch top genres
        const { data: genresData, error: genresError } = await supabase.rpc('get_top_genres', { p_user_id: user.id });
        if (genresError) {
          console.error('Error fetching top genres:', genresError);
        } else {
          setTopGenres(genresData || []);
        }

        // Fetch top authors
        const { data: authorsData, error: authorsError } = await supabase.rpc('get_top_authors', { p_user_id: user.id });
        if (authorsError) {
          console.error('Error fetching top authors:', authorsError);
        } else {
          setTopAuthors(authorsData || []);
        }

        // Fetch reading pace
        const { data: paceData, error: paceError } = await supabase.rpc('get_reading_pace', { p_user_id: user.id });
        if (paceError) {
          console.error('Error fetching reading pace:', paceError);
        } else {
          setReadingPace(paceData);
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [form, supabase]);

  async function onSubmit(values: ProfileFormValues) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: values.username,
          bio: values.bio,
          avatar_url: avatarUrl,
          updated_at: new Date(),
        })
        .eq('id', user.id);

      if (error) {
        console.error(error);
        toast({ title: 'Erreur', description: "La mise à jour du profil a échoué.", variant: 'destructive', duration: 5000 });
      } else {
        toast({ title: 'Succès', description: "Votre profil a été mis à jour avec succès.", duration: 5000 });
      }
    }
  }

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-800">Gestion du Profil</h1>
          <p className="text-gray-600">Mettez à jour vos informations personnelles.</p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Vos Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-around">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats?.total_books_read || 0}</p>
              <p className="text-sm text-gray-600">Livres Lus</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats?.total_pages_read || 0}</p>
              <p className="text-sm text-gray-600">Pages Lues</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats?.average_rating?.toFixed(1) || 'N/A'}</p>
              <p className="text-sm text-gray-600">Note Moyenne</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité de Lecture</CardTitle>
          </CardHeader>
          <CardContent>
            <ReadingActivityChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mes Badges</CardTitle>
          </CardHeader>
          <CardContent>
            {badges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {badges.map(badge => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            ) : (
              <p>Vous n'avez pas encore débloqué de badges. Continuez à lire !</p>
            )}
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
                onUpload={(url: string) => setAvatarUrl(url)}
              />
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="username"
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

        <Card>
          <CardHeader>
            <CardTitle>Vos Préférences de Lecture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <WordCloud data={topGenres} title="Genres Favoris" />
            <WordCloud data={topAuthors} title="Auteurs Favoris" />
            <PaceDisplay pace={readingPace as any} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
