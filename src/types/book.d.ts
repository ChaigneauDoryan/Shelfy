// src/types/book.d.ts

export interface GoogleBooksVolumeInfo {
  title: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  industryIdentifiers?: Array<{ type: string; identifier: string }>;
  pageCount?: number;
  printType?: string;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  maturityRating?: string;
  allowAnonLogging?: boolean;
  contentVersion?: string;
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
  };
  language?: string;
  previewLink?: string;
  infoLink?: string;
  canonicalVolumeLink?: string;
}

export interface GoogleBooksApiBook {
  id: string;
  volumeInfo: GoogleBooksVolumeInfo;
}

export interface ManualBookData {
  title: string;
  author: string;
  description?: string;
  coverUrl?: string;
  pageCount?: number;
  genre?: string;
  publishedDate?: string;
  publisher?: string;
  isbn?: string;
  isManual?: boolean;
}

export type BookData = GoogleBooksApiBook | ManualBookData;

export interface AddUserBookData {
  readingPace?: number;
}
