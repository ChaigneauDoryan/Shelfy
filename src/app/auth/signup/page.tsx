
'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
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
import { signIn } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast'; // Import useToast

const formSchema = z.object({
  name: z.string().min(2, { message: "Le nom d'utilisateur doit contenir au moins 2 caractères." }),
  email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirmPassword"],
});

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast(); // Initialize useToast
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    document.title = 'Shelfy - Signup';
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        password: values.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast({
        title: 'Erreur d\'inscription',
        description: data.message || 'Une erreur est survenue lors de l\'inscription.',
        variant: 'destructive',
      });
    } else {
      setSuccess(true);
      toast({
        title: 'Inscription réussie !',
        description: 'Un e-mail de vérification a été envoyé à votre adresse. Veuillez cliquer sur le lien dans l\'e-mail pour activer votre compte.',
      });
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Créer un compte</CardTitle>
          <CardDescription>Rejoignez Shelfy pour commencer votre aventure littéraire.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {success ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-green-600">Vérifiez votre e-mail</h2>
              <p className="mt-4 text-gray-600">Un e-mail de vérification a été envoyé à votre adresse. Veuillez cliquer sur le lien dans l'e-mail pour activer votre compte.</p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* {error && <p className="text-sm text-red-600 text-center">{error}</p>} */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom d'utilisateur</FormLabel>
                      <FormControl>
                        <Input placeholder="Votre pseudo" {...field} />
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
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer le mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">S'inscrire</Button>
              </form>
            </Form>
          )}
          {!success && (
            <>
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
                S'inscrire avec Google
              </Button>
              <p className="mt-4 text-center text-sm text-gray-600">
                Déjà un compte ?{' '}
                <Link href="/auth/login" className="font-semibold leading-6 text-blue-600 hover:text-blue-500">
                  Connexion
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
