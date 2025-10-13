
import { prisma } from './prisma';
import { checkAndAwardBadges } from './badge-utils';

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

export async function findOrCreateBook(bookData: any, userId: string) {
  const isGoogleBooks = bookData.volumeInfo !== undefined;
  const bookInfo = isGoogleBooks ? bookData.volumeInfo : bookData;

  const googleBooksId = bookData.id;
  const title = bookInfo.title;
  const author = bookInfo.authors ? bookInfo.authors.join(', ') : bookData.author;
  const description = bookInfo.description;
  const coverUrl = bookInfo.imageLinks?.thumbnail || bookInfo.imageLinks?.smallThumbnail || bookData.coverUrl;
  const pageCount = bookInfo.pageCount;
  const genre = bookInfo.categories ? bookInfo.categories.join(', ') : bookData.genre;
  let publishedDate = bookInfo.publishedDate;
  if (publishedDate) {
    try {
      publishedDate = new Date(publishedDate).toISOString();
    } catch (e) {
      publishedDate = null; // Invalide date format
    }
  }
  const publisher = bookInfo.publisher;
  const isManual = bookData.isManual || !isGoogleBooks;

  let isbn = bookData.isbn;
  if (isGoogleBooks && bookInfo.industryIdentifiers) {
    const isbn13 = bookInfo.industryIdentifiers.find((i: any) => i.type === 'ISBN_13');
    const isbn10 = bookInfo.industryIdentifiers.find((i: any) => i.type === 'ISBN_10');
    isbn = isbn13 ? isbn13.identifier : (isbn10 ? isbn10.identifier : null);
  }

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

export async function addUserBook(userId: string, bookId: string, bookData: any) {
  const { readingPace } = bookData;

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
      reading_pace: readingPace,
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
      book: true, // Inclure l'objet livre complet
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

export async function updateUserBookStatus(userBookId: string, statusName: string, userId: string) {
  const statusId = await getReadingStatusId(statusName);
  const updateData: any = { status_id: statusId };

  if (statusName === 'finished') {
    updateData.finished_at = new Date();
  }

  const updatedBook = await prisma.userBook.update({
    where: { id: userBookId, user_id: userId },
    data: updateData,
  });

  let awardedBadges: any[] = [];
  // La logique de badge doit aussi être migrée pour utiliser Prisma
  // if (statusName === 'finished') {
  //   awardedBadges = await checkAndAwardBadges(userId);
  // }

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
