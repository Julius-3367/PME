import { login as apiLogin, setApiBase, getApiBase, getInstances, addInstance, getRoles, setOnboardTokenForBase, getOnboardTokenForBase } from './api.js';

const form = document.getElementById('login-form');
const errorEl = document.getElementById('error');

const apiSelect = document.getElementById('api-select');
const apiUrlInput = document.getElementById('api-url');
const addInstanceBtn = document.getElementById('add-instance');

function populateInstances() {
  const list = getInstances();
  apiSelect.innerHTML = '';
  if (!list || list.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'No instance saved';
    apiSelect.appendChild(opt);
    return;
  }
  list.forEach((u) => {
    const opt = document.createElement('option');
    opt.value = u;
    opt.textContent = u;
    apiSelect.appendChild(opt);
  });
}

async function populateRoles() {
  const accountSelect = document.getElementById('account');
  if (!accountSelect) return;
  // show loading option
  accountSelect.innerHTML = '';
  const loading = document.createElement('option');
  loading.value = '';
  loading.textContent = 'Loading roles...';
  accountSelect.appendChild(loading);

  try {
    const roles = await getRoles();
    accountSelect.innerHTML = '';
    if (!roles || roles.length === 0) {
      const opt = document.createElement('option');
      opt.value = 'tenant';
      opt.textContent = 'Tenant';
      accountSelect.appendChild(opt);
      return;
    }
    roles.forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r;
      // display friendly label
      opt.textContent = r.charAt(0).toUpperCase() + r.slice(1);
      accountSelect.appendChild(opt);
    });
  } catch (e) {
    // If roles endpoint returned 401, show onboarding token input and allow retry
    if (e && e.status === 401) {
      const tokenContainer = document.getElementById('onboard-token-container');
      if (tokenContainer) tokenContainer.style.display = 'flex';
      // prefill from storage if exists
      const base = getApiBase();
      const existing = getOnboardTokenForBase(base);
      const input = document.getElementById('onboard-token');
      if (input && existing) input.value = existing;
      return;
    }
    // fallback to defaults
    accountSelect.innerHTML = '';
    ['tenant', 'admin', 'manager', 'user', 'client'].forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = r.charAt(0).toUpperCase() + r.slice(1);
      accountSelect.appendChild(opt);
    });
  }
}

// initial fill
try {
  populateInstances();
  // if there are no instances saved, add the default public instance
  const existing = getInstances();
  if (!existing || existing.length === 0) {
    const defaultInstance = 'https://ke.erpproject.online';
    addInstance(defaultInstance);
    setApiBase(defaultInstance);
    populateInstances();
  }
  const base = getApiBase();
  if (base) {
    apiUrlInput.value = base;
    // select first matching option if present
    for (const opt of apiSelect.options) {
      if (opt.value === base) {
        opt.selected = true;
        break;
      }
    }
    // populate roles for this instance
    populateRoles();
  }
} catch (e) {
  // ignore
}

addInstanceBtn.addEventListener('click', () => {
  const url = apiUrlInput.value && apiUrlInput.value.trim();
  if (!url) return;
  addInstance(url);
  setApiBase(url);
  populateInstances();
  // pick the newly added
  for (const opt of apiSelect.options) {
    if (opt.value === url) opt.selected = true;
  }
  // populate roles for the newly added instance
  populateRoles();
});

// when user changes selected api instance, set it and reload roles
apiSelect.addEventListener('change', (e) => {
  const val = apiSelect.value;
  if (!val) return;
  setApiBase(val);
  populateRoles();
});

// onboarding token save handler
const saveOnboardBtn = document.getElementById('save-onboard');
if (saveOnboardBtn) {
  saveOnboardBtn.addEventListener('click', () => {
    const base = (apiSelect && apiSelect.value) || apiUrlInput.value;
    const token = document.getElementById('onboard-token').value.trim();
    if (!base || !token) return;
    setOnboardTokenForBase(base, token);
    // hide the token container and retry loading roles
    const tokenContainer = document.getElementById('onboard-token-container');
    if (tokenContainer) tokenContainer.style.display = 'none';
    populateRoles();
  });
}

// show spinner when roles are loading
const rolesSpinner = document.getElementById('roles-spinner');
const originalPopulateRoles = populateRoles;
populateRoles = async function () {
  if (rolesSpinner) rolesSpinner.style.display = 'block';
  try {
    await originalPopulateRoles();
  } finally {
    if (rolesSpinner) rolesSpinner.style.display = 'none';
  }
};

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const account = undefined; // Role/account selection removed
    const remember = document.getElementById('remember').checked;

    // use selected API base (or the typed one)
    const selectedApi = (apiSelect && apiSelect.value) || apiUrlInput.value || '';
    if (selectedApi) {
      setApiBase(selectedApi);
    }

    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.textContent = 'Signing in...';

    try {
      console.log('Attempting login to:', getApiBase() || '(no base set)');
      const loginResponse = await apiLogin(username, password, account, remember);
      console.log('Login response received:', loginResponse);
      
      // validate token by fetching current user
      try {
        const user = await (await import('./api.js')).getUser();
        // store user in session for quick access
        sessionStorage.setItem('user', JSON.stringify(user));
      } catch (uerr) {
        console.error('Failed fetching user after login', uerr);
        throw new Error('Login succeeded but fetching user failed');
      }
      
      // Check if backend returned a redirect_url (for seamless web dashboard login)
      if (loginResponse && loginResponse.redirect_url) {
        // Backend provides a special URL with token that creates web session
        // Just navigate to it directly
        window.location.href = loginResponse.redirect_url;
      } else {
        // Fallback: stay in mobile app
        window.location.href = './index.html';
      }
    } catch (err) {
      console.error('Login error:', err);
      // Show more detailed error message
      let errorMsg = 'Login failed';
      if (err.message) {
        errorMsg = err.message;
      } else if (err.toString().includes('Failed to fetch')) {
        errorMsg = 'Cannot connect to server. Please check your internet connection or try again later.';
      }
      errorEl.textContent = errorMsg;
      btn.disabled = false;
      btn.textContent = 'Login';
    }
  });
}

// Use demo button — prefill credentials and submit
const useDemoBtn = document.getElementById('use-demo');
if (useDemoBtn) {
  useDemoBtn.addEventListener('click', async () => {
    const demoBase = 'https://ke.erpproject.online';
    apiUrlInput.value = demoBase;
    addInstance(demoBase);
    setApiBase(demoBase);
    populateInstances();
    await populateRoles();
    document.getElementById('username').value = 'demoaccount@gmail.com';
    document.getElementById('password').value = 'R5N2h4t';
    // choose demo role if available
    const acc = document.getElementById('account');
    if (acc) {
      const option = Array.from(acc.options).find(o => o.value === 'admin') || acc.options[0];
      if (option) acc.value = option.value;
    }
    // submit form programmatically
    form.dispatchEvent(new Event('submit', { cancelable: true }));
  });
}

// Password visibility toggle
const togglePasswordBtn = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');
const eyeIcon = document.getElementById('eye-icon');

if (togglePasswordBtn && passwordInput) {
  togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    
    // Update icon
    if (isPassword) {
      // Show "eye-slash" icon (password visible)
      eyeIcon.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="12" r="3" stroke="#666" stroke-width="2"/>
        <line x1="1" y1="1" x2="23" y2="23" stroke="#666" stroke-width="2" stroke-linecap="round"/>
      `;
    } else {
      // Show "eye" icon (password hidden)
      eyeIcon.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="12" r="3" stroke="#666" stroke-width="2"/>
      `;
    }
  });
}
