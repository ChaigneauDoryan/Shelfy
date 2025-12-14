
import { prisma } from './prisma';
import { checkAndAwardBadges } from './badge-utils';
import { canAddMorePersonalBooks } from './subscription-utils';
import { SubscriptionLimitError } from './errors';
import { BookData, GoogleBooksApiBook, ManualBookData, AddUserBookData, GoogleBooksVolumeInfo } from '@/types/book';
import type { AwardedBadge, UserBookWithBook } from '@/types/domain';

// Note: Les types Book et UserBook sont maintenant générés par Prisma.
// Nous pouvons les importer si nécessaire, mais souvent ce n'est pas obligatoire
// car le typage de retour de Prisma est très bon.

export async function getReadingStatusId(statusName: string): Promise<number> {
  const status = await prisma.readingStatus.findUnique({
    where: { status_name: statusName },
    select: { id: true },
  });

  if (!status) {
    throw new Error(`Status '${statusName}' not found.`);
  }
  return status.id;
}

interface NormalizedBookInput {
  googleBooksId?: string;
  isbn?: string | null;
  title: string;
  author: string;
  description?: string | null;
  coverUrl?: string | null;
  pageCount?: number | null;
  genre?: string | null;
  publishedDate?: string | null;
  publisher?: string | null;
  isManual: boolean;
}

const toIsoDateOrNull = (value?: string): string | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const normalizeGoogleBook = (book: GoogleBooksApiBook): NormalizedBookInput => {
  const volume = book.volumeInfo;
  const identifiers = volume.industryIdentifiers ?? [];
  const isbn13 = identifiers.find((i) => i.type === 'ISBN_13');
  const isbn10 = identifiers.find((i) => i.type === 'ISBN_10');

  return {
    googleBooksId: book.id,
    isbn: isbn13?.identifier ?? isbn10?.identifier ?? null,
    title: volume.title,
    author: volume.authors?.join(', ') ?? 'Auteur inconnu',
    description: volume.description ?? null,
    coverUrl: volume.imageLinks?.thumbnail ?? volume.imageLinks?.smallThumbnail ?? null,
    pageCount: volume.pageCount ?? null,
    genre: volume.categories?.join(', ') ?? null,
    publishedDate: toIsoDateOrNull(volume.publishedDate),
    publisher: volume.publisher ?? null,
    isManual: false,
  };
};

const normalizeManualBook = (book: ManualBookData): NormalizedBookInput => ({
  googleBooksId: undefined,
  isbn: book.isbn ?? null,
  title: book.title,
  author: book.author,
  description: book.description ?? null,
  coverUrl: book.coverUrl ?? null,
  pageCount: book.pageCount ?? null,
  genre: book.genre ?? null,
  publishedDate: toIsoDateOrNull(book.publishedDate),
  publisher: book.publisher ?? null,
  isManual: book.isManual ?? true,
});

export async function findOrCreateBook(bookData: BookData, userId: string) {
  const isGoogleBooks = 'volumeInfo' in bookData;
  const normalizedData = isGoogleBooks
    ? normalizeGoogleBook(bookData as GoogleBooksApiBook)
    : normalizeManualBook(bookData as ManualBookData);

  const {
    googleBooksId,
    isbn,
    title,
    author,
    description,
    coverUrl,
    pageCount,
    genre,
    publishedDate,
    publisher,
    isManual,
  } = normalizedData;

  // Logique de recherche simplifiée avec Prisma
  if (!isManual && (googleBooksId || isbn)) {
    const existingBook = await prisma.book.findFirst({
      where: {
        OR: [
          { google_books_id: googleBooksId ? String(googleBooksId) : undefined },
          { isbn: isbn ? String(isbn) : undefined },
        ],
      },
    });
    if (existingBook) {
      return existingBook;
    }
  }

  // Si non trouvé, créer le livre
  console.log('Attempting to create new book with data:', {
    google_books_id: isManual ? null : googleBooksId,
    isbn: isbn,
    title: title,
    author: author,
    description: description,
    cover_url: coverUrl,
    page_count: pageCount,
    genre: genre,
    published_date: publishedDate,
    publisher: publisher,
    created_by_id: userId,
  });
  const newBook = await prisma.book.create({
    data: {
      google_books_id: isManual ? null : googleBooksId,
      isbn: isbn,
      title: title,
      author: author,
      description: description,
      cover_url: coverUrl,
      page_count: pageCount,
      genre: genre,
      published_date: publishedDate,
      publisher: publisher,
      created_by_id: userId,
    },
  });

  return newBook;
}

export async function addUserBook(userId: string, bookId: string, bookData: AddUserBookData) {
  const { readingPace } = bookData;

  const canAdd = await canAddMorePersonalBooks(userId);
  if (!canAdd) {
    throw new SubscriptionLimitError('Vous avez atteint la limite de livres personnels pour votre plan d\'abonnement.');
  }

  const existingUserBook = await prisma.userBook.findUnique({
    where: { user_id_book_id: { user_id: userId, book_id: bookId } },
  });

  if (existingUserBook) {
    throw new Error('Ce livre est déjà dans votre bibliothèque.');
  }

  const userBook = await prisma.userBook.create({
    data: {
      user_id: userId,
      book_id: bookId,
      status_id: 1, // Default: 'to_read' (ID 1)
      reading_pace: readingPace != null ? String(readingPace) : null,
    },
  });

  return userBook;
}

export async function getUserBooks(userId: string, statusId?: number, isArchived?: boolean) {
  const userBooks = await prisma.userBook.findMany({
    where: {
      user_id: userId,
      status_id: statusId,
      is_archived: isArchived,
    },
    include: {
      book: true, // Inclure l\'objet livre complet
    },
    orderBy: {
      created_at: 'desc',
    },
  });
  return userBooks;
}

export async function getUserBookById(userBookId: string, userId: string) {
  const userBook = await prisma.userBook.findFirst({
    where: {
      id: userBookId,
      user_id: userId,
    },
    include: {
      book: true,
    },
  });

  if (!userBook) {
    throw new Error('Failed to fetch user book.');
  }
  return userBook;
}

export async function updateUserBookStatus(
  userBookId: string,
  statusName: string,
  userId: string
): Promise<{ updatedBook: UserBookWithBook; awardedBadges: AwardedBadge[] }> {
  const statusId = await getReadingStatusId(statusName);
  const updateData: { status_id: number; finished_at?: Date; current_page?: number } = { status_id: statusId };

  // First, verify the book exists and belongs to the user.
  // This prevents errors by fetching the book before attempting to update.
  const userBook = await prisma.userBook.findFirst({
    where: {
      id: userBookId,
      user_id: userId,
    },
    include: {
      book: true,
    },
  });

  if (!userBook) {
    throw new Error("Livre non trouvé ou vous n'avez pas la permission de le modifier.");
  }

  // If the book is finished, set the finished date and update the current page.
  if (statusName === 'finished') {
    updateData.finished_at = new Date();
    if (userBook.book.page_count) {
      updateData.current_page = userBook.book.page_count;
    }
  }

  const updatedBook = await prisma.userBook.update({
    where: {
      id: userBookId,
    },
    data: updateData,
    include: {
      book: true,
    },
  });

  let awardedBadges: AwardedBadge[] = [];
  if (statusName === 'finished') {
    awardedBadges = await checkAndAwardBadges(userId);
  }

  return { updatedBook, awardedBadges };
}

export async function deleteUserBook(userBookId: string, userId: string) {
  await prisma.userBook.delete({
    where: {
      id: userBookId,
      user_id: userId, // Assure que seul le propriétaire peut supprimer
    },
  });
  return { message: 'Livre supprimé de votre bibliothèque.' };
}

export async function addPageComment(userBookId: string, pageNumber: number, commentText: string) {
  const newComment = await prisma.userBookComment.create({
    data: {
      user_book_id: userBookId,
      page_number: pageNumber,
      comment_text: commentText,
    },
  });
  return newComment;
}

export async function updateUserBookArchiveStatus(userBookId: string, userId: string, isArchived: boolean) {
  const updatedUserBook = await prisma.userBook.update({
    where: {
      id: userBookId,
      user_id: userId,
    },
    data: {
      is_archived: isArchived,
    },
  });
  return updatedUserBook;
}

export async function fetchBookDetailsFromGoogleBooks(googleBooksId: string) {
  const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${googleBooksId}`);
  if (!response.ok) {
    console.error(`Failed to fetch book details for Google Books ID: ${googleBooksId}`, response.statusText);
    return null;
  }
  const data = await response.json();
  return data.volumeInfo;
}
