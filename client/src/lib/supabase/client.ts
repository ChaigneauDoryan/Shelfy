
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  console.log('DEBUG (client.ts): Supabase URL:', supabaseUrl);
  console.log('DEBUG (client.ts): Supabase Anon Key (first 5 chars):', supabaseAnonKey.substring(0, 5) + '...');

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        storage: localStorage, // Utiliser localStorage pour la persistance
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  )
}
