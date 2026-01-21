let movies = [];
let movieA, movieB;
let streak = 0;
let bestStreak = 0;
let guessing = false;

// Parse CSV file
Papa.parse("../movies.csv", {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function (results) {
        movies = results.data
            .filter(row => row.title) // avoid empty rows
            .map(row => ({
                title: row.title,
                poster: row.poster_path || '',
                rating: row.vote_average, // Use TMDB rating
                overview: row.overview || '',
                release_date: row.release_date || 'N/A'
            }));

        if (movies.length > 1) {
            randomMatchup();
        }
    }
});

function randomMatchup() {
    movieA = movies[Math.floor(Math.random() * movies.length)];
    do {
        movieB = movies[Math.floor(Math.random() * movies.length)];
    } while (movieB === movieA);
    renderMovieCard(document.getElementById("movieA"), movieA);
    renderMovieCard(document.getElementById("movieB"), movieB);
    guessing = false;
    document.getElementById("result").classList.add('hidden');
}

function nextRound(keepMovie, keepContainer) {
    // Get a new random movie different from the keeper
    let newMovie;
    do {
        newMovie = movies[Math.floor(Math.random() * movies.length)];
    } while (newMovie.title === keepMovie.title);
    
    // Replace the other movie
    const otherContainer = keepContainer.id === 'movieA' ? 
        document.getElementById("movieB") : document.getElementById("movieA");
    
    if (keepContainer.id === 'movieA') {
        movieB = newMovie;
    } else {
        movieA = newMovie;
    }
    
    renderMovieCard(otherContainer, newMovie);
    guessing = false;
    document.getElementById("result").classList.add('hidden');
}

function renderMovieCard(containerEl, movie) {
    if (!containerEl || !movie) return;
    containerEl.querySelector('.poster-placeholder').innerHTML = `
        <img class="poster" src="https://image.tmdb.org/t/p/w500${movie.poster}" alt="${movie.title}">
    `;

    containerEl.querySelector('.title').textContent = movie.title;
    const metaP = containerEl.querySelector('.meta p');
    metaP.textContent = movie.overview;
    containerEl.querySelector('.release-date').textContent = `Released: ${movie.release_date}`;

    // Movie card click to guess
    containerEl.onclick = (e) => {
        if (!guessing) {
            makeGuess(movie, containerEl);
        }
    };
}

function makeGuess(guessedMovie, containerEl) {
    if (guessing) return;
    guessing = true;
    
    const otherMovie = guessedMovie === movieA ? movieB : movieA;
    const otherContainer = guessedMovie === movieA ? 
        document.getElementById("movieB") : document.getElementById("movieA");
    const isCorrect = guessedMovie.rating > otherMovie.rating;
    
    // Show result
    const resultEl = document.getElementById("result");
    
    if (isCorrect) {
        streak++;
        if (streak > bestStreak) bestStreak = streak;
        resultEl.textContent = `Correct! Streak: ${streak}`;
        resultEl.className = `result correct`;
        document.getElementById("score").textContent = `Streak: ${streak} | Best: ${bestStreak}`;
    } else {
        resultEl.textContent = `Game Over! Best streak: ${bestStreak}`;
        resultEl.className = `result incorrect`;
    }
    
    // Always show ratings on both movies
    document.querySelectorAll('.guess-movie').forEach(el => {
        const movie = el === containerEl ? guessedMovie : otherMovie;
        const existingRating = el.querySelector('.rating');
        if (existingRating) existingRating.remove();
        const ratingEl = document.createElement('div');
        ratingEl.className = 'rating';
        ratingEl.textContent = movie.rating.toFixed(1);
        el.appendChild(ratingEl);
    });
    
    if (isCorrect) {
        // Continue with next round - randomly choose which movie to keep
        setTimeout(() => {
            const keepWinner = Math.random() > 0.5;
            if (keepWinner) {
                // Keep the correct choice, replace the other
                nextRound(guessedMovie, containerEl);
            } else {
                // Keep the wrong choice, replace the correct one
                nextRound(otherMovie, otherContainer);
            }
        }, 1500);
    } else {
        // Game over - show restart option
        setTimeout(() => {
            streak = 0;
            document.getElementById("score").textContent = `Streak: ${streak} | Best: ${bestStreak}`;
            randomMatchup();
        }, 2500);
    }
}
