
// 🎭 imdb-cast-loader.js
const TMDB_API_KEY = '34773a6e0f80645a5b07a1ee76ecc26b';  // Replace with your TMDb key
const YOUTUBE_API_KEY = 'AIzaSyBJMZDXDPcVPUFhMKdYrABrke4PQZgRsT8';

async function fetchCastFromIMDb() {
  const input = document.getElementById('imdbIdInput').value.trim();
  let imdbId = input.includes("imdb.com") ? input.split("/name/")[1]?.split("/")[0] : input;

  if (!imdbId || !imdbId.startsWith('nm')) {
    alert('Invalid IMDb ID or URL');
    return;
  }

  const castContainer = document.getElementById('cast-list-preview');
  castContainer.innerHTML = '<p>Loading cast data...</p>';

  try {
    // Step 1: Get TMDb person ID by IMDb ID
    const tmdbRes = await fetch(`https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`);
    const tmdbData = await tmdbRes.json();

    const person = tmdbData.person_results[0];
    if (!person) throw new Error('No TMDb match for IMDb ID');

    const personId = person.id;

    // Step 2: Get full person details
    const detailRes = await fetch(`https://api.themoviedb.org/3/person/${personId}?api_key=${TMDB_API_KEY}&append_to_response=movie_credits`);
    const detailData = await detailRes.json();

    // Build a simplified profile card
    const films = detailData.movie_credits.cast.slice(0, 2).map(movie => ({
      title: movie.title,
      poster: movie.poster_path ? 'https://image.tmdb.org/t/p/w300' + movie.poster_path : ''
    }));

    const castJson = {
      name: detailData.name,
      character: detailData.known_for_department || 'Actor',
      knownFor: films.map(f => f.title).join(', '),
      bio: detailData.biography || 'No bio available.',
      headshot: detailData.profile_path ? 'https://image.tmdb.org/t/p/w300' + detailData.profile_path : '',
      films
    };

    // Show preview
    castContainer.innerHTML = `
      <div style="display:flex; gap:20px; align-items:flex-start;">
        <img src="${castJson.headshot}" width="120" />
        <div>
          <h3>${castJson.name}</h3>
          <strong>Role:</strong> ${castJson.character}<br>
          <strong>Known for:</strong> ${castJson.knownFor}<br>
          <p>${castJson.bio}</p>
          <h4>🎬 Films:</h4>
          <div style="display:flex; gap:10px;">
            ${castJson.films.map(f => `<div><img src="${f.poster}" width="80"><br><small>${f.title}</small></div>`).join('')}
          </div>
        </div>
      </div>
    `;

    // Store result globally for saving
    window.fetchedCast = castJson;

  } catch (e) {
    console.error(e);
    castContainer.innerHTML = '<p style="color:red;">Failed to load cast info. Please check the IMDb ID and try again.</p>';
  }
}

function saveToCastData() {
  if (!window.fetchedCast) return alert("No cast data to save!");

  fetch('/flm-viewer/cast/cast-data.json')  // Optional: verify path exists
    .catch(() => console.warn('File not found. This will be saved manually.'));

  const blob = new Blob([JSON.stringify([window.fetchedCast], null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cast-data.json';
  a.click();
}
