# 🎬 FLM TV Chat Room Integration Guide

## ✅ What's New

Your `home-CHAT-ROOMS-WORKING.html` now has:

1. **Chat Room System** - Switch between lobby and per-movie chat rooms
2. **Message Selection/Deletion** - Click checkbox icon to select and delete messages
3. **All working with Firebase** - No Jellyfin login required

---

## 📋 Features

### 1. **Lobby Chat (Default)**
- When page loads, chat shows "💬 FLM TV Lobby"
- All messages go to `Firebase: messages/`
- Everyone sees the same lobby chat

### 2. **Per-Movie Chat Rooms**
- When watching a movie, switch to that movie's chat
- Messages go to `Firebase: chat-rooms/movie-{movieId}/messages/`
- Each movie has its own isolated chat room

### 3. **Selection Mode for Deletion**
- Click the checkbox icon in chat header
- Checkboxes appear next to all messages
- Select messages and delete them
- Works in BOTH lobby and movie rooms

---

## 🔧 How to Switch to Movie Chat

When a user clicks on a movie to watch it, call this function:

```javascript
// Example: When opening movie player
function openMovie(movieId, movieTitle) {
    // Switch to movie chat room
    switchChatRoom('movie', movieId, movieTitle);
    
    // Then open your Jellyfin player
    // ... your existing player code ...
}

// Example with actual movie
switchChatRoom('movie', 'abc123xyz', 'The Matrix');
// Chat header updates to: "🎬 The Matrix"
```

---

## 🔙 How to Return to Lobby

```javascript
// When closing movie player or returning to browse
function closeMovie() {
    // Return to lobby chat
    switchChatRoom('lobby');
    
    // ... rest of your close code ...
}
```

---

## 📱 Testing

### Test Lobby:
1. Open `home-CHAT-ROOMS-WORKING.html`
2. Open chat panel
3. See "💬 FLM TV Lobby" in header
4. Send a message → appears in Firebase at `messages/`

### Test Movie Room:
1. Open browser console (F12)
2. Run: `switchChatRoom('movie', 'test123', 'Test Movie')`
3. Chat header updates to "🎬 Test Movie"
4. Send message → appears in Firebase at `chat-rooms/movie-test123/messages/`

### Test Deletion:
1. Click checkbox icon in chat header
2. Checkboxes appear next to messages
3. Click "Select All"
4. Click "Delete Selected (X)"
5. Messages removed from Firebase

---

## 🎯 Integration with Movie Pages

If you have separate `movie-detail.html` files, add this after Firebase initialization:

```javascript
// In movie-detail.html
const movieId = new URLSearchParams(window.location.search).get('id');
const movieTitle = new URLSearchParams(window.location.search).get('title');

// Switch to movie chat when page loads
if (movieId && movieTitle) {
    switchChatRoom('movie', movieId, decodeURIComponent(movieTitle));
}

// Return to lobby when user leaves
window.addEventListener('beforeunload', () => {
    switchChatRoom('lobby');
});
```

---

## 🗄️ Firebase Structure

```
flmtv-site-counter/
├── messages/                    ← Lobby chat
│   ├── -N1abc123/
│   │   ├── text: "Hello lobby!"
│   │   ├── username: "Zaina"
│   │   └── timestamp: 1234567890
│   └── ...
│
└── chat-rooms/                  ← Movie chat rooms
    ├── movie-abc123/
    │   └── messages/
    │       ├── -N2def456/
    │       │   ├── text: "Great movie!"
    │       │   ├── username: "Fan"
    │       │   └── timestamp: 1234567891
    │       └── ...
    └── movie-xyz789/
        └── messages/
            └── ...
```

---

## 🎬 Jellyfin Player (No Login)

You mentioned wanting to use **Jellyfin's player WITHOUT login**. Here's the key:

The current file already bypasses Jellyfin login by using direct API access with your API key.

To play movies without login:
1. Get movie ID from Jellyfin API
2. Use direct stream URL: `https://your-server/Videos/{movieId}/stream?api_key=YOUR_API_KEY`
3. Play in HTML5 video player or iframe

Example:
```javascript
const player = document.getElementById('moviePlayer');
player.src = `${JELLYFIN_CONFIG.SERVER}/Videos/${movieId}/stream?api_key=${JELLYFIN_CONFIG.API_KEY}`;
player.play();
```

---

## 🚀 Ready to Use!

Your `home-CHAT-ROOMS-WORKING.html` is fully functional with:
- ✅ Chat working
- ✅ Room switching working
- ✅ Message deletion working
- ✅ No Jellyfin login required
- ✅ Firebase integrated

Upload and test!
