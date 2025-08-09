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

const profileFormSchema = z.object({
  username: z.string().min(2, { message: "Le nom d'utilisateur doit contenir au moins 2 caractères." }),
  
  bio: z.string().max(280, { message: "La biographie ne peut pas dépasser 280 caractères." }).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

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
          });
          setAvatarUrl(data.avatar_url || '');
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
      } else {
        alert("Profil mis à jour !");
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
      </div>
    </div>
  );
}
