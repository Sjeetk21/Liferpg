/**
 * LifeRPG Profile & Identity Page Controller
 * Handles stats display, achievement evaluation, theme selection, and reset.
 */

class ProfilePageEngine {
  constructor() {
    this.store = window.LifeRPGStore;
    this.misc = window.LifeRPGMisc;
    
    // Badge specifications
    this.badgeConfigs = [
      { id: 'b_first_step', name: 'First Step', desc: 'Complete your first habit or quest.', icon: '✨', check: (state) => state.player.total_completed >= 1 },
      { id: 'b_streak_7', name: 'Consistent Explorer', desc: 'Reach a streak of 7 days.', icon: '🔥', check: (state) => state.player.longest_streak >= 7 },
      { id: 'b_streak_15', name: 'Momentum Master', desc: 'Achieve a streak of 15 days.', icon: '👑', check: (state) => state.player.longest_streak >= 15 },
      { id: 'b_level_10', name: 'Ascendant Entity', desc: 'Reach Player Level 10.', icon: '⚡', check: (state) => state.player.level >= 10 },
      { id: 'b_knowledge_5', name: 'Scholar', desc: 'Reach Level 5 in Knowledge.', icon: '📚', check: (state) => {
          const attr = state.attributes.find(a => a.id === 'attr_knowledge');
          return attr ? attr.level >= 5 : false;
        }
      },
      { id: 'b_fitness_5', name: 'Iron Will', desc: 'Reach Level 5 in Fitness.', icon: '🏋️', check: (state) => {
          const attr = state.attributes.find(a => a.id === 'attr_fitness');
          return attr ? attr.level >= 5 : false;
        }
      }
    ];
  }

  init() {
    this.renderStats();
    this.renderBadges();
    this.setupThemeSelection();
    this.setupResetAction();
    this.setupFeedback();
  }

  renderStats() {
    const state = this.store.state;
    
    document.getElementById('profile-name').textContent = state.player.name;
    document.getElementById('profile-avatar').textContent = state.player.name.charAt(0).toUpperCase();
    document.getElementById('profile-level-title').textContent = `Lvl ${state.player.level} ${state.player.title}`;
    
    document.getElementById('profile-stat-completions').textContent = state.player.total_completed;
    document.getElementById('profile-stat-streak').textContent = `${state.player.streak} Day${state.player.streak !== 1 ? 's' : ''}`;
    document.getElementById('profile-stat-longest').textContent = `${state.player.longest_streak} Day${state.player.longest_streak !== 1 ? 's' : ''}`;
  }

  renderBadges() {
    const state = this.store.state;
    const container = document.getElementById('badges-container');
    container.innerHTML = '';

    this.badgeConfigs.forEach(b => {
      const isUnlocked = b.check(state);
      
      const card = document.createElement('div');
      card.className = `badge-card ${!isUnlocked ? 'locked' : ''}`;
      
      card.innerHTML = `
        <div class="badge-art">
          ${isUnlocked ? b.icon : '🔒'}
        </div>
        <div>
          <h4 class="badge-title">${b.name}</h4>
          <p class="badge-desc">${b.desc}</p>
          ${!isUnlocked ? `<span style="font-size:0.65rem; color:var(--color-primary); font-weight:700; text-transform:uppercase;">Locked</span>` : `<span style="font-size:0.65rem; color:var(--color-secondary); font-weight:700; text-transform:uppercase;">Unlocked</span>`}
        </div>
      `;

      container.appendChild(card);
    });
  }

  setupThemeSelection() {
    const state = this.store.state;
    const activeTheme = state.activeTheme || 'dark-default';

    // Highlight current active theme
    document.querySelectorAll('.theme-card').forEach(card => {
      const themeName = card.getAttribute('data-theme');
      if (themeName === activeTheme) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }

      // Add click listener
      card.addEventListener('click', () => {
        document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        state.activeTheme = themeName;
        this.store.save(state);
        this.misc.initTheme(); // Re-apply theme class to html root
        
        // Update logo color classes
        this.misc.showToast(`Applied theme: ${card.querySelector('.theme-name').textContent}`, 'success');
      });
    });
  }

  setupResetAction() {
    document.getElementById('btn-reset-data').addEventListener('click', () => {
      if (confirm('WARNING: Are you sure you want to delete all habits, goals, and stats? This cannot be undone.')) {
        this.store.reset();
        this.misc.showToast('Database wiped successfully.', 'info');
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    });
  }

  setupFeedback() {
    const btnOpen = document.getElementById('btn-open-feedback');
    const btnExport = document.getElementById('btn-export-feedback');
    const modal = document.getElementById('feedback-modal-overlay');
    const btnClose = document.getElementById('btn-close-feedback-modal');
    const btnCancel = document.getElementById('btn-cancel-feedback-modal');
    const btnSubmit = document.getElementById('btn-submit-feedback');
    const commentInput = document.getElementById('feedback-comment');

    if (!btnOpen) return;

    let selectedRating = 5;

    // Rating selection emojis click triggers
    const ratingBtns = document.querySelectorAll('.rating-emoji-btn');
    ratingBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        ratingBtns.forEach(b => {
          b.style.borderColor = 'var(--border-color)';
          b.style.background = 'transparent';
        });
        btn.style.borderColor = 'var(--color-primary)';
        btn.style.background = 'rgba(99,102,241,0.05)';
        selectedRating = parseInt(btn.getAttribute('data-rating'), 10);
      });
    });

    btnOpen.addEventListener('click', () => {
      modal.classList.add('active');
      commentInput.value = '';
      ratingBtns.forEach(b => {
        b.style.borderColor = 'var(--border-color)';
        b.style.background = 'transparent';
      });
      const defaultBtn = document.querySelector('.rating-emoji-btn[data-rating="5"]');
      if (defaultBtn) {
        defaultBtn.style.borderColor = 'var(--color-primary)';
        defaultBtn.style.background = 'rgba(99,102,241,0.05)';
      }
      selectedRating = 5;
    });

    const closeModal = () => modal.classList.remove('active');

    btnClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    btnSubmit.addEventListener('click', () => {
      const comment = commentInput.value.trim();
      this.store.addFeedback(selectedRating, comment);
      closeModal();
      this.misc.playRewardChime();
      this.misc.showToast('Thank you for your feedback! It has been saved.', 'success');
    });

    btnExport.addEventListener('click', () => {
      const feedbackList = this.store.state.feedback || [];
      if (feedbackList.length === 0) {
        alert('No feedback entries recorded yet. Please submit feedback first!');
        return;
      }

      // Create download trigger
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(feedbackList, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `liferpg_feedback_export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      this.misc.showToast('Feedback successfully exported!', 'success');
    });
  }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
  if (!window.location.pathname.includes('/pages/profile.html')) return;
  const engine = new ProfilePageEngine();
  engine.init();
});
