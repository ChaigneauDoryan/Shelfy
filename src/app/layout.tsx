'use client'

import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Toaster } from '@/components/ui/toaster';
import TopNavbar from "@/components/TopNavbar";
import CookieConsent from "react-cookie-consent";

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
        <CookieConsent
          location="bottom"
          buttonText="J'accepte"
          cookieName="myAwesomeCookieConsent"
          style={{ background: "#2B373B" }}
          buttonStyle={{ color: "#4e503b", fontSize: "13px" }}
          expires={150}
          enableDeclineButton
          declineButtonText="Je refuse"
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
          <a href="/politique-confidentialite" style={{ color: "#fff" }}>En savoir plus</a>
        </CookieConsent>
        <footer className="bg-background border-t py-6 w-full">
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