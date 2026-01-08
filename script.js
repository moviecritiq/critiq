let movies = [];
const K = 30;
let movieA, movieB;
let dataLoaded = false;
let appStarted = false;

// Parse CSV file
Papa.parse("erics_list.csv", {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function (results) {
        movies = results.data
            .filter(row => row.title)
            .map(row => ({
                name: row.title,
                poster: row.poster_path || null,
                rating: 1500,
                overview: row.overview || '',
                release_date: row.release_date || 'N/A'
            }));

            if (movies.length > 1) {
                loadRatings();
                dataLoaded = true;
                const startBtn = document.getElementById('startBtn');
                if (startBtn) {
                    startBtn.disabled = false;
                    startBtn.textContent = 'Start';
                }
                if (appStarted) {
                    randomMatchup();
                    updateLeaderboard();
                }
            }
    }
});

    // Welcome / Start button handling
    const welcomeOverlay = document.getElementById('welcomeOverlay');
    const startBtn = document.getElementById('startBtn');
    const appRoot = document.getElementById('appRoot');
    // Hide the app while the welcome page is active
    if (appRoot && welcomeOverlay) appRoot.style.display = 'none';
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            appStarted = true;
            if (welcomeOverlay) welcomeOverlay.style.display = 'none';
            if (appRoot) appRoot.style.display = '';
            if (dataLoaded && movies.length > 1) {
                randomMatchup();
                updateLeaderboard();
            } else {
                // still loading; indicate waiting
                startBtn.disabled = true;
                startBtn.textContent = 'Loading...';
            }
        });
    }

function randomMatchup() {
    if (!movies || movies.length < 2) return;
    movieA = movies[Math.floor(Math.random() * movies.length)];
    do {
        movieB = movies[Math.floor(Math.random() * movies.length)];
    } while (movieB === movieA);

    const movieAEl = document.getElementById("movieA");
    const movieBEl = document.getElementById("movieB");

    renderMovieCard(movieAEl, movieA);
    renderMovieCard(movieBEl, movieB);
}

function eloUpdate(winner, loser) {
    let expectedWinner = 1 / (1 + Math.pow(10, (loser.rating - winner.rating) / 400));
    let expectedLoser = 1 / (1 + Math.pow(10, (winner.rating - loser.rating) / 400));
    winner.rating += K * (1 - expectedWinner);
    loser.rating += K * (0 - expectedLoser);
    saveRatings();
}

function updateLeaderboard() {
    // Use FLIP animation so items slide smoothly when reordered
    const container = document.getElementById("ratings");
    const sortedMovies = [...movies].sort((a, b) => b.rating - a.rating);

    // record current positions
    const oldRects = new Map();
    Array.from(container.children).forEach(li => {
        const key = li.dataset && li.dataset.name ? li.dataset.name : null;
        if (key) oldRects.set(key, li.getBoundingClientRect());
    });

    const present = new Set();

    // create/update items in new order (append in order)
    sortedMovies.forEach((m, i) => {
        const name = m.name;
        present.add(name);

        // safer lookup without CSS.escape
        let li = Array.from(container.children).find(el => el.dataset && el.dataset.name === name);

        const html = `\n            <span class="lb-pos">${i + 1}</span>\n            <span class="lb-title">${m.name}</span>\n            <span class="lb-score">${Math.round(m.rating)}</span>`;

        if (!li) {
            li = document.createElement('li');
            li.dataset.name = name;
            li.className = `pos-${i + 1}`;
            li.innerHTML = html;
            container.appendChild(li);
        } else {
            li.className = `pos-${i + 1}`;
            const pos = li.querySelector('.lb-pos'); if (pos) pos.textContent = i + 1;
            const title = li.querySelector('.lb-title'); if (title) title.textContent = m.name;
            const score = li.querySelector('.lb-score'); if (score) score.textContent = Math.round(m.rating);
            container.appendChild(li); // move to new order
        }
    });

    // remove any items not present
    Array.from(container.children).forEach(li => {
        if (!present.has(li.dataset.name)) li.remove();
    });

    // measure new positions and apply FLIP transforms
    Array.from(container.children).forEach(li => {
        const name = li.dataset.name;
        const oldRect = oldRects.get(name);
        const newRect = li.getBoundingClientRect();

        if (oldRect) {
            const dy = oldRect.top - newRect.top;
            if (dy !== 0) {
                // invert
                li.style.transform = `translateY(${dy}px)`;
                // force reflow so the transform is applied
                li.getBoundingClientRect();
                // play
                li.style.transition = 'transform 700ms cubic-bezier(0.2, 0, 0, 1)';
                li.style.transform = '';
                const cleanup = () => {
                    li.style.transition = '';
                    li.removeEventListener('transitionend', cleanup);
                };
                li.addEventListener('transitionend', cleanup);
            }
        } else {
            // new element fade/slide in
            li.style.transform = 'translateY(10px)';
            li.style.opacity = '0';
            // force reflow
            li.getBoundingClientRect();
            li.style.transition = 'transform 700ms ease, opacity 700ms ease';
            li.style.transform = '';
            li.style.opacity = '';
            const cleanupNew = () => {
                li.style.transition = '';
                li.removeEventListener('transitionend', cleanupNew);
            };
            li.addEventListener('transitionend', cleanupNew);
        }
    });
}

function saveRatings() {
    localStorage.setItem("movieRatings", JSON.stringify(movies));
}

function loadRatings() {
    let stored = localStorage.getItem("movieRatings");
    if (stored) {
        let storedMovies = JSON.parse(stored);
        movies.forEach(m => {
            let saved = storedMovies.find(sm => sm.name === m.name);
            if (saved) m.rating = saved.rating;
        });
    }
}
document.getElementById("movieA").addEventListener("click", () => {
    eloUpdate(movieA, movieB);
    updateLeaderboard();
    randomMatchup();
});

document.getElementById("movieB").addEventListener("click", () => {
    eloUpdate(movieB, movieA);
    updateLeaderboard();
    randomMatchup();
});

// Skip current matchup without changing ratings
const skipBtn = document.getElementById("skipBtn");
if (skipBtn) {
    skipBtn.addEventListener("click", () => {
        randomMatchup();
    });
}

/**
 * Render a movie card with poster and hover overlay (title + synopsis + release date).
 */
function renderMovieCard(containerEl, movie) {
    if (!containerEl || !movie) return;
    const title = movie.name || movie.title || movie.original_title || '';
    const overview = movie.overview || '';
    const posterPath = movie.poster ? `https://image.tmdb.org/t/p/w500${movie.poster}` : '';
    const releaseDate = movie.release_date || 'N/A';

    containerEl.innerHTML = `
        <img class="poster" src="${escapeHtml(posterPath)}" alt="${escapeHtml(title)} poster" />
        <div class="meta">
            <div>
                <div class="title-row">
                    <h3 class="title">${escapeHtml(title)}</h3>
                    <div class="release-date">${escapeHtml(releaseDate)}</div>
                </div>
                <p>${escapeHtml(overview)}</p>
            </div>
        </div>
    `;
}

/**
 * Safely escape text for HTML injection.
 */
function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[s]);
}
