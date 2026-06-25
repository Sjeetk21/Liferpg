/**
 * LifeRPG Weekly Review Page Controller
 */

class WeeklyReviewPageEngine {
  constructor() {
    this.store = window.LifeRPGStore;
    this.misc = window.LifeRPGMisc;
    
    // Modal Elements
    this.archiveModal = document.getElementById('archive-modal-overlay');
    this.btnCloseArchive = document.getElementById('btn-close-archive-modal');
    this.btnCancelArchive = document.getElementById('btn-cancel-archive');
    this.btnSaveArchive = document.getElementById('btn-save-archive');

    this.inputWin = document.getElementById('review-biggest-win');
    this.inputMiss = document.getElementById('review-biggest-miss');
    this.inputFocusNext = document.getElementById('review-focus-next');
  }

  init() {
    this.render();
    this.registerEvents();
  }

  registerEvents() {
    const btnArchive = document.getElementById('btn-finalize-review');
    if (btnArchive) {
      btnArchive.addEventListener('click', () => this.openArchiveModal());
    }

    if (this.btnCloseArchive) this.btnCloseArchive.addEventListener('click', () => this.closeArchiveModal());
    if (this.btnCancelArchive) this.btnCancelArchive.addEventListener('click', () => this.closeArchiveModal());
    if (this.btnSaveArchive) this.btnSaveArchive.addEventListener('click', () => this.handleSaveArchive());

    if (this.archiveModal) {
      this.archiveModal.addEventListener('click', (e) => {
        if (e.target === this.archiveModal) this.closeArchiveModal();
      });
    }
  }

  openArchiveModal() {
    this.archiveModal.classList.add('active');
    this.inputWin.value = '';
    this.inputMiss.value = '';
    this.inputFocusNext.value = '';
    this.inputWin.focus();
  }

  closeArchiveModal() {
    this.archiveModal.classList.remove('active');
  }

  handleSaveArchive() {
    const winText = this.inputWin.value.trim();
    const missText = this.inputMiss.value.trim();
    const focusNextText = this.inputFocusNext.value.trim();

    if (!winText || !missText || !focusNextText) {
      alert('Please fill out all reflection fields before archiving.');
      return;
    }

    const stats = this.store.getWeeklyStats();
    
    const reviewData = {
      ...stats,
      biggestWin: winText,
      biggestMiss: missText,
      focusNext: focusNextText
    };

    this.store.saveWeeklyReview(reviewData);
    this.closeArchiveModal();
    
    this.misc.playRewardChime();
    this.misc.triggerConfetti();
    this.misc.showToast("Weekly review successfully archived!", "success");
    
    this.render();
  }

  render() {
    const stats = this.store.getWeeklyStats();
    
    // 1. Render Date Range
    const startObj = new Date(stats.startDate);
    const endObj = new Date(stats.endDate);
    const formatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const dateRangeStr = `${startObj.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - ${endObj.toLocaleDateString(undefined, formatOptions)}`;
    document.getElementById('week-date-range').textContent = dateRangeStr;

    // 2. Stats (Renamed XP to GP)
    document.getElementById('review-xp-gained').textContent = stats.xpGained.toLocaleString();
    document.getElementById('review-completions').textContent = stats.habitsCompleted.toLocaleString();
    document.getElementById('review-best-streak').textContent = `${stats.bestStreak} Day${stats.bestStreak !== 1 ? 's' : ''}`;

    // 3. Improved / Low Performing
    document.getElementById('review-most-improved').textContent = stats.mostImprovedAttribute;
    document.getElementById('review-lowest-performing').textContent = stats.lowestPerformingArea;

    // 4. GP breakdown bars
    const barsContainer = document.getElementById('review-xp-bars-container');
    if (barsContainer) {
      barsContainer.innerHTML = '';
      
      const maxVal = Math.max(...this.store.state.attributes.map(a => stats.attrXpGains[a.name] || 0), 100);

      this.store.state.attributes.forEach(attr => {
        const xpGained = stats.attrXpGains[attr.name] || 0;
        const pct = Math.min(100, Math.round((xpGained / maxVal) * 100));

        const barRow = document.createElement('div');
        barRow.className = 'xp-bar-row';
        barRow.innerHTML = `
          <div class="xp-bar-label-row">
            <span style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary); display: flex; align-items: center; gap: 5px;">
              <span style="color: ${attr.color};">${this.getAttrEmoji(attr.name)}</span>
              ${attr.name}
            </span>
            <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">+${xpGained} GP</span>
          </div>
          <div class="progress-bar-outer" style="height: 8px; border-radius: 4px;">
            <div class="progress-bar-inner" style="width: ${pct}%; background: ${attr.color}; height: 100%; border-radius: 4px; box-shadow: 0 0 8px ${attr.color}50;"></div>
          </div>
        `;
        barsContainer.appendChild(barRow);
      });
    }

    // 5. Render archives
    const archivesContainer = document.getElementById('archives-container');
    if (archivesContainer) {
      archivesContainer.innerHTML = '';
      const reviews = this.store.state.weekly_reviews || [];

      if (reviews.length === 0) {
        archivesContainer.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted); border: 1px dashed var(--border-color); border-radius: 12px; background: rgba(255,255,255,0.01);">
            <p style="font-style: italic; font-size: 0.85rem;">No archived weekly reviews yet. Click "Archive This Week" above to save your first reflection.</p>
          </div>
        `;
        return;
      }

      // Render chronologically descending
      const totalReviews = reviews.length;
      [...reviews].reverse().forEach((rev, revIdx) => {
        // revIdx in reversed array corresponds to (totalReviews - revIdx - 1) in original array
        const origIndex = totalReviews - revIdx - 1;
        const weekNum = origIndex + 1;

        const revStart = new Date(rev.startDate);
        const revEnd = new Date(rev.endDate);
        const revRange = `${revStart.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - ${revEnd.toLocaleDateString(undefined, formatOptions)}`;
        
        const card = document.createElement('div');
        card.className = 'card archive-card';
        card.innerHTML = `
          <div class="archive-header">
            <h4 style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">Week ${weekNum}</h4>
            <span style="font-size: 0.75rem; color: var(--text-secondary); font-family: var(--font-display); font-weight: 600;">${revRange}</span>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-top: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
            <div>
              <span style="display: block; font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">GP Earned</span>
              <strong style="font-size: 1.1rem; color: var(--color-primary);">+${rev.xpGained}</strong>
            </div>
            <div>
              <span style="display: block; font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">Quests Done</span>
              <strong style="font-size: 1.1rem; color: var(--text-primary);">${rev.habitsCompleted}</strong>
            </div>
            <div>
              <span style="display: block; font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">Streak</span>
              <strong style="font-size: 1.1rem; color: var(--color-warning);">${rev.bestStreak} Days</strong>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.75rem; margin-bottom: 0.75rem;">
            <div>
              <span style="display: block; font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 2px;">🚀 Most Improved</span>
              <span style="font-size: 0.8rem; font-weight: 600; color: var(--color-secondary);">${rev.mostImprovedAttribute}</span>
            </div>
            <div>
              <span style="display: block; font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 2px;">⚠️ Lowest Area</span>
              <span style="font-size: 0.8rem; font-weight: 600; color: #F59E0B;">${rev.lowestPerformingArea}</span>
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-color); padding-top: 0.75rem; display: flex; justify-content: flex-end;">
            <button class="btn btn-secondary btn-toggle-details" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; width: 100%; text-align: center; display: block;">Show Reflections</button>
          </div>

          <div class="reflections-drawer" style="display: none; margin-top: 1rem; border-top: 1px dashed var(--border-color); padding-top: 0.75rem; font-size: 0.75rem; text-align: left; line-height: 1.45;">
            <div style="margin-bottom: 0.6rem;">
              <strong style="color: var(--color-secondary); display: block; text-transform: uppercase; font-size: 0.65rem; letter-spacing: 0.05em; margin-bottom: 2px;">Biggest Win</strong>
              <span style="color: var(--text-primary); font-size: 0.8rem;">${rev.biggestWin || 'No reflections logged.'}</span>
            </div>
            <div style="margin-bottom: 0.6rem;">
              <strong style="color: #EF4444; display: block; text-transform: uppercase; font-size: 0.65rem; letter-spacing: 0.05em; margin-bottom: 2px;">Biggest Miss</strong>
              <span style="color: var(--text-primary); font-size: 0.8rem;">${rev.biggestMiss || 'No reflections logged.'}</span>
            </div>
            <div>
              <strong style="color: var(--color-primary); display: block; text-transform: uppercase; font-size: 0.65rem; letter-spacing: 0.05em; margin-bottom: 2px;">Focus Next Week</strong>
              <span style="color: var(--text-primary); font-size: 0.8rem;">${rev.focusNext || 'No reflections logged.'}</span>
            </div>
          </div>
        `;

        const toggleBtn = card.querySelector('.btn-toggle-details');
        const drawer = card.querySelector('.reflections-drawer');
        toggleBtn.addEventListener('click', () => {
          const isVisible = drawer.style.display === 'block';
          drawer.style.display = isVisible ? 'none' : 'block';
          toggleBtn.textContent = isVisible ? 'Show Reflections' : 'Hide Reflections';
        });

        archivesContainer.appendChild(card);
      });
    }
  }

  getAttrEmoji(name) {
    const emojis = { Fitness: '⚡', Knowledge: '📚', Wealth: '💰', Creativity: '🎨' };
    return emojis[name] || '✨';
  }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
  if (!window.location.pathname.includes('/pages/weekly_review.html')) return;
  const engine = new WeeklyReviewPageEngine();
  engine.init();
});
