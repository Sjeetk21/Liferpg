/**
 * LifeRPG Goals Page Controller
 * Handles goals rendering, milestone checking, and goal CRUD modal.
 */

class GoalsPageEngine {
  constructor() {
    this.store = window.LifeRPGStore;
    this.misc = window.LifeRPGMisc;

    // Elements
    this.container = document.getElementById('goals-container');
    this.modal = document.getElementById('goal-modal-overlay');
    this.btnCreate = document.getElementById('btn-create-goal');
    this.btnClose = document.getElementById('btn-close-modal');
    this.btnCancel = document.getElementById('btn-cancel-modal');
    this.btnSave = document.getElementById('btn-save-goal');
    
    // Form Inputs
    this.inputEditId = document.getElementById('edit-goal-id');
    this.inputName = document.getElementById('goal-name');
    this.inputDeadline = document.getElementById('goal-deadline');
    this.milestonesFieldContainer = document.getElementById('milestones-form-fields-container');
    this.btnAddMilestoneField = document.getElementById('btn-add-milestone-field');
  }

  init() {
    this.registerEvents();
    this.render();
  }

  registerEvents() {
    this.btnCreate.addEventListener('click', () => this.openModal());
    this.btnClose.addEventListener('click', () => this.closeModal());
    this.btnCancel.addEventListener('click', () => this.closeModal());
    this.btnSave.addEventListener('click', () => this.handleSave());
    this.btnAddMilestoneField.addEventListener('click', () => this.addMilestoneInputField());
    
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });
  }

  render() {
    const goals = this.store.state.goals;
    this.container.innerHTML = '';

    if (goals.length === 0) {
      this.container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-muted);">
          <p style="font-size: 1.15rem; margin-bottom: 1rem;">No active missions.</p>
          <button class="btn btn-secondary" onclick="document.getElementById('btn-create-goal').click()">Set Your First Mission</button>
        </div>
      `;
      return;
    }

    goals.forEach(g => {
      const card = document.createElement('div');
      card.className = 'goal-card';
      
      const formattedDate = g.deadline ? new Date(g.deadline).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'}) : 'No limit';
      const isCompleted = g.progress === 100;

      let milestoneItemsHtml = '';
      if (g.milestones && g.milestones.length > 0) {
        g.milestones.forEach((m, idx) => {
          milestoneItemsHtml += `
            <div class="milestone-item ${m.completed ? 'completed' : ''}" data-goal-id="${g.id}" data-index="${idx}">
              <div class="milestone-checkbox">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span class="milestone-title-text">${m.title}</span>
            </div>
          `;
        });
      } else {
        milestoneItemsHtml = `<p style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">No milestones defined.</p>`;
      }

      card.innerHTML = `
        <div class="goal-card-header">
          <div class="goal-title-block">
            <h3 class="goal-title">${g.name}</h3>
            <span class="goal-deadline">
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Target: ${formattedDate}
            </span>
          </div>

          <div class="goal-options">
            <button class="btn-icon" style="padding: 0.35rem;" onclick="window.GoalsPage.editGoal('${g.id}')">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon" style="padding: 0.35rem; color: #EF4444; border-color: rgba(239, 68, 68, 0.1);" onclick="window.GoalsPage.deleteGoal('${g.id}')">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        <div class="goal-progress-section">
          <div class="goal-progress-bar-label">
            <span>Overall Progress</span>
            <span style="color: ${isCompleted ? 'var(--color-secondary)' : 'var(--text-primary)'}">${g.progress}%</span>
          </div>
          <div class="progress-bar-outer" style="height: 8px; border-radius: 4px;">
            <div class="progress-bar-inner" style="width: ${g.progress}%; border-radius: 4px; ${isCompleted ? 'background: var(--color-secondary); box-shadow: 0 0 8px rgba(16,185,129,0.5);' : ''}"></div>
          </div>
        </div>

        <div class="milestones-block">
          <h4 style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 2px;">Milestones</h4>
          ${milestoneItemsHtml}
        </div>
      `;

      // Milestone check click triggers
      card.querySelectorAll('.milestone-item').forEach(mItem => {
        mItem.addEventListener('click', (e) => {
          const goalId = mItem.getAttribute('data-goal-id');
          const index = parseInt(mItem.getAttribute('data-index'), 10);
          this.store.toggleMilestone(goalId, index);
          
          // Complete effects if Goal completes
          const goalObj = this.store.state.goals.find(g => g.id === goalId);
          if (goalObj.progress === 100 && !isCompleted) {
            this.misc.playRewardChime();
            this.misc.triggerConfetti();
            this.misc.showToast(`Mission Completed: ${goalObj.name}!`, 'success');
          } else {
            this.misc.playRewardChime();
          }

          this.render();
          if (window.LifeRPGLayout) {
            window.LifeRPGLayout.updateUserSummary(); // Update active mission on sidebar if changed
          }
        });
      });

      this.container.appendChild(card);
    });
  }

  // Edit Goal loading handler called from onclick attributes
  editGoal(id) {
    const goal = this.store.state.goals.find(g => g.id === id);
    if (goal) {
      this.openModal(goal);
    }
  }

  deleteGoal(id) {
    const goalObj = this.store.state.goals.find(g => g.id === id);
    if (confirm(`Delete the goal "${goalObj.name}"?`)) {
      this.store.deleteGoal(id);
      this.render();
      this.misc.showToast('Goal deleted.', 'info');
      if (window.LifeRPGLayout) {
        window.LifeRPGLayout.updateUserSummary();
      }
    }
  }

  openModal(goal = null) {
    this.modal.classList.add('active');
    this.milestonesFieldContainer.innerHTML = '';

    if (goal) {
      document.getElementById('modal-goal-title').textContent = 'Edit Mission';
      this.inputEditId.value = goal.id;
      this.inputName.value = goal.name;
      this.inputDeadline.value = goal.deadline;

      if (goal.milestones && goal.milestones.length > 0) {
        goal.milestones.forEach(m => this.addMilestoneInputField(m.title));
      } else {
        this.addMilestoneInputField();
      }
    } else {
      document.getElementById('modal-goal-title').textContent = 'Add Mission';
      this.inputEditId.value = '';
      this.inputName.value = '';
      
      // Default 1 week out
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      this.inputDeadline.value = defaultDate.toISOString().split('T')[0];
      
      this.addMilestoneInputField();
    }
    this.inputName.focus();
  }

  addMilestoneInputField(value = '') {
    const row = document.createElement('div');
    row.className = 'milestone-input-row';
    row.innerHTML = `
      <input type="text" class="form-input milestone-input-val" placeholder="e.g. Purchase running shoes" value="${value}">
      <button class="btn-remove-milestone-field">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    row.querySelector('.btn-remove-milestone-field').addEventListener('click', () => {
      row.remove();
    });

    this.milestonesFieldContainer.appendChild(row);
  }

  closeModal() {
    this.modal.classList.remove('active');
  }

  handleSave() {
    const name = this.inputName.value.trim();
    const deadline = this.inputDeadline.value;
    const id = this.inputEditId.value;

    const milestones = [];
    document.querySelectorAll('.milestone-input-val').forEach(input => {
      const val = input.value.trim();
      if (val) milestones.push(val);
    });

    if (!name) {
      alert('Please enter a goal/mission name.');
      return;
    }

    if (id) {
      this.store.updateGoal(id, name, deadline, milestones);
      this.misc.showToast('Mission updated.', 'success');
    } else {
      this.store.addGoal(name, deadline, milestones);
      this.misc.showToast('Mission added.', 'success');
    }

    this.closeModal();
    this.render();
    
    if (window.LifeRPGLayout) {
      window.LifeRPGLayout.updateUserSummary();
    }
  }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
  if (!window.location.pathname.includes('/pages/goals.html')) return;
  window.GoalsPage = new GoalsPageEngine();
  window.GoalsPage.init();
});
