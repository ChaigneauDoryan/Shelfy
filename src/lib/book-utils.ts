import { cookies } from 'next/headers';
import { createClient } from './supabase/server';

export async function getReadingStatusId(cookieStore: ReturnType<typeof cookies>, statusName: string): Promise<number> {
  const supabase = createClient(cookieStore);
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

export async function findOrCreateBook(cookieStore: ReturnType<typeof cookies>, bookData: any, userId: string) {
  const supabase = createClient(cookieStore);
  const { googleBooksId, isbn, title, author, description, coverUrl, pageCount, genre, publishedDate, publisher } = bookData;

  let book: any = null;
  try {
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

    if (!book) {
      const { data: newBook, error: insertError } = await supabase
        .from('books')
        .insert({
          google_books_id: googleBooksId,
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
        throw new Error('Failed to save book information.');
      }
      book = newBook;
    }
  } catch (e) {
    throw e; 
  }

  return book;
}

export async function addUserBook(cookieStore: ReturnType<typeof cookies>, userId: string, bookId: string) {
  const supabase = createClient(cookieStore);

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

    const { data: userBook, error: insertError } = await supabase
      .from('user_books')
      .insert({
        user_id: userId,
        book_id: bookId,
        status_id: 1, // Par défaut: 'to_read' (ID 1)
      })
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

export async function getUserBooks(cookieStore: ReturnType<typeof cookies>, userId: string, statusName?: string) {
  const supabase = createClient(cookieStore);

  let query = supabase
    .from('user_books')
    .select(`
      id,
      status_id,
      rating,
      started_at,
      finished_at,
      book:books(*)
    `)
    .eq('user_id', userId);

  if (statusName) {
    const statusId = await getReadingStatusId(cookieStore, statusName);
    query = query.eq('status_id', statusId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching user books:', error);
    throw new Error('Failed to fetch user books.');
  }
  return data;
}

export async function getUserBookById(cookieStore: ReturnType<typeof cookies>, userBookId: string, userId: string) {
  const supabase = createClient(cookieStore);
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
    console.error('Error fetching user book:', error);
    throw new Error('Failed to fetch user book.');
  }
  return data;
}

export async function updateUserBookStatus(cookieStore: ReturnType<typeof cookies>, userBookId: string, statusName: string, userId: string) {
  const supabase = createClient(cookieStore);
  const statusId = await getReadingStatusId(cookieStore, statusName);
  const updateData: any = { status_id: statusId, updated_at: new Date() };

  if (statusName === 'finished') {
    updateData.finished_at = new Date();
  } else if (statusName === 'reading') {
    updateData.started_at = new Date();
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

export async function deleteUserBook(cookieStore: ReturnType<typeof cookies>, userBookId: string, userId: string) {
  const supabase = createClient(cookieStore);
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
