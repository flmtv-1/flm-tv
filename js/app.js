// =======================================================
//  🎬 Jellyfin Integration
// =======================================================

// 🌐 Jellyfin API Config
const JELLYFIN_SERVER = "http://192.168.1.28:8096";   // 👈 replace with your NAS LAN IP
const API_KEY = "61d4bab81ebd4c3b97577aa2c61a7436";
const USER_ID = "eb93bfe071ee4c9e9a230f093bffc0d4";   // 👈 your Jellyfin UserId

// =======================================================
//  🎬 Categories Map
// =======================================================
const CATEGORY_MAP = {
  "continue-watching-grid": "resume", // special case
  "movies-grid": "689c3f2fb8ec0ad205e3d8a10f2374c3",   // Movies
  "awesome-tv-grid": "2bf52839930529f99103629d73a7eddf", // Awesome TV Shows
  "asian-cinema-grid": "19116110a53a09d86550478370bfc335", // Asian Cinema
  "beyond-reality-grid": "340bf395c964fa0cd8bb3ea7637cba92", 
  "classic-tv-grid": "166e859a8da3ffff474656b30a70835b", 
  "collections-grid": "9d7ad6afe9afa2dab1a2f6e00ad28fa6", 
  "comedy-grid": "4e568432e1e1fe9b58d9686ed00209f2", 
  "flm-news-grid": "1259ee891225026d06a4196ea5df33bf", 
  "independent-grid": "73ab9c3def8d47b4d7a3aa7a95fbc505", 
  "gaming-grid": "acd9ad43077694066efd35f9951ccbcc", 
  "golden-classics-grid": "1a174c52bb41600a050fba01721b7bd9", 
  "in-spanish-grid": "f6242940555a0e587208f9a341328f76", 
  "international-grid": "ba8b8bbcbf17886eaa65ec99bfa6dee6", 
  "kids-world-grid": "469e7ae569d80eaf09e9ff54b55708ba", 
  "live-events-grid": "2e1b17e21dc4226a24c642f954e8b949", 
  "midnight-grid": "3f690d06d91a896371469fa96d0b3d21", 
  "talk-grid": "8fddfbad9a964aec868e3952adeb2945", 
  "teens-grid": "8d8187c8ab14b6edc1451b5052470fc4", 
  "zaina-zone-grid": "1ac641863cec9162df01d2c2a751c932"
};

// =======================================================
//  📌 Fetchers
// =======================================================

// Special fetcher for Continue Watching
async function fetchContinueWatching() {
  try {
    const res = await fetch(`${JELLYFIN_SERVER}/Users/${USER_ID}/Items/Resume`, {
      headers: {
        "X-Emby-Token": API_KEY,
        "Accept": "application/json"
      }
    });

    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();

    const grid = document.getElementById("continue-watching-grid");
    if (!grid) return;

    grid.innerHTML = data.Items.map(m => `
      <div class="movie-card">
        <img src="${JELLYFIN_SERVER}/Items/${m.Id}/Images/Primary?api_key=${API_KEY}" alt="${m.Name}">
        <h3>${m.Name}</h3>
      </div>
    `).join("");

  } catch (err) {
    console.error("Error fetching Continue Watching:", err);
  }
}

// Generic fetcher for normal categories
async function fetchCategory(categoryId, gridId) {
  try {
    const res = await fetch(`${JELLYFIN_SERVER}/Items?ParentId=${categoryId}`, {
      headers: {
        "X-Emby-Token": API_KEY,
        "Accept": "application/json"
      }
    });

    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();

    const grid = document.getElementById(gridId);
    if (!grid) return;

   grid.innerHTML = data.Items.map(m => `
  <div class="movie-card" onclick="openJellyfinItem('${m.Id}')">
    <img src="${JELLYFIN_SERVER}/Items/${m.Id}/Images/Primary?api_key=${API_KEY}" alt="${m.Name}">
    <h3>${m.Name}</h3>
  </div>
`).join("");


  } catch (err) {
    console.error(`Error loading category ${gridId}:`, err);
  }
}

// =======================================================
//  🚀 Load Categories on Page Load
// =======================================================
document.addEventListener("DOMContentLoaded", () => {
  for (const [gridId, categoryId] of Object.entries(CATEGORY_MAP)) {
    if (categoryId === "resume") {
      fetchContinueWatching(); // Special case
    } else {
      fetchCategory(categoryId, gridId); // Normal categories
    }
  }
});

// =======================================================
//  🎬 Navigation to Jellyfin Pages
// =======================================================
function openJellyfinItem(itemId) {
  // Direct link to Jellyfin’s own item page
  window.location.href = `${JELLYFIN_SERVER}/web/index.html#!/item?id=${itemId}&serverId=${USER_ID}`;
}
function scrollCategories(direction) {
  const container = document.getElementById("categories-scroll");
  const scrollAmount = 300; // how far each click scrolls
  container.scrollBy({
    left: direction * scrollAmount,
    behavior: "smooth"
  });
}
