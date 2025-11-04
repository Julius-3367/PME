// Lightweight wrapper that uses Capacitor SecureStorage plugin when available,
// and falls back to localStorage in the web environment.

export async function setItem(key, value) {
  try {
    if (window && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SecureStorage) {
      // community plugin exposes set/get/remove
      await window.Capacitor.Plugins.SecureStorage.set({ key, value });
      return;
    }
  } catch (e) {
    // plugin call failed; fall back
    console.warn('SecureStorage plugin failed, falling back to localStorage', e);
  }
  localStorage.setItem(key, value);
}

export async function getItem(key) {
  try {
    if (window && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SecureStorage) {
      const res = await window.Capacitor.Plugins.SecureStorage.get({ key });
      // plugin returns { value }
      return res && (res.value || null);
    }
  } catch (e) {
    console.warn('SecureStorage plugin get failed, falling back to localStorage', e);
  }
  return localStorage.getItem(key);
}

export async function removeItem(key) {
  try {
    if (window && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SecureStorage) {
      await window.Capacitor.Plugins.SecureStorage.remove({ key });
      return;
    }
  } catch (e) {
    console.warn('SecureStorage plugin remove failed, falling back to localStorage', e);
  }
  localStorage.removeItem(key);
}

export default { setItem, getItem, removeItem };
