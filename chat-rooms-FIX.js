// ═══════════════════════════════════════════════════════════════
//  FLM TV - CHAT ROOMS SYSTEM
//  Per-Content Chat Rooms with Viewer Count
// ═══════════════════════════════════════════════════════════════

const ChatRooms = {
    currentRoom: 'lobby',
    currentRoomName: 'FLM TV Lobby',
    database: null,
    messagesRef: null,
    viewerCountRef: null,
    userId: null,
    
    // Initialize chat rooms
    init(database, userId) {
        this.database = database;
        this.userId = userId;
        console.log('🎬 Chat Rooms initialized');
    },
    
    // Join a chat room
    joinRoom(roomId, roomName, movieData = null) {
        // Leave current room first
        if (this.currentRoom) {
            this.leaveRoom();
        }
        
        this.currentRoom = roomId;
        this.currentRoomName = roomName;
        
        console.log(`🚪 Joining room: ${roomName} (${roomId})`);
        
        // Set Firebase reference to this room
        this.messagesRef = this.database.ref(`chat-rooms/${roomId}/messages`);
        this.viewerCountRef = this.database.ref(`chat-rooms/${roomId}/viewers`);
        
        // Register as viewer in this room
        this.registerViewer(movieData);
        
        // Update UI
        this.updateRoomDisplay();
        
        return this.messagesRef;
    },
    
    // Leave current room
    leaveRoom() {
        if (this.viewerCountRef && this.userId) {
            // Remove from viewers list
            this.viewerCountRef.child(this.userId).remove();
            console.log(`👋 Left room: ${this.currentRoomName}`);
        }
    },
    
    // Register as viewer in room
    registerViewer(movieData) {
        if (!this.viewerCountRef || !this.userId) return;
        
        const viewerData = {
            joinedAt: Date.now(),
            userId: this.userId
        };
        
        if (movieData) {
            viewerData.movieId = movieData.id;
            viewerData.movieTitle = movieData.title;
        }
        
        // Add to viewers list with auto-remove on disconnect
        const viewerRef = this.viewerCountRef.child(this.userId);
        viewerRef.set(viewerData);
        viewerRef.onDisconnect().remove();
    },
    
    // Get viewer count for current room
    getViewerCount(callback) {
        if (!this.viewerCountRef) return;
        
        this.viewerCountRef.on('value', (snapshot) => {
            const count = snapshot.numChildren();
            callback(count);
        });
    },
    
    // Update room display in UI
    updateRoomDisplay() {
        const roomIndicator = document.getElementById('chatRoomIndicator');
        const viewerCount = document.getElementById('viewerCount');
        
        if (roomIndicator) {
            // Get room emoji
            let emoji = '💬';
            if (this.currentRoom.startsWith('movie-')) emoji = '🎬';
            if (this.currentRoom.startsWith('episode-')) emoji = '📺';
            if (this.currentRoom === 'live-stream') emoji = '🔴';
            
            roomIndicator.innerHTML = `${emoji} ${this.currentRoomName}`;
        }
        
        // Show viewer count
        if (viewerCount) {
            this.getViewerCount((count) => {
                if (this.currentRoom === 'lobby') {
                    viewerCount.textContent = `${count} online`;
                } else {
                    viewerCount.textContent = `${count} watching`;
                }
            });
        }
    },
    
    // Send message to current room
    sendMessage(username, message, avatar) {
        if (!this.messagesRef) {
            console.error('❌ No room joined');
            return;
        }
        
        this.messagesRef.push({
            username: username,
            message: message,
            avatar: avatar || '👤',
            timestamp: Date.now(),
            room: this.currentRoom
        });
    },
    
    // Listen for messages in current room
    listenToRoom(callback, limit = 50) {
        if (!this.messagesRef) return;
        
        console.log(`👂 Listening to room: ${this.currentRoomName}`);
        
        this.messagesRef.limitToLast(limit).on('child_added', (snapshot) => {
            const messageData = snapshot.val();
            messageData.id = snapshot.key;
            callback(messageData);
        });
    },
    
    // Get room ID from movie/show data
    getRoomIdFromContent(contentType, contentId) {
        return `${contentType}-${contentId}`;
    },
    
    // Get all active rooms with viewer counts
    getAllRooms(callback) {
        this.database.ref('chat-rooms').once('value', (snapshot) => {
            const rooms = [];
            snapshot.forEach((roomSnap) => {
                const roomId = roomSnap.key;
                const viewerCount = roomSnap.child('viewers').numChildren();
                
                if (viewerCount > 0) {
                    rooms.push({
                        id: roomId,
                        viewers: viewerCount
                    });
                }
            });
            callback(rooms);
        });
    },
    
    // Clear all messages in current room (admin only)
    clearRoom(password) {
        if (password !== 'FLM2025') {
            alert('❌ Incorrect password');
            return;
        }
        
        if (!this.messagesRef) return;
        
        if (confirm(`Clear all messages in "${this.currentRoomName}"?`)) {
            this.messagesRef.remove();
            alert('✅ Room cleared');
        }
    }
};

console.log('🎬 Chat Rooms system loaded');
