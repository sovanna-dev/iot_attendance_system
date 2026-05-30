/*
 * ==========================================================
 *  AUTHENTICATION - FIRESTORE VERSION
 * ==========================================================
 */

let currentUserRole = 'viewer';

// ==========================================================
// UI Functions
// ==========================================================
function showLogin() {
    document.getElementById('loginBox').style.display = 'block';
    document.getElementById('registerBox').style.display = 'none';
    document.getElementById('formTitle').textContent = '🔐 Sign In';
    document.getElementById('formSubtitle').textContent = 'Access Attendance Dashboard';
}

function showRegister() {
    document.getElementById('loginBox').style.display = 'none';
    document.getElementById('registerBox').style.display = 'block';
    document.getElementById('formTitle').textContent = '📝 Create Account';
    document.getElementById('formSubtitle').textContent = 'Register for access';
}

// ==========================================================
// Login
// ==========================================================
function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    if (!email || !password) {
        showError(errorEl, '⚠️ Please fill in all fields');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Signing in...';
    errorEl.style.display = 'none';

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            btn.innerHTML = '✅ Success!';
            console.log('✅ Logged in');
        })
        .catch((error) => {
            btn.disabled = false;
            btn.innerHTML = '🔐 Sign In';
            let msg = 'Login failed';
            if (error.code === 'auth/user-not-found') msg = '❌ No account found';
            else if (error.code === 'auth/wrong-password') msg = '❌ Wrong password';
            showError(errorEl, msg);
        });
}

// ==========================================================
// Register
// ==========================================================
function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirmPassword').value;
    const errorEl = document.getElementById('registerError');
    const successEl = document.getElementById('registerSuccess');
    const btn = document.getElementById('registerBtn');

    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    if (!name || !email || !password || !confirm) {
        showError(errorEl, '⚠️ Please fill in all fields');
        return;
    }
    if (password !== confirm) {
        showError(errorEl, '❌ Passwords do not match');
        return;
    }
    if (password.length < 6) {
        showError(errorEl, '❌ Password must be 6+ characters');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating...';

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Save to Firestore
            return db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                role: 'viewer',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            successEl.textContent = '✅ Account created! You can now sign in.';
            successEl.style.display = 'block';
            btn.innerHTML = '✅ Created!';
            setTimeout(() => {
                showLogin();
                btn.disabled = false;
                btn.innerHTML = '📝 Create Account';
            }, 2000);
        })
        .catch((error) => {
            btn.disabled = false;
            btn.innerHTML = '📝 Create Account';
            let msg = 'Registration failed';
            if (error.code === 'auth/email-already-in-use') msg = '❌ Email already registered';
            showError(errorEl, msg);
        });
}

// ==========================================================
// Logout
// ==========================================================
function logout() {
    auth.signOut().then(() => console.log('✅ Logged out'));
}

// ==========================================================
// Role Check
// ==========================================================
function checkUserRole(user) {
    db.collection('users').doc(user.uid).get()
        .then((doc) => {
            if (doc.exists && doc.data().role === 'admin') {
                currentUserRole = 'admin';
                showAdminFeatures();
                console.log('👑 Admin:', user.email);
            } else {
                currentUserRole = 'viewer';
                hideAdminFeatures();
                console.log('👤 Viewer:', user.email);
            }
        })
        .catch(() => {
            currentUserRole = 'viewer';
            hideAdminFeatures();
        });
}

function showAdminFeatures() {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    document.getElementById('userRole').textContent = '👑 Admin';
    document.getElementById('userRole').style.color = '#fbbf24';
    if (typeof loadUsers === 'function') loadUsers();
}

function hideAdminFeatures() {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    document.getElementById('userRole').textContent = '👤 Viewer';
    document.getElementById('userRole').style.color = '#94a3b8';
}

// ==========================================================
// Auth Observer
// ==========================================================
auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('userAvatar').textContent = user.email.charAt(0).toUpperCase();
        document.getElementById('displayName').textContent = user.email;
        checkUserRole(user);
        showDashboard();
    } else {
        showAuth();
    }
});

function showDashboard() {
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'block';
    if (typeof loadAttendance === 'function') loadAttendance();
}

function showAuth() {
    document.getElementById('authPage').style.display = 'flex';
    document.getElementById('dashboardPage').style.display = 'none';
    showLogin();
}

// ==========================================================
// Helpers
// ==========================================================
function showError(el, msg) {
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 5000);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (document.getElementById('loginBox').style.display !== 'none') login();
        else if (document.getElementById('registerBox').style.display !== 'none') register();
    }
});