import { AuthService, ROLES } from '../auth.js';
import { Dialog } from '@capacitor/dialog';

export class LoginForm {
  constructor() {
    this.authService = new AuthService();
    this.initializeElements();
    this.setupEventListeners();
  }

  initializeElements() {
    // Create form container
    this.container = document.createElement('div');
    this.container.className = 'login-container';
    this.container.innerHTML = `
      <div class="login-card">
        <div class="login-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>
        
        <form id="loginForm" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              placeholder="Enter your email" 
              required 
              autocomplete="username"
            >
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <div class="password-input">
              <input 
                type="password" 
                id="password" 
                placeholder="Enter your password" 
                required
                autocomplete="current-password"
              >
              <button type="button" id="togglePassword" class="toggle-password">👁️</button>
            </div>
          </div>
          
          <div class="form-group">
            <label for="role">Role</label>
            <select id="role" required>
              <option value="">Select your role</option>
              <option value="${ROLES.ADMIN}">Administrator</option>
              <option value="${ROLES.MANAGER}">Manager</option>
              <option value="${ROLES.EMPLOYEE}">Employee</option>
              <option value="${ROLES.ACCOUNTANT}">Accountant</option>
            </select>
          </div>
          
          <div class="form-group remember-me">
            <input type="checkbox" id="rememberMe">
            <label for="rememberMe">Remember me</label>
          </div>
          
          <button type="submit" class="login-button">
            <span class="button-text">Sign In</span>
            <span class="button-loader" style="display: none;">
              <div class="spinner"></div>
            </span>
          </button>
          
          <div class="divider">
            <span>OR</span>
          </div>
          
          <div class="social-login">
            <button type="button" class="social-button google">
              <i class="fab fa-google"></i>
              <span>Continue with Google</span>
            </button>
            
            <button type="button" class="social-button facebook">
              <i class="fab fa-facebook"></i>
              <span>Continue with Facebook</span>
            </button>
          </div>
          
          <div class="signup-link">
            Don't have an account? <a href="#" id="showSignup">Sign up</a>
          </div>
        </form>
      </div>
      
      <div class="login-footer">
        <p>© 2025 PME ERP. All rights reserved.</p>
      </div>
    `;
  }

  setupEventListeners() {
    const form = this.container.querySelector('#loginForm');
    const togglePassword = this.container.querySelector('#togglePassword');
    const passwordInput = this.container.querySelector('#password');
    const showSignupBtn = this.container.querySelector('#showSignup');

    // Toggle password visibility
    togglePassword?.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      togglePassword.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
    });

    // Form submission
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = form.querySelector('#email').value;
      const password = form.querySelector('#password').value;
      const role = form.querySelector('#role').value;
      const rememberMe = form.querySelector('#rememberMe').checked;
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const buttonText = submitBtn.querySelector('.button-text');
      const buttonLoader = submitBtn.querySelector('.button-loader');
      
      try {
        // Show loading state
        buttonText.style.display = 'none';
        buttonLoader.style.display = 'flex';
        submitBtn.disabled = true;
        
        // Simulate API call
        await this.authService.login(email, password, role);
        
        // Show success message
        await Dialog.alert({
          title: 'Success',
          message: 'Login successful!',
          buttonTitle: 'Continue'
        });
        
        // Redirect to dashboard
        window.location.href = '/dashboard.html';
        
      } catch (error) {
        // Show error message
        await Dialog.alert({
          title: 'Login Failed',
          message: error.message || 'Invalid email or password',
          buttonTitle: 'Try Again'
        });
      } finally {
        // Reset button state
        buttonText.style.display = 'block';
        buttonLoader.style.display = 'none';
        submitBtn.disabled = false;
      }
    });
    
    // Show signup form
    showSignupBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      // TODO: Implement signup form
      Dialog.alert({
        title: 'Sign Up',
        message: 'Sign up functionality will be implemented here',
        buttonTitle: 'OK'
      });
    });
  }
  
  render(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    container.innerHTML = '';
    container.appendChild(this.container);
    this.applyStyles();
  }
  
  applyStyles() {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --primary-color: #4a6cf7;
        --error-color: #ff4444;
        --success-color: #00c851;
        --border-color: #e0e0e0;
        --text-color: #333;
        --text-light: #666;
        --bg-color: #f5f7ff;
        --card-bg: #ffffff;
        --shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      }
      
      body {
        background-color: var(--bg-color);
        color: var(--text-color);
        line-height: 1.6;
      }
      
      .login-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 20px;
      }
      
      .login-card {
        background: var(--card-bg);
        border-radius: 12px;
        box-shadow: var(--shadow);
        width: 100%;
        max-width: 420px;
        padding: 32px;
        margin: 20px 0;
      }
      
      .login-header {
        text-align: center;
        margin-bottom: 32px;
      }
      
      .login-header h2 {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 8px;
        color: var(--text-color);
      }
      
      .login-header p {
        color: var(--text-light);
        font-size: 14px;
      }
      
      .form-group {
        margin-bottom: 20px;
      }
      
      .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        font-size: 14px;
        color: var(--text-color);
      }
      
      .form-group input,
      .form-group select {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        font-size: 16px;
        transition: border-color 0.3s;
      }
      
      .form-group input:focus,
      .form-group select:focus {
        outline: none;
        border-color: var(--primary-color);
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
        font-size: 16px;
        cursor: pointer;
        padding: 0;
        color: var(--text-light);
      }
      
      .remember-me {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .remember-me input[type="checkbox"] {
        width: auto;
        margin: 0;
      }
      
      .login-button {
        width: 100%;
        padding: 14px;
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        transition: background-color 0.3s;
        margin: 24px 0;
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
      
      .divider {
        display: flex;
        align-items: center;
        text-align: center;
        margin: 20px 0;
        color: var(--text-light);
        font-size: 14px;
      }
      
      .divider::before,
      .divider::after {
        content: '';
        flex: 1;
        border-bottom: 1px solid var(--border-color);
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
        padding: 12px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: white;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s;
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
        font-size: 14px;
        color: var(--text-light);
        margin-top: 16px;
      }
      
      .signup-link a {
        color: var(--primary-color);
        text-decoration: none;
        font-weight: 500;
      }
      
      .signup-link a:hover {
        text-decoration: underline;
      }
      
      .login-footer {
        text-align: center;
        margin-top: 20px;
        color: var(--text-light);
        font-size: 12px;
      }
      
      /* Error states */
      .error {
        color: var(--error-color);
        font-size: 12px;
        margin-top: 4px;
        display: none;
      }
      
      input.error-input {
        border-color: var(--error-color) !important;
      }
      
      /* Responsive adjustments */
      @media (max-width: 480px) {
        .login-card {
          padding: 24px 16px;
        }
        
        .login-button {
          padding: 12px;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize the login form when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = new LoginForm();
  loginForm.render('#app'); // Render in an element with id="app"
});
