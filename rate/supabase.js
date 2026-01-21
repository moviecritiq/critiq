// CONFIG: put your real values here
const SUPABASE_URL = "https://tfqvucutsyoygsvehdtj.supabase.co";
const SUPABASE_KEY = "sb_publishable_J4bqJ2jxH9aMjXnRPZimoA_dDjEFC-Y";

// Grab Supabase createClient from the CDN
const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);


async function fetchMovies() {
    const { data, error } = await supabaseClient
        .from('movies')
        .select()
    movies = data
            .filter(row => row.title) // avoid empty rows
            .map(row => ({
                id : row.id,
                title: row.title,
                poster: row.poster_path || '',
                elo: row.elo,
                overview: row.overview || '',
                release_date: row.release_date || 'N/A'
            }));;
}

fetchMovies();

async function updateMovieElo(id, newElo) {
    const { error } = await supabaseClient
        .from('movies')
        .update({ elo: newElo })
        .eq('id', id);
    console.log(error);
}

updateMovieElo(157336, 9999);