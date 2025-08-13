
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { createClient } from "@/lib/supabase/client";

import GroupAvatarUpload from "@/components/GroupAvatarUpload";

import { jwtDecode } from 'jwt-decode';

const createGroupSchema = z.object({
  name: z.string().min(3, { message: "Le nom du groupe doit contenir au moins 3 caractères." }).max(50, { message: "Le nom du groupe ne peut pas dépasser 50 caractères." }),
  description: z.string().max(280, { message: "La description ne peut pas dépasser 280 caractères." }).optional(),
  avatar_url: z.string().url({ message: "Veuillez fournir une URL valide." }).optional(),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

export default function CreateGroupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      avatar_url: '',
    },
  });

  const onSubmit = async (values: CreateGroupFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error("Utilisateur non authentifié.");
      }

      // --- Débogage du JWT ---
      try {
        const decodedToken = jwtDecode(accessToken);
      } catch (e) {
        console.error("Error decoding JWT:", e);
      }
      // --- Fin du débogage ---

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de la création du groupe.');
      }

      router.push('/groups');
      router.refresh(); // Pour forcer le re-rendu de la page des groupes

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Créer un nouveau groupe de lecture</CardTitle>
          <CardDescription>Rassemblez des lecteurs autour d'un thème ou d'un genre qui vous passionne.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="avatar_url"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center">
                    <FormLabel>Avatar du groupe (Optionnel)</FormLabel>
                    <FormControl>
                      <GroupAvatarUpload onUpload={(url) => field.onChange(url)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du groupe</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Les Aventuriers de la Science-Fiction" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optionnel)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Décrivez l'objectif et l'ambiance de votre groupe..." className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Création en cours...' : 'Créer le groupe'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
