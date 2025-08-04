const socket = io();

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const chatInterface = document.getElementById('chatInterface');
const usernameInput = document.getElementById('usernameInput');
const joinBtn = document.getElementById('joinBtn');
const leaveBtn = document.getElementById('leaveBtn');
const usersList = document.getElementById('usersList');
const userCount = document.getElementById('userCount');
const messages = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');

// State
let username = '';
let isTyping = false;
let typingTimeout;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    usernameInput.focus();
});

// Join Chat Event Listeners
joinBtn.addEventListener('click', joinChat);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinChat();
});

// Message Event Listeners
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-resize textarea
messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
});

// Typing indicators
messageInput.addEventListener('input', handleTyping);
messageInput.addEventListener('blur', stopTyping);

// Leave chat
leaveBtn.addEventListener('click', leaveChat);

// Functions
function joinChat() {
    const inputUsername = usernameInput.value.trim();
    if (inputUsername && inputUsername.length >= 2) {
        username = inputUsername;
        socket.emit('join', username);
        
        loginScreen.classList.add('hidden');
        chatInterface.classList.remove('hidden');
        messageInput.focus();
    } else {
        alert('Please enter a username (at least 2 characters)');
    }
}

function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('chat message', { message });
        messageInput.value = '';
        messageInput.style.height = 'auto';
        stopTyping();
    }
}

function leaveChat() {
    socket.disconnect();
    location.reload();
}

function handleTyping() {
    if (!isTyping) {
        isTyping = true;
        socket.emit('typing', username);
    }
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        stopTyping();
    }, 1000);
}

function stopTyping() {
    if (isTyping) {
        isTyping = false;
        socket.emit('stop typing');
    }
    clearTimeout(typingTimeout);
}

function addMessage(messageData, isOwn = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'user' : 'assistant'}`;
    
    const avatarInitial = messageData.username.charAt(0).toUpperCase();
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatarInitial}</div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-username">${escapeHtml(messageData.username)}</span>
                <span class="message-time">${messageData.timestamp}</span>
            </div>
            <div class="message-text">${escapeHtml(messageData.message)}</div>
        </div>
    `;
    
    messages.appendChild(messageDiv);
    scrollToBottom();
}

function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = text;
    messages.appendChild(messageDiv);
    scrollToBottom();
}

function updateUsersList(users) {
    usersList.innerHTML = '';
    userCount.textContent = users.length;
    
    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        userDiv.textContent = user;
        usersList.appendChild(userDiv);
    });
}

function scrollToBottom() {
    const conversationContainer = document.querySelector('.conversation-container');
    conversationContainer.scrollTop = conversationContainer.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Socket Event Listeners
socket.on('chat message', (messageData) => {
    const isOwn = messageData.username === username;
    addMessage(messageData, isOwn);
});

socket.on('user joined', (joinedUsername) => {
    addSystemMessage(`${joinedUsername} joined the chat`);
});

socket.on('user left', (leftUsername) => {
    addSystemMessage(`${leftUsername} left the chat`);
});

socket.on('user list', (users) => {
    updateUsersList(users);
});

socket.on('typing', (typingUsername) => {
    typingIndicator.textContent = `${typingUsername} is typing...`;
});

socket.on('stop typing', () => {
    typingIndicator.textContent = '';
});

// Handle connection errors
socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    alert('Failed to connect to server. Please try again.');
});

socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
    if (reason === 'io server disconnect') {
        socket.connect();
    }
});