import { Preferences } from '@capacitor/preferences';
import { Dialog } from '@capacitor/dialog';

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  ACCOUNTANT: 'accountant'
};

// API Configuration
const API_CONFIG = {
  // Authentication API (HTTP)
  AUTH_BASE_URL: 'http://ke.erp.project.online/api',
  // ERP Interface URL (HTTPS)
  ERP_BASE_URL: 'https://ke.erpproject.online',
  ENDPOINTS: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    USER: '/auth/user',
    PASSWORD_RESET: '/auth/forgot-password'
  },
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 2,
  // Force API requests to use HTTP (for development)
  FORCE_HTTP: true
};

export class AuthService {
  constructor() {
    this.currentUser = null;
    this.initialize();
  }

  async initialize() {
    try {
      // Load user from storage
      const user = await this.getStoredUser();
      if (user) {
        this.currentUser = user;
      }
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
    }
  }

  async getStoredUser() {
    try {
      const { value } = await Preferences.get({ key: 'currentUser' });
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Failed to get stored user:', error);
      return null;
    }
  }

  async setStoredUser(user) {
    try {
      if (user) {
        await Preferences.set({
          key: 'currentUser',
          value: JSON.stringify(user)
        });
      } else {
        await Preferences.remove({ key: 'currentUser' });
      }
    } catch (error) {
      console.error('Failed to store user:', error);
    }
  }

  async makeApiCall(endpoint, options = {}) {
    // Ensure we're using the correct protocol for API calls
    let baseUrl = API_CONFIG.AUTH_BASE_URL;
    if (API_CONFIG.FORCE_HTTP && baseUrl.startsWith('https://')) {
      baseUrl = 'http://' + baseUrl.substring(8); // Convert https:// to http://
    }
    
    const url = `${baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    try {
      const fetchOptions = {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Mobile-App': 'PME-ERP-Mobile',
          ...(options.headers || {})
        },
        credentials: 'include', // Include cookies for session handling
        mode: 'cors' // Enable CORS mode
      };

      console.log(`Making API call to: ${url}`);
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your internet connection.');
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  }

  async login(email, password) {
    // Show loading state
    const loadingDialog = await Dialog.alert({
      title: 'Logging in',
      message: 'Please wait...',
      buttonTitle: ''
    });

    try {
      // Basic validation
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      const response = await this.makeApiCall(API_CONFIG.ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ 
          email: email.trim(),
          password: password,
          device_name: 'mobile-app' // For Laravel Sanctum
        })
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error('Login API Error:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
        
        let errorMessage = 'Login failed. Please check your credentials.';
        
        if (response.status === 422 && responseData.errors) {
          // Handle Laravel validation errors
          errorMessage = Object.values(responseData.errors).flat().join('\n');
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (response.status === 401) {
          errorMessage = 'Invalid email or password';
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }
  
      if (!responseData.token) {
        throw new Error('No authentication token received');
      }

      // Store the token and user data
      await Preferences.set({
        key: 'auth_token',
        value: responseData.token
      });
      
      // Store user data
      const user = {
        id: responseData.user.id,
        name: responseData.user.name,
        email: responseData.user.email,
        role: responseData.user.role || ROLES.EMPLOYEE
      };
      
      this.currentUser = user;
      await this.setStoredUser(user);
      
      return user;
      
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      // Always dismiss the loading dialog
      await Dialog.dismiss().catch(console.error);
    }
  }

  async logout() {
    try {
      const token = await this.getAuthToken();
      if (token) {
        await this.makeApiCall(API_CONFIG.ENDPOINTS.LOGOUT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).catch(error => {
          console.error('Logout API call failed:', error);
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear stored data
      await Promise.all([
        Preferences.remove({ key: 'auth_token' }),
        Preferences.remove({ key: 'currentUser' })
      ]);
      
      this.currentUser = null;
      
      // Notify the app that we've logged out
      window.dispatchEvent(new CustomEvent('logout'));
    }
  }

  async isAuthenticated() {
    try {
      const token = await this.getAuthToken();
      if (!token) return false;

      // If we have a user in memory, consider them authenticated
      if (this.currentUser) return true;

      // Otherwise, try to validate the token
      const response = await this.makeApiCall(API_CONFIG.ENDPOINTS.USER, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const user = await response.json();
        this.currentUser = user;
        await this.setStoredUser(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  }

  async getAuthToken() {
    try {
      const { value } = await Preferences.get({ key: 'auth_token' });
      return value || null;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  async requestPasswordReset(email) {
    try {
      const response = await this.makeApiCall(API_CONFIG.ENDPOINTS.PASSWORD_RESET, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to request password reset');
      }

      return true;
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw error;
    }
  }

  hasRole(role) {
    return this.currentUser && this.currentUser.role === role;
  }

  hasAnyRole(roles) {
    return this.currentUser && roles.includes(this.currentUser.role);
  }
}

export const authService = new AuthService();
