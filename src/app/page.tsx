import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shelfy - Home',
};

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-5xl font-bold mb-8">Bienvenue sur Codex</h1>
      <p className="text-lg text-muted-foreground mb-12">Votre compagnon de lecture en groupe.</p>
      <div className="flex space-x-4">
        <Link href="/subscription">
          <Button>Voir nos plans</Button>
        </Link>
        <Link href="/auth/login">
          <Button variant="outline">Se connecter</Button>
        </Link>
      </div>
    </main>
  );
}
