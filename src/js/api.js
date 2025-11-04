// Simple API wrapper for auth endpoints with configurable API base (multi-instance)
// Uses Capacitor SecureStorage plugin when available for token storage, falls back to localStorage/sessionStorage.
import * as Secure from './secure-storage.js';

/**
 * Return token stored in session (preferred) or secure/local storage.
 * This is async because secure storage access may be async on native.
 */
export async function getStoredToken() {
  const s = sessionStorage.getItem('auth_token');
  if (s) return s;
  try {
    const v = await Secure.getItem('auth_token');
    return v || null;
  } catch (e) {
    return localStorage.getItem('auth_token');
  }
}

export async function setToken(token, remember = true) {
  if (remember) {
    // try secure storage for persistent token
    try {
      await Secure.setItem('auth_token', token);
      sessionStorage.removeItem('auth_token');
      return;
    } catch (e) {
      // fallback
      localStorage.setItem('auth_token', token);
      return;
    }
  }

  // session token
  sessionStorage.setItem('auth_token', token);
  try {
    await Secure.removeItem('auth_token');
  } catch (e) {
    localStorage.removeItem('auth_token');
  }
}

export async function clearToken() {
  try {
    await Secure.removeItem('auth_token');
  } catch (e) {
    // ignore
  }
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_token');
}

// API base management (supports multiple instances)
const API_BASE_KEY = 'api_base';
const API_INSTANCES_KEY = 'api_instances';

export function getApiBase() {
  return (localStorage.getItem(API_BASE_KEY) || '').replace(/\/$/, '');
}

export function setApiBase(url) {
  if (!url) return;
  const normalized = url.trim().replace(/\/$/, '');
  localStorage.setItem(API_BASE_KEY, normalized);
  // also add to instances list for convenience
  try {
    const inst = JSON.parse(localStorage.getItem(API_INSTANCES_KEY) || '[]');
    if (!inst.includes(normalized)) {
      inst.unshift(normalized);
      // keep only latest 10
      localStorage.setItem(API_INSTANCES_KEY, JSON.stringify(inst.slice(0, 10)));
    }
  } catch (e) {
    localStorage.setItem(API_INSTANCES_KEY, JSON.stringify([normalized]));
  }
}

export function getInstances() {
  try {
    return JSON.parse(localStorage.getItem(API_INSTANCES_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export function addInstance(url) {
  if (!url) return;
  const normalized = url.trim().replace(/\/$/, '');
  const inst = getInstances();
  if (!inst.includes(normalized)) {
    inst.unshift(normalized);
    localStorage.setItem(API_INSTANCES_KEY, JSON.stringify(inst.slice(0, 10)));
  }
}

async function authFetch(path, opts = {}) {
  const token = await getStoredToken();
  const headers = (opts.headers = opts.headers || {});
  headers['Accept'] = 'application/json';
  if (!(opts.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  const base = getApiBase() || '';
  const url = base + path;

  const res = await fetch(url, opts);
  if (res.status === 401) {
    // token invalid - clear local copy
    clearToken();
  }
  return res;
}

export async function login(username, password, account, remember = true) {
  // The real backend expects an "email" field when the identifier is an email address.
  // If the user entered an email-like identifier, send it as `email`; otherwise keep `username`.
  let body;
  if (username && username.includes('@')) {
    body = { email: username, password, account };
  } else {
    body = { username, password, account };
  }
  const base = getApiBase() || '';
  const res = await fetch(base + '/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText || 'Login failed');
  }

  const data = await res.json();
  // Expect the API to return a token property (adjust if your API uses a different shape)
  const token = data.token || data.access_token || (data.data && data.data.token);
  if (!token) {
    // if API doesn't return token in expected shape, pass whole response through
    throw new Error('No token returned from server');
  }
  await setToken(token, remember);
  return data;
}

export async function getUser() {
  const res = await authFetch('/api/user', { method: 'GET' });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

// Fetch available roles for the current API instance.
// Returns an array of role strings like ['tenant','admin',...].
export async function getRoles() {
  const base = getApiBase() || '';
  try {
    const headers = { Accept: 'application/json' };
    // include onboard token if present for this base
    const onboardKey = API_BASE_KEY + '_onboard_token';
    const onboard = localStorage.getItem(onboardKey + ':' + base) || '';
    if (onboard) headers['x-onboarding-token'] = onboard;

    const res = await fetch(base + '/api/roles', { method: 'GET', headers });
    if (res.status === 401) {
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }
    if (!res.ok) {
      // return default if endpoint not available
      return ['tenant', 'admin', 'manager', 'user', 'client'];
    }
    const data = await res.json();
    // support both { roles: [...] } and simple array
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.roles)) return data.roles;
    return ['tenant', 'admin', 'manager', 'user', 'client'];
  } catch (e) {
    // if unauthorized bubble up to caller
    if (e && e.status === 401) throw e;
    return ['tenant', 'admin', 'manager', 'user', 'client'];
  }
}

export function setOnboardTokenForBase(base, token) {
  if (!base) return;
  const key = API_BASE_KEY + '_onboard_token';
  const normalized = base.trim().replace(/\/$/, '');
  if (!token) {
    localStorage.removeItem(key + ':' + normalized);
  } else {
    localStorage.setItem(key + ':' + normalized, token);
  }
}

export function getOnboardTokenForBase(base) {
  if (!base) return null;
  const key = API_BASE_KEY + '_onboard_token';
  const normalized = base.trim().replace(/\/$/, '');
  return localStorage.getItem(key + ':' + normalized) || null;
}

export async function logout() {
  try {
    await authFetch('/api/logout', { method: 'POST' });
  } finally {
    await clearToken();
  }
}

export default { login, logout, getUser, getStoredToken, setToken, clearToken, getApiBase, setApiBase, getInstances, addInstance };
