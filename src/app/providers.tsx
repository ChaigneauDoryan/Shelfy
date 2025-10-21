'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import TopNavbar from '../components/TopNavbar'; // Import TopNavbar
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <AuthConditionalWrapper>
            {children}
          </AuthConditionalWrapper>
        </QueryClientProvider>
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