'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FcGoogle } from 'react-icons/fc';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
  password: z.string().min(1, { message: "Le mot de passe ne peut pas être vide." }),
});

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'SignupSuccessful') {
      setSuccessMessage('Inscription réussie ! Vous pouvez maintenant vous connecter.');
    }
    const authError = searchParams.get('error');
    if (authError === 'CredentialsSignin') {
      setError('Email ou mot de passe invalide.');
    }
  }, [searchParams]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setSuccessMessage(null);

    const result = await signIn('credentials', {
      redirect: false, // Ne pas rediriger automatiquement, pour gérer la réponse ici
      email: values.email,
      password: values.password,
    });

    if (result?.error) {
      setError("Email ou mot de passe invalide.");
    } else if (result?.ok) {
      // Redirection manuelle après une connexion réussie
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>Accédez à votre compte Codex.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{successMessage}</span>
              </div>
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="votre@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="text-sm text-right">
              <Link href="/auth/forgot-password" className="font-medium text-primary hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
            <Button type="submit" className="w-full">Se connecter</Button>
          </form>
        </Form>
        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou continuer avec
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full mt-6"
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        >
          <FcGoogle className="mr-2 h-4 w-4" />
          Se connecter avec Google
        </Button>
      </CardContent>
    </Card>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <LoginFormContent />
    </Suspense>
  )
}