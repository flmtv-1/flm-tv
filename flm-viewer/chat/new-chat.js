// Firebase configuration (REPLACE WITH YOUR ACTUAL CONFIG IF DIFFERENT)
// Use the config from your previously working chatbox.html for consistency
const firebaseConfig = {
    apiKey: "AIzaSyDK4Uz1MvUJWDKh0ynnDMpyhA71UnsRUcC",
    authDomain: "flmchat-16c19.firebaseapp.com",
    databaseURL: "https://flmchat-16c19-default-rtdb.firebaseio.com",
    projectId: "flmchat-16c19",
    storageBucket: "flmchat-16c19.appspot.com",
    messagingSenderId: "855266929572",
    appId: "1:855266929572:web:ef3200ff83ad90a8d86f31",
    measurementId: "G-48HJKZBXKN"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const messagesRef = database.ref('messages'); // Reference to your 'messages' node

// Get DOM elements
const messagesDisplay = document.getElementById('messages-display');
const messageInput = document.getElementById('message-input');
const sendMessageButton = document.getElementById('send-message-button');
const emojiToggleButton = document.getElementById('emoji-toggle-button');
const emojiPickerContainer = document.getElementById('emoji-picker-container');
const usernameModal = document.getElementById('username-modal');
const usernameInput = document.getElementById('username-input');
const saveUsernameButton = document.getElementById('save-username-button');
const closeChatBtn = document.querySelector('.close-chat-btn'); // Assuming you want a close button for the chatbox itself

let username = localStorage.getItem('chatUsername'); // Load username from local storage

// --- Username Handling ---
if (!username) {
    usernameModal.style.display = 'flex'; // Show modal if no username
} else {
    usernameModal.style.display = 'none'; // Hide modal if username exists
    usernameInput.value = username; // Pre-fill input if user has one
}

saveUsernameButton.addEventListener('click', () => {
    const enteredUsername = usernameInput.value.trim();
    if (enteredUsername) {
        username = enteredUsername;
        localStorage.setItem('chatUsername', username); // Save username
        usernameModal.style.display = 'none'; // Hide modal
        messageInput.focus(); // Focus on message input
    } else {
        alert('Please enter a username to chat.');
    }
});

usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        saveUsernameButton.click();
    }
});

// --- Send Message Function ---
function sendMessage() {
    const messageText = messageInput.value.trim();
    if (messageText && username) { // Ensure message is not empty and username is set
        messagesRef.push({
            username: username,
            text: messageText,
            timestamp: firebase.database.ServerValue.TIMESTAMP // Firebase's server timestamp
        });
        messageInput.value = ''; // Clear input
        emojiPickerContainer.style.display = 'none'; // Hide emoji picker after sending
    } else if (!username) {
        alert('Please set your username first!');
        usernameModal.style.display = 'flex'; // Show modal to prompt for username
    }
}

sendMessageButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// --- Listen for New Messages ---
messagesRef.on('child_added', (snapshot) => {
    const message = snapshot.val();
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    const date = new Date(message.timestamp);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Determine if the message was sent by the current user
    const isSent = username && message.username === username;
    if (isSent) {
        messageElement.classList.add('sent');
    } else {
        messageElement.classList.add('received'); // Add received class for other users' messages
    }

    messageElement.innerHTML = `<strong>${message.username}:</strong> <span>${message.text}</span> <div class="timestamp">${timeString}</div>`;
    messagesDisplay.appendChild(messageElement);

    // Scroll to bottom
    messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
});

// --- Emoji Picker Functionality ---
const commonEmojis = [
    '😀', '😂', '😊', '👍', '🙏', '❤️', '🔥', '🎉', '🌟', '🚀',
    '😎', '🥳', '🤩', '💯', '👏', '🎶', '💡', '🌈', '✅', '📺',
    '😍', '🥰', '😘', '😋', '😜', '😇', '🤔', '🤫', '🤥', '😳',
    '🥺', '😭', '😡', '🤬', '🤮', '🤯', '😴', '🙄', '😤', '🥶',
    '🤩', '🥳', '🤓', '🤠', '🦸', '🦹', '🧙', '🧚', '🧜', '🧛',
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦋', '🐛',
    '🐠', '🐢', '🐍', '🦎', '🦖', '🦕', '🦀', '🦐', '🦑', '🐙',
    '🍄', '🌺', '🌻', '🌹', '🌼', '🌷', '🌾', '🌲', '🌳', '🌴',
    '🌍', '🌎', '🌏', '☀️', '☁️', '⚡', '🌈', '☔', '❄️', '☃️',
    '🏠', '🏡', '🏢', '🏫', '🏥', '🏦', '🏪', '🏭', '🏗️', '🛣️',
    '🚗', '🚕', '🚌', '🏎️', '🏍️', '🚲', '🛴', '🚄', '🚅', '🚆',
    '✈️', '🚁', '🚢', '🚀', '🛸', '🛰️', '💡', '🔦', '🔋', '🔌',
    '💻', '📱', '⌨️', '🖱️', '🖨️', '💾', '💿', '📀', '🎥', '🎬',
    '🎧', '🎤', '🎼', '🎵', '🎶', '🥁', '🎸', '🎹', '🎺', '🎻',
    '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸',
    '🥊', '🥋', '🏋️', '🚴', '🤸', '⛹️', '🏊', '🏄', '🏅', '🏆',
    '🥇', '🥈', '🥉', '🎖️', '🎗️', '🎫', '🎟️', '🎪', '🎭', '🎨',
    '🎲', '🧩', '🧸', '🎈', '🎁', '🎀', '🎉', '🎊', '✨', '🔥',
    '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💖', '💝',
    '💯', '✅', '☑️', '✔️', '➕', '➖', '➗', '✖️', '™️', '©️',
    '®️', '⬆️', '⬇️', '⬅️', '➡️', '↖️', '↗️', '↘️', '↙️', '↔️',
    '↕️', '↩️', '↪️', '⤴️', '⤵️', '🔙', '🔜', '🔛', '🔝', '🔚',
    '⏰', '⏳', '⌚', '⏱️', '⏲️', '🗓️', '📅', '📆', '🗓️', '📖'
];


function populateEmojiPicker() {
    emojiPickerContainer.innerHTML = ''; // Clear existing emojis
    commonEmojis.forEach(emoji => {
        const emojiBtn = document.createElement('button');
        emojiBtn.classList.add('emoji-button');
        emojiBtn.textContent = emoji;
        emojiBtn.onclick = () => {
            messageInput.value += emoji; // Add emoji to input
            messageInput.focus(); // Keep focus on input
            // Optional: Keep picker open or close? For now, we'll let it stay open until next click or send.
        };
        emojiPickerContainer.appendChild(emojiBtn);
    });
}

emojiToggleButton.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent click from bubbling to document
    populateEmojiPicker(); // Ensure emojis are populated
    emojiPickerContainer.style.display = emojiPickerContainer.style.display === 'none' ? 'flex' : 'none';
});

// Close emoji picker if clicked outside
document.addEventListener('click', (e) => {
    if (!emojiPickerContainer.contains(e.target) && e.target !== emojiToggleButton) {
        emojiPickerContainer.style.display = 'none';
    }
});

// Initial scroll to bottom when chat loads (useful for history)
messagesDisplay.scrollTop = messagesDisplay.scrollHeight;

// Optional: Function to toggle chat visibility if controlled by parent (index.html)
// This is a placeholder; actual control would be in index.html
window.toggleChatVisibility = function() {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer.style.display === 'none' || chatContainer.style.display === '') {
        chatContainer.style.display = 'flex';
        messageInput.focus();
    } else {
        chatContainer.style.display = 'none';
    }
};

// Close chat button listener (if chatbox is hidden by parent HTML, this might close the iframe or element)
if (closeChatBtn) {
    closeChatBtn.addEventListener('click', () => {
        // This function would be called by the parent 'index.html'
        // For now, it could hide the chat container itself within the iframe
        document.getElementById('chat-container').style.display = 'none';
        console.log('Chat container hidden. Parent index.html should control iframe visibility.');
    });
}