
import { createClient } from '@/lib/supabase/server'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default function SignupPage() {
  const handleSignUp = async () => {
    'use server'
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const origin = (headers() as any).get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const redirectToUrl = `${protocol}://${origin}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectToUrl,
      },
    })

    if (data.url) {
      redirect(data.url)
    }
  }

  return (
    <form action={handleSignUp}>
      <button>S'inscrire avec Google</button>
    </form>
  )
}
