import { getStoredToken, getUser, clearToken } from './api.js';

// Prevent logged-in users from seeing login page
(async function () {
  const token = await getStoredToken();
  if (!token) return; // no token; allow login page to render

  try {
    await getUser();
    // token valid — redirect to dashboard
    window.location.href = './index.html';
  } catch (e) {
    // invalid token — clear and stay on login
    await clearToken();
    return;
  }
})();
