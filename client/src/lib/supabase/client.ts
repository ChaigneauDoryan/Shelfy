
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        // Supabase SSR gère automatiquement le stockage pour les clients de navigateur
        // Pas besoin de spécifier 'storage: localStorage' directement ici.
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  )
}
