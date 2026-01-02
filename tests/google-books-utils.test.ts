import { describe, expect, it } from 'vitest';

import { filterGoogleBooksItems, detectSearchLanguageFromTerms } from '@/lib/google-books';
import { GoogleBooksApiBook } from '@/types/book';

describe('detectSearchLanguageFromTerms', () => {
  it('should detect Japanese when the query contains Hiragana or Kanji', () => {
    const result = detectSearchLanguageFromTerms(['これは日本語のタイトルです']);
    expect(result).toEqual({ language: 'ja', isFallback: false });
  });

  it('should detect French when the query includes French-specific characters or words', () => {
    const result = detectSearchLanguageFromTerms(['Le mystère de la forêt enchantée']);
    expect(result).toEqual({ language: 'fr', isFallback: false });
  });

  it('should fallback to English for neutral queries', () => {
    const result = detectSearchLanguageFromTerms(['A gentle book search without accents']);
    expect(result.language).toBe('en');
    expect(result.isFallback).toBe(true);
  });
});

describe('filterGoogleBooksItems', () => {
  const completeFrenchBook: GoogleBooksApiBook = {
    id: 'fr-complete',
    volumeInfo: {
      title: 'Le voyageur',
      authors: ['Émile Zola'],
      description: 'Une description française complète.',
      publisher: 'Maison Littéraire',
      language: 'fr',
      imageLinks: { thumbnail: 'https://example.com/fr-cover.jpg' },
      industryIdentifiers: [{ type: 'ISBN_13', identifier: '1111111111111' }],
    },
  };

  const incompleteDuplicate: GoogleBooksApiBook = {
    id: 'fr-dup',
    volumeInfo: {
      title: 'Le voyageur',
      authors: ['Émile Zola'],
      description: undefined,
      publisher: 'Maison Littéraire',
      language: 'fr',
      imageLinks: { thumbnail: 'https://example.com/fr-cover.jpg' },
    },
  };

  const englishBook: GoogleBooksApiBook = {
    id: 'en',
    volumeInfo: {
      title: 'Traveler',
      authors: ['Emile'],
      description: 'An English version.',
      publisher: 'Literary House',
      language: 'en',
      imageLinks: { thumbnail: 'https://example.com/en-cover.jpg' },
    },
  };

  it('should prefer the most complete card and remove duplicates', () => {
    const filtered = filterGoogleBooksItems([completeFrenchBook, incompleteDuplicate], {
      preferredLanguage: 'fr',
      existingGoogleBooksIds: new Set(),
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('fr-complete');
  });

  it('should remove books already in the user library', () => {
    const filtered = filterGoogleBooksItems([completeFrenchBook], {
      preferredLanguage: 'fr',
      existingGoogleBooksIds: new Set(['fr-complete']),
    });
    expect(filtered).toHaveLength(0);
  });

  it('should filter books that do not match the preferred language when language is specified', () => {
    const filtered = filterGoogleBooksItems([englishBook], {
      preferredLanguage: 'fr',
      existingGoogleBooksIds: new Set(),
    });
    expect(filtered).toHaveLength(0);
  });

  it('should still keep entries that are missing a description or cover if no better option exists', () => {
    const missingDescription: GoogleBooksApiBook = {
      id: 'missing-description',
      volumeInfo: {
        title: 'Un livre sans description',
        authors: ['Auteur'],
        publisher: 'Petit éditeur',
        language: 'fr',
        imageLinks: { thumbnail: 'https://example.com/cover.jpg' },
      },
    };

    const filtered = filterGoogleBooksItems([missingDescription], {
      preferredLanguage: 'fr',
      existingGoogleBooksIds: new Set(),
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('missing-description');
  });
});
