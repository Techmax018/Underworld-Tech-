import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { 
    getFirestore, doc, setDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// --- CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBjg4BmX1t0kPPZHBgn39qMh0KxLXGdnxY",
    authDomain: "login-37da6.firebaseapp.com",
    projectId: "login-37da6",
    storageBucket: "login-37da6.appspot.com",
    messagingSenderId: "976257188489",
    appId: "1:976257188489:web:8ea88e1e7c33f4a1867c58"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// --- UI UTILITIES ---

function setBtnLoading(btnId, isLoading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (isLoading) {
        btn.disabled = true;
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing...`;
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    }
}

function showMessage(element, message, isError = true) {
    if (!element) return;
    element.textContent = message;
    element.className = isError ? 'messageDiv error-msg' : 'messageDiv success-msg';
    element.style.display = 'block';
    // Style adjustments for visibility
    element.style.color = isError ? '#ff4d4d' : '#00e676';
    setTimeout(() => { element.style.display = 'none'; }, 5000);
}

// --- AUTHENTICATION ACTIONS ---

// 1. Sign Up Logic
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm-password').value;
    const msgDiv = document.getElementById('signupMessage');

    if (password !== confirm) return showMessage(msgDiv, "Passwords do not match");
    if (password.length < 6) return showMessage(msgDiv, "Password must be at least 6 characters");

    setBtnLoading('signupBtn', true);
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        
        // Save user profile to Firestore
        await setDoc(doc(db, "users", cred.user.uid), {
            name,
            email,
            createdAt: serverTimestamp(),
            plan: 'free',
            role: 'user'
        });

        showMessage(msgDiv, "Fortress Access Created! Redirecting...", false);
        setTimeout(() => { window.location.href = 'services.html'; }, 1500);
    } catch (err) {
        showMessage(msgDiv, err.message);
    } finally {
        setBtnLoading('signupBtn', false);
    }
});

// 2. Login Logic
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const msgDiv = document.getElementById('loginMessage');

    setBtnLoading('loginBtn', true);
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage(msgDiv, "Access Granted. Welcome back!", false);
        setTimeout(() => { window.location.href = 'services.html'; }, 1000);
    } catch (err) {
        showMessage(msgDiv, "Invalid credentials. Access Denied.");
    } finally {
        setBtnLoading('loginBtn', false);
    }
});

// 3. Google Social Login
window.loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Update user record in Firestore on every login
        await setDoc(doc(db, "users", user.uid), {
            name: user.displayName,
            email: user.email,
            lastLogin: serverTimestamp()
        }, { merge: true });

        window.location.href = 'services.html';
    } catch (err) {
        console.error("Google Auth Error:", err);
        alert("Google Sign-in failed. Please try again.");
    }
};

// 4. Password Reset (Modal Integration)
document.getElementById('sendResetBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('resetEmail').value.trim();
    if (!email) return alert("Please enter your email address.");

    try {
        await sendPasswordResetEmail(auth, email);
        alert("Check your inbox! A reset link has been sent.");
        document.getElementById('forgotModal').classList.remove('active');
    } catch (err) {
        alert(err.message);
    }
});