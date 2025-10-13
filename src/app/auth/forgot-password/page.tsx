'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Mot de passe oublié</CardTitle>
          <CardDescription>Cette fonctionnalité est en cours de développement.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">Veuillez contacter l'administrateur si vous avez oublié votre mot de passe.</p>
          <Link href="/auth/login">
            Retour à la connexion
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}