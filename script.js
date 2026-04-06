// ==================== UNDERWORLD HOMEPAGE CONTROLLER ====================
// Includes Luna AI Assistant functionality

// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
const getStartedBtn = document.getElementById('getStartedBtn');
const demoBtn = document.getElementById('demoBtn');
const heroGetStartedBtn = document.getElementById('heroGetStartedBtn');
const heroDemoBtn = document.getElementById('heroDemoBtn');
const chatModal = document.getElementById('chatModal');
const closeChatModal = document.getElementById('closeChatModal');
const sendChatBtn = document.getElementById('sendChatBtn');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const floatingChatBtn = document.getElementById('floatingChatBtn');
const homeChatBtn = document.getElementById('homeChatBtn');
const lunaFloatingBadge = document.getElementById('lunaFloatingBadge');
const lunaQuickBtns = document.querySelectorAll('.luna-quick-btn');

// Luna's Knowledge Base
const lunaResponses = {
    greeting: "✨ Hello! I'm Luna, your cybersecurity assistant! How can I help protect your digital world today? 🌙",
    security: "🔒 Our security solutions include:\n\n• Endpoint Protection - Guards all your devices\n• Network Security - Firewall & intrusion detection\n• Cloud Security - Protects your cloud assets\n• Zero-Trust Architecture - Never trust, always verify",
    encryption: "🔐 Encryption is our specialty! We use:\n\n• AES-256 Military-grade encryption\n• Quantum-resistant cryptography\n• End-to-end encryption for all data\n• Secure key management",
    start: "🚀 Getting started with Underworld is easy!\n\n1. Click 'Get Started' to create your account\n2. Choose your security plan\n3. Install our security agent\n4. Let Luna guide you through setup",
    default: "I'm here to help! You can ask me about:\n\n🔒 Security solutions\n🔐 Encryption & protection\n🚀 Getting started\n\nWhat would you like to know?"
};

// Navbar Functions
function closeMenu() {
    if (navLinks && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        if (menuToggle) menuToggle.classList.remove('active');
    }
}

if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        navLinks.classList.toggle('open');
        menuToggle.classList.toggle('active');
    });
    document.addEventListener('click', (e) => {
        if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            closeMenu();
        }
    });
}

// Redirect Functions
function redirectToSignup() { window.location.href = 'sign up.html'; }
function redirectToDemo() { alert('🎬 Demo Coming Soon!\n\nLuna will guide you through our security platform shortly.'); }

if (getStartedBtn) getStartedBtn.addEventListener('click', redirectToSignup);
if (heroGetStartedBtn) heroGetStartedBtn.addEventListener('click', redirectToSignup);
if (demoBtn) demoBtn.addEventListener('click', redirectToDemo);
if (heroDemoBtn) heroDemoBtn.addEventListener('click', redirectToDemo);

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
});

// Parallax Effect
window.addEventListener('mousemove', (e) => {
    const shapes = document.querySelector('.hero-background-shapes');
    if (!shapes) return;
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    shapes.style.transform = `translate(${x * 8}px, ${y * 6}px)`;
});

// Video Fallback
const videoBg = document.querySelector('.features-background-video');
if (videoBg) videoBg.addEventListener('error', () => { videoBg.style.opacity = '0'; });

// Luna Chat Functions
function openChatModal() {
    if (chatModal) {
        chatModal.classList.add('active');
        setTimeout(() => { if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight; }, 100);
    }
}

function closeChatModalFunc() {
    if (chatModal) chatModal.classList.remove('active');
}

function addChatMessage(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user' : 'bot'}`;
    if (!isUser) {
        messageDiv.innerHTML = `<div class="message-avatar"><i class="fas fa-moon"></i></div><div class="message-content"><p>${message.replace(/\n/g, '<br>')}</p></div>`;
    } else {
        messageDiv.innerHTML = `<div class="message-avatar"><i class="fas fa-user"></i></div><div class="message-content"><p>${message}</p></div>`;
    }
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot typing-message';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `<div class="message-avatar"><i class="fas fa-moon"></i></div><div class="typing-indicator" style="display: flex; gap: 4px; padding: 8px 12px; background: rgba(46,110,223,0.1); border-radius: 16px;"><span style="width:8px;height:8px;background:var(--blue-primary);border-radius:50%;animation:typing 1.4s infinite"></span><span style="width:8px;height:8px;background:var(--blue-primary);border-radius:50%;animation:typing 1.4s infinite 0.2s"></span><span style="width:8px;height:8px;background:var(--blue-primary);border-radius:50%;animation:typing 1.4s infinite 0.4s"></span></div>`;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

function getLunaResponse(userMessage) {
    const msg = userMessage.toLowerCase().trim();
    if (msg.includes('security') || msg.includes('protect') || msg.includes('threat')) return lunaResponses.security;
    if (msg.includes('encrypt') || msg.includes('cryptography')) return lunaResponses.encryption;
    if (msg.includes('start') || msg.includes('begin') || msg.includes('get started')) return lunaResponses.start;
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) return lunaResponses.greeting;
    return lunaResponses.default;
}

function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    addChatMessage(message, true);
    chatInput.value = '';
    showTypingIndicator();
    setTimeout(() => {
        removeTypingIndicator();
        const response = getLunaResponse(message);
        addChatMessage(response, false);
        if (!message.toLowerCase().includes('bye')) {
            setTimeout(() => {
                const quickDiv = document.createElement('div');
                quickDiv.className = 'chat-message bot';
                quickDiv.innerHTML = `<div class="message-avatar"><i class="fas fa-moon"></i></div><div class="message-content"><div class="quick-replies"><button class="quick-reply" data-question="security">🔒 Security</button><button class="quick-reply" data-question="encryption">🔐 Encryption</button><button class="quick-reply" data-question="start">🚀 Get Started</button></div></div>`;
                chatMessages.appendChild(quickDiv);
                quickDiv.querySelectorAll('.quick-reply').forEach(btn => {
                    btn.addEventListener('click', () => { chatInput.value = btn.getAttribute('data-question'); sendChatMessage(); });
                });
            }, 500);
        }
    }, 800);
}

// Chat Event Listeners
if (sendChatBtn) sendChatBtn.addEventListener('click', sendChatMessage);
if (chatInput) chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(); });
if (closeChatModal) closeChatModal.addEventListener('click', closeChatModalFunc);
if (floatingChatBtn) floatingChatBtn.addEventListener('click', openChatModal);
if (homeChatBtn) homeChatBtn.addEventListener('click', openChatModal);
if (lunaFloatingBadge) lunaFloatingBadge.addEventListener('click', (e) => { if (!e.target.closest('.luna-speech-bubble button')) openChatModal(); });
if (chatModal) chatModal.addEventListener('click', (e) => { if (e.target === chatModal) closeChatModalFunc(); });

// Luna Quick Buttons
lunaQuickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const question = btn.getAttribute('data-question');
        if (question) { openChatModal(); setTimeout(() => { chatInput.value = question; sendChatMessage(); }, 300); }
    });
});

// Typing Animation Style
if (!document.querySelector('#typing-animation-style')) {
    const style = document.createElement('style');
    style.id = 'typing-animation-style';
    style.textContent = `@keyframes typing { 0%,60%,100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-8px); opacity: 1; } }`;
    document.head.appendChild(style);
}

// Welcome Message on First Visit
if (!localStorage.getItem('luna_welcomed_home')) {
    setTimeout(() => { localStorage.setItem('luna_welcomed_home', 'true'); }, 1000);
}

console.log("🌙 Luna is ready! Underworld Technology homepage loaded.");