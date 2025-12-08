// js/app.js - Main Application Logic

// --- Firebase Initialization and Auth State Management ---
// We access the Firebase objects made globally available in index.html
const { initializeApp, getAuth, signInAnonymously, onAuthStateChanged, getFirestore } = window.firebase;

// Global variables for Firebase services
let app;
let auth;
let db;
let isAuthInitialized = false;
let userId = 'anonymous'; // Default to anonymous user ID

// Application configuration and constants
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.error("Firebase initialization failed:", error);
}

/**
 * Initializes Firebase authentication by signing in with a custom token or anonymously.
 */
async function initializeAuth() {
    try {
        if (initialAuthToken) {
            await window.firebase.signInWithCustomToken(auth, initialAuthToken);
        } else {
            await signInAnonymously(auth);
        }
    } catch (error) {
        console.error("Firebase authentication failed:", error);
    }
}

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    isAuthInitialized = true;
    if (user) {
        // User is signed in.
        userId = user.uid;
        console.log("User signed in:", userId);
        document.getElementById('userIdDisplay').textContent = `User ID: ${userId}`;
        document.getElementById('userIdDisplay').classList.remove('hidden');
    } else {
        // User is signed out.
        console.log("User signed out.");
        userId = crypto.randomUUID(); // Fallback to a random ID for anonymous data
        document.getElementById('userIdDisplay').textContent = `Anon User ID: ${userId}`;
        document.getElementById('userIdDisplay').classList.remove('hidden');
    }
});


// --- Panel and Modal Management ---
const videoPlayer = document.getElementById('videoPlayer');
const panels = ['chatBox', 'lumaPanel', 'videoPlayer']; // All panels that can be toggled

/**
 * Toggles the visibility of a given panel.
 * @param {string} panelId The ID of the panel to toggle.
 */
window.togglePanel = (panelId) => {
    const panelElement = document.getElementById(panelId);
    if (!panelElement) {
        console.error(`Panel with ID "${panelId}" not found.`);
        return;
    }

    if (panelElement.classList.contains('active')) {
        panelElement.classList.remove('active');
        document.body.style.overflow = 'auto';
    } else {
        // Close other panels first
        panels.forEach(id => {
            if (id !== panelId) {
                document.getElementById(id).classList.remove('active');
            }
        });

        panelElement.classList.add('active');
        if (panelId === 'videoPlayer') {
             // For video player, we want a full-screen-like experience.
             document.body.style.overflow = 'hidden';
        }
    }
};

/**
 * Displays a custom alert modal instead of using the browser's alert().
 * @param {string} message The message to display.
 */
window.showCustomAlert = (message) => {
    const modal = document.getElementById('customAlertModal');
    const messageElement = document.getElementById('customAlertMessage');
    messageElement.textContent = message;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
};

/**
 * Hides the custom alert modal.
 */
window.hideCustomAlert = () => {
    const modal = document.getElementById('customAlertModal');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
};

/**
 * Handles clicks on features that require authentication.
 * If the user is not signed in, it shows an alert.
 * @param {string} featureName The name of the feature (e.g., 'Chat', 'Zaina AI').
 * @param {string} panelId The ID of the panel to open if the user is authenticated.
 */
window.handleAuthRestrictedFeature = (featureName, panelId) => {
    if (!auth.currentUser) {
        showCustomAlert(`Please sign in to use the ${featureName} feature.`);
    } else {
        togglePanel(panelId);
    }
};


// --- Video Player Functions ---

/**
 * Plays a video in the video player panel.
 * @param {string} title The title of the video.
 * @param {string} videoUrl The URL of the video source.
 */
window.playVideo = (title, videoUrl) => {
    const player = document.getElementById('player');
    const videoTitle = document.getElementById('videoPlayerTitle');
    
    videoTitle.textContent = title;
    player.src = videoUrl;
    
    togglePanel('videoPlayer'); // Open the video player panel
    player.play();
};


// --- Mock Data (will be replaced by API calls in a real app) ---
const mockData = {
    heroSlides: [
        {
            title: "Echoes of the Void",
            description: "A lone explorer uncovers a terrifying secret at the edge of the universe.",
            imageUrl: "https://placehold.co/1920x1080/1a202c/ffffff?text=Echoes+of+the+Void",
            videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
        },
        {
            title: "Rogue Ops: The Last Mission",
            description: "An elite special forces team races against time to prevent a global catastrophe.",
            imageUrl: "https://placehold.co/1920x1080/2d3748/ffffff?text=Rogue+Ops",
            videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
        },
        {
            title: "City of Shadows",
            description: "In a neon-drenched metropolis, a detective hunts a serial killer with a taste for the theatrical.",
            imageUrl: "https://placehold.co/1920x1080/4a5568/ffffff?text=City+of+Shadows",
            videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
        }
    ],
    latestReleases: [
        { title: "Crimson Peak", imageUrl: "https://placehold.co/300x450/e53e3e/ffffff?text=Crimson+Peak", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
        { title: "Project Chimera", imageUrl: "https://placehold.co/300x450/48bb78/ffffff?text=Project+Chimera", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
        { title: "The Quantum Enigma", imageUrl: "https://placehold.co/300x450/4299e1/ffffff?text=Quantum+Enigma", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
        { title: "Starfall", imageUrl: "https://placehold.co/300x450/9f7aea/ffffff?text=Starfall", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
        { title: "Beyond the Horizon", imageUrl: "https://placehold.co/300x450/f6ad55/ffffff?text=Beyond+Horizon", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
        { title: "A Whisper in the Dark", imageUrl: "https://placehold.co/300x450/cbd5e0/ffffff?text=Whisper+Dark", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
    ],
    liveTvChannels: [
        { title: "News 24/7", imageUrl: "https://placehold.co/200x120/8b5cf6/ffffff?text=News" },
        { title: "FLM Sports", imageUrl: "https://placehold.co/200x120/f9a8d4/ffffff?text=Sports" },
        { title: "Music Vibes", imageUrl: "https://placehold.co/200x120/4ade80/ffffff?text=Music" },
        { title: "Classic Films", imageUrl: "https://placehold.co/200x120/f472b6/ffffff?text=Classics" },
    ],
    categories: [
        { title: "Action", imageUrl: "https://placehold.co/400x250/2563eb/ffffff?text=Action" },
        { title: "Sci-Fi", imageUrl: "https://placehold.co/400x250/d946ef/ffffff?text=Sci-Fi" },
        { title: "Thriller", imageUrl: "https://placehold.co/400x250/14b8a6/ffffff?text=Thriller" },
        { title: "Comedy", imageUrl: "https://placehold.co/400x250/eab308/ffffff?text=Comedy" },
        { title: "Drama", imageUrl: "https://placehold.co/400x250/dc2626/ffffff?text=Drama" },
        { title: "Family", imageUrl: "https://placehold.co/400x250/4f46e5/ffffff?text=Family" },
    ]
};


// --- Dynamic Content Rendering Functions ---

/**
 * Sets up the hero slideshow with content and controls.
 */
function setupHeroSlideshow() {
    const slidesContainer = document.getElementById('hero-slides-container');
    const paginationContainer = document.getElementById('heroPagination');
    const heroTitle = document.getElementById('heroTitle');
    const heroDescription = document.getElementById('heroDescription');
    const heroPlayButton = document.getElementById('heroPlayButton');

    let currentSlide = 0;

    const renderSlide = (index) => {
        const slide = mockData.heroSlides[index];
        slidesContainer.innerHTML = `<img src="${slide.imageUrl}" alt="${slide.title}" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-500">`;
        heroTitle.textContent = slide.title;
        heroDescription.textContent = slide.description;
        heroPlayButton.onclick = () => playVideo(slide.title, slide.videoUrl);

        // Update pagination
        document.querySelectorAll('#heroPagination .h-2').forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('bg-[--primary]');
                dot.classList.remove('bg-gray-400');
            } else {
                dot.classList.add('bg-gray-400');
                dot.classList.remove('bg-[--primary]');
            }
        });
    };

    const nextSlide = () => {
        currentSlide = (currentSlide + 1) % mockData.heroSlides.length;
        renderSlide(currentSlide);
    };

    // Create pagination dots
    paginationContainer.innerHTML = mockData.heroSlides.map((_, index) =>
        `<span class="w-2 h-2 rounded-full cursor-pointer transition-colors" onclick="setSlide(${index})"></span>`
    ).join('');

    // Make setSlide globally accessible
    window.setSlide = (index) => {
        currentSlide = index;
        renderSlide(currentSlide);
    };

    renderSlide(currentSlide);
    setInterval(nextSlide, 5000); // Auto-advance every 5 seconds
}

/**
 * Fetches and displays the latest releases.
 */
function fetchAndDisplayLatestReleases() {
    const carousel = document.getElementById('latest-releases-carousel');
    carousel.innerHTML = mockData.latestReleases.map(item => `
        <div class="carousel-item flex-shrink-0 w-48 rounded-lg overflow-hidden shadow-lg transform transition-transform duration-300 hover:scale-105 cursor-pointer" onclick="playVideo('${item.title}', '${item.videoUrl}')">
            <img src="${item.imageUrl}" alt="${item.title}" class="w-full h-64 object-cover">
            <div class="p-2 bg-[--card-bg]">
                <h3 class="text-sm font-semibold truncate">${item.title}</h3>
            </div>
        </div>
    `).join('');
}

/**
 * Fetches and displays live TV channels.
 */
function fetchAndDisplayLiveTvChannels() {
    const container = document.getElementById('live-tv-channels');
    container.innerHTML = mockData.liveTvChannels.map(channel => `
        <div class="channel-card rounded-lg overflow-hidden shadow-lg transform transition-transform duration-300 hover:scale-105 cursor-pointer">
            <img src="${channel.imageUrl}" alt="${channel.title}" class="w-full h-auto object-cover">
            <div class="p-2 bg-[--card-bg] flex items-center justify-center">
                <span class="text-xs font-bold text-center">${channel.title}</span>
            </div>
        </div>
    `).join('');
}

/**
 * Fetches and displays categories.
 */
function fetchAndDisplayCategories() {
    const container = document.getElementById('categories-grid');
    container.innerHTML = mockData.categories.map(category => `
        <div class="category-card relative rounded-lg overflow-hidden shadow-lg transform transition-transform duration-300 hover:scale-105 cursor-pointer">
            <img src="${category.imageUrl}" alt="${category.title}" class="w-full h-40 object-cover">
            <div class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <span class="text-lg font-bold">${category.title}</span>
            </div>
        </div>
    `).join('');
}


// --- Main Entry Point ---
document.addEventListener("DOMContentLoaded", () => {
    // Check if Firebase auth is ready before fetching data
    const checkAuthReady = setInterval(() => {
        if (isAuthInitialized) {
            clearInterval(checkAuthReady);
            console.log("Firebase Auth is ready. Proceeding with data fetching.");
            // Populate the main content
            setupHeroSlideshow();
            fetchAndDisplayLatestReleases();
            fetchAndDisplayLiveTvChannels();
            fetchAndDisplayCategories();
        }
    }, 100); // Check every 100ms
});

// Initialize authentication
initializeAuth();
