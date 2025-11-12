'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useSession } from 'next-auth/react';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

const contactFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis.'),
  email: z.string().email('Adresse email invalide.'),
  subject: z.string().min(1, 'Le sujet est requis.'),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères.'),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export function ContactForm() {
  const { data: session } = useSession();
  const { data: subscription, isLoading: isSubscriptionLoading } = useUserSubscription(session?.user?.id);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      subject: '',
      message: '',
    },
  });

  // Manually update form values when session loads, as defaultValues is only for initialization
  useEffect(() => {
    if (session?.user) {
      form.setValue('name', session.user.name || '');
      form.setValue('email', session.user.email || '');
    }
  }, [session, form]);

  const isPremium = subscription?.planId === 'premium';

  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          plan: isPremium ? 'Premium' : 'Gratuit',
        }),
      });

      if (!response.ok) {
        throw new Error('Échec de l\'envoi du message.');
      }

      toast({
        title: 'Message envoyé !',
        description: 'Nous avons bien reçu votre message et nous vous répondrons bientôt.',
      });
      form.reset({
        ...form.getValues(),
        subject: '',
        message: '',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Formulaire de Contact</CardTitle>
        {isPremium && (
          <div className="mt-2 flex items-center text-green-600 bg-green-50 border border-green-200 rounded-md p-3">
            <ShieldCheck className="h-5 w-5 mr-2" />
            <p className="text-sm font-medium">Vous bénéficiez du support prioritaire !</p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sujet</FormLabel>
                  <FormControl>
                    <Input placeholder="Sujet de votre message" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Votre message..." className="resize-none" rows={6} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
