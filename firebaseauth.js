// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getFirestore, setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

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

function showMessage(message, divId) {
  const messageDiv = document.getElementById(divId);
  if (!messageDiv) return;
  messageDiv.style.display = "block";
  messageDiv.innerHTML = message;
  messageDiv.style.opacity = 1;
  setTimeout(() => {
    messageDiv.style.opacity = 0;
  }, 5000);
}

// --- SIGN UP ---
const signUpForm = document.getElementById("signup");
if (signUpForm) {
  signUpForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("signup-confirm-password").value;
    const auth = getAuth(app);
    const db = getFirestore(app);

    if (password !== confirmPassword) {
      showMessage("Passwords do not match", 'signupMessage');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userData = {
        email: user.email,
        uid: user.uid
      };
      showMessage("User created successfully! Redirecting...", 'signupMessage');
      await setDoc(doc(db, "users", user.uid), userData);
      setTimeout(() => {
        window.location.href = "services.html";
      }, 1000);
    } catch (error) {
      const errorCode = error.code;
      if (errorCode === 'auth/email-already-in-use') {
        showMessage("Email is already in use", 'signupMessage');
      } else {
        showMessage("Error creating user: " + error.message, 'signupMessage');
      }
    }
  });
}

// --- LOGIN ---
const loginForm = document.getElementById("login");
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const auth = getAuth(app);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showMessage("Login successful! Redirecting...", 'loginMessage');
      setTimeout(() => {
        window.location.href = "services.html";
      }, 1000);
    } catch (error) {
      const errorCode = error.code;
      if (errorCode === 'auth/user-not-found') {
        showMessage("User not found", 'loginMessage');
      } else if (errorCode === 'auth/wrong-password') {
        showMessage("Incorrect password", 'loginMessage');
      } else {
        showMessage("Login error: " + error.message, 'loginMessage');
      }
    }
  });
}

// --- AUTH STATE CHANGE ---
const userProfile = document.getElementById('userProfile');
const profileDropdown = document.getElementById('profileDropdown');
const accountStatus = document.getElementById('accountStatus');
const subscriptionStatus = document.getElementById('subscriptionStatus');

const auth = getAuth();
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        userProfile.style.display = "flex";
        userName.textContent = user.displayName || user.email.split('@')[0];
        profilePic.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email.split('@')[0])}`;

        // Fetch subscription status from Firestore
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.subscription && data.subscription === "active") {
                    accountStatus.textContent = "Active";
                    subscriptionStatus.textContent = "Premium subscription active.";
                } else {
                    accountStatus.textContent = "Passive";
                    subscriptionStatus.textContent = "No subscription. Please subscribe a plan.";
                }
            } else {
                accountStatus.textContent = "Passive";
                subscriptionStatus.textContent = "No subscription. Please subscribe a plan.";
            }
        } catch (e) {
            accountStatus.textContent = "Passive";
            subscriptionStatus.textContent = "No subscription. Please subscribe a plan.";
        }
    } else {
        userProfile.style.display = "none";
    }
});

// Toggle dropdown on profile click
if (userProfile) {
    userProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        userProfile.classList.toggle('open');
    });
    // Hide dropdown when clicking outside
    document.addEventListener('click', () => {
        userProfile.classList.remove('open');
    });
}

// --- LOGOUT ---
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        const auth = getAuth();
        await signOut(auth);
        window.location.href = "index.html";
    });
}

