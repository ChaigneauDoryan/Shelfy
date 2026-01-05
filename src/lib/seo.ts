import { z } from 'zod';
import type { Metadata } from 'next';

export interface PageMetadataOptions {
  pageTitle?: string;
  description?: string;
  path?: string;
  keywords?: string[];
  type?: 'website' | 'article' | 'book' | 'profile';
}

const APP_NAME = 'Shelfy';
const DEFAULT_ORIGIN = 'https://www.shelfy.fr';
const APP_ORIGIN = (process.env.NEXTAUTH_URL ?? DEFAULT_ORIGIN).replace(/\/+$/, '');
const METADATA_BASE_URL = new URL(APP_ORIGIN);
const DEFAULT_DESCRIPTION =
  'Shelfy est la plateforme française qui connecte les lecteurs, les clubs de lecture et leurs avis pour bâtir une communauté de lecteurs passionnés et partager vos meilleures découvertes.';
const DEFAULT_KEYWORDS = ['club de lecture', 'bibliothèque personnelle', 'lecture collaborative', 'avis de livres'];

const pageMetadataSchema = z.object({
  pageTitle: z.string().trim().max(60).optional(),
  description: z.string().trim().max(160).optional(),
  path: z.string().trim().optional(),
  keywords: z.array(z.string().trim().min(1)).optional(),
  type: z.enum(['website', 'article', 'book', 'profile']).optional(),
});

const normalizePath = (path?: string) => {
  if (!path) {
    return '/';
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return path.startsWith('/') ? path : `/${path}`;
};

export function createPageMetadata(options: PageMetadataOptions = {}): Metadata {
  const parsed = pageMetadataSchema.parse(options);

  const title = parsed.pageTitle ? `${parsed.pageTitle} | ${APP_NAME}` : `${APP_NAME} - Communauté de lecteurs`;
  const description = parsed.description ?? DEFAULT_DESCRIPTION;
  const keywordSet = new Set([...DEFAULT_KEYWORDS, ...(parsed.keywords ?? [])]);
  const relativePath = normalizePath(parsed.path);
  const canonicalUrl =
    relativePath.startsWith('http://') || relativePath.startsWith('https://')
      ? new URL(relativePath)
      : new URL(relativePath, METADATA_BASE_URL);

  return {
    title,
    description,
    metadataBase: METADATA_BASE_URL,
    alternates: {
      canonical: canonicalUrl.toString(),
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl.toString(),
      siteName: APP_NAME,
      type: parsed.type ?? 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    keywords: Array.from(keywordSet),
  };
}
