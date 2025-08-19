import { createClient } from './supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// This function will be called when a user's book status is updated to 'finished'
export async function checkAndAwardBadges(supabase: SupabaseClient, userId: string) {
  const bookCountBadges = await checkAndAwardBookCountBadges(supabase, userId);
  const genreDiversityBadges = await checkAndAwardGenreDiversityBadge(supabase, userId);
  // Reading streak badge will be implemented separately as it's more complex

  const allAwardedBadges = [...bookCountBadges, ...genreDiversityBadges];
  return allAwardedBadges;
}

async function checkAndAwardBookCountBadges(supabase: SupabaseClient, userId: string) {
  const awardedBadges = [];

  const { count, error } = await supabase
    .from('user_books')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('status_id', 3); // Assuming status_id 3 is 'finished'

  if (error || count === null) {
    console.error('Error fetching finished book count:', error);
    return [];
  }

  if (count >= 1) {
    const badge = await awardBadge(supabase, userId, 1); // Premier Pas
    if (badge) awardedBadges.push(badge);
  }
  if (count >= 5) {
    const badge = await awardBadge(supabase, userId, 2); // Apprenti Lecteur
    if (badge) awardedBadges.push(badge);
  }
  if (count >= 20) {
    const badge = await awardBadge(supabase, userId, 3); // Rat de Bibliothèque
    if (badge) awardedBadges.push(badge);
  }

  return awardedBadges;
}

// Types pour clarifier la structure des données
type BookGenreData = {
  books: {
    genre: string;
  }[] | {
    genre: string;
  } | null;
};

async function checkAndAwardGenreDiversityBadge(supabase: SupabaseClient, userId: string) {
  const awardedBadges = [];

  const { data, error } = await supabase
    .from('user_books')
    .select('books(genre)')
    .eq('user_id', userId)
    .eq('status_id', 3); // Assuming status_id 3 is 'finished'

  if (error || !data) {
    console.error('Error fetching user book genres:', error);
    return [];
  }

  // Cast explicite du type pour aider TypeScript
  const typedData = data as BookGenreData[];
  const allGenres: string[] = [];
  
  typedData.forEach(item => {
    if (Array.isArray(item.books)) {
      // Si books est un array, on ajoute tous les genres
      item.books.forEach(book => {
        if (book?.genre) {
          allGenres.push(book.genre);
        }
      });
    } else if (item.books?.genre) {
      // Si books est un objet unique
      allGenres.push(item.books.genre);
    }
  });

  const genres = new Set(allGenres);

  if (genres.size >= 3) {
    const badge = await awardBadge(supabase, userId, 5); // Curieux
    if (badge) awardedBadges.push(badge);
  }

  return awardedBadges;
}

async function awardBadge(supabase: SupabaseClient, userId: string, badgeId: number) {
  // Check if the user already has the badge
  const { data: existingBadge, error: checkError } = await supabase
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_id', badgeId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116: no rows found
    console.error('Error checking for existing badge:', checkError);
    return null;
  }

  // If the badge doesn't exist, award it
  if (!existingBadge) {
    const { error: insertError } = await supabase
      .from('user_badges')
      .insert({ user_id: userId, badge_id: badgeId });

    if (insertError) {
      console.error('Error awarding badge (insert):', insertError);
      return null;
    }

    // Fetch the details of the newly awarded badge
    const { data: badgeDetails, error: fetchError } = await supabase
      .from('badges')
      .select('*')
      .eq('id', badgeId)
      .single();

    if (fetchError) {
      console.error('Error fetching badge details:', fetchError);
      return null;
    }

    return badgeDetails;
  }

  return null;
}