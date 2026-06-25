/**
 * LifeRPG Dashboard Rendering and Checkbox Logic
 */

class DashboardEngine {
  constructor() {
    this.store = window.LifeRPGStore;
    this.misc = window.LifeRPGMisc;
    this.selectedMood = null;
  }

  init() {
    this.checkOnboarding();
    this.setupMissionEvents();
    this.setupReflectionEvents();
    this.setupOutcomeEvents();
    this.render();
  }

  checkOnboarding() {
    const state = this.store.state;
    const overlay = document.getElementById('onboarding-modal-overlay');
    if (!overlay) return;

    if (!state.onboarded) {
      overlay.classList.add('active');
      this.setupOnboardingEvents();
    } else {
      overlay.classList.remove('active');
    }
  }

  setupOnboardingEvents() {
    const overlay = document.getElementById('onboarding-modal-overlay');
    const step1 = document.getElementById('onboarding-step-1');
    const step2 = document.getElementById('onboarding-step-2');
    const step3 = document.getElementById('onboarding-step-3');

    const btnNext1 = document.getElementById('onboard-next-1');
    const btnNext2 = document.getElementById('onboard-next-2');
    const btnBack2 = document.getElementById('onboard-back-2');
    const btnBack3 = document.getElementById('onboard-back-3');
    const btnFinish = document.getElementById('onboard-finish');

    let selectedArchetype = 'Scholar';

    // Archetype selection picker
    const cards = document.querySelectorAll('.archetype-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => {
          c.classList.remove('active');
          c.style.border = '1px solid var(--border-color)';
          c.style.background = 'transparent';
        });
        card.classList.add('active');
        card.style.border = '2px solid var(--color-primary)';
        card.style.background = 'rgba(99,102,241,0.05)';
        selectedArchetype = card.getAttribute('data-archetype');
      });
    });

    btnNext1.addEventListener('click', () => {
      const name = document.getElementById('onboard-player-name').value.trim();
      if (!name) {
        alert('Please enter your explorer name.');
        return;
      }
      step1.style.display = 'none';
      step2.style.display = 'block';
    });

    btnBack2.addEventListener('click', () => {
      step2.style.display = 'none';
      step1.style.display = 'block';
    });

    btnNext2.addEventListener('click', () => {
      const checkboxes = document.querySelectorAll('.onboard-attr-checkbox:checked');
      if (checkboxes.length === 0) {
        alert('Please select at least one focus area.');
        return;
      }
      
      const selectedAttrs = Array.from(checkboxes).map(cb => cb.value);
      const labels = document.querySelectorAll('#onboarding-step-3 .form-label');
      const inputs = document.querySelectorAll('.onboard-habit-input');
      
      inputs.forEach((input, index) => {
        const attrName = selectedAttrs[index % selectedAttrs.length];
        labels[index].textContent = `Habit ${index + 1} (${attrName} Focus)`;
        
        // Auto generate sensible starter presets matching their categories
        if (input.value === '20 pushups' || input.value === 'Read 15 minutes' || input.value === 'Write code') {
          if (attrName === 'Fitness') input.value = 'Morning stretching or walk';
          else if (attrName === 'Knowledge') input.value = 'Read 10 pages of a book';
          else if (attrName === 'Wealth') input.value = 'Record my daily expenses';
          else if (attrName === 'Creativity') input.value = 'Practice coding / creative hobby';
        }
      });

      step2.style.display = 'none';
      step3.style.display = 'block';
    });

    btnBack3.addEventListener('click', () => {
      step3.style.display = 'none';
      step2.style.display = 'block';
    });

    btnFinish.addEventListener('click', () => {
      const name = document.getElementById('onboard-player-name').value.trim();
      const checkboxes = document.querySelectorAll('.onboard-attr-checkbox:checked');
      const selectedAttrs = Array.from(checkboxes).map(cb => cb.value);

      const habitInputs = document.querySelectorAll('.onboard-habit-input');
      const habitNames = Array.from(habitInputs).map(input => input.value.trim()).filter(Boolean);

      if (habitNames.length === 0) {
        alert('Please specify at least one starting habit.');
        return;
      }

      this.store.completeOnboarding(name, selectedArchetype, selectedAttrs, habitNames);
      overlay.classList.remove('active');
      this.misc.showToast(`Welcome explorer, ${name}! Your journey has begun.`, 'success');
      
      if (window.LifeRPGLayout) {
        window.LifeRPGLayout.updateUserSummary();
      }
      this.render();
    });
  }

  // Primary Mission editing handlers
  setupMissionEvents() {
    const btnEdit = document.getElementById('btn-edit-mission');
    const inputMission = document.getElementById('primary-mission-input');
    const labelMission = document.getElementById('current-mission');

    if (!btnEdit || !inputMission) return;

    btnEdit.addEventListener('click', () => {
      btnEdit.style.display = 'none';
      inputMission.style.display = 'block';
      inputMission.value = labelMission.textContent;
      inputMission.focus();
    });

    const saveMission = () => {
      const val = inputMission.value.trim();
      if (val) {
        this.store.updatePrimaryMission(val);
      }
      inputMission.style.display = 'none';
      btnEdit.style.display = 'flex';
      this.render();
    };

    inputMission.addEventListener('blur', saveMission);
    inputMission.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveMission();
    });
  }

  // Daily Reflection modal events
  setupReflectionEvents() {
    const btnOpen = document.getElementById('btn-open-reflection');
    const overlay = document.getElementById('reflection-modal-overlay');
    const btnClose = document.getElementById('btn-close-reflection-modal');
    const btnCancel = document.getElementById('btn-cancel-reflection');
    const btnSave = document.getElementById('btn-save-reflection');
    const moodBtns = document.querySelectorAll('.mood-btn');
    const notesInput = document.getElementById('reflection-notes');

    if (!btnOpen || !overlay) return;

    btnOpen.addEventListener('click', () => {
      overlay.classList.add('active');
      
      // Preload existing reflection if it exists for today
      const today = this.store.getTodayString();
      const existing = this.store.state.daily_reflections.find(r => r.date === today);
      
      this.selectedMood = null;
      moodBtns.forEach(btn => btn.classList.remove('active'));
      notesInput.value = '';

      if (existing) {
        this.selectedMood = existing.mood;
        notesInput.value = existing.notes || '';
        const activeBtn = Array.from(moodBtns).find(btn => btn.getAttribute('data-mood') === existing.mood);
        if (activeBtn) activeBtn.classList.add('active');
      }
    });

    const closeModal = () => {
      overlay.classList.remove('active');
    };

    btnClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);

    moodBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        moodBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedMood = btn.getAttribute('data-mood');
      });
    });

    btnSave.addEventListener('click', () => {
      if (!this.selectedMood) {
        alert('Please select a mood that represents today.');
        return;
      }
      const notes = notesInput.value.trim();
      this.store.addDailyReflection(this.selectedMood, notes);
      this.misc.showToast('Reflection logged successfully.', 'success');
      closeModal();
    });
  }

  // Outcome Metric Logging events
  setupOutcomeEvents() {
    const overlay = document.getElementById('outcome-log-modal-overlay');
    const btnSkip = document.getElementById('btn-outcome-log-skip');
    const btnSave = document.getElementById('btn-outcome-log-save');
    const inputVal = document.getElementById('outcome-log-value');
    const habitIdInput = document.getElementById('outcome-log-habit-id');
    const metricIdInput = document.getElementById('outcome-log-metric-id');

    if (!overlay) return;

    const closeOutcomeModal = () => {
      overlay.classList.remove('active');
    };

    btnSkip.addEventListener('click', () => {
      const habitId = habitIdInput.value;
      closeOutcomeModal();
      this.completeQuestAndNotify(habitId);
    });

    btnSave.addEventListener('click', () => {
      const valText = inputVal.value.trim();
      const habitId = habitIdInput.value;
      const metricId = metricIdInput.value;
      const today = this.store.getTodayString();

      if (!valText) {
        alert('Please enter a numeric value or click Skip.');
        return;
      }

      const valParsed = parseFloat(valText);
      if (isNaN(valParsed)) {
        alert('Please enter a valid number.');
        return;
      }

      this.store.logOutcomeValue(metricId, valParsed, today);
      closeOutcomeModal();
      this.completeQuestAndNotify(habitId);
    });
  }

  showUndoToast(habitId, message) {
    const container = document.querySelector('.notification-container');
    if (!container) return;

    const existing = document.getElementById('undo-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'undo-toast';
    toast.className = 'toast show';
    toast.style.borderLeftColor = 'var(--color-warning)';
    toast.style.pointerEvents = 'auto';
    toast.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 12px;">
        <span>${message}</span>
        <button class="btn btn-primary" id="btn-undo-action" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: var(--color-warning); border-color: var(--color-warning); color: #000; font-weight: 700; cursor: pointer; border-radius: 4px;">Undo</button>
      </div>
    `;

    container.appendChild(toast);

    const undoBtn = toast.querySelector('#btn-undo-action');
    let undone = false;
    undoBtn.addEventListener('click', () => {
      undone = true;
      this.store.undoCompleteHabit(habitId);
      this.misc.showToast('Action undone.', 'info');
      toast.remove();
      this.render();
    });

    setTimeout(() => {
      if (!undone) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
      }
    }, 5000);
  }

  completeQuestAndNotify(habitId) {
    const habit = this.store.state.habits.find(h => h.id === habitId);
    if (!habit) return;
    const xpReward = this.store.getXpReward(habit.difficulty);

    // Capture button position BEFORE render (render removes the button from DOM)
    const btnElem = document.querySelector(`[data-id="${habitId}"]`);
    
    const result = this.store.completeHabit(habitId);
    if (!result) return;

    // Immediately re-render so other habits remain clickable right away
    this.render();

    this.misc.playRewardChime();
    this.misc.triggerConfetti();

    // Spawn floating GP indicator using pre-captured element
    if (btnElem) {
      this.misc.spawnFloatingXP(btnElem, xpReward);
    }

    if (result.playerLeveledUp) {
      setTimeout(() => this.misc.triggerLevelUp(result.newLevel), 300);
    } else {
      this.showUndoToast(habitId, `Gained +${xpReward} GP in ${result.attrName}!`);
    }

    if (result.attrLeveledUp) {
      setTimeout(() => {
        this.misc.showToast(`${result.attrName} rose to Lvl ${result.attrLevel}!`, 'success');
      }, 600);
    }
  }

  handleQuestCompletion(event, habitId) {
    event.stopPropagation();
    const habit = this.store.state.habits.find(h => h.id === habitId);
    if (!habit) return;

    if (habit.linkedOutcomeId) {
      // Find outcome details
      const outcome = this.store.state.outcomes.find(o => o.id === habit.linkedOutcomeId);
      if (outcome) {
        // Open outcome modal
        const overlay = document.getElementById('outcome-log-modal-overlay');
        const label = document.getElementById('outcome-log-label');
        const inputVal = document.getElementById('outcome-log-value');
        const habitIdInput = document.getElementById('outcome-log-habit-id');
        const metricIdInput = document.getElementById('outcome-log-metric-id');

        label.textContent = `${habit.name} Completed! How many ${outcome.unit || 'units'} to add to "${outcome.name}"?`;
        inputVal.value = '';
        habitIdInput.value = habitId;
        metricIdInput.value = habit.linkedOutcomeId;
        overlay.classList.add('active');
        inputVal.focus();
        return;
      }
    }

    this.completeQuestAndNotify(habitId);
  }

  handleQuestMiss(event, habitId) {
    event.stopPropagation();
    const result = this.store.missHabit(habitId);
    if (!result) return;

    this.render();
    this.showUndoToast(habitId, `Quest marked as missed.`);
  }

  render() {
    const state = this.store.state;

    // 1. Context-Aware Hour Greeting
    const hour = new Date().getHours();
    let greeting = '';
    let motivation = '';
    if (hour >= 5 && hour < 12) {
      greeting = `Good Morning, ${state.player.name}.`;
      motivation = "Today's small actions build tomorrow's success.";
    } else if (hour >= 12 && hour < 18) {
      greeting = `Good Afternoon, ${state.player.name}.`;
      motivation = "Consistency beats perfection.";
    } else {
      greeting = `Good Evening, ${state.player.name}.`;
      motivation = "Consistency beats perfection.";
    }
    document.getElementById('dashboard-greeting').textContent = greeting;
    document.getElementById('dashboard-motivation').textContent = motivation;

    // 2. Render Player Card
    document.getElementById('player-name').textContent = state.player.name;
    document.getElementById('player-level').textContent = state.player.level;
    document.getElementById('player-streak').textContent = `${state.player.streak} Day${state.player.streak !== 1 ? 's' : ''}`;
    
    // Editable Mission Statement Text
    document.getElementById('current-mission').textContent = state.primary_mission;

    // Growth Points (GP) Progress Bar
    const currentLvlXP = this.store.getXpForLevel(state.player.level);
    const pct = Math.min(100, Math.round((state.player.xp / currentLvlXP) * 100));
    document.getElementById('player-xp-label').textContent = `${state.player.xp} / ${currentLvlXP} GP`;
    document.getElementById('player-xp-bar').style.width = `${pct}%`;

    // Remaining Display
    const remainingGP = currentLvlXP - state.player.xp;
    document.getElementById('player-remaining-gp-label').textContent = `${remainingGP} Growth Points remaining until Level ${state.player.level + 1}`;

    // 3. Render "Since Joining" Lifetime Progress Widget
    let totalLifetimeGP = 0;
    Object.keys(state.history).forEach(date => {
      totalLifetimeGP += state.history[date].xp || 0;
    });
    document.getElementById('lifetime-gp').textContent = `+${totalLifetimeGP} GP`;
    document.getElementById('lifetime-completions').textContent = state.player.total_completed;
    
    const breakdownText = state.attributes.map(a => `${a.name} Lvl ${a.level}`).join(' • ');
    document.getElementById('lifetime-breakdown').textContent = breakdownText || 'No areas initialized yet';

    // 4. Render Attribute Cards
    const attrsContainer = document.getElementById('attributes-container');
    attrsContainer.innerHTML = '';

    state.attributes.forEach(attr => {
      const requiredXP = this.store.getXpForAttributeLevel(attr.level);
      const attrPct = Math.min(100, Math.round((attr.xp / requiredXP) * 100));
      
      const card = document.createElement('div');
      card.className = 'attribute-card';
      card.style.borderLeft = `3px solid ${attr.color}`;
      card.innerHTML = `
        <div class="attribute-card-header">
          <div class="attribute-title-block">
            <div class="attribute-icon-wrapper" style="background-color: ${attr.color}20; color: ${attr.color}">
              ${this.getAttrIcon(attr.icon)}
            </div>
            <span class="attribute-info-title">${attr.name}</span>
          </div>
          <span class="attribute-level-badge">Lvl ${attr.level}</span>
        </div>
        <div class="attribute-progress-block">
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 2px;">
            <span>GP Progress</span>
            <span>${attr.xp}/${requiredXP} GP</span>
          </div>
          <div class="progress-bar-outer" style="height: 6px; border-radius: 3px;">
            <div class="progress-bar-inner" style="width: ${attrPct}%; height: 100%; border-radius: 3px; background: ${attr.color}; box-shadow: 0 0 8px ${attr.color}60;"></div>
          </div>
        </div>
      `;
      attrsContainer.appendChild(card);
    });

    // 5. Render Checklist Groups (Overdue, Habits, One-Time Tasks)
    const questsContainer = document.getElementById('quests-container');
    questsContainer.innerHTML = '';

    const todayStr = this.store.getTodayString();
    const todayDate = new Date(todayStr);

    // Grouping
    const overdueTasks = [];
    const habitsList = [];
    const oneTimeList = [];

    state.habits.forEach(h => {
      const freq = (h.frequency || '').toLowerCase();
      if (freq === 'one-time') {
        if (h.deadline && h.deadline < todayStr && !h.completed_today) {
          overdueTasks.push(h);
        } else {
          oneTimeList.push(h);
        }
      } else {
        habitsList.push(h);
      }
    });

    // Sub-render helper
    const buildQuestHTML = (h, type = 'normal') => {
      const isCompleted = h.completed_today === true;
      const isMissed = h.completed_today === 'missed';
      const isOverdue = type === 'overdue';
      
      const xpReward = this.store.getXpReward(h.difficulty);
      const difficultyClass = `badge-${h.difficulty.toLowerCase()}`;
      
      let badgeHTML = `<span class="quest-badge ${difficultyClass}">${h.difficulty}</span>`;
      if (isOverdue) {
        const daysOverdue = Math.round((todayDate - new Date(h.deadline)) / (1000 * 60 * 60 * 24));
        badgeHTML = `<span class="quest-badge overdue-badge">⚠️ ${daysOverdue} Day${daysOverdue !== 1 ? 's' : ''} Overdue</span>`;
      }

      let actionsHTML = '';
      if (!isCompleted && !isMissed) {
        if (freqIsHabit(h.frequency)) {
          actionsHTML = `
            <div class="habit-action-btn-group">
              <button class="btn-action-check check-btn" data-id="${h.id}" title="Complete Quest">✅</button>
              <button class="btn-action-miss miss-btn" data-id="${h.id}" title="Mark as Missed">❌</button>
            </div>
          `;
        } else {
          // One-time checklists just get a single checkoff button
          actionsHTML = `
            <button class="quest-checkbox-btn check-btn" data-id="${h.id}">
              <svg viewBox="0 0 24 24" style="opacity: 0; transform: scale(0.5);"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          `;
        }
      } else if (isCompleted) {
        actionsHTML = `
          <span style="color: var(--color-secondary); font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 4px;">
            ✓ Completed
          </span>
        `;
      } else if (isMissed) {
        actionsHTML = `
          <span style="color: #EF4444; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 4px;">
            ✗ Missed
          </span>
        `;
      }

      const item = document.createElement('div');
      item.className = `quest-item ${isCompleted ? 'completed' : ''} ${isMissed ? 'missed' : ''} ${isOverdue ? 'overdue-item' : ''}`;
      
      item.innerHTML = `
        <div class="quest-details">
          <div class="quest-info-text">
            <span class="quest-title">${h.name}</span>
            <div class="quest-meta-row">
              ${badgeHTML}
              <span class="quest-rewards">
                <span class="quest-reward-pill">+${xpReward} GP</span>
                <span style="color: var(--text-muted); font-size: 0.75rem;">${h.category}</span>
                ${h.deadline ? `<span style="color: var(--text-muted); font-size: 0.75rem;">• Deadline: ${h.deadline}</span>` : ''}
              </span>
            </div>
          </div>
        </div>
        <div style="flex-shrink: 0;">
          ${actionsHTML}
        </div>
      `;

      // Wire up clicks
      const checkBtn = item.querySelector('.check-btn');
      if (checkBtn) {
        checkBtn.addEventListener('click', (e) => this.handleQuestCompletion(e, h.id));
      }
      const missBtn = item.querySelector('.miss-btn');
      if (missBtn) {
        missBtn.addEventListener('click', (e) => this.handleQuestMiss(e, h.id));
      }

      return item;
    };

    function freqIsHabit(freq) {
      const f = (freq || '').toLowerCase();
      return f === 'daily' || f === 'weekly' || f === 'monthly';
    }

    let hasAnyItems = false;

    // Render Overdue Tasks Section
    if (overdueTasks.length > 0) {
      hasAnyItems = true;
      const title = document.createElement('h4');
      title.className = 'quest-section-title overdue-title';
      title.textContent = '⚠️ Overdue tasks';
      questsContainer.appendChild(title);

      overdueTasks.forEach(h => {
        questsContainer.appendChild(buildQuestHTML(h, 'overdue'));
      });
    }

    // Render Habits Section
    const titleHabits = document.createElement('h4');
    titleHabits.className = 'quest-section-title';
    titleHabits.textContent = '🔄 Habits';
    questsContainer.appendChild(titleHabits);

    if (habitsList.length > 0) {
      hasAnyItems = true;
      habitsList.forEach(h => {
        questsContainer.appendChild(buildQuestHTML(h, 'normal'));
      });
    } else {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No habits configured. Visit Quests page to create some!';
      questsContainer.appendChild(empty);
    }

    // Render One-Time Tasks Section
    const titleTasks = document.createElement('h4');
    titleTasks.className = 'quest-section-title';
    titleTasks.textContent = '📌 One-Time Tasks';
    questsContainer.appendChild(titleTasks);

    if (oneTimeList.length > 0) {
      hasAnyItems = true;
      oneTimeList.forEach(h => {
        questsContainer.appendChild(buildQuestHTML(h, 'normal'));
      });
    } else {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No one-time tasks due today.';
      questsContainer.appendChild(empty);
    }

    // Overall total lists remaining count calculations
    // Count incomplete daily/weekly/monthly habits & non-overdue/overdue incomplete tasks
    let totalNormalCount = state.habits.length;
    let completedNormalCount = state.habits.filter(h => h.completed_today === true).length;
    let missedNormalCount = state.habits.filter(h => h.completed_today === 'missed').length;

    const remainingCount = totalNormalCount - completedNormalCount - missedNormalCount;
    document.getElementById('quests-remaining-label').textContent = `${remainingCount} left`;

    // Dial updates: count checkoffs today
    this.updateCompletionDial(completedNormalCount, totalNormalCount - missedNormalCount);
  }

  updateCompletionDial(completed, total) {
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const circumference = 314;
    const offset = circumference - (pct / 100) * circumference;
    
    const dialFill = document.getElementById('completion-dial-fill');
    const dialText = document.getElementById('completion-dial-text');
    const countText = document.getElementById('completion-count-text');

    if (dialFill) dialFill.style.strokeDashoffset = offset;
    if (dialText) dialText.textContent = `${pct}%`;
    if (countText) countText.textContent = `${completed} of ${total} quests complete`;
  }

  getAttrIcon(iconName) {
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
  if (window.location.pathname.includes('/pages/')) return;
  const engine = new DashboardEngine();
  engine.init();
});
