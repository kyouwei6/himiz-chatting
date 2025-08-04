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

// Auto-resize textarea and update send button
messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
    
    // Update send button state based on content
    const hasContent = messageInput.value.trim().length > 0;
    if (hasContent) {
        sendBtn.classList.add('active');
    } else {
        sendBtn.classList.remove('active');
    }
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
        sendBtn.classList.remove('active');
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
            <div class="message-actions">
                <button class="message-action-btn" title="Copy message" disabled>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4 2a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 1h8a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"/>
                    </svg>
                </button>
                <button class="message-action-btn" title="Regenerate" disabled>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 3a5 5 0 104.546 2.914.5.5 0 00-.908-.417A4 4 0 118 4V3z"/>
                        <path d="M8 4.466V.534a.25.25 0 01.41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 018 4.466z"/>
                    </svg>
                </button>
                <button class="message-action-btn" title="Good response" disabled>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8.864.046C7.908-.193 7.02.53 6.956 1.466c-.072 1.051-.23 2.016-.428 2.59-.125.36-.479 1.013-1.04 1.639-.557.623-1.282 1.178-2.131 1.41C2.685 7.288 2 7.87 2 8.72v4.001c0 .845.682 1.464 1.448 1.545 1.07.114 1.564.415 2.068.723l.048.03c.272.165.578.348.97.484.397.136.861.217 1.466.217h3.5c.937 0 1.599-.477 1.934-1.064a1.86 1.86 0 00.254-.912c0-.152-.023-.312-.077-.464.201-.263.38-.578.488-.901.11-.33.172-.762.004-1.149.069-.13.12-.269.159-.403.077-.27.113-.568.113-.857 0-.288-.036-.585-.113-.856a2.144 2.144 0 00-.138-.362 1.9 1.9 0 00.234-1.734c-.206-.592-.682-1.1-1.2-1.272-.847-.282-1.803-.276-2.516-.211a9.84 9.84 0 00-.443.05 9.365 9.365 0 00-.062-4.509A1.38 1.38 0 009.125.111L8.864.046zM11.5 14.721H8c-.51 0-.863-.069-1.14-.164-.281-.097-.506-.228-.776-.393l-.04-.024c-.555-.339-1.198-.731-2.49-.868-.333-.036-.554-.29-.554-.55V8.72c0-.254.226-.543.62-.65 1.095-.3 1.977-.996 2.614-1.708.635-.71 1.064-1.475 1.238-1.978.243-.7.407-1.768.482-2.85.025-.362.36-.594.667-.518l.262.066c.16.04.258.143.288.255a8.34 8.34 0 01-.145 4.725.5.5 0 00.595.644l.003-.001.014-.003.058-.014a8.908 8.908 0 01.543-.118c.583-.09 1.472-.205 2.154.102-.333.322-.419.635-.419.732 0 .279.081.561.245.77.165.209.394.322.618.322h.342a.5.5 0 01.407.817c-.097.144-.215.273-.348.384.21.92.21 1.716-.123 2.334-.333.617-.914 1.028-1.764 1.028z"/>
                    </svg>
                </button>
                <button class="message-action-btn" title="Bad response" disabled>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8.864 15.674c-.956.24-1.843-.484-1.908-1.42-.072-1.05-.23-2.015-.428-2.59-.125-.36-.479-1.012-1.04-1.638-.557-.624-1.282-1.179-2.131-1.41C2.685 8.432 2 7.85 2 7V3c0-.845.682-1.464 1.448-1.546 1.07-.113 1.564-.415 2.068-.723l.048-.029c.272-.166.578-.349.97-.484C6.931.082 7.395 0 8 0h3.5c.937 0 1.599.478 1.934 1.064.164.287.254.607.254.913 0 .152-.023.312-.077.464.201.262.38.577.488.9.11.33.172.762.004 1.15.069.129.12.268.159.403.077.27.113.567.113.856 0 .289-.036.586-.113.856-.035.12-.08.244-.. "/>
                    </svg>
                </button>
            </div>
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