'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

import GroupAvatarUpload from "@/components/GroupAvatarUpload";
import { useSession } from 'next-auth/react';
import JoinRequestsManager from '@/components/JoinRequestsManager';

const editGroupSchema = z.object({
  name: z.string().min(3, { message: "Le nom du groupe doit contenir au moins 3 caractères." }).max(50, { message: "Le nom du groupe ne peut pas dépasser 50 caractères." }),
  description: z.string().max(280, { message: "La description ne peut pas dépasser 280 caractères." }).optional(),
  avatar_url: z.string().url({ message: "Veuillez fournir une URL valide." }).optional().or(z.literal('')), // Permettre chaîne vide
});

type EditGroupFormValues = z.infer<typeof editGroupSchema>;

export default function EditGroupPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<any>(null);

  const form = useForm<EditGroupFormValues>({
    resolver: zodResolver(editGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      avatar_url: '',
    },
  });

  useEffect(() => {
    const fetchGroup = async () => {
      if (!session?.user?.id || !groupId) return;

      const response = await fetch(`/api/groups/${groupId}`);
      if (!response.ok) {
        setError('Impossible de charger les informations du groupe.');
        return;
      }
      const data = await response.json();
      setGroup(data);
      form.reset({
        name: data.name,
        description: data.description || '',
        avatar_url: data.avatar_url || '',
      });
    };

    if (groupId && status === 'authenticated') {
      fetchGroup();
    }
  }, [groupId, status, session, form]);

  const onSubmit = async (values: EditGroupFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de la mise à jour du groupe.');
      }

      router.push('/groups');
      router.refresh();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || !group) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Chargement...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Chargement des informations du groupe...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Modifier le groupe</CardTitle>
          <CardDescription>Mettez à jour les informations de votre groupe de lecture.</CardDescription>
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
                      <GroupAvatarUpload onUpload={(url) => field.onChange(url)} existingAvatarUrl={group?.avatar_url} />
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
                      <Input {...field} />
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
                      <Textarea className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Mise à jour en cours...' : 'Mettre à jour le groupe'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="mt-8">
        <JoinRequestsManager groupId={groupId} />
      </div>
    </div>
  );
}