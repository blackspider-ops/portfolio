// Supabase configuration
const SUPABASE_URL = 'https://xplifhqnkmofhmrwkejf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbGlmaHFua21vZmhtcndrZWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NjMwNzEsImV4cCI6MjA4MjEzOTA3MX0.7AMPoHde89TRsqea46DQtm0FQtp9trjGucaaSVwPZpo';

// DOM Elements
const loginForm = document.getElementById('login-form');
const loggedInContainer = document.getElementById('logged-in');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberCheckbox = document.getElementById('remember');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const errorMessage = document.getElementById('error-message');
const userEmailSpan = document.getElementById('user-email');
const userAvatar = document.getElementById('user-avatar');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved credentials if remember was checked
  const savedEmail = await getFromStorage('savedEmail');
  const savedPassword = await getFromStorage('savedPassword');
  
  if (savedEmail) {
    emailInput.value = savedEmail;
  }
  if (savedPassword) {
    passwordInput.value = savedPassword;
    rememberCheckbox.checked = true;
  }

  // Check if already logged in
  const session = await getFromStorage('session');
  if (session && session.access_token) {
    // Verify session is still valid
    const isValid = await verifySession(session.access_token);
    if (isValid) {
      showLoggedInState(session.user);
    } else {
      await clearSession();
    }
  }
});

// Login handler
loginBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError('Please enter email and password');
    return;
  }

  setLoading(true);
  hideError();

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || data.error || data.msg || 'Login failed');
    }

    // Save session
    await saveToStorage('session', {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
    });

    // Save credentials if remember is checked
    if (rememberCheckbox.checked) {
      await saveToStorage('savedEmail', email);
      await saveToStorage('savedPassword', password);
    } else {
      await removeFromStorage('savedEmail');
      await removeFromStorage('savedPassword');
    }

    showLoggedInState(data.user);
  } catch (error) {
    showError(error.message || 'Login failed');
  } finally {
    setLoading(false);
  }
});

// Logout handler
logoutBtn.addEventListener('click', async () => {
  const session = await getFromStorage('session');
  
  if (session && session.access_token) {
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
    } catch (e) {
      // Ignore logout errors
    }
  }

  await clearSession();
  showLoginForm();
});

// Enter key to submit
passwordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    loginBtn.click();
  }
});

emailInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    passwordInput.focus();
  }
});

// Helper functions
async function verifySession(accessToken) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

function showLoggedInState(user) {
  loginForm.style.display = 'none';
  loggedInContainer.style.display = 'flex';
  
  const email = user.email || '';
  userEmailSpan.textContent = email;
  
  // Set avatar initials
  const initials = email
    .split('@')[0]
    .split('.')
    .map(part => part[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2) || 'TS';
  userAvatar.textContent = initials;
}

function showLoginForm() {
  loginForm.style.display = 'flex';
  loggedInContainer.style.display = 'none';
  passwordInput.value = '';
}

function setLoading(loading) {
  loginBtn.disabled = loading;
  loginBtn.querySelector('.btn-text').style.display = loading ? 'none' : 'inline';
  loginBtn.querySelector('.btn-loading').style.display = loading ? 'inline-flex' : 'none';
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}

function hideError() {
  errorMessage.style.display = 'none';
}

async function clearSession() {
  await removeFromStorage('session');
}

// Chrome storage helpers
function saveToStorage(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

function getFromStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key]);
    });
  });
}

function removeFromStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.remove([key], resolve);
  });
}
