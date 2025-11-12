'use client';

import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import GroupAvatarUpload from "@/components/GroupAvatarUpload";
import { useSession } from 'next-auth/react';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { canCreateMoreGroups } from '@/lib/subscription-utils';

const createGroupSchema = z.object({
  name: z.string().min(3, { message: "Le nom du groupe doit contenir au moins 3 caractères." }).max(50, { message: "Le nom du groupe ne peut pas dépasser 50 caractères." }),
  description: z.string().max(280, { message: "La description ne peut pas dépasser 280 caractères." }).optional(),
  avatar_url: z.string().url({ message: "Veuillez fournir une URL valide." }).optional().or(z.literal('')),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

export default function CreateGroupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const { data: subscription, isLoading: isSubscriptionLoading } = useUserSubscription(userId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canCreateGroup, setCanCreateGroup] = useState(true);

  useEffect(() => {
    if (userId && subscription && !isSubscriptionLoading) {
      const checkLimit = async () => {
        const result = await canCreateMoreGroups(userId);
        setCanCreateGroup(result);
      };
      checkLimit();
    }
  }, [userId, subscription, isSubscriptionLoading]);

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
      if (status !== 'authenticated') {
        throw new Error("Utilisateur non authentifié.");
      }

      const response = await fetch(`/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 402) {
          toast({
            title: 'Limite du plan gratuit atteinte',
            description: errorData.message,
            variant: 'destructive',
          });
        } else {
          throw new Error(errorData.message || 'Échec de la création du groupe.');
        }
      } else {
        router.push('/groups');
        router.refresh();
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div>Chargement...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }

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
                      <GroupAvatarUpload onUpload={(url) => field.onChange(url)} groupName={form.watch('name')} />
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
              {!canCreateGroup && (
                <p className="text-red-600 text-sm">Vous avez atteint la limite de création de groupes pour votre plan d'abonnement. Passez au plan Premium pour créer plus de groupes.</p>
              )}
              <Button type="submit" className="w-full" disabled={loading || !canCreateGroup}>
                {loading ? 'Création en cours...' : 'Créer le groupe'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}