/**
 * LifeRPG Habits Page Controller
 * Manages habit list rendering, CRUD, and modal actions.
 */

class HabitsPageEngine {
  constructor() {
    this.store = window.LifeRPGStore;
    this.misc = window.LifeRPGMisc;
    
    // Selectors
    this.container = document.getElementById('habits-container');
    this.modal = document.getElementById('habit-modal-overlay');
    this.btnCreate = document.getElementById('btn-create-habit');
    this.btnClose = document.getElementById('btn-close-modal');
    this.btnCancel = document.getElementById('btn-cancel-modal');
    this.btnSave = document.getElementById('btn-save-habit');
    
    // Form Inputs
    this.inputEditId = document.getElementById('edit-habit-id');
    this.inputName = document.getElementById('habit-name');
    this.inputCategory = document.getElementById('habit-category');
    this.inputDifficulty = document.getElementById('habit-difficulty');
    this.inputFrequency = document.getElementById('habit-frequency');
    this.inputStreakMode = document.getElementById('habit-streak-mode');
    this.inputDeadline = document.getElementById('habit-deadline');
    this.inputOutcome = document.getElementById('habit-outcome');
    
    // Form Groups to show/hide
    this.streakModeGroup = document.getElementById('streak-mode-group');
    this.deadlineGroup = document.getElementById('habit-deadline-group');

    // Search and Filters
    this.searchInput = document.getElementById('search-input');
    this.filterCategory = document.getElementById('filter-category');
    this.filterFrequency = document.getElementById('filter-frequency');
  }

  init() {
    this.populateDropdowns();
    this.registerEvents();
    this.render();
  }

  populateDropdowns() {
    // 1. Populate Category dropdown
    const catSelect = this.inputCategory;
    const filterCatSelect = this.filterCategory;
    const currentVal = catSelect.value;
    
    catSelect.innerHTML = '';
    this.store.state.attributes.forEach(attr => {
      const opt = document.createElement('option');
      opt.value = attr.name;
      opt.textContent = `${attr.name} (${this.getAttrEmoji(attr.icon)})`;
      catSelect.appendChild(opt);
    });
    
    // Add create new focus option
    const newFocusOpt = document.createElement('option');
    newFocusOpt.value = 'new-focus';
    newFocusOpt.textContent = '+ Create New Focus Area...';
    catSelect.appendChild(newFocusOpt);
    
    if (currentVal && Array.from(catSelect.options).some(o => o.value === currentVal)) {
      catSelect.value = currentVal;
    }

    // Populate Filter Category dropdown
    const filterCurrentVal = filterCatSelect.value;
    filterCatSelect.innerHTML = '<option value="all">All Attributes</option>';
    this.store.state.attributes.forEach(attr => {
      const opt = document.createElement('option');
      opt.value = attr.name;
      opt.textContent = attr.name;
      filterCatSelect.appendChild(opt);
    });
    if (filterCurrentVal) filterCatSelect.value = filterCurrentVal;

    // 2. Populate Outcome link dropdown
    const outcomeSelect = this.inputOutcome;
    const currentOutcomeVal = outcomeSelect.value;
    
    outcomeSelect.innerHTML = '<option value="">None</option>';
    if (this.store.state.outcomes) {
      this.store.state.outcomes.forEach(out => {
        const opt = document.createElement('option');
        opt.value = out.id;
        opt.textContent = `${out.name} (${out.unit || ''})`;
        outcomeSelect.appendChild(opt);
      });
    }
    
    if (currentOutcomeVal && Array.from(outcomeSelect.options).some(o => o.value === currentOutcomeVal)) {
      outcomeSelect.value = currentOutcomeVal;
    }
  }

  registerEvents() {
    // Open Modal (Create mode)
    this.btnCreate.addEventListener('click', () => this.openModal());
    
    // Close Modal
    this.btnClose.addEventListener('click', () => this.closeModal());
    this.btnCancel.addEventListener('click', () => this.closeModal());
    
    // Save Action
    this.btnSave.addEventListener('click', () => this.handleSave());
    
    // Close on overlay click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });

    // Search and filter triggers
    this.searchInput.addEventListener('input', () => this.render());
    this.filterCategory.addEventListener('change', () => this.render());
    this.filterFrequency.addEventListener('change', () => this.render());

    // Toggle Deadline vs Streak Mode based on frequency select in modal
    this.inputFrequency.addEventListener('change', () => {
      this.toggleFrequencyFields();
    });

    // Create New Focus Area prompt trigger
    this.inputCategory.addEventListener('change', () => {
      if (this.inputCategory.value === 'new-focus') {
        this.handleNewFocusCreation();
      }
    });
  }

  toggleFrequencyFields() {
    const freq = this.inputFrequency.value;
    if (freq === 'One-time') {
      this.streakModeGroup.style.display = 'none';
      this.deadlineGroup.style.display = 'block';
    } else {
      this.streakModeGroup.style.display = 'block';
      this.deadlineGroup.style.display = 'none';
    }
  }

  handleNewFocusCreation() {
    const name = prompt('Enter the name for the new life focus area (e.g. Health):');
    if (!name || !name.trim()) {
      // Revert selection
      this.inputCategory.selectedIndex = 0;
      return;
    }
    
    const icon = prompt('Enter a single emoji icon (e.g. 🍎):', '✨') || '✨';
    const color = prompt('Enter a CSS Hex Color code (e.g. #FF5733):', '#6366F1') || '#6366F1';
    
    const newAttr = this.store.addAttribute(name.trim(), color, icon);
    
    this.populateDropdowns();
    this.inputCategory.value = newAttr.name;
    this.misc.showToast(`Focus Area "${newAttr.name}" created successfully.`, 'success');
  }

  render() {
    const query = this.searchInput.value.toLowerCase().trim();
    const catFilter = this.filterCategory.value;
    const freqFilter = this.filterFrequency.value;
    
    let habits = this.store.state.habits;

    // Apply Search Filter
    if (query) {
      habits = habits.filter(h => {
        return h.name.toLowerCase().includes(query) || 
               (h.category || '').toLowerCase().includes(query) || 
               (h.frequency || '').toLowerCase().includes(query);
      });
    }

    // Apply Attribute Category Filter
    if (catFilter !== 'all') {
      habits = habits.filter(h => h.category === catFilter);
    }

    // Apply Frequency Filter
    if (freqFilter !== 'all') {
      habits = habits.filter(h => h.frequency === freqFilter);
    }

    this.container.innerHTML = '';

    if (habits.length === 0) {
      this.container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-muted);">
          <p style="font-size: 1.15rem; margin-bottom: 1rem;">No quests match your filters.</p>
        </div>
      `;
      return;
    }

    habits.forEach(h => {
      const card = document.createElement('div');
      const isCompleted = h.completed_today === true && h.frequency !== 'One-time';
      card.className = `habit-card ${isCompleted ? 'completed-mute' : ''}`;
      
      const xpReward = this.store.getXpReward(h.difficulty);
      const difficultyClass = `badge-${h.difficulty.toLowerCase()}`;
      
      // Find category color accent
      const matchingAttr = this.store.state.attributes.find(a => a.name === h.category);
      const borderThemeColor = matchingAttr ? matchingAttr.color : 'var(--color-primary)';

      card.style.borderLeft = `4px solid ${borderThemeColor}`;

      let streakHTML = '';
      if (h.frequency !== 'One-time' && h.streak > 0) {
        streakHTML = `<span style="font-size: 0.75rem; color: var(--color-warning); margin-left: 0.5rem;">🔥 ${h.streak} Day Streak</span>`;
      }

      card.innerHTML = `
        <div>
          <div class="habit-header">
            <div>
              <h3 class="habit-card-title">${h.name}</h3>
              <span class="habit-card-cat" style="color: ${borderThemeColor}">${h.category}</span>
              ${streakHTML}
            </div>
            <span class="habit-pill ${difficultyClass}">${h.difficulty}</span>
          </div>

          <div class="habit-details-row">
            <span class="habit-pill pill-freq">${h.frequency}</span>
            ${h.frequency !== 'One-time' ? `<span class="habit-pill" style="background: rgba(255,255,255,0.05); color: var(--text-secondary); border: 1px solid var(--border-color);">${h.streakMode === 'flexible' ? 'Flexible' : 'Strict'}</span>` : ''}
            ${h.deadline ? `<span class="habit-pill" style="background: rgba(239, 68, 68, 0.05); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.2);">Due: ${h.deadline}</span>` : ''}
            <span style="font-size: 0.75rem; color: var(--text-secondary);">Reward: <strong style="color: var(--color-primary);">+${xpReward} GP</strong></span>
          </div>
        </div>

        <div class="habit-footer">
          <div class="habit-actions-group">
            <button class="btn btn-card-action btn-edit" data-id="${h.id}">Edit</button>
            <button class="btn btn-card-action btn-delete" data-id="${h.id}">Delete</button>
          </div>
          
          ${h.completed_today === true ? 
            `<button class="btn btn-card-action btn-secondary" style="border-color: var(--color-secondary); color: var(--color-secondary);" disabled>
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="3" fill="none" style="margin-right: 4px; display: inline-block; vertical-align: middle;"><polyline points="20 6 9 17 4 12"/></svg>Done
             </button>` : 
            h.completed_today === 'missed' ?
            `<button class="btn btn-card-action btn-secondary" style="border-color: #EF4444; color: #EF4444;" disabled>
              ✗ Missed
             </button>` :
            `<button class="btn btn-card-action btn-primary btn-complete-habit" data-id="${h.id}">Complete</button>`
          }
        </div>
      `;

      // Complete click
      const completeBtn = card.querySelector('.btn-complete-habit');
      if (completeBtn) {
        completeBtn.addEventListener('click', (e) => this.handleComplete(e, h));
      }

      // Edit click
      card.querySelector('.btn-edit').addEventListener('click', () => this.openModal(h));

      // Delete click
      card.querySelector('.btn-delete').addEventListener('click', () => {
        if (confirm(`Delete the quest "${h.name}"?`)) {
          this.store.deleteHabit(h.id);
          this.render();
          this.misc.showToast('Quest deleted.', 'info');
        }
      });

      this.container.appendChild(card);
    });
  }

  handleComplete(event, habit) {
    event.stopPropagation();
    
    // Check if outcome is linked
    if (habit.linkedOutcomeId) {
      // Find outcome details
      const outcome = this.store.state.outcomes.find(o => o.id === habit.linkedOutcomeId);
      if (outcome) {
        const valText = prompt(`Quest completed! How many ${outcome.unit || 'units'} to add to "${outcome.name}"? (Or click Cancel to complete without logging value)`);
        if (valText !== null) {
          const valParsed = parseFloat(valText);
          if (!isNaN(valParsed)) {
            this.store.logOutcomeValue(habit.linkedOutcomeId, valParsed, this.store.getTodayString());
          }
        }
      }
    }

    const xpReward = this.store.getXpReward(habit.difficulty);
    const result = this.store.completeHabit(habit.id);
    if (!result) return;

    this.misc.playRewardChime();
    this.misc.triggerConfetti();
    this.misc.spawnFloatingXP(event.currentTarget, xpReward);

    setTimeout(() => {
      if (result.playerLeveledUp) {
        this.misc.triggerLevelUp(result.newLevel);
      } else {
        this.misc.showToast(`Gained +${xpReward} GP!`);
      }

      if (result.attrLeveledUp) {
        setTimeout(() => {
          this.misc.showToast(`${result.attrName} rose to Lvl ${result.attrLevel}!`, 'success');
        }, 600);
      }
      
      this.render();
    }, 400);
  }

  openModal(habit = null) {
    this.populateDropdowns();
    this.modal.classList.add('active');
    
    if (habit) {
      document.getElementById('modal-habit-title').textContent = 'Edit Quest';
      this.inputEditId.value = habit.id;
      this.inputName.value = habit.name;
      this.inputCategory.value = habit.category;
      this.inputDifficulty.value = habit.difficulty;
      this.inputFrequency.value = habit.frequency;
      this.inputStreakMode.value = habit.streakMode || 'strict';
      this.inputDeadline.value = habit.deadline || '';
      this.inputOutcome.value = habit.linkedOutcomeId || '';
    } else {
      document.getElementById('modal-habit-title').textContent = 'Create Quest';
      this.inputEditId.value = '';
      this.inputName.value = '';
      this.inputCategory.selectedIndex = 0;
      this.inputDifficulty.value = 'Medium';
      this.inputFrequency.value = 'Daily';
      this.inputStreakMode.value = 'strict';
      this.inputDeadline.value = '';
      this.inputOutcome.value = '';
    }
    
    this.toggleFrequencyFields();
    this.inputName.focus();
  }

  closeModal() {
    this.modal.classList.remove('active');
  }

  handleSave() {
    const name = this.inputName.value.trim();
    const category = this.inputCategory.value;
    const difficulty = this.inputDifficulty.value;
    const frequency = this.inputFrequency.value;
    const id = this.inputEditId.value;
    const streakMode = this.inputStreakMode.value;
    const deadline = frequency === 'One-time' ? this.inputDeadline.value : '';
    const outcomeId = this.inputOutcome.value;

    if (!name) {
      alert('Please fill out the quest name.');
      return;
    }

    if (id) {
      // Edit
      this.store.updateHabit(id, name, difficulty, frequency, category, streakMode, outcomeId, deadline);
      this.misc.showToast('Quest updated.', 'success');
    } else {
      // Create
      this.store.addHabit(name, difficulty, frequency, category, streakMode, outcomeId, deadline);
      this.misc.showToast('Quest created.', 'success');
    }

    this.closeModal();
    this.render();
  }

  getAttrEmoji(iconName) {
    switch(iconName) {
      case 'zap': return '⚡';
      case 'book': return '📚';
      case 'dollar': return '💰';
      case 'palette': return '🎨';
      default: return '✨';
    }
  }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
  if (!window.location.pathname.includes('/pages/habits.html')) return;
  const engine = new HabitsPageEngine();
  engine.init();
});
