import { AuthService, ROLES } from '../auth.js';
import { Preferences } from '@capacitor/preferences';
import { Dialog } from '@capacitor/dialog';
import { App } from '@capacitor/app';

export class LoginComponent extends HTMLElement {
  constructor() {
    super();
    this.authService = new AuthService();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
        }
        
        .login-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        }
        
        .login-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          width: 100%;
          max-width: 400px;
          padding: 40px 32px;
          margin: 20px 0;
          position: relative;
          overflow: hidden;
        }
        
        .login-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%);
        }
        
        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .logo {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          background-color: #1e3c72;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 32px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(30, 60, 114, 0.2);
        }
        
        .login-header h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 10px 0 8px;
          color: #1e3c72;
          letter-spacing: -0.5px;
        }
        
        .login-header p {
          color: #6b7280;
          font-size: 15px;
          margin-bottom: 10px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          font-size: 14px;
          color: #333;
        }
        
        .form-input {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          font-size: 16px;
          transition: all 0.2s;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #4a6cf7;
          box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.2);
        }
        
        .password-input {
          position: relative;
        }
        
        .toggle-password {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          color: #666;
        }
        
        .login-button {
          width: 100%;
          padding: 16px;
          background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin: 20px 0 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: relative;
          overflow: hidden;
        }
        
        .login-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(30, 60, 114, 0.3);
        }
        
        .login-button:active {
          transform: translateY(0);
        }
        
        .login-button:disabled {
          background-color: #a0a0a0;
          cursor: not-allowed;
        }
        
        .login-button:hover:not(:disabled) {
          background-color: #3a5bd9;
        }
        
        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .forgot-password {
          display: block;
          text-align: right;
          margin-top: 8px;
          font-size: 14px;
          color: #4a6cf7;
          text-decoration: none;
        }
        
        .forgot-password:hover {
          text-decoration: underline;
        }
        
        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 20px 0;
          color: #999;
          font-size: 14px;
        }
        
        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .divider:not(:empty)::before {
          margin-right: 16px;
        }
        
        .divider:not(:empty)::after {
          margin-left: 16px;
        }
        
        .social-login {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .social-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          background: white;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .social-button:hover {
          background-color: #f8f9fa;
          border-color: #cbd5e0;
        }
        
        .social-button.google {
          color: #db4437;
        }
        
        .social-button.facebook {
          color: #1877f2;
        }
        
        .signup-link {
          text-align: center;
          font-size: 15px;
          color: #666;
          margin-top: 24px;
        }
        
        .signup-link a {
          color: #4a6cf7;
          text-decoration: none;
          font-weight: 500;
          margin-left: 4px;
        }
        
        .signup-link a:hover {
          text-decoration: underline;
        }
        
        .error-message {
          color: #ff4444;
          background-color: #fff5f5;
          border: 1px solid #ffdddd;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          font-size: 14px;
          display: none;
        }
        
        .error-input {
          border-color: #ff4444 !important;
        }
        
        .remember-me {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 16px 0;
        }
        
        .remember-me input[type="checkbox"] {
          width: 18px;
          height: 18px;
          margin: 0;
        }
        
        @media (max-width: 480px) {
          .login-card {
            padding: 24px 16px;
          }
          
          .login-button {
            padding: 14px;
          }
        }
      </style>
      
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <div class="logo">PME</div>
            <h1>PME ERP System</h1>
            <p>Sign in to access your dashboard</p>
          </div>
          
          <div id="error-message" class="error-message"></div>
          
          <form id="login-form">
            <div class="form-group">
              <label class="form-label" for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                class="form-input" 
                placeholder="Enter your email" 
                required 
                autocomplete="username"
                inputmode="email"
              >
            </div>
            
            <div class="form-group">
              <label class="form-label" for="password">Password</label>
              <div class="password-input">
                <input 
                  type="password" 
                  id="password" 
                  class="form-input" 
                  placeholder="Enter your password" 
                  required
                  autocomplete="current-password"
                >
                <button type="button" id="togglePassword" class="toggle-password" aria-label="Toggle password visibility">👁️</button>
              </div>
              <a href="#" class="forgot-password" id="forgot-password">Forgot password?</a>
            </div>

            <div class="remember-me">
              <input type="checkbox" id="rememberMe" class="form-checkbox">
              <label for="rememberMe">Remember me</label>
            </div>

            <button type="submit" class="login-button">
              <span class="button-text">Sign In</span>
              <span class="button-loader" style="display: none;">
                <div class="spinner"></div>
              </span>
            </button>

            <div class="divider">OR</div>

            <div class="social-login">
              <button type="button" class="social-button google">
                <span>Continue with Google</span>
              </button>
              
              <button type="button" class="social-button facebook">
                <span>Continue with Facebook</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    const form = this.shadowRoot.getElementById('login-form');
    const togglePassword = this.shadowRoot.getElementById('togglePassword');
    const passwordInput = this.shadowRoot.getElementById('password');
    const forgotPasswordLink = this.shadowRoot.getElementById('forgot-password');
    const googleBtn = this.shadowRoot.querySelector('.social-button.google');
    const facebookBtn = this.shadowRoot.querySelector('.social-button.facebook');

    // Toggle password visibility
    if (togglePassword && passwordInput) {
      togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
      });
    }

    // Form submission
    if (form) {
      form.addEventListener('submit', this.handleLogin.bind(this));
    }

    // Forgot password
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', this.handleForgotPassword.bind(this));
    }

    // Social login handlers
    if (googleBtn) {
      googleBtn.addEventListener('click', () => this.handleSocialLogin('google'));
    }
    
    if (facebookBtn) {
      facebookBtn.addEventListener('click', () => this.handleSocialLogin('facebook'));
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    
    const email = this.shadowRoot.getElementById('email').value.trim();
    const password = this.shadowRoot.getElementById('password').value;
    const rememberMe = this.shadowRoot.getElementById('rememberMe').checked;
    
    const loginBtn = this.shadowRoot.querySelector('button[type="submit"]');
    const buttonText = loginBtn?.querySelector('.button-text');
    const buttonLoader = loginBtn?.querySelector('.button-loader');
    const errorElement = this.shadowRoot.querySelector('#error-message');
    
    try {
      // Show loading state
      if (buttonText) buttonText.style.display = 'none';
      if (buttonLoader) buttonLoader.style.display = 'flex';
      if (loginBtn) loginBtn.disabled = true;
      if (errorElement) errorElement.style.display = 'none';
      
      // Validate form
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      // Call the auth service
      const user = await this.authService.login(email, password);
      
      // Store remember me preference
      await Preferences.set({
        key: 'remember_me',
        value: rememberMe.toString()
      });
      
      // Show success message
      await Dialog.alert({
        title: 'Success',
        message: `Welcome back, ${user.name || 'User'}!`,
        buttonTitle: 'Continue'
      });
      
      // Dispatch login success event
      this.dispatchEvent(new CustomEvent('login-success', {
        bubbles: true,
        composed: true,
        detail: { user }
      }));
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Show error message
      if (errorElement) {
        errorElement.textContent = error.message || 'An error occurred during login. Please try again.';
        errorElement.style.display = 'block';
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      // Show dialog for important errors
      if (error.message?.includes('network') || error.message?.includes('server')) {
        await Dialog.alert({
          title: 'Connection Error',
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
          buttonTitle: 'OK'
        });
      }
      
    } finally {
      // Reset button state
      if (buttonText) buttonText.style.display = 'block';
      if (buttonLoader) buttonLoader.style.display = 'none';
      if (loginBtn) loginBtn.disabled = false;
    }
  }

  async handleForgotPassword(e) {
    e.preventDefault();
    
    try {
      const { value: email, cancelled } = await Dialog.prompt({
        title: 'Reset Password',
        message: 'Enter your email address to receive a password reset link',
        inputPlaceholder: 'your@email.com',
        inputType: 'email',
        okButtonTitle: 'Send Reset Link',
        cancelButtonTitle: 'Cancel'
      });
      
      if (cancelled || !email) return;
      
      // Show loading
      const loading = await Dialog.alert({
        title: 'Sending...',
        message: 'Sending password reset instructions',
        buttonTitle: '' // No button while loading
      });
      
      try {
        await this.authService.requestPasswordReset(email);
        
        // Dismiss loading
        await loading.dismiss();
        
        // Show success
        await Dialog.alert({
          title: 'Email Sent',
          message: 'If an account exists with this email, you will receive a password reset link shortly.',
          buttonTitle: 'OK'
        });
        
      } catch (error) {
        // Dismiss loading if still showing
        try { await loading.dismiss(); } catch (e) {}
        
        console.error('Password reset error:', error);
        
        // Show error
        await Dialog.alert({
          title: 'Error',
          message: error.message || 'Failed to send password reset email. Please try again later.',
          buttonTitle: 'OK'
        });
      }
      
    } catch (error) {
      console.error('Forgot password dialog error:', error);
    }
  }
  
  async handleSocialLogin(provider) {
    try {
      // Here you would integrate with the actual social login provider
      // This is a mock implementation
      await Dialog.alert({
        title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Login`,
        message: `This would typically redirect to ${provider} for authentication`,
        buttonTitle: 'OK'
      });
      
      // Mock successful login
      this.dispatchEvent(new CustomEvent('login-success', { 
        bubbles: true,
        composed: true,
        detail: { 
          email: `user@${provider}.com`,
          provider 
        } 
      }));
      
    } catch (error) {
      const errorElement = this.shadowRoot.getElementById('error-message');
      if (errorElement) {
        errorElement.textContent = `Failed to sign in with ${provider}: ${error.message}`;
        errorElement.style.display = 'block';
      }
      console.error(`${provider} login failed:`, error);
    }
  }
}

// Register the custom element
if (!customElements.get('login-component')) {
  customElements.define('login-component', LoginComponent);
}
