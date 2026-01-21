let movies = [];
const K = 30;
let movieA, movieB;
let dataLoaded = false;
let appStarted = false;

// Parse CSV file
Papa.parse("../movies.csv", {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function (results) {
        movies = results.data
            .filter(row => row.title) // avoid empty rows
            .map(row => ({
                name: row.title,
                poster: row.poster_path || null,
                rating: 1500,
                overview: row.overview || '',
                release_date: row.release_date || 'N/A',
                tmdbRating: parseFloat(row.vote_average) || 0
            }));

        if (movies.length > 1) {
            //loadRatings();
            dataLoaded = true;
            startHigherLowerGame();
        }
    }
});



/**
 * Safely escape text for HTML injection.
 */
function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s]);
}


// ============ Higher or Lower Game ============
let hlGameActive = false;
let hlScore = 0;
let currentMovie, nextMovie;

function startHigherLowerGame() {
    if (!dataLoaded || movies.length < 2) {
        alert('Loading movies... Please try again in a moment.');
        return;
    }
    
    hlGameActive = true;
    hlScore = 0;
    
    loadNewHigherLowerRound();
}

function newGame () {
    document.getElementById('gameOverScreen').style.display = 'none';
    hlScore = 0;
    document.getElementById('hlScore').textContent = hlScore;
    currentMovie = null;
    nextMovie = null;
    loadNewHigherLowerRound();
}

function getRandomMovie(excludeMovie = null) {
    let randomMovie;
    do {
        randomMovie = movies[Math.floor(Math.random() * movies.length)];
    } while (excludeMovie && randomMovie.name === excludeMovie.name);
    return randomMovie;
}

function loadNewHigherLowerRound() {
    const currentMovieEl = document.getElementById('currentMovie');
    const nextMovieEl = document.getElementById('nextMovie');
    
    // Remove animation classes
    if (currentMovieEl) currentMovieEl.classList.remove('exit');
    if (nextMovieEl) nextMovieEl.classList.remove('enter');
    
    currentMovie = nextMovie || getRandomMovie();
    nextMovie = getRandomMovie(currentMovie);
    
    renderHigherLowerMovie('currentMovie', currentMovie, false, "blur-1");
    renderHigherLowerMovie('nextMovie', nextMovie, true, "blur-2");
    
    // Trigger animations after rendering
    if (nextMovieEl) {
        setTimeout(() => {
            nextMovieEl.classList.add('enter');
        }, 10);
    }
}

function renderHigherLowerMovie(elementId, movie, hideRating, blurEl) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    const posterPath = `https://image.tmdb.org/t/p/w1280${movie.poster}`;
    const ratingClass = hideRating ? 'hidden' : '';
    
    el.innerHTML = `
        <img src="${escapeHtml(posterPath)}" alt="${escapeHtml(movie.name)}" />
        <div class="rating ${ratingClass}">${movie.tmdbRating.toFixed(1)}</div>
    `;

    const blur = document.getElementById(blurEl);
    if (!blur) return;
    blur.src = escapeHtml(posterPath);
}

function checkHigherLowerGuess(isHigher) {
    const currentRating = currentMovie.tmdbRating;
    const nextRating = nextMovie.tmdbRating;
    
    let correct = false;
    
    if (isHigher && nextRating > currentRating) {
        correct = true;
    } else if (!isHigher && nextRating < currentRating) {
        correct = true;
    } else if (nextRating === currentRating) {
        correct = true; // tie counts as correct
    }
    
    // Reveal the answer
    renderHigherLowerMovie('nextMovie', nextMovie, false);
    
    if (correct) {
        hlScore++;
        
        // Add exit animation to current movie
        const currentMovieEl = document.getElementById('currentMovie');
        if (currentMovieEl) currentMovieEl.classList.add('exit');
        
        // Wait for animation, then load new round
        setTimeout(() => {
            loadNewHigherLowerRound();
        }, 600);
    } else {
        // Game over - show game over screen
        const finalScore = hlScore;
        document.getElementById('finalScore').textContent = finalScore;
        
        if (finalScore < 3) {
            document.getElementById('gameOverMessage').textContent = 'You suck';
        } else {
            document.getElementById('gameOverMessage').textContent = 'Good job!';
        }
        
        document.getElementById('gameOverScreen').style.display = 'flex';
        return;
    }
    
    document.getElementById('hlScore').textContent = hlScore;
}

// Event listeners for higher/lower buttons (set up at page load in DOMContentLoaded)
const hlHigherBtn = document.getElementById('hlHigherBtn');
if (hlHigherBtn) {
    hlHigherBtn.addEventListener('click', () => {
        if (hlGameActive) checkHigherLowerGuess(true);
    });
}

const hlLowerBtn = document.getElementById('hlLowerBtn');
if (hlLowerBtn) {
    hlLowerBtn.addEventListener('click', () => {
        if (hlGameActive) checkHigherLowerGuess(false);
    });
}
