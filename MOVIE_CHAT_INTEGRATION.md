# Movie Chat Room Integration Guide

## How to Integrate Per-Movie Chat Rooms

Your `home.html` now supports **per-movie chat rooms**! When users view content, the chat automatically switches from the "FLM TV Lobby" to that movie's dedicated chat room.

---

## Integration in movie-detail.html

Add this code to your **movie-detail.html** page when it loads a movie:

```javascript
// When opening a movie detail page or starting playback
function openMovieDetail(movieId, movieName) {
    // ... your existing movie detail code ...
    
    // Switch chat room to this movie
    if (typeof switchChatRoom === 'function') {
        switchChatRoom('movie', movieId, movieName);
    }
    
    // Open chat panel automatically (optional)
    if (typeof openPanel === 'function') {
        openPanel('chatPanel');
    }
}

// When closing the movie detail page
function closeMovieDetail() {
    // ... your existing close code ...
    
    // Return to lobby
    if (typeof switchChatRoom === 'function') {
        switchChatRoom('lobby');
    }
}
```

---

## Quick Example

```html
<!-- In your movie-detail.html -->
<script>
// When movie starts playing
function playMovie(movieData) {
    const movieId = movieData.Id;
    const movieName = movieData.Name;
    
    console.log(`🎬 Playing: ${movieName}`);
    
    // Switch to movie's chat room
    parent.switchChatRoom('movie', movieId, movieName);
    
    // Start playback...
}

// When returning to home
function returnToHome() {
    // Return to lobby chat
    parent.switchChatRoom('lobby');
    
    // Close player...
}
</script>
```

---

## What Happens Automatically

✅ **Lobby Mode** (default):
- Shows "💬 FLM TV Lobby" 
- Uses `database.ref('messages')` (your existing messages)
- General chat for all viewers

✅ **Movie Mode** (when playing content):
- Shows "🎬 [Movie Name]"
- Uses `database.ref('chat-rooms/movie-{id}/messages')`
- Dedicated discussion for that specific movie
- Messages don't mix with lobby or other movies

---

## Testing

1. **Test Lobby Chat**: Open home.html → chat should show "💬 FLM TV Lobby"
2. **Test Movie Chat**: Call `switchChatRoom('movie', 'test123', 'Test Movie')` in console
3. **Verify Switch**: Chat header should update to "🎬 Test Movie"
4. **Send Message**: Messages should save to `chat-rooms/movie-test123/messages` in Firebase
5. **Return to Lobby**: Call `switchChatRoom('lobby')` → should show lobby messages again

---

## Firebase Database Structure

```
flmtv-site-counter/
├── messages/                    ← Lobby (old location, preserved)
│   ├── -N1abc123/
│   │   ├── text: "Hello lobby!"
│   │   ├── username: "Zaina"
│   │   └── timestamp: 1234567890
│   └── ...
│
└── chat-rooms/                  ← New structure for movie rooms
    ├── movie-abc123/
    │   └── messages/
    │       ├── -N2def456/
    │       │   ├── text: "Great movie!"
    │       │   ├── username: "Film Fan"
    │       │   └── timestamp: 1234567891
    │       └── ...
    └── movie-xyz789/
        └── messages/
            └── ...
```

---

## Selection/Delete Features

New features added to chat:

1. **Selection Mode Button** - Click checkbox icon in header
2. **Select All** - Select all visible messages  
3. **Delete Selected** - Remove checked messages from Firebase
4. **Cancel** - Exit selection mode

These work in BOTH lobby and movie rooms!

---

## Need Help?

If you need to modify the integration or have questions about the chat room system, let me know!
