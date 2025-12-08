const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = chatInput.value.trim();
  if (!msg) return;

  const msgEl = document.createElement('div');
  msgEl.textContent = `You: ${msg}`;
  chatMessages.appendChild(msgEl);
  chatInput.value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight;
});
// 🔥 Firebase Config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  databaseURL: "https://your-app.firebaseio.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 🔌 Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 🎯 DOM Elements
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

// 📤 Send Message
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = chatInput.value.trim();
  if (!msg) return;

  db.ref("messages").push({
    text: msg,
    timestamp: Date.now()
  });

  chatInput.value = '';
});

// 📥 Display New Messages
db.ref("messages").on("child_added", (snapshot) => {
  const msg = snapshot.val();
  const msgEl = document.createElement('div');
  msgEl.textContent = msg.text;
  chatMessages.appendChild(msgEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});
