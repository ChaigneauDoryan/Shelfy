
'use client'

import { useState, useEffect } from 'react'
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import Navbar from "../components/Navbar"
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Toaster } from '@/components/ui/toaster';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    fetchUser();

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <html lang="fr">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <div className="flex items-center justify-center min-h-screen">Chargement...</div>
        </body>
      </html>
    );
  }

  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {!user && <Navbar />}
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
