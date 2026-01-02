import { GoogleBooksApiBook, GoogleBooksVolumeInfo } from '@/types/book';

export interface LanguageDetectionResult {
  language: string;
  isFallback: boolean;
}

export interface FilterGoogleBooksOptions {
  preferredLanguage: string;
  existingGoogleBooksIds: Set<string>;
}

const DEFAULT_LANGUAGE = 'en';
const JAPANESE_REGEX = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;
const FRENCH_ACCENTS_REGEX = /[àâäéèêëîïôöùûüÿçœæ]/i;
const FRENCH_TERMS_REGEX = /\b(le|la|les|des|une|de|du|pour|et|ce|cette|lorsque)\b/i;

/**
 * Détecte la langue la plus probable à partir des termes fournis.
 */
export function detectSearchLanguageFromTerms(terms: string[]): LanguageDetectionResult {
  const source = terms.filter(Boolean).join(' ').trim();
  if (!source) {
    return { language: DEFAULT_LANGUAGE, isFallback: true };
  }

  if (JAPANESE_REGEX.test(source)) {
    return { language: 'ja', isFallback: false };
  }

  if (FRENCH_ACCENTS_REGEX.test(source) || FRENCH_TERMS_REGEX.test(source)) {
    return { language: 'fr', isFallback: false };
  }

  return { language: DEFAULT_LANGUAGE, isFallback: true };
}

const getCoverUrl = (volumeInfo: GoogleBooksVolumeInfo): string | undefined =>
  volumeInfo.imageLinks?.thumbnail ?? volumeInfo.imageLinks?.smallThumbnail;

const normalizeText = (value: string | undefined): string =>
  value?.trim().toLowerCase() ?? '';

const buildDedupKey = (volumeInfo: GoogleBooksVolumeInfo): string => {
  const authors = (volumeInfo.authors ?? []).map(author => normalizeText(author)).join(',');

  return [
    normalizeText(volumeInfo.title),
    authors,
    normalizeText(volumeInfo.publisher),
  ].join('|');
};

const computeCompletenessScore = (volumeInfo: GoogleBooksVolumeInfo): number => {
  const coverUrl = getCoverUrl(volumeInfo);
  const values = [
    Boolean(volumeInfo.title?.trim()),
    Boolean(volumeInfo.authors?.length),
    Boolean(volumeInfo.description?.trim()),
    Boolean(coverUrl),
  ];
  return values.filter(Boolean).length;
};

/**
 * Filtre et dé-duplique les résultats Google Books en favorisant les fiches les plus complètes.
 */
export function filterGoogleBooksItems(
  items: GoogleBooksApiBook[],
  { preferredLanguage, existingGoogleBooksIds }: FilterGoogleBooksOptions
): GoogleBooksApiBook[] {
  const dedupMap = new Map<string, { book: GoogleBooksApiBook; score: number }>();
  const normalizedLanguage = preferredLanguage?.toLowerCase();

  for (const item of items) {
    if (existingGoogleBooksIds.has(item.id)) {
      continue;
    }

    const { volumeInfo } = item;
    if (!volumeInfo?.title?.trim() || !volumeInfo.authors?.length) {
      continue;
    }

    if (
      normalizedLanguage &&
      volumeInfo.language &&
      volumeInfo.language.toLowerCase() !== normalizedLanguage
    ) {
      continue;
    }

    const key = buildDedupKey(volumeInfo);
    const score = computeCompletenessScore(volumeInfo);
    const existing = dedupMap.get(key);

    if (!existing || score > existing.score) {
      dedupMap.set(key, { book: item, score });
    }
  }

  return Array.from(dedupMap.values())
    .sort((a, b) => b.score - a.score)
    .map(entry => entry.book);
}
