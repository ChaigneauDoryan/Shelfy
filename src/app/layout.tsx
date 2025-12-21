'use client'

import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Toaster } from 'sonner';
import { usePathname } from 'next/navigation';

import CookieConsent from "react-cookie-consent";
import { MobileBottomTabs } from '@/components/navigation/MobileBottomTabs';
import { shouldHideTabs } from '@/lib/env';

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
  const pathname = usePathname();
  const shouldShowTabs = !shouldHideTabs(pathname);
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased bg-background text-foreground">
        <Providers>
          <div className="flex min-h-screen flex-col pb-24 md:pb-0">
            <div className="flex-1 w-full pb-10 md:pb-0">{children}</div>
          </div>
          {shouldShowTabs && <MobileBottomTabs />}
        </Providers>
        <Toaster richColors />
        <CookieConsent
          location="bottom"
          buttonText="J'accepte"
          cookieName="myAwesomeCookieConsent"
          style={{ background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }}
          buttonStyle={{
            color: 'hsl(var(--primary-foreground))',
            background: 'hsl(var(--primary))',
            borderRadius: '999px',
            fontSize: '13px',
            padding: '0.4rem 1rem'
          }}
          expires={150}
          enableDeclineButton
          declineButtonText="Je refuse"
          declineButtonStyle={{
            color: 'hsl(var(--foreground))',
            background: 'transparent',
            border: '1px solid hsl(var(--border))',
            borderRadius: '999px',
            fontSize: '13px',
            padding: '0.4rem 1rem'
          }}
          cookieSecurity={true} // Use secure cookies in production
          onAccept={(byScroll) => {
            // Optional: Callback when cookies are accepted
            // e.g., initialize analytics scripts here
            console.log("Cookies accepted!");
          }}
          onDecline={() => {
            // Optional: Callback when cookies are declined
            console.log("Cookies declined!");
          }}
        >
          Ce site utilise des cookies pour améliorer l'expérience utilisateur. En continuant à naviguer, vous acceptez notre utilisation des cookies.{" "}
          <a href="/politique-confidentialite" style={{ color: 'hsl(var(--primary))' }}>En savoir plus</a>
        </CookieConsent>
        <footer className="hidden w-full border-t bg-background py-6 md:block">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Shelfy. Tous droits réservés.</p>
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
