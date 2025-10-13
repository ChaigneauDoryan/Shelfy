'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import TopNavbar from '../components/TopNavbar'; // Import TopNavbar

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthConditionalWrapper>
          {children}
        </AuthConditionalWrapper>
      </ThemeProvider>
    </SessionProvider>
  );
}

// New component to handle conditional rendering of TopNavbar
function AuthConditionalWrapper({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  return (
    <>
      {status === 'authenticated' && <TopNavbar />}
      {children}
    </>
  );
}