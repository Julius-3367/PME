import { Preferences } from '@capacitor/preferences';
import { Dialog } from '@capacitor/dialog';

const API_BASE_URL = 'https://ke.erpproject.online/api';

class ApiService {
  constructor() {
    this.token = null;
    this.initialize();
  }

  async initialize() {
    // Try to get token from storage
    const { value } = await Preferences.get({ key: 'auth_token' });
    this.token = value;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
      credentials: 'include' // Important for cookies/sessions
    };

    try {
      const response = await fetch(url, config);
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        await this.handleUnauthorized();
        return this.request(endpoint, options); // Retry the request
      }

      // Handle other error statuses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'An error occurred');
      }

      // For successful responses with no content
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      await Dialog.alert({
        title: 'Error',
        message: error.message || 'An error occurred while processing your request',
        buttonTitle: 'OK'
      });
      throw error;
    }
  }

  async handleUnauthorized() {
    // Clear stored token
    await Preferences.remove({ key: 'auth_token' });
    this.token = null;
    
    // Notify the app to show login
    window.dispatchEvent(new CustomEvent('auth:logout'));
    
    throw new Error('Your session has expired. Please log in again.');
  }

  // Auth methods
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    // Store the token
    if (data.token) {
      this.token = data.token;
      await Preferences.set({ 
        key: 'auth_token', 
        value: data.token 
      });
    }
    
    return data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      await Preferences.remove({ key: 'auth_token' });
      this.token = null;
    }
  }

  // User methods
  async getCurrentUser() {
    return this.request('/user');
  }

  async updateProfile(userData) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  // Password reset
  async requestPasswordReset(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(token, password, passwordConfirmation) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password, password_confirmation: passwordConfirmation })
    });
  }
}

export const apiService = new ApiService();
