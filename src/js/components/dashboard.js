import { AuthService, ROLE_MENUS, ROLE_STATS } from '../auth.js';

export class DashboardComponent extends HTMLElement {
  constructor() {
    super();
    this.authService = new AuthService();
  }

  connectedCallback() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.dispatchEvent(new CustomEvent('logout', {
        bubbles: true,
        composed: true
      }));
      return;
    }

    this.render(user);
    this.attachEventListeners();
  }

  render(user) {
    const menus = ROLE_MENUS[user.role] || [];
    const stats = ROLE_STATS[user.role] || [];
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();

    this.innerHTML = `
      <div class="dashboard-container">
        <div class="dashboard-header">
          <div class="dashboard-title">PME ERP</div>
          <div class="dashboard-user">
            <div class="user-info">
              <div class="user-name">${user.name}</div>
              <div class="user-role">${this.formatRole(user.role)}</div>
            </div>
            <div class="user-avatar">${initials}</div>
          </div>
        </div>

        <div class="dashboard-content">
          <h2 class="section-title">Overview</h2>
          <div class="stats-grid">
            ${stats.map(stat => `
              <div class="stat-card">
                <div class="stat-label">${stat.label}</div>
                <div class="stat-value">${stat.value}</div>
                <div class="stat-change ${stat.positive ? 'positive' : 'negative'}">
                  ${stat.positive ? '↑' : '↓'} ${stat.change}
                </div>
              </div>
            `).join('')}
          </div>

          <h2 class="section-title">Quick Access</h2>
          <div class="menu-grid">
            ${menus.map(menu => `
              <div class="menu-item" data-action="${menu.action}">
                <div class="menu-icon">${menu.icon}</div>
                <div class="menu-label">${menu.label}</div>
              </div>
            `).join('')}
          </div>

          <button class="btn-logout" id="logout-btn">
            Sign Out
          </button>
        </div>
      </div>
    `;
  }

  formatRole(role) {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  attachEventListeners() {
    // Logout button
    const logoutBtn = this.querySelector('#logout-btn');
    logoutBtn.addEventListener('click', () => {
      this.authService.logout();
      this.dispatchEvent(new CustomEvent('logout', {
        bubbles: true,
        composed: true
      }));
    });

    // Menu items
    const menuItems = this.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        this.handleMenuAction(action);
      });
    });
  }

  handleMenuAction(action) {
    // For now, just show an alert. In a real app, this would navigate to different pages
    const user = this.authService.getCurrentUser();
    alert(`Opening ${action} module for ${user.role}`);
    
    // You can dispatch custom events here to handle navigation
    this.dispatchEvent(new CustomEvent('navigate', {
      bubbles: true,
      composed: true,
      detail: { action }
    }));
  }
}

customElements.define('dashboard-component', DashboardComponent);
