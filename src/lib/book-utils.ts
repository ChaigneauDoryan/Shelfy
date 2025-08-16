import { cookies } from 'next/headers';
import { createClient } from './supabase/server';

export async function getReadingStatusId(supabase: any, statusName: string): Promise<number> {
  const { data, error } = await supabase
    .from('reading_statuses')
    .select('id')
    .eq('status_name', statusName)
    .single();

  if (error || !data) {
    throw new Error(`Status '${statusName}' not found.`);
  }
  return data.id;
}

export async function findOrCreateBook(supabase: any, bookData: any, userId: string) {
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
    const dateParts = publishedDate.split('-');
    if (dateParts.length === 1) { // Only year
      publishedDate = `${publishedDate}-01-01`;
    } else if (dateParts.length === 2) { // Year and month
      publishedDate = `${publishedDate}-01`;
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

  let book: any = null;
  try {
    if (!isManual && googleBooksId) {
      let { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('google_books_id', googleBooksId)
        .single();

      if (error && error.code === 'PGRST116') { // PGRST116: no rows found
        if (isbn) {
          let { data: bookByIsbn, error: isbnError } = await supabase
            .from('books')
            .select('*')
            .eq('isbn', isbn)
            .single();
          
          if (!isbnError && bookByIsbn) {
            book = bookByIsbn;
          }
        }
      } else if (data) {
        book = data;
      }
    }

    if (!book) {
      const { data: newBook, error: insertError } = await supabase
        .from('books')
        .insert({
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
          created_by: userId,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting new book:', insertError);
        return { data: null, error: insertError };
      }
      book = newBook;
    }
    return { data: book, error: null };
  } catch (e: any) {
    console.error('Error in findOrCreateBook:', e.message);
    return { data: null, error: { message: e.message } };
  }
}

export async function addUserBook(supabase: any, userId: string, bookId: string, bookData: any) {
  const { readingPace } = bookData;

  try {
    const { data: existingUserBook, error: userBookError } = await supabase
      .from('user_books')
      .select('id')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single();

    if (existingUserBook) {
      throw new Error('Ce livre est déjà dans votre bibliothèque.');
    }

    const insertData: any = {
      user_id: userId,
      book_id: bookId,
      status_id: 1, // Default: 'to_read' (ID 1)
    };

    if (readingPace) {
      insertData.reading_pace = readingPace;
    }

    const { data: userBook, error: insertError } = await supabase
      .from('user_books')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Error adding book to user library:', insertError);
      throw new Error('Failed to add book to your library.');
    }

    return userBook;
  } catch (e) {
    throw e; 
  }
}

export async function getUserBooks(supabase: any, userId: string, statusName?: string, isArchived?: boolean) {

  let query = supabase
    .from('user_books')
    .select(`
      id,
      status_id,
      rating,
      started_at,
      finished_at,
      current_page,
      book:books(*)
    `)
    .eq('user_id', userId);

  if (statusName) {
    const statusId = await getReadingStatusId(supabase, statusName);
    query = query.eq('status_id', statusId);
  }

  // Add is_archived filter
  if (isArchived !== undefined) { // Apply filter only if isArchived is explicitly true or false
    query = query.eq('is_archived', isArchived);
  }
  // If isArchived is undefined, no filter is applied, showing all books (archived and non-archived)

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching user books:', error);
    throw new Error('Failed to fetch user books.');
  }
  return data;
}

export async function getUserBookById(supabase: any, userBookId: string, userId: string) {
  const { data, error } = await supabase
    .from('user_books')
    .select(`
      id,
      status_id,
      rating,
      started_at,
      finished_at,
      book:books(*)
    `)
    .eq('id', userBookId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user book:', error.message, error.code, error);
    throw new Error('Failed to fetch user book.');
  }
  return data;
}

export async function updateUserBookStatus(supabase: any, userBookId: string, statusName: string, userId: string) {
  const statusId = await getReadingStatusId(cookieStore, statusName);
  const updateData: any = { status_id: statusId, updated_at: new Date() };

  if (statusName === 'finished') {
    updateData.finished_at = new Date();
  }

  const { data, error } = await supabase
    .from('user_books')
    .update(updateData)
    .eq('id', userBookId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user book status:', error);
    throw new Error('Failed to update book status.');
  }
  return data;
}

export async function deleteUserBook(supabase: any, userBookId: string, userId: string) {
  const { error } = await supabase
    .from('user_books')
    .delete()
    .eq('id', userBookId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting user book:', error);
    throw new Error('Failed to delete user book.');
  }
  return { message: 'Livre supprimé de votre bibliothèque.' };
}







export async function addPageComment(supabase: any, userBookId: string, pageNumber: number, commentText: string) {

  const { data, error } = await supabase
    .from('user_book_comments') // Assuming this is the existing table
    .insert({
      user_book_id: userBookId,
      page_number: pageNumber,
      comment_text: commentText,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding page comment:', error);
    throw new Error('Failed to add page comment.');
  }
  return data;
}