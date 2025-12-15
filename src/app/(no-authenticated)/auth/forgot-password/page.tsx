'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
// import { useToast } from '@/hooks/use-toast'; // Import useToast

const formSchema = z.object({
  email: z.string().email({ message: 'Veuillez saisir une adresse e-mail valide.' }),
});

type ForgotPasswordFormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);
  // const { toast } = useToast(); // Initialize useToast

  useEffect(() => {
    document.title = 'Shelfy - Mot de passe oublié';
  }, []);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setMessage(null);
    setIsError(false);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        setIsError(true);
        setMessage(data.error || 'Une erreur inattendue est survenue.');
        // toast({
        //   title: 'Erreur',
        //   description: data.error || 'Une erreur inattendue est survenue.',
        //   variant: 'destructive',
        // });
      } else {
        setMessage(data.message);
        // toast({
        //   title: 'Succès',
        //   description: data.message,
        // });
      }
    } catch (error) {
      setIsError(true);
      setMessage('Une erreur inattendue est survenue. Veuillez réessayer.');
      // toast({
      //   title: 'Erreur',
      //   description: 'Une erreur inattendue est survenue. Veuillez réessayer.',
      //   variant: 'destructive',
      // });
      console.error(error);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Mot de passe oublié</CardTitle>
          <CardDescription className="text-center">Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation de mot de passe.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Envoyer le lien de réinitialisation
              </Button>
            </form>
          </Form>
          {message && (
            <p className={`mt-4 text-center ${isError ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
          )}
          <p className="mt-4 text-center text-sm text-gray-600">
            <Link href="/auth/login" className="underline">
              Retour à la connexion
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}