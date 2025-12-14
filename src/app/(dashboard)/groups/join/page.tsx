'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useSession } from 'next-auth/react';

const joinGroupSchema = z.object({
  invitationCode: z.string().min(1, { message: "Veuillez saisir un code d'invitation." }),
});

type JoinGroupFormValues = z.infer<typeof joinGroupSchema>;

export default function JoinGroupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<JoinGroupFormValues>({
    resolver: zodResolver(joinGroupSchema),
    defaultValues: {
      invitationCode: '',
    },
  });

  const onSubmit = async (values: JoinGroupFormValues) => {
    setLoading(true);
    setError(null);

    try {
      if (status !== 'authenticated') {
        throw new Error("Utilisateur non authentifié.");
      }

      const response = await fetch(`/api/groups/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationCode: values.invitationCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec pour rejoindre le groupe.');
      }

      router.push('/groups');
      router.refresh();

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossible de rejoindre le groupe.';
      setError(message);
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
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Rejoindre un groupe</CardTitle>
          <CardDescription>Saisissez le code d'invitation pour rejoindre un groupe de lecture.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="invitationCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code d'invitation</FormLabel>
                    <FormControl>
                      <Input placeholder="Saisissez votre code..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Recherche en cours...' : 'Rejoindre le groupe'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
