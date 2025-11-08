import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FaBookReader, FaUsers, FaSearch, FaQuoteLeft } from 'react-icons/fa';
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shelfy - Home',
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-5xl font-bold mb-8">Bienvenue sur Codex</h1>
      <p className="text-lg text-muted-foreground mb-12">Votre compagnon de lecture en groupe.</p>
      <div className="flex space-x-4">
        <Link href="/dashboard">
          <Button>Aller au tableau de bord</Button>
        </Link>
      </div>
    </main>
  );
}
