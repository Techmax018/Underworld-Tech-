// ==================== DASHBOARD CONTROLLER ====================
// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut,
    deleteUser,
    updateProfile,
    updateEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs
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

// Global variables
let currentUser = null;
let activeServices = [];
let activities = [];
let isInitialized = false;

// DOM Elements
function getElement(id) { return document.getElementById(id); }

const premiumServicesCatalog = [
    { id: 'threat-monitoring', name: 'Threat Monitoring', desc: '24/7 monitoring to detect and respond to cyber threats in real time.', price: 1999, icon: 'fa-eye', features: ['Real-time alerts', 'AI threat detection'] },
    { id: 'consulting', name: 'Consulting', desc: 'Expert advice and solutions tailored to your business needs.', price: 1999, icon: 'fa-chalkboard-user', features: ['Expert consultation', 'Custom strategy'] },
    { id: 'disaster-recovery', name: 'Disaster Recovery', desc: 'Comprehensive plans to recover from data loss events.', price: 1999, icon: 'fa-database', features: ['Automated backups', 'Rapid restoration'] },
    { id: 'advanced-analytics', name: 'Advanced Analytics', desc: 'In-depth analysis to optimize your data security.', price: 1999, icon: 'fa-chart-pie', features: ['Custom dashboards', 'Predictive insights'] },
    { id: 'priority-support', name: 'Priority Support', desc: 'Fast, 24/7 access to our expert support team.', price: 1999, icon: 'fa-headset', features: ['24/7 support', 'Priority queue'] },
    { id: 'custom-integrations', name: 'Custom Integrations', desc: 'Tailored integrations with your existing tools.', price: 1999, icon: 'fa-code-branch', features: ['API access', 'Custom development'] }
];

const freeTrialServices = [
    { id: 'data-protection', name: 'Data Protection', desc: 'Advanced encryption to keep your data safe.', price: 499, trialMonths: 3, icon: 'fa-lock' },
    { id: 'cloud-backup', name: 'Cloud Backup', desc: 'Automatic secure cloud backups for your files.', price: 499, trialMonths: 3, icon: 'fa-cloud-upload-alt' }
];

// State
let pendingSubscription = null;
let currentSection = 'overview';
let isSidebarOpen = false;

// ==================== UTILITY FUNCTIONS ====================

function formatCurrency(amount) { return `Ksh ${amount.toLocaleString()}`; }

function escapeHtml(text) { if (!text) return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i><span>${message}</span>`;
    notification.style.cssText = `position:fixed;top:20px;right:20px;background:var(--bg-card);border:1px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#2e6edf'};border-radius:12px;padding:16px 24px;display:flex;align-items:center;gap:12px;z-index:2000;animation:slideIn 0.3s ease;backdrop-filter:blur(8px);`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function addActivity(action, details) {
    const activity = { 
        id: Date.now(), 
        action, 
        details, 
        timestamp: new Date(), 
        icon: action === 'subscribe' ? 'fa-crown' : action === 'trial' ? 'fa-gift' : action === 'login' ? 'fa-sign-in-alt' : action === 'logout' ? 'fa-sign-out-alt' : action === 'update' ? 'fa-user-edit' : 'fa-bell' 
    };
    activities.unshift(activity);
    if (activities.length > 50) activities = activities.slice(0, 50);
    renderActivities();
    saveToLocalStorage();
}

function saveToLocalStorage() {
    if (currentUser && currentUser.uid) {
        localStorage.setItem(`underworld_services_${currentUser.uid}`, JSON.stringify(activeServices));
        localStorage.setItem(`underworld_activities_${currentUser.uid}`, JSON.stringify(activities));
    }
}

function loadFromLocalStorage() {
    if (currentUser && currentUser.uid) {
        const savedServices = localStorage.getItem(`underworld_services_${currentUser.uid}`);
        const savedActivities = localStorage.getItem(`underworld_activities_${currentUser.uid}`);
        if (savedServices) try { activeServices = JSON.parse(savedServices); } catch(e) { activeServices = []; }
        if (savedActivities) try { activities = JSON.parse(savedActivities).map(a => ({ ...a, timestamp: new Date(a.timestamp) })); } catch(e) { activities = []; }
    }
}

// ==================== RENDER FUNCTIONS ====================

function renderPremiumServices() {
    const grid = getElement('premiumServicesGrid');
    if (!grid) return;
    grid.innerHTML = premiumServicesCatalog.map(service => `
        <div class="service-card">
            <div class="service-icon"><i class="fas ${service.icon}"></i></div>
            <h3>${service.name}</h3>
            <p>${service.desc}</p>
            <div class="service-features">${service.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}</div>
            <div><span class="price">${formatCurrency(service.price)}/month</span></div>
            <button class="subscribe-btn" data-service-id="${service.id}" data-service-name="${service.name}" data-service-price="${service.price}"><i class="fas fa-crown"></i> Subscribe Now</button>
        </div>
    `).join('');
    
    document.querySelectorAll('.subscribe-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btnEl = e.currentTarget;
            openPaymentModal(btnEl.getAttribute('data-service-id'), btnEl.getAttribute('data-service-name'), parseInt(btnEl.getAttribute('data-service-price')));
        });
    });
}

function renderActiveSubscriptions() {
    const container = getElement('activeSubscriptionsList');
    if (!container) return;
    if (activeServices.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-crown"></i><p>No active subscriptions yet.</p><small>Subscribe to a premium plan to unlock advanced features!</small></div>`;
        return;
    }
    container.innerHTML = activeServices.map(service => `
        <div class="service-card">
            <div class="service-icon"><i class="fas ${service.icon || 'fa-shield-alt'}"></i></div>
            <h3>${service.name}</h3>
            <p>${service.desc || 'Active subscription'}</p>
            <div class="active-badge"><i class="fas fa-check-circle"></i> Active ${service.isTrial ? '<br><small>Free Trial</small>' : ''}${service.expiryDate ? `<br><small>Expires: ${service.expiryDate}</small>` : ''}</div>
        </div>
    `).join('');
}

function updateStats() {
    const count = activeServices.length;
    const protectedAssetsEl = getElement('protectedAssets');
    const cloudStorageEl = getElement('cloudStorage');
    const threatsBlockedEl = getElement('threatsBlocked');
    const activeServicesCountEl = getElement('activeServicesCount');
    const subscriptionStatusEl = getElement('subscriptionStatus');
    const userRoleEl = getElement('userRole');
    
    if (protectedAssetsEl) protectedAssetsEl.textContent = count * 50 + 125;
    if (cloudStorageEl) cloudStorageEl.innerHTML = `${count * 8 + 15} <span style="font-size:0.9rem;">GB</span>`;
    if (threatsBlockedEl) threatsBlockedEl.textContent = count * 18 + 42;
    if (activeServicesCountEl) activeServicesCountEl.textContent = count;
    if (subscriptionStatusEl) subscriptionStatusEl.textContent = count > 0 ? 'Premium' : 'Free';
    if (userRoleEl) userRoleEl.textContent = count > 0 ? 'Premium Account' : 'Free Account';
}

function updateUserDisplay() {
    if (!currentUser) return;
    
    const userNameEl = getElement('userName');
    const userRoleEl = getElement('userRole');
    const panelUserNameEl = getElement('panelUserName');
    const panelUserEmailEl = getElement('panelUserEmail');
    const profilePicEl = getElement('profilePic');
    const panelProfilePicEl = getElement('panelProfilePic');
    const activeServicesCountEl = getElement('activeServicesCount');
    
    const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
    const isPremium = activeServices.length > 0;
    
    if (userNameEl) userNameEl.textContent = displayName;
    if (userRoleEl) userRoleEl.textContent = isPremium ? 'Premium Account' : 'Free Account';
    if (panelUserNameEl) panelUserNameEl.textContent = displayName;
    if (panelUserEmailEl) panelUserEmailEl.textContent = currentUser.email || '';
    if (activeServicesCountEl) activeServicesCountEl.textContent = activeServices.length;
    
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2e6edf&color=fff&length=2&bold=true`;
    if (profilePicEl) profilePicEl.src = avatarUrl;
    if (panelProfilePicEl) panelProfilePicEl.src = avatarUrl;
}

function renderActivities() {
    const activityListEl = getElement('activityList');
    const fullActivityListEl = getElement('fullActivityList');
    
    if (activityListEl) {
        if (activities.length === 0) {
            activityListEl.innerHTML = `<div class="activity-item"><i class="fas fa-info-circle" style="color: var(--secondary-text);"></i><div><p>No recent activity</p><small>Your activities will appear here</small></div></div>`;
        } else {
            activityListEl.innerHTML = activities.slice(0, 5).map(a => `
                <div class="activity-item">
                    <i class="fas ${a.icon}" style="color:var(--success);"></i>
                    <div><p>${a.details}</p><small>${new Date(a.timestamp).toLocaleString()}</small></div>
                </div>
            `).join('');
        }
    }
    if (fullActivityListEl) {
        if (activities.length === 0) {
            fullActivityListEl.innerHTML = `<div class="empty-state"><i class="fas fa-history"></i><p>No activity history yet</p></div>`;
        } else {
            fullActivityListEl.innerHTML = activities.map(a => `
                <div class="activity-item">
                    <i class="fas ${a.icon}" style="color:var(--blue-primary);"></i>
                    <div><p>${a.details}</p><small>${new Date(a.timestamp).toLocaleString()}</small></div>
                </div>
            `).join('');
        }
    }
}

// ==================== SERVICE ACTIONS ====================

function activateFreeTrial(serviceId, serviceName) {
    const service = freeTrialServices.find(s => s.id === serviceId);
    if (!service) return;
    
    const existingTrial = activeServices.find(s => s.id === serviceId && s.isTrial);
    if (existingTrial) {
        showNotification(`You already have an active trial for ${serviceName}`, 'error');
        return;
    }
    
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + service.trialMonths);
    
    activeServices.push({ 
        id: serviceId, 
        name: serviceName, 
        isTrial: true, 
        icon: service.icon, 
        desc: service.desc, 
        expiryDate: expiryDate.toLocaleDateString() 
    });
    
    addActivity('trial', `Activated free trial for ${serviceName} (${service.trialMonths} months)`);
    showNotification(`✅ Free trial activated for ${serviceName}! Valid for ${service.trialMonths} months.`, 'success');
    renderActiveSubscriptions();
    updateStats();
    updateUserDisplay();
    saveToLocalStorage();
}

function openPaymentModal(serviceId, serviceName, price) {
    pendingSubscription = { serviceId, serviceName, price };
    const modalServiceName = getElement('modalServiceName');
    const modalPlanName = getElement('modalPlanName');
    const modalPrice = getElement('modalPrice');
    
    if (modalServiceName) modalServiceName.textContent = `Subscribe to ${serviceName}`;
    if (modalPlanName) modalPlanName.textContent = serviceName;
    if (modalPrice) modalPrice.textContent = formatCurrency(price) + '/month';
    
    const paymentModal = getElement('paymentModal');
    if (paymentModal) paymentModal.classList.add('active');
}

function processPayment() {
    if (!pendingSubscription) return;
    
    const serviceDetails = premiumServicesCatalog.find(s => s.id === pendingSubscription.serviceId);
    if (!serviceDetails) return;
    
    const selectedMethod = document.querySelector('.payment-method.selected');
    const methodName = selectedMethod ? selectedMethod.querySelector('strong')?.textContent || 'M-Pesa' : 'M-Pesa';
    
    showNotification('Processing payment...', 'info');
    
    setTimeout(() => {
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        
        activeServices.push({
            id: pendingSubscription.serviceId,
            name: pendingSubscription.serviceName,
            price: pendingSubscription.price,
            icon: serviceDetails.icon,
            desc: serviceDetails.desc,
            isTrial: false,
            expiryDate: expiryDate.toLocaleDateString()
        });
        
        addActivity('subscribe', `Subscribed to ${pendingSubscription.serviceName} via ${methodName} - ${formatCurrency(pendingSubscription.price)}/month`);
        renderActiveSubscriptions();
        updateStats();
        updateUserDisplay();
        showNotification(`✅ Payment Successful! Subscribed to ${pendingSubscription.serviceName}.`, 'success');
        
        const paymentModal = getElement('paymentModal');
        if (paymentModal) paymentModal.classList.remove('active');
        pendingSubscription = null;
        saveToLocalStorage();
    }, 1000);
}

function cancelPayment() {
    const paymentModal = getElement('paymentModal');
    if (paymentModal) paymentModal.classList.remove('active');
    pendingSubscription = null;
    showNotification('Payment cancelled', 'info');
}

// ==================== USER PROFILE MANAGEMENT ====================

function showEditProfileModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="edit-profile-modal">
            <div class="modal-header">
                <h2><i class="fas fa-user-edit"></i> Edit Profile</h2>
                <button class="modal-close" id="closeEditModal"><i class="fas fa-times"></i></button>
            </div>
            <form id="editProfileForm">
                <div class="form-group">
                    <label>Display Name</label>
                    <input type="text" id="editName" value="${currentUser.displayName || ''}" placeholder="Enter your name">
                </div>
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" id="editEmail" value="${currentUser.email || ''}" placeholder="Enter your email">
                </div>
                <div class="form-group">
                    <label>New Password (leave blank to keep current)</label>
                    <input type="password" id="editPassword" placeholder="Enter new password">
                </div>
                <div class="form-group">
                    <label>Confirm New Password</label>
                    <input type="password" id="editConfirmPassword" placeholder="Confirm new password">
                </div>
                <div class="form-group">
                    <label>Current Password (required for changes)</label>
                    <input type="password" id="currentPassword" placeholder="Enter your current password" required>
                </div>
                <button type="submit" class="submit-btn"><i class="fas fa-save"></i> Save Changes</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('#closeEditModal');
    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    
    const form = modal.querySelector('#editProfileForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = document.getElementById('editName').value;
        const newEmail = document.getElementById('editEmail').value;
        const newPassword = document.getElementById('editPassword').value;
        const confirmPassword = document.getElementById('editConfirmPassword').value;
        const currentPassword = document.getElementById('currentPassword').value;
        
        if (newPassword && newPassword !== confirmPassword) {
            showNotification('New passwords do not match!', 'error');
            return;
        }
        
        showNotification('Updating profile...', 'info');
        
        try {
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);
            
            if (newName && newName !== currentUser.displayName) {
                await updateProfile(currentUser, { displayName: newName });
            }
            
            if (newEmail && newEmail !== currentUser.email) {
                await updateEmail(currentUser, newEmail);
            }
            
            if (newPassword) {
                await updatePassword(currentUser, newPassword);
            }
            
            await updateDoc(doc(db, "users", currentUser.uid), {
                name: newName || currentUser.displayName,
                email: newEmail || currentUser.email,
                updatedAt: new Date().toISOString()
            });
            
            await currentUser.reload();
            currentUser = auth.currentUser;
            updateUserDisplay();
            addActivity('update', 'Updated profile information');
            showNotification('Profile updated successfully!', 'success');
            modal.remove();
        } catch (error) {
            console.error('Update error:', error);
            if (error.code === 'auth/wrong-password') {
                showNotification('Current password is incorrect', 'error');
            } else {
                showNotification('Error updating profile: ' + error.message, 'error');
            }
        }
    });
}

// ==================== NAVIGATION ====================

function switchSection(sectionId) {
    currentSection = sectionId;
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');
    
    navItems.forEach(nav => nav.classList.toggle('active', nav.getAttribute('data-section') === sectionId));
    sections.forEach(section => section.classList.toggle('active', section.id === `section-${sectionId}`));
    
    if (window.innerWidth <= 992 && isSidebarOpen) toggleSidebar();
}

function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
    const sidebar = getElement('sidebar');
    if (sidebar) sidebar.classList.toggle('open', isSidebarOpen);
}

function toggleUserMenu() {
    const userProfileHeader = getElement('userProfileHeader');
    if (userProfileHeader) userProfileHeader.classList.toggle('open');
}

// ==================== USER ACTIONS ====================

async function logoutUser() {
    if (confirm('Are you sure you want to log out?')) {
        try {
            addActivity('logout', 'Logged out from dashboard');
            await signOut(auth);
            showNotification('Logged out successfully', 'success');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            showNotification('Error logging out', 'error');
        }
    }
}

async function deleteAccount() {
    const confirmMessage = '⚠️ WARNING: This action is permanent!\n\nDeleting your account will:\n• Remove all your subscriptions\n• Delete all your data\n• Cancel all active services\n\nAre you absolutely sure?';
    
    if (confirm(confirmMessage)) {
        const password = prompt('Please enter your password to confirm account deletion:');
        if (!password) return;
        
        try {
            const credential = EmailAuthProvider.credential(currentUser.email, password);
            await reauthenticateWithCredential(currentUser, credential);
            
            const userServicesQuery = query(collection(db, "userServices"), where("userId", "==", currentUser.uid));
            const servicesSnapshot = await getDocs(userServicesQuery);
            servicesSnapshot.forEach(async (doc) => { await deleteDoc(doc.ref); });
            
            await deleteDoc(doc(db, "users", currentUser.uid));
            await deleteUser(currentUser);
            
            localStorage.removeItem(`underworld_services_${currentUser.uid}`);
            localStorage.removeItem(`underworld_activities_${currentUser.uid}`);
            
            showNotification('Account deleted successfully', 'warning');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Delete account error:', error);
            if (error.code === 'auth/wrong-password') {
                showNotification('Incorrect password. Account not deleted.', 'error');
            } else {
                showNotification('Error deleting account. Please try again.', 'error');
            }
        }
    }
}

// ==================== SETTINGS ====================

function enable2FA() {
    showNotification('Two-Factor Authentication setup will be available soon!', 'info');
}

function manageSessions() {
    const sessionInfo = `Active Sessions:\n\n• Current Session (This device)\n  Location: ${getUserLocation()}\n  Browser: ${getBrowserInfo()}\n  Last active: Now\n\nNo other active sessions detected.`;
    alert(sessionInfo);
}

function getUserLocation() { return 'Nairobi, Kenya'; }
function getBrowserInfo() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    return 'Unknown';
}

// ==================== EVENT LISTENERS SETUP ====================

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchSection(item.getAttribute('data-section')));
    });
    
    // Sidebar toggle
    const menuToggleSidebar = getElement('menuToggleSidebar');
    if (menuToggleSidebar) menuToggleSidebar.addEventListener('click', toggleSidebar);
    
    // User menu
    const userProfileHeader = getElement('userProfileHeader');
    if (userProfileHeader) {
        userProfileHeader.addEventListener('click', (e) => { e.stopPropagation(); toggleUserMenu(); });
    }
    document.addEventListener('click', () => {
        const userProfileHeader = getElement('userProfileHeader');
        if (userProfileHeader) userProfileHeader.classList.remove('open');
    });
    
    // Free trial buttons
    document.querySelectorAll('.activate-btn').forEach(btn => {
        btn.addEventListener('click', () => activateFreeTrial(btn.getAttribute('data-service'), btn.getAttribute('data-name')));
    });
    
    // Payment modal buttons
    const confirmPaymentBtn = getElement('confirmPaymentBtn');
    const cancelPaymentBtn = getElement('cancelPaymentBtn');
    if (confirmPaymentBtn) confirmPaymentBtn.addEventListener('click', processPayment);
    if (cancelPaymentBtn) cancelPaymentBtn.addEventListener('click', cancelPayment);
    
    // Payment method selection
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', function() {
            document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Account buttons
    const logoutBtn = getElement('logoutBtn');
    const deleteAccountBtn = getElement('deleteAccountBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);
    if (deleteAccountBtn) deleteAccountBtn.addEventListener('click', deleteAccount);
    
    // Add Edit Profile button to account panel
    const accountPanel = getElement('accountPanel');
    if (accountPanel && !document.querySelector('.edit-profile-btn')) {
        const editBtn = document.createElement('button');
        editBtn.className = 'panel-btn edit-profile-btn';
        editBtn.innerHTML = '<i class="fas fa-user-edit"></i> Edit Profile';
        editBtn.style.marginBottom = '8px';
        editBtn.addEventListener('click', showEditProfileModal);
        const panelActions = accountPanel.querySelector('.panel-actions');
        if (panelActions) {
            panelActions.insertBefore(editBtn, panelActions.firstChild);
        }
    }
    
    // Settings buttons
    const enable2faBtn = getElement('enable2faBtn');
    const manageSessionsBtn = getElement('manageSessionsBtn');
    if (enable2faBtn) enable2faBtn.addEventListener('click', enable2FA);
    if (manageSessionsBtn) manageSessionsBtn.addEventListener('click', manageSessions);
    
    // Close modal on overlay click
    const paymentModal = getElement('paymentModal');
    if (paymentModal) {
        paymentModal.addEventListener('click', (e) => { if (e.target === paymentModal) cancelPayment(); });
    }
}

// ==================== INITIALIZATION ====================

async function initDashboard() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            
            // Load user data from Firestore if needed
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (!userDoc.exists()) {
                await setDoc(doc(db, "users", user.uid), {
                    name: user.displayName || user.email?.split('@')[0],
                    email: user.email,
                    createdAt: new Date().toISOString(),
                    subscription: 'free'
                });
            }
            
            loadFromLocalStorage();
            
            const lastLoginDate = localStorage.getItem(`last_login_${user.uid}`);
            const today = new Date().toDateString();
            if (lastLoginDate !== today) {
                addActivity('login', 'Logged in to dashboard');
                localStorage.setItem(`last_login_${user.uid}`, today);
            }
            
            renderPremiumServices();
            renderActiveSubscriptions();
            updateStats();
            updateUserDisplay();
            renderActivities();
            setupEventListeners();
            
            setTimeout(() => {
                showNotification(`Welcome back, ${user.displayName || user.email?.split('@')[0] || 'User'}!`, 'success');
            }, 500);
            
            isInitialized = true;
        } else {
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
            window.location.href = 'sign up.html';
        }
    });
}

// Add modal styles
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    .edit-profile-modal {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 24px;
        width: 90%;
        max-width: 500px;
        padding: 32px;
        animation: modalSlideIn 0.3s ease;
    }
    .edit-profile-modal .form-group {
        margin-bottom: 20px;
    }
    .edit-profile-modal .form-group label {
        display: block;
        margin-bottom: 8px;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--secondary-text);
    }
    .edit-profile-modal .form-group input {
        width: 100%;
        padding: 12px 16px;
        background: rgba(46, 110, 223, 0.05);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        color: var(--primary-text);
        font-family: inherit;
        outline: none;
    }
    .edit-profile-modal .form-group input:focus {
        border-color: var(--blue-primary);
    }
    .edit-profile-modal .submit-btn {
        width: 100%;
        background: var(--gradient-blue);
        border: none;
        padding: 14px;
        border-radius: 40px;
        color: white;
        font-weight: 600;
        cursor: pointer;
        margin-top: 8px;
    }
    .edit-profile-btn {
        background: rgba(46, 110, 223, 0.2);
        color: var(--blue-primary);
        margin-bottom: 8px;
    }
    .edit-profile-btn:hover {
        background: rgba(46, 110, 223, 0.4);
    }
    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }
`;
document.head.appendChild(modalStyles);

// Start the dashboard
initDashboard();