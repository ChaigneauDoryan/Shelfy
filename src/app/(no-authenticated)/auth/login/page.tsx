import LoginForm from './LoginForm';
import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  pageTitle: 'Connexion',
  description: 'Accédez à votre espace Shelfy pour suivre vos lectures, noter vos livres et rejoindre des clubs de lecture francophones.',
  path: '/auth/login',
  keywords: ['connexion Shelfy', 'suivi de lecture', 'club de lecture'],
});

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <LoginForm />
    </div>
  );
}
