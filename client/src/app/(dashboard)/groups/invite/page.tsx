
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFieldArray, useForm } from 'react-hook-form';
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
import { createClient } from '@/lib/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MinusCircle, PlusCircle } from 'lucide-react';

const inviteFormSchema = z.object({
  emails: z.array(z.object({
    email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
  })).min(1, { message: "Veuillez saisir au moins une adresse e-mail." }),
  groupId: z.string().min(1, { message: "Veuillez sélectionner un groupe." }),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

export default function InviteToGroupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adminGroups, setAdminGroups] = useState<any[]>([]);
  const [fetchingGroups, setFetchingGroups] = useState(true);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      emails: [{ email: '' }],
      groupId: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "emails",
  });

  useEffect(() => {
    const fetchAdminGroups = async () => {
      setFetchingGroups(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('group_members')
          .select(
            `
            role,
            groups (*)
          `
          )
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user groups:', error);
          setError('Impossible de charger vos groupes.');
        } else {
          const groups = data.filter((item: any) => item.role === 'admin').map((item: any) => item.groups);
          setAdminGroups(groups);
          if (groups.length > 0) {
            form.setValue('groupId', groups[0].id); // Sélectionne le premier groupe par défaut
          }
        }
      }
      setFetchingGroups(false);
    };

    fetchAdminGroups();
  }, [supabase, form]);

  const onSubmit = async (values: InviteFormValues) => {
    setLoading(true);
    setMessage(null);
    setError(null);

    const selectedGroup = adminGroups.find(group => group.id === values.groupId);
    if (!selectedGroup) {
      setError("Groupe sélectionné invalide.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/groups/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          groupId: values.groupId,
          groupName: selectedGroup.name,
          invitedEmails: values.emails.map(emailObj => emailObj.email), // Transformer en tableau de chaînes de caractères
        }),
      });

      console.log('DEBUG (Frontend): Sending body:', {
        groupId: values.groupId,
        groupName: selectedGroup.name,
        __temp_invited_emails__: values.emails.map(emailObj => emailObj.email),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de l\'envoi de l\'invitation.');
      }

      setMessage('Invitations envoyées avec succès !');
      form.reset();
      router.push('/groups');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingGroups) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Chargement des groupes...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Veuillez patienter pendant que nous chargeons la liste de vos groupes.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (adminGroups.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Aucun groupe administrateur trouvé</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Vous devez être administrateur d'au moins un groupe pour envoyer des invitations.</p>
            <Button onClick={() => router.push('/groups/create')} className="mt-4">Créer un groupe</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                name="groupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sélectionner un groupe</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un groupe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {adminGroups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                {fields.map((item, index) => (
                  <FormField
                    control={form.control}
                    key={item.id}
                    name={`emails.${index}.email`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={index === 0 ? "block" : "sr-only"}>
                          Email de l'invité
                        </FormLabel>
                        <div className="flex space-x-2">
                          <FormControl>
                            <Input type="email" placeholder="invite@example.com" {...field} />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => append({ email: '' })}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Ajouter un e-mail
                </Button>
              </div>
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
