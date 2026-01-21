let movies = [];
const K = 30;
let movieA, movieB;
let comparisonsCount = 0;

// Parse CSV file
Papa.parse("../movies.csv", {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function (results) {
        movies = results.data
            .filter(row => row.title) // avoid empty rows
            .map(row => ({
                id : row.id,
                title: row.title,
                poster: row.poster_path || '',
                elo: 1500,
                overview: row.overview || '',
                release_date: row.release_date || 'N/A'
            }));
        loadRatings();
        randomMatchup();
        updateLeaderboard();
    }
});

function randomMatchup() {
    movieA = movies[Math.floor(Math.random() * movies.length)];
    do {
        movieB = movies[Math.floor(Math.random() * movies.length)];
    } while (movieB === movieA && movies.length > 1);
    renderMovieCard(document.getElementById("movieA"), movieA);
    renderMovieCard(document.getElementById("movieB"), movieB);
}

function renderMovieCard(containerEl, movie) {
    document.getElementById("comparisonCount").textContent = comparisonsCount;

    if (!containerEl || !movie) return;
    containerEl.querySelector('.poster-placeholder').innerHTML = `
        <img class="poster" src="https://image.tmdb.org/t/p/w500${movie.poster}" alt="${movie.title}">
    `;

    containerEl.querySelector('.title').textContent = movie.title;
    containerEl.querySelector('.meta p').textContent = movie.overview;
    containerEl.querySelector('.release-date').textContent = `Released: ${movie.release_date}`;

    // Remove button listener
    const removeBtn = containerEl.querySelector('.remove-btn');
    if (removeBtn) {
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeMovie(movie.title);
        };
    }
}

function eloUpdate(winner, loser) {
    comparisonsCount++;
    let expectedWinner = 1 / (1 + Math.pow(10, (loser.elo - winner.elo) / 400));
    let expectedLoser = 1 / (1 + Math.pow(10, (winner.elo - loser.elo) / 400));
    winner.elo += K * (1 - expectedWinner);
    loser.elo += K * (0 - expectedLoser);
    saveRatings();
}

function saveRatings() {
    const simplifiedMovies = movies.map(movie => ({
        id: movie.id,
        elo: movie.elo
    }));
    localStorage.setItem("movieRatings", JSON.stringify(simplifiedMovies));
    localStorage.setItem("comparisonsCount", JSON.stringify(comparisonsCount));
}

function loadRatings() {
    comparisonsCount = JSON.parse(localStorage.getItem("comparisonsCount"));
    let stored = localStorage.getItem("movieRatings");
    if (stored) {
        let storedMovies = JSON.parse(stored);
        movies = movies.filter(m => storedMovies.some(sm => sm.id === m.id));
        movies.forEach(m => {
            let saved = storedMovies.find(sm => sm.id === m.id);
            if (saved) m.elo = saved.elo;
        });
    }
}

function chooseMovie(movie) {
    eloUpdate(movie, movie === movieA ? movieB : movieA);
    updateLeaderboard();
    randomMatchup();
}

function removeMovie(movieTitle) {
    movies = movies.filter(m => m.title !== movieTitle);
    saveRatings();
    updateLeaderboard();
    randomMatchup();
}
