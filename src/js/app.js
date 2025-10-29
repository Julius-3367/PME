import { SplashScreen } from '@capacitor/splash-screen';
import { Preferences } from '@capacitor/preferences';
import { AuthService, API_CONFIG } from './auth.js';
import { LoginComponent } from './components/LoginComponent.js';
import { Capacitor } from '@capacitor/core';
import { Dialog } from '@capacitor/dialog';

class ERPApp {
  constructor() {
    this.authService = new AuthService();
    this.appContainer = document.getElementById('app');
    this.init();
  }

  async init() {
    try {
      await SplashScreen.hide();
      this.showLogin();

      // Listen for login success
      document.addEventListener('login-success', async () => {
        // Show loading before showing dashboard
        this.appContainer.innerHTML = `
          <div style="text-align: center; padding: 40px;">
            <p>Logging you in...</p>
          </div>
        `;
        
        // Small delay to show the loading message
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Then show the dashboard
        this.showDashboard();
      });

      // Listen for logout
      document.addEventListener('logout', async () => {
        try {
          await this.authService.logout();
          this.showLogin();
        } catch (error) {
          console.error('Logout failed:', error);
          this.showLogin();
        }
      });
    } catch (error) {
      console.error('App initialization failed:', error);
      this.showLogin();
    }
  }

  showLogin() {
    this.appContainer.innerHTML = `
      <login-component></login-component>
    `;
  }

  async showDashboard(retryCount = 0) {
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 2000; // 2 seconds
    
    try {
      // Get the authentication token
      const token = await this.authService.getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create the ERP iframe container
      this.appContainer.innerHTML = `
        <div style="width: 100%; height: 100vh; position: relative;">
          <div id="erp-loading" style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: white;
            z-index: 10;
          ">
            <div id="loading-spinner" style="
              width: 40px;
              height: 40px;
              border: 4px solid #f3f3f3;
              border-top: 4px solid #4a6cf7;
              border-radius: 50%;
              margin: 0 auto 20px;
              animation: spin 1s linear infinite;
            "></div>
            <p id="loading-text">Loading ERP interface...</p>
            <div id="error-message" style="color: #e74c3c; margin-top: 10px; display: none;"></div>
          </div>
          <iframe 
            id="erp-iframe"
            src="${API_CONFIG.ERP_BASE_URL}/login?token=${encodeURIComponent(token)}&mobile_app=true"
            style="
              width: 100%;
              height: 100%;
              border: none;
              display: none;
            "
            allow="camera *; microphone *; geolocation *;"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          ></iframe>
          <style>
            @keyframes spin { 
              0% { transform: rotate(0deg); } 
              100% { transform: rotate(360deg); } 
            }
          </style>
        </div>`;

      const iframe = document.getElementById('erp-iframe');
      const loading = document.getElementById('erp-loading');
      const loadingText = document.getElementById('loading-text');
      const errorMessage = document.getElementById('error-message');
      
      if (!iframe || !loading) return;
      
      let loadTimeout;
      let isLoaded = false;

      const showError = (message, showRetry = true) => {
        if (loadingText) loadingText.textContent = 'Failed to load dashboard';
        if (errorMessage) {
          errorMessage.textContent = message;
          errorMessage.style.display = 'block';
        }
        
        if (showRetry && retryCount < MAX_RETRIES) {
          setTimeout(() => {
            this.showDashboard(retryCount + 1);
          }, RETRY_DELAY);
        }
      };

      const handleLoad = () => {
        if (isLoaded) return;
        isLoaded = true;
        clearTimeout(loadTimeout);
        
        try {
          // Try to access the iframe's content to verify it's loaded
          if (iframe.contentWindow && iframe.contentWindow.document) {
            loading.style.display = 'none';
            iframe.style.display = 'block';
            console.log('ERP dashboard loaded successfully');
          } else {
            throw new Error('Iframe content not accessible');
          }
        } catch (error) {
          console.error('Error accessing iframe content:', error);
          showError('Error loading dashboard. Please try again.');
        }
      };

      // Set a timeout for the iframe load
      loadTimeout = setTimeout(() => {
        if (!isLoaded) {
          iframe.contentWindow.location.reload();
          loadTimeout = setTimeout(() => {
            if (!isLoaded) {
              showError('Taking longer than expected. Retrying...');
            }
          }, 5000);
        }
      }, 10000); // 10 seconds initial timeout

      // Handle iframe load event
      iframe.onload = handleLoad;
      
      // Fallback in case onload doesn't fire
      setTimeout(handleLoad, 2000);
      
      // Handle iframe errors
      iframe.onerror = () => {
        showError('Failed to load ERP dashboard. Please check your connection.');
      };
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      await Dialog.alert({
        title: 'Error',
        message: 'Failed to load the ERP interface. Please try again.',
        buttonTitle: 'OK'
      });
      this.showLogin();
    }
  }
}

// Register custom elements
if (!customElements.get('login-component')) {
  customElements.define('login-component', LoginComponent);
}

// Initialize the app when DOM is ready
const initApp = async () => {
  try {
    await SplashScreen.hide();
    const app = new ERPApp();
    return app;
  } catch (error) {
    console.error('Failed to initialize app:', error);
    document.getElementById('app').innerHTML = `
      <div style="padding: 20px; text-align: center; margin-top: 50px;">
        <h2 style="color: #e74c3c;">Something went wrong</h2>
        <p style="margin: 20px 0; color: #7f8c8d;">${error.message || 'Please try again later'}</p>
        <button onclick="window.location.reload()" style="
          background: #4a6cf7;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(74, 108, 247, 0.3);
          transition: all 0.2s ease;
        ">
          Refresh Page
        </button>
      </div>
    `;
  }
};

// Start the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Export for debugging
window.erpApp = {
  auth: new AuthService(),
  initApp,
  Capacitor,
  Preferences
};
