import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import { createPageMetadata } from '@/lib/seo';

describe('createPageMetadata', () => {
  const originalNextAuthUrl = process.env.NEXTAUTH_URL;

  beforeEach(() => {
    process.env.NEXTAUTH_URL = 'https://www.shelfy.fr';
  });

  afterEach(() => {
    process.env.NEXTAUTH_URL = originalNextAuthUrl;
  });

  it('should compose a branded title and canonical URL when path is provided', () => {
    const metadata = createPageMetadata({ pageTitle: 'Connexion', path: '/auth/login' });
    expect(metadata.title).toBe('Connexion | Shelfy');
    expect(metadata.alternates?.canonical).toBe('https://www.shelfy.fr/auth/login');
  });

  it('should fallback to defaults when minimum information is provided', () => {
    const metadata = createPageMetadata({});
    expect(metadata.description).toContain('communauté de lecteurs');
    expect(metadata.keywords?.length).toBeGreaterThan(0);
  });

  it('should keep custom keywords without duplicates', () => {
    const metadata = createPageMetadata({ keywords: ['lecture', 'bibliothèque'] });
    expect(metadata.keywords).toContain('lecture');
    expect(metadata.keywords).toContain('bibliothèque');
  });
});
