// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBjg4BmX1t0kPPZHBgn39qMh0KxLXGdnxY",
    authDomain: "login-37da6.firebaseapp.com",
    projectId: "login-37da6",
    storageBucket: "login-37da6.appspot.com",
    messagingSenderId: "976257188489",
    appId: "1:976257188489:web:8ea88e1e7c33f4a1867c58"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Add scopes for better user data
googleProvider.addScope('email');
googleProvider.addScope('profile');

// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const signupName = document.getElementById('signup-name');
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');
const signupConfirmPassword = document.getElementById('signup-confirm-password');
const loginMessage = document.getElementById('loginMessage');
const signupMessage = document.getElementById('signupMessage');

// Helper function to show messages
function showMessage(element, message, isError = true) {
    if (!element) return;
    element.textContent = message;
    element.style.display = 'block';
    element.style.backgroundColor = isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
    element.style.border = `1px solid ${isError ? '#ef4444' : '#10b981'}`;
    element.style.padding = '12px';
    element.style.borderRadius = '12px';
    element.style.marginBottom = '20px';
    element.style.fontSize = '0.85rem';
    
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// Save user to Firestore
async function saveUserToFirestore(userId, userData) {
    try {
        await setDoc(doc(db, "users", userId), {
            ...userData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            subscription: 'free'
        });
        return true;
    } catch (error) {
        console.error("Error saving user:", error);
        return false;
    }
}

// Set auth session in localStorage
function setAuthSession(user) {
    const sessionData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        role: 'free',
        lastLogin: new Date().toISOString()
    };
    localStorage.setItem('underworld_auth_token', btoa(`${user.uid}:${Date.now()}`));
    localStorage.setItem('underworld_user', JSON.stringify(sessionData));
}

// Clear auth session
function clearAuthSession() {
    localStorage.removeItem('underworld_auth_token');
    localStorage.removeItem('underworld_user');
}

// ==================== EMAIL/PASSWORD SIGN UP ====================
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = signupName.value.trim();
        const email = signupEmail.value.trim();
        const password = signupPassword.value;
        const confirmPassword = signupConfirmPassword.value;
        
        if (!name || !email || !password) {
            showMessage(signupMessage, 'Please fill in all fields', true);
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage(signupMessage, 'Passwords do not match!', true);
            return;
        }
        
        if (password.length < 6) {
            showMessage(signupMessage, 'Password must be at least 6 characters', true);
            return;
        }
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            await updateProfile(user, { displayName: name });
            
            await saveUserToFirestore(user.uid, {
                name: name,
                email: email,
                createdAt: new Date().toISOString()
            });
            
            setAuthSession(user);
            showMessage(signupMessage, 'Account created successfully! Redirecting...', false);
            
            setTimeout(() => {
                window.location.href = 'services.html';
            }, 1500);
            
        } catch (error) {
            let errorMessage = 'Sign up failed. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email already registered. Please log in instead.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Use at least 6 characters.';
            }
            showMessage(signupMessage, errorMessage, true);
        }
    });
}

// ==================== EMAIL/PASSWORD LOGIN ====================
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = loginEmail.value.trim();
        const password = loginPassword.value;
        
        if (!email || !password) {
            showMessage(loginMessage, 'Please enter email and password', true);
            return;
        }
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            setAuthSession(user);
            showMessage(loginMessage, 'Login successful! Redirecting...', false);
            
            setTimeout(() => {
                window.location.href = 'services.html';
            }, 1000);
            
        } catch (error) {
            let errorMessage = 'Invalid email or password. Please try again.';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email. Please sign up first.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later.';
            }
            showMessage(loginMessage, errorMessage, true);
        }
    });
}

// ==================== GOOGLE SIGN IN (FIXED) ====================
let isGoogleSignInInProgress = false;

window.loginWithGoogle = async function() {
    // Prevent multiple simultaneous popups
    if (isGoogleSignInInProgress) {
        showNotification('Sign in already in progress. Please wait...', 'info');
        return;
    }
    
    isGoogleSignInInProgress = true;
    
    try {
        // Show loading indicator
        const googleBtn = document.querySelector('.google-login-btn');
        if (googleBtn) {
            googleBtn.disabled = true;
            googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
        }
        
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
            // New user - save to Firestore
            await saveUserToFirestore(user.uid, {
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                photoURL: user.photoURL,
                createdAt: new Date().toISOString()
            });
        }
        
        setAuthSession(user);
        showNotification('Google sign in successful! Redirecting...', 'success');
        
        setTimeout(() => {
            window.location.href = 'services.html';
        }, 1000);
        
    } catch (error) {
        console.error('Google Sign-In Error:', error);
        
        let errorMessage = 'Google sign in failed. Please try again.';
        
        if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Popup was blocked by your browser. Please allow popups for this site and try again.';
        } else if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Sign in popup was closed. Please try again.';
        } else if (error.code === 'auth/cancelled-popup-request') {
            errorMessage = 'Multiple sign in attempts detected. Please wait a moment and try again.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your internet connection.';
        }
        
        showNotification(errorMessage, 'error');
        
    } finally {
        isGoogleSignInInProgress = false;
        
        // Reset button
        const googleBtn = document.querySelector('.google-login-btn');
        if (googleBtn) {
            googleBtn.disabled = false;
            googleBtn.innerHTML = '<i class="fab fa-google"></i> Continue with Google';
        }
    }
};

// Helper function for notifications
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i><span>${message}</span>`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-card);
        border: 1px solid ${type === 'success' ? '#10b981' : '#ef4444'};
        border-radius: 12px;
        padding: 16px 24px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 2000;
        animation: slideIn 0.3s ease;
        backdrop-filter: blur(8px);
        color: white;
        font-family: 'Inter', sans-serif;
        font-size: 0.85rem;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add notification styles if not present
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ==================== FORGOT PASSWORD ====================
window.sendPasswordReset = async function(email) {
    if (!email) {
        showNotification('Please enter your email address', 'error');
        return { success: false, message: 'Please enter your email address' };
    }
    
    try {
        await sendPasswordResetEmail(auth, email);
        showNotification(`Password reset email sent to ${email}`, 'success');
        return { success: true, message: 'Password reset email sent!' };
    } catch (error) {
        let errorMessage = 'Failed to send reset email.';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        }
        showNotification(errorMessage, 'error');
        return { success: false, message: errorMessage };
    }
};

// ==================== AUTH STATE MONITORING ====================
onAuthStateChanged(auth, (user) => {
    const isDashboardPage = window.location.pathname.includes('services.html');
    const isAuthPage = window.location.pathname.includes('sign up.html') || 
                       window.location.pathname.includes('index.html');
    
    if (isDashboardPage && !user) {
        // Not logged in, redirect to signup
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = 'sign up.html';
    }
    
    if (isAuthPage && user) {
        // Already logged in, redirect to services (dashboard)
        window.location.href = 'services.html';
    }
});

// Export for use in other files
export { auth, db, sendPasswordResetEmail };