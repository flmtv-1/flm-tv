// FLM TV API Configuration
// DO NOT commit this file to GitHub!
// Add this file to .gitignore

const API_KEYS = {
    OPENAI: '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',
    TMDB: '34773a6e0f80645a5b07a1ee76ecc26b',
    OMDB: '266aeb44',
    YOUTUBE: 'AIzaSyDmMHjQL14WW4Pd2TB9mdJafX8JILXeK9Y'
};

// ================================================
// Epic Kids Zone Configuration
// ================================================

const FLMTV_KIDS_CONFIG = {
    // Your Jellyfin server URL
    SERVER_URL: 'http://192.168.68.108:8096',
    
    // Jellyfin username (create a "Public" user with no password)
    USERNAME: 'Public',
    
    // Password (leave blank for Public user)
    PASSWORD: '',
    
    // ================================================
    // HOW TO GET YOUR LIBRARY IDs:
    // ================================================
    // 1. Open Jellyfin: http://192.168.68.108:8096
    // 2. Click on your Books library
    // 3. Look at the URL in browser address bar
    // 4. Find the part that says: parentId=abc123def456
    // 5. Copy that ID (the abc123def456 part) and paste below
    
    // Library ID for audiobooks (your Books library)
    AUDIOBOOKS_LIBRARY_ID: '',  // PASTE YOUR BOOKS LIBRARY ID HERE
    
    // Library ID for textbooks/PDFs (can be same as audiobooks)
    TEXTBOOKS_LIBRARY_ID: '',   // PASTE YOUR BOOKS LIBRARY ID HERE
};
