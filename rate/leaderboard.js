function updateLeaderboard() {
    // Use FLIP animation so items slide smoothly when reordered
    const container = document.getElementById("leaderboard");
    const sortedMovies = [...movies].sort((a, b) => b.elo - a.elo);

    // record current positions
    const oldRects = new Map();
    Array.from(container.children).forEach(li => {
        const key = li.dataset && li.dataset.title ? li.dataset.title : null;
        if (key) oldRects.set(key, li.getBoundingClientRect());
    });

    const present = new Set();

    // create/update items in new order (append in order)
    sortedMovies.forEach((m, i) => {
        const title = m.title;
        present.add(title);

        // safer lookup without CSS.escape
        let li = Array.from(container.children).find(el => el.dataset && el.dataset.title === title);

        const html = `<span class="lb-pos">${i + 1}</span><span class="lb-title">${m.title}</span><span class="lb-score">${Math.round(m.elo)}</span>`;

        if (!li) {
            li = document.createElement('li');
            li.dataset.title = title;
            li.innerHTML = html;
            container.appendChild(li);
        } else {
            const pos = li.querySelector('.lb-pos'); if (pos) pos.textContent = i + 1;
            const title = li.querySelector('.lb-title'); if (title) title.textContent = m.title;
            const score = li.querySelector('.lb-score'); if (score) score.textContent = Math.round(m.elo);
            container.appendChild(li); // move to new order
        }
    });

    // remove any items not present
    Array.from(container.children).forEach(li => {
        if (!present.has(li.dataset.title)) li.remove();
    });

    // measure new positions and apply FLIP transforms
    Array.from(container.children).forEach(li => {
        const title = li.dataset.title;
        const oldRect = oldRects.get(title);
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