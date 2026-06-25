/**
 * LifeRPG Shared Layout Engine
 * Dynamically inserts the sidebar and bottom mobile navigation across pages,
 * resolving relative paths dynamically based on page location.
 */

class LayoutEngine {
  constructor() {
    this.isRoot = !window.location.pathname.includes('/pages/');
    this.pathPrefix = this.isRoot ? './' : '../';
    this.pagesPrefix = 'pages/';
  }

  init() {
    const appContainer = document.querySelector('.app-container');
    if (!appContainer) {
      console.warn('App container (.app-container) not found. Skipping layout injection.');
      return;
    }

    // 1. Inject Sidebar (Desktop)
    const sidebar = this.createSidebar();
    appContainer.insertBefore(sidebar, appContainer.firstChild);

    // 2. Inject Bottom Navigation (Mobile)
    const mobileNav = this.createMobileNav();
    appContainer.appendChild(mobileNav);

    // 3. Inject Confetti Canvas and Toast Notification Container
    this.injectUtilityElements();

    // 4. Set Active Navigation Item based on current path
    this.setActiveNavItem();

    // 5. Update sidebar level badge details
    this.updateUserSummary();
  }

  createSidebar() {
    const aside = document.createElement('aside');
    aside.className = 'sidebar';
    aside.innerHTML = `
      <div>
        <a href="${this.pathPrefix}index.html" class="brand">
          <div class="brand-logo">
            <svg viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h1 class="brand-name">LifeRPG</h1>
            <span class="brand-tagline">Evolve Daily</span>
          </div>
        </a>

        <nav class="nav-menu">
          <a href="${this.pathPrefix}index.html" class="nav-item" data-page="index">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
            Dashboard
          </a>
          <a href="${this.pathPrefix}${this.pagesPrefix}habits.html" class="nav-item" data-page="habits">
            <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Quests & Habits
          </a>
          <a href="${this.pathPrefix}${this.pagesPrefix}goals.html" class="nav-item" data-page="goals">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            Missions & Goals
          </a>
          <a href="${this.pathPrefix}${this.pagesPrefix}outcomes.html" class="nav-item" data-page="outcomes">
            <svg viewBox="0 0 24 24"><path d="M23 6l-9.5 9.5-5-5L1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            Outcome Tracking
          </a>
          <a href="${this.pathPrefix}${this.pagesPrefix}weekly_review.html" class="nav-item" data-page="weekly_review">
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>
            Weekly Review
          </a>
          <a href="${this.pathPrefix}${this.pagesPrefix}progress.html" class="nav-item" data-page="progress">
            <svg viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
            Analytics & Insights
          </a>
          <a href="${this.pathPrefix}${this.pagesPrefix}profile.html" class="nav-item" data-page="profile">
            <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Identity & Settings
          </a>
        </nav>
      </div>

      <div class="sidebar-footer">
        <div class="user-summary">
          <div class="user-avatar" id="layout-avatar">N</div>
          <div class="user-info">
            <span class="user-name" id="layout-username">Neo</span>
            <span class="user-title" id="layout-title">Level 1 Explorer</span>
          </div>
        </div>
      </div>
    `;
    return aside;
  }

  createMobileNav() {
    const nav = document.createElement('nav');
    nav.className = 'mobile-nav';
    nav.innerHTML = `
      <a href="${this.pathPrefix}index.html" class="mobile-nav-item" data-page="index">
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
        <span>Home</span>
      </a>
      <a href="${this.pathPrefix}${this.pagesPrefix}habits.html" class="mobile-nav-item" data-page="habits">
        <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <span>Quests</span>
      </a>
      <a href="${this.pathPrefix}${this.pagesPrefix}goals.html" class="mobile-nav-item" data-page="goals">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
        <span>Goals</span>
      </a>
      <a href="${this.pathPrefix}${this.pagesPrefix}outcomes.html" class="mobile-nav-item" data-page="outcomes">
        <svg viewBox="0 0 24 24"><path d="M23 6l-9.5 9.5-5-5L1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        <span>Outcomes</span>
      </a>
      <a href="${this.pathPrefix}${this.pagesPrefix}weekly_review.html" class="mobile-nav-item" data-page="weekly_review">
        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>
        <span>Review</span>
      </a>
      <a href="${this.pathPrefix}${this.pagesPrefix}progress.html" class="mobile-nav-item" data-page="progress">
        <svg viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
        <span>Growth</span>
      </a>
      <a href="${this.pathPrefix}${this.pagesPrefix}profile.html" class="mobile-nav-item" data-page="profile">
        <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>Profile</span>
      </a>
    `;
    return nav;
  }

  injectUtilityElements() {
    // Inject Canvas for confetti if not exists
    if (!document.getElementById('confetti-canvas')) {
      const canvas = document.createElement('canvas');
      canvas.id = 'confetti-canvas';
      document.body.appendChild(canvas);
    }

    // Inject Toast notification container
    if (!document.querySelector('.notification-container')) {
      const container = document.createElement('div');
      container.className = 'notification-container';
      document.body.appendChild(container);
    }

    // Inject Level Up Modal template
    if (!document.getElementById('level-up-modal-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'level-up-modal-overlay';
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-card level-up-modal">
          <h2 class="level-up-title">LEVEL UP!</h2>
          <div class="level-up-circle" id="modal-level-num">2</div>
          <p style="color: var(--text-secondary); margin-bottom: 1rem;">Your capacity expands. You are becoming stronger.</p>
          <button class="btn btn-primary" onclick="document.getElementById('level-up-modal-overlay').classList.remove('active')">Continue Journey</button>
        </div>
      `;
      document.body.appendChild(overlay);
    }
  }

  setActiveNavItem() {
    const path = window.location.pathname;
    let activePage = 'index'; // default

    if (path.includes('habits.html')) activePage = 'habits';
    else if (path.includes('goals.html')) activePage = 'goals';
    else if (path.includes('outcomes.html')) activePage = 'outcomes';
    else if (path.includes('weekly_review.html')) activePage = 'weekly_review';
    else if (path.includes('progress.html')) activePage = 'progress';
    else if (path.includes('profile.html')) activePage = 'profile';

    // Desktop Nav
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.getAttribute('data-page') === activePage) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Mobile Nav
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      if (item.getAttribute('data-page') === activePage) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  updateUserSummary() {
    const state = window.LifeRPGStore.state;
    const avatar = document.getElementById('layout-avatar');
    const username = document.getElementById('layout-username');
    const title = document.getElementById('layout-title');

    if (avatar) avatar.textContent = state.player.name.charAt(0).toUpperCase();
    if (username) username.textContent = state.player.name;
    if (title) title.textContent = `Lvl ${state.player.level} ${state.player.title}`;
  }
}

// Instantiate on load
document.addEventListener('DOMContentLoaded', () => {
  window.LifeRPGLayout = new LayoutEngine();
  window.LifeRPGLayout.init();
});
