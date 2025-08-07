
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useRouter } from 'next/navigation';

const inviteFormSchema = z.object({
  email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
  groupId: z.string().min(1, { message: "L'ID du groupe est requis." }), // Temporaire, à remplacer par une sélection de groupe
  groupName: z.string().min(1, { message: "Le nom du groupe est requis." }), // Temporaire, à remplacer par une sélection de groupe
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

export default function InviteToGroupPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: '',
      groupId: 'your-group-id', // REMPLACER PAR L'ID RÉEL DU GROUPE
      groupName: 'Your Group Name', // REMPLACER PAR LE NOM RÉEL DU GROUPE
    },
  });

  const onSubmit = async (values: InviteFormValues) => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/groups/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
                throw new Error(errorData.message || 'Échec de l\'envoi de l\'invitation.');
      }

      setMessage('Invitation envoyée avec succès !');
      form.reset();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Inviter un membre au groupe</CardTitle>
          <CardDescription>Envoyez une invitation par e-mail pour rejoindre votre groupe de lecture.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="groupName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du Groupe</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom de votre groupe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="groupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID du Groupe</FormLabel>
                    <FormControl>
                      <Input placeholder="ID du groupe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de l'invité</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="invite@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Envoi...' : 'Envoyer l\'invitation'}
              </Button>
            </form>
          </Form>
          {message && <p className="text-green-600 mt-4 text-center">{message}</p>}
          {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
