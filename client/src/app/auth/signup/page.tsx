'use client'

import { useState, useEffect, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { debounce } from "lodash"

const formSchema = z.object({
  username: z.string().min(2, { message: "Le nom d'utilisateur doit contenir au moins 2 caractères." }),
  
  email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirmPassword"],
});

export default function SignupPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const supabase = createClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const checkUsername = useCallback(
    debounce(async (username: string) => {
      if (username.length < 2) {
        setUsernameAvailable(null);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();
      setUsernameAvailable(!data);
    }, 500),
    []
  );

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'username') {
        checkUsername(value.username || "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form, checkUsername]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setEmailError(null);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          username: values.username,
          
        },
      },
    });

    if (error) {
      if (error.message.includes("User already registered")) {
        setEmailError("Cette adresse e-mail est déjà utilisée.");
      } else {
        console.error("Erreur d'inscription:", error);
      }
    } else {
      setIsSubmitted(true);
    }
  }

  async function handleGoogleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  }

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Inscription réussie !</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Veuillez vérifier votre boîte de réception pour confirmer votre adresse e-mail.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Créer un compte</CardTitle>
          <CardDescription>Rejoignez Codex pour commencer votre aventure littéraire.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom d'utilisateur</FormLabel>
                    <FormControl>
                      <Input placeholder="Votre pseudo" {...field} />
                    </FormControl>
                    {usernameAvailable === true && <p className="text-sm text-green-600">Ce nom d'utilisateur est disponible.</p>}
                    {usernameAvailable === false && <p className="text-sm text-red-600">Ce nom d'utilisateur est déjà pris.</p>}
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
                    {emailError && <p className="text-sm text-red-600">{emailError}</p>}
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
              <Button type="submit" className="w-full hidden">S'inscrire</Button>
            </form>
          </Form>
          <div className="mt-4 text-center flex flex-col space-y-2">
            <Button type="submit" className="w-full">S'inscrire</Button>
            <p className="text-sm text-gray-600">Ou continuer avec</p>
            <Button onClick={handleGoogleSignIn} variant="outline" className="w-full">S'inscrire avec Google</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}