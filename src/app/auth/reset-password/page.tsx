'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

const formSchema = z.object({
  password: z.string().min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof formSchema>;

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(searchParams.get('token'));
  }, [searchParams]);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setMessage(null);
    setIsError(false);

    if (!token) {
      setIsError(true);
      setMessage('Le jeton de réinitialisation du mot de passe est manquant.');
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password: values.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setIsError(true);
        setMessage(data.error || 'Une erreur inattendue est survenue.');
      } else {
        setMessage(data.message);
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    } catch (error) {
      setIsError(true);
      setMessage('Une erreur inattendue est survenue. Veuillez réessayer.');
      console.error(error);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Réinitialiser le mot de passe</CardTitle>
          <CardDescription className="text-center">Saisissez votre nouveau mot de passe.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Réinitialiser le mot de passe
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}