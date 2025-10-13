'use client'

import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Toaster } from '@/components/ui/toaster';
import TopNavbar from "@/components/TopNavbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        
        <Providers>{children}</Providers>
        <Toaster />
        <footer className="bg-background border-t py-6 w-full">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Codex. Tous droits réservés.</p>
            <div className="flex space-x-4 mt-3 md:mt-0">
              <a href="/mentions-legales" className="hover:underline">Mentions Légales</a>
              <a href="/politique-confidentialite" className="hover:underline">Politique de Confidentialité</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}