/**
 * LifeRPG LocalStorage Storage Layer
 * Manages the state, persistence, gamification logic, and CRUD operations.
 */

const STORAGE_KEY = 'liferpg_state';

const DEFAULT_STATE = {
  onboarded: false,
  primary_mission: "Build the person you want to become",
  player: {
    name: 'Neo',
    title: 'Growth Initiate',
    level: 1,
    xp: 0,
    streak: 0,
    longest_streak: 0,
    last_completion_date: null,
    total_completed: 0
  },
  attributes: [
    { id: 'attr_fitness', name: 'Fitness', level: 1, xp: 0, color: '#EC4899', icon: 'zap' },
    { id: 'attr_knowledge', name: 'Knowledge', level: 1, xp: 0, color: '#3B82F6', icon: 'book' },
    { id: 'attr_wealth', name: 'Wealth', level: 1, xp: 0, color: '#10B981', icon: 'dollar' },
    { id: 'attr_creativity', name: 'Creativity', level: 1, xp: 0, color: '#A855F7', icon: 'palette' }
  ],
  habits: [
    { id: 'h_1', name: 'Morning Workout', difficulty: 'Medium', frequency: 'Daily', category: 'Fitness', completed_today: false, streakMode: 'strict', linkedOutcomeId: '', streak: 0, history: [], missed_history: [] },
    { id: 'h_2', name: 'Read 20 Pages', difficulty: 'Easy', frequency: 'Daily', category: 'Knowledge', completed_today: false, streakMode: 'flexible', linkedOutcomeId: '', streak: 0, history: [], missed_history: [] },
    { id: 'h_3', name: 'Write Code', difficulty: 'Hard', frequency: 'Daily', category: 'Creativity', completed_today: false, streakMode: 'strict', linkedOutcomeId: '', streak: 0, history: [], missed_history: [] }
  ],
  goals: [
    {
      id: 'g_1',
      name: 'Run a 10K Marathon',
      deadline: '2026-12-31',
      progress: 33,
      milestones: [
        { title: 'Run 3K without stopping', completed: true },
        { title: 'Complete a 5K race', completed: false },
        { title: 'Run 10K test run', completed: false }
      ]
    }
  ],
  history: {}, // Keyed by YYYY-MM-DD: { count: Number, xp: Number }
  weekly_reviews: [],
  outcomes: [],
  feedback: [],
  daily_reflections: [],
  activeTheme: 'dark-default'
};

class StorageEngine {
  constructor() {
    this.state = this.load();
    this.checkDayTransition();
  }

  // Load from LocalStorage
  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.save(DEFAULT_STATE);
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
    try {
      const parsed = JSON.parse(raw);
      // Backwards compatibility layer
      if (parsed.onboarded === undefined) parsed.onboarded = false;
      if (parsed.primary_mission === undefined) parsed.primary_mission = "Build the person you want to become";
      if (!parsed.weekly_reviews) parsed.weekly_reviews = [];
      if (!parsed.outcomes) parsed.outcomes = [];
      if (!parsed.feedback) parsed.feedback = [];
      if (!parsed.daily_reflections) parsed.daily_reflections = [];
      
      if (parsed.habits) {
        parsed.habits.forEach(h => {
          if (h.streakMode === undefined) h.streakMode = 'strict';
          if (h.linkedOutcomeId === undefined) h.linkedOutcomeId = '';
          if (h.streak === undefined) h.streak = 0;
          if (!h.missed_history) h.missed_history = [];
        });
      }
      return parsed;
    } catch (e) {
      console.error('State corrupted, resetting to defaults.', e);
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  // Save to LocalStorage
  save(state = this.state) {
    this.state = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // Reset all data
  reset() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.save();
    return this.state;
  }

  // Check if a new day has arrived. If so, reset completed_today for daily habits
  checkDayTransition() {
    const today = this.getTodayString();
    const lastDate = this.state.player.last_completion_date;
    
    // If it's a new calendar day
    if (lastDate && lastDate !== today) {
      const yesterday = this.getYesterdayString();
      
      // 1. Reset streaks per habit on day transition
      this.state.habits.forEach(h => {
        if (!h.streak) h.streak = 0;
        if (!h.missed_history) h.missed_history = [];
        if (!h.history) h.history = [];
        
        const lastCompletion = h.history[h.history.length - 1];
        
        if (h.streakMode === 'flexible') {
          // Flexible: must have completed at least 5 of the last 7 days (including yesterday, excluding today)
          const last7Days = [];
          for (let i = 1; i <= 7; i++) {
            last7Days.push(this.getDateStringOffset(i));
          }
          const activeDays = h.history.filter(date => last7Days.includes(date)).length;
          if (activeDays < 5) {
            h.streak = 0;
          }
        } else {
          // Strict: must have completed yesterday to maintain streak
          if (lastCompletion !== yesterday) {
            h.streak = 0;
          }
        }
      });

      // 2. Reset player overall momentum streak if they completed NOTHING yesterday!
      if (lastDate !== yesterday) {
        this.state.player.streak = 0;
      }
      
      // 3. Reset completed_today flag
      this.state.habits.forEach(h => {
        if (h.frequency === 'Daily') {
          h.completed_today = false;
        }
        // Weekly resets on Mondays
        if (h.frequency === 'Weekly') {
          const now = new Date();
          if (now.getDay() === 1) { // 1 = Monday
            h.completed_today = false;
          }
        }
        // Monthly resets on 1st of month
        if (h.frequency === 'Monthly') {
          const now = new Date();
          if (now.getDate() === 1) {
            h.completed_today = false;
          }
        }
      });
      this.save();
    }
  }

  getTodayString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  getYesterdayString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // Calculate required XP for a player level
  getXpForLevel(lvl) {
    return lvl * 1000;
  }

  // Calculate required XP for an attribute level
  getXpForAttributeLevel(lvl) {
    return lvl * 500;
  }

  // Calculate reward based on difficulty
  getXpReward(difficulty) {
    switch (difficulty) {
      case 'Easy': return 50;
      case 'Medium': return 100;
      case 'Hard': return 200;
      default: return 50;
    }
  }

  // Core Gamification Action: Complete a Habit/Task
  completeHabit(habitId) {
    const habit = this.state.habits.find(h => h.id === habitId);
    if (!habit) return null;

    const today = this.getTodayString();

    // Prevent double completions today for daily habits, unless it's weekly
    if (habit.completed_today && habit.frequency === 'Daily') return null;

    habit.completed_today = true;
    
    // Track execution history in habit object
    if (!habit.history) habit.history = [];
    habit.history.push(today);

    // Calculate XP
    const xpReward = this.getXpReward(habit.difficulty);

    // Update Player XP
    let playerLeveledUp = false;
    let oldLevel = this.state.player.level;
    this.state.player.xp += xpReward;
    
    while (this.state.player.xp >= this.getXpForLevel(this.state.player.level)) {
      this.state.player.xp -= this.getXpForLevel(this.state.player.level);
      this.state.player.level += 1;
      playerLeveledUp = true;
    }

    // Update Streak
    let streakIncremented = false;
    const lastDate = this.state.player.last_completion_date;
    if (lastDate !== today) {
      if (!lastDate || lastDate === this.getYesterdayString()) {
        this.state.player.streak += 1;
      } else {
        this.state.player.streak = 1; // Reset to 1 since they missed a day
      }
      
      if (this.state.player.streak > this.state.player.longest_streak) {
        this.state.player.longest_streak = this.state.player.streak;
      }
      this.state.player.last_completion_date = today;
      streakIncremented = true;
    }

    // Update habit-specific streak
    if (habit.streak === undefined) habit.streak = 0;
    const yesterday = this.getYesterdayString();
    // Only increment habit streak if this is the first completion today
    const completionsToday = habit.history.filter(d => d === today).length;
    if (completionsToday <= 1) {
      if (habit.streakMode === 'flexible') {
        const last7Days = [];
        for (let i = 0; i < 7; i++) {
          last7Days.push(this.getDateStringOffset(i));
        }
        const activeDays = habit.history.filter(date => last7Days.includes(date)).length;
        if (activeDays >= 5) {
          habit.streak += 1;
        } else {
          habit.streak = 1;
        }
      } else {
        const secondLastComp = habit.history[habit.history.length - 2];
        if (!secondLastComp || secondLastComp === yesterday) {
          habit.streak += 1;
        } else {
          habit.streak = 1;
        }
      }
    }

    // Update linked attribute XP
    // Map category name to attribute ID
    const categoryAttrMap = {
      'Fitness': 'attr_fitness',
      'Knowledge': 'attr_knowledge',
      'Wealth': 'attr_wealth',
      'Creativity': 'attr_creativity'
    };
    const attrId = categoryAttrMap[habit.category];
    const attribute = this.state.attributes.find(a => a.id === attrId);
    let attrLeveledUp = false;
    
    if (attribute) {
      attribute.xp += xpReward;
      while (attribute.xp >= this.getXpForAttributeLevel(attribute.level)) {
        attribute.xp -= this.getXpForAttributeLevel(attribute.level);
        attribute.level += 1;
        attrLeveledUp = true;
      }
    }

    // Update Heatmap History
    if (!this.state.history[today]) {
      this.state.history[today] = { count: 0, xp: 0 };
    }
    this.state.history[today].count += 1;
    this.state.history[today].xp += xpReward;

    this.state.player.total_completed += 1;

    // Save state
    this.save();

    return {
      xpReward,
      playerLeveledUp,
      oldLevel,
      newLevel: this.state.player.level,
      attrLeveledUp,
      attrName: attribute ? attribute.name : '',
      attrLevel: attribute ? attribute.level : 1,
      streak: this.state.player.streak
    };
  }

  // Habits CRUD
  addHabit(name, difficulty, frequency, category, streakMode = 'strict', linkedOutcomeId = '', deadline = '') {
    const id = this.generateId('h');
    const newHabit = {
      id,
      name,
      difficulty,
      frequency,
      category,
      completed_today: false,
      streakMode,
      linkedOutcomeId,
      deadline,
      streak: 0,
      history: [],
      missed_history: []
    };
    this.state.habits.push(newHabit);
    this.save();
    return newHabit;
  }

  updateHabit(id, name, difficulty, frequency, category, streakMode = 'strict', linkedOutcomeId = '', deadline = '') {
    const idx = this.state.habits.findIndex(h => h.id === id);
    if (idx !== -1) {
      this.state.habits[idx].name = name;
      this.state.habits[idx].difficulty = difficulty;
      this.state.habits[idx].frequency = frequency;
      this.state.habits[idx].category = category;
      this.state.habits[idx].streakMode = streakMode;
      this.state.habits[idx].linkedOutcomeId = linkedOutcomeId;
      this.state.habits[idx].deadline = deadline;
      this.save();
      return this.state.habits[idx];
    }
    return null;
  }

  deleteHabit(id) {
    this.state.habits = this.state.habits.filter(h => h.id !== id);
    this.save();
  }

  // Goals CRUD
  addGoal(name, deadline, milestones = []) {
    const id = this.generateId('g');
    const newGoal = {
      id,
      name,
      deadline,
      progress: 0,
      milestones: milestones.map(m => ({ title: m, completed: false }))
    };
    this.state.goals.push(newGoal);
    this.save();
    return newGoal;
  }

  updateGoal(id, name, deadline, milestones = []) {
    const goal = this.state.goals.find(g => g.id === id);
    if (goal) {
      goal.name = name;
      goal.deadline = deadline;
      // Preserve completion status if milestone title matches, else create new ones
      const oldMilestones = goal.milestones || [];
      goal.milestones = milestones.map(title => {
        const match = oldMilestones.find(om => om.title === title);
        return { title, completed: match ? match.completed : false };
      });
      this.recalculateGoalProgress(id);
      this.save();
      return goal;
    }
    return null;
  }

  deleteGoal(id) {
    this.state.goals = this.state.goals.filter(g => g.id !== id);
    this.save();
  }

  toggleMilestone(goalId, milestoneIndex) {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (goal && goal.milestones[milestoneIndex]) {
      goal.milestones[milestoneIndex].completed = !goal.milestones[milestoneIndex].completed;
      this.recalculateGoalProgress(goalId);
      this.save();
    }
  }

  recalculateGoalProgress(goalId) {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (goal && goal.milestones.length > 0) {
      const completed = goal.milestones.filter(m => m.completed).length;
      goal.progress = Math.round((completed / goal.milestones.length) * 100);
    } else if (goal) {
      goal.progress = 0;
    }
  }

  // Custom attributes creation
  addAttribute(name, color, icon) {
    const id = this.generateId('attr');
    const newAttr = { id, name, level: 1, xp: 0, color, icon };
    this.state.attributes.push(newAttr);
    this.save();
    return newAttr;
  }

  // Priority 1: Onboarding Finalizer
  completeOnboarding(name, archetype, selectedAttributes, initialHabits) {
    this.state.player.name = name;
    this.state.player.title = archetype;
    this.state.player.level = 1;
    this.state.player.xp = 0;
    this.state.player.streak = 0;
    this.state.player.longest_streak = 0;
    this.state.player.total_completed = 0;

    // Filter attributes to selected areas
    const allAttrs = [
      { id: 'attr_fitness', name: 'Fitness', level: 1, xp: 0, color: '#EC4899', icon: 'zap' },
      { id: 'attr_knowledge', name: 'Knowledge', level: 1, xp: 0, color: '#3B82F6', icon: 'book' },
      { id: 'attr_wealth', name: 'Wealth', level: 1, xp: 0, color: '#10B981', icon: 'dollar' },
      { id: 'attr_creativity', name: 'Creativity', level: 1, xp: 0, color: '#A855F7', icon: 'palette' }
    ];
    this.state.attributes = allAttrs.filter(a => selectedAttributes.includes(a.name));

    // Reset habits, goals, history
    this.state.habits = [];
    this.state.goals = [];
    this.state.history = {};
    this.state.weekly_reviews = [];
    this.state.outcomes = [];
    this.state.feedback = [];

    // Add initial starter habits
    initialHabits.forEach((habitName, idx) => {
      if (habitName.trim()) {
        // Map index to a matching selected attribute category
        const category = selectedAttributes[idx % selectedAttributes.length] || 'Knowledge';
        this.addHabit(habitName, 'Medium', 'Daily', category);
      }
    });

    this.state.onboarded = true;
    this.save();
  }

  // Priority 2: Weekly Review Statistics Calculation
  getDateStringOffset(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  getWeeklyStats() {
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      last7Days.push(this.getDateStringOffset(i));
    }

    let xpGained = 0;
    let habitsCompleted = 0;

    // Sum XP & completions from general history
    last7Days.forEach(date => {
      const dayData = this.state.history[date];
      if (dayData) {
        xpGained += dayData.xp || 0;
        habitsCompleted += dayData.count || 0;
      }
    });

    // Calculate XP gained per active attribute category
    const attrXpGains = {};
    this.state.attributes.forEach(a => {
      attrXpGains[a.name] = 0;
    });

    this.state.habits.forEach(h => {
      if (h.history) {
        const completionsThisWeek = h.history.filter(date => last7Days.includes(date)).length;
        const xpReward = this.getXpReward(h.difficulty);
        if (attrXpGains[h.category] !== undefined) {
          attrXpGains[h.category] += completionsThisWeek * xpReward;
        }
      }
    });

    // Determine most improved and lowest performing areas
    let mostImprovedAttribute = 'None';
    let maxXP = -1;
    let lowestPerformingArea = 'None';
    let minXP = Infinity;

    this.state.attributes.forEach(a => {
      const xp = attrXpGains[a.name] || 0;
      if (xp > maxXP) {
        maxXP = xp;
        mostImprovedAttribute = a.name;
      }
      if (xp < minXP) {
        minXP = xp;
        lowestPerformingArea = a.name;
      }
    });

    // Fallbacks
    if (maxXP <= 0) mostImprovedAttribute = 'None';
    if (minXP === Infinity) lowestPerformingArea = 'None';

    return {
      startDate: last7Days[6],
      endDate: last7Days[0],
      xpGained,
      habitsCompleted,
      bestStreak: this.state.player.streak,
      mostImprovedAttribute,
      lowestPerformingArea,
      attrXpGains
    };
  }

  saveWeeklyReview(summary) {
    if (!this.state.weekly_reviews) this.state.weekly_reviews = [];
    
    // Add review with timestamp
    const newReview = {
      id: this.generateId('wr'),
      timestamp: new Date().toISOString(),
      ...summary
    };
    
    this.state.weekly_reviews.push(newReview);
    this.save();
    return newReview;
  }

  // Priority 3: Outcome Metrics
  addOutcomeMetric(name, unit, targetValue) {
    if (!this.state.outcomes) this.state.outcomes = [];
    const newMetric = {
      id: this.generateId('out'),
      name,
      unit,
      targetValue: parseFloat(targetValue) || null,
      history: []
    };
    this.state.outcomes.push(newMetric);
    this.save();
    return newMetric;
  }

  logOutcomeValue(id, value, date) {
    if (!this.state.outcomes) return null;
    const metric = this.state.outcomes.find(m => m.id === id);
    if (metric) {
      const valParsed = parseFloat(value);
      if (isNaN(valParsed)) return null;

      // Remove existing entry on same day if logged twice
      metric.history = metric.history.filter(h => h.date !== date);
      metric.history.push({ date, value: valParsed });
      
      // Sort history chronologically
      metric.history.sort((a, b) => new Date(a.date) - new Date(b.date));
      this.save();
      return metric;
    }
    return null;
  }

  deleteOutcomeMetric(id) {
    if (!this.state.outcomes) return;
    this.state.outcomes = this.state.outcomes.filter(m => m.id !== id);
    this.save();
  }

  // Priority 4: User Feedback submission
  addFeedback(rating, comment) {
    if (!this.state.feedback) this.state.feedback = [];
    this.state.feedback.push({
      id: this.generateId('fb'),
      timestamp: new Date().toISOString(),
      rating: parseInt(rating, 10),
      comment
    });
    this.save();
  }

  // V1.1 Updates: Undo Completion (Full Revert State)
  undoCompleteHabit(habitId) {
    const habit = this.state.habits.find(h => h.id === habitId);
    if (!habit || !habit.completed_today) return null;

    const today = this.getTodayString();
    
    // Check if it was marked as completed or missed
    if (habit.completed_today === 'missed') {
      habit.completed_today = false;
      if (habit.missed_history) {
        habit.missed_history = habit.missed_history.filter(d => d !== today);
      }
      this.save();
      return { success: true };
    }

    // It was completed, proceed with rollback
    habit.completed_today = false;
    if (habit.history) {
      habit.history = habit.history.filter(d => d !== today);
    }
    
    // Rollback habit streak
    if (habit.streak && habit.streak > 0) {
      habit.streak -= 1;
    }

    const xpReward = this.getXpReward(habit.difficulty);

    // Rollback Player XP
    this.state.player.xp -= xpReward;
    if (this.state.player.xp < 0) {
      if (this.state.player.level > 1) {
        this.state.player.level -= 1;
        this.state.player.xp += this.getXpForLevel(this.state.player.level);
      } else {
        this.state.player.xp = 0;
      }
    }

    // Rollback player overall streak
    if (this.state.history[today]) {
      this.state.history[today].count = Math.max(0, this.state.history[today].count - 1);
      this.state.history[today].xp = Math.max(0, this.state.history[today].xp - xpReward);
      
      if (this.state.history[today].count === 0) {
        delete this.state.history[today];
        
        // Revert daily player momentum streak since today has 0 completions now
        this.state.player.streak = Math.max(0, this.state.player.streak - 1);
        const remainingDates = Object.keys(this.state.history).filter(d => d !== today);
        if (remainingDates.length > 0) {
          remainingDates.sort();
          this.state.player.last_completion_date = remainingDates[remainingDates.length - 1];
        } else {
          this.state.player.last_completion_date = null;
        }
      }
    }

    // Rollback linked attribute
    const categoryAttrMap = {
      'Fitness': 'attr_fitness',
      'Knowledge': 'attr_knowledge',
      'Wealth': 'attr_wealth',
      'Creativity': 'attr_creativity'
    };
    const attrId = categoryAttrMap[habit.category];
    const attribute = this.state.attributes.find(a => a.id === attrId);
    if (attribute) {
      attribute.xp -= xpReward;
      if (attribute.xp < 0) {
        if (attribute.level > 1) {
          attribute.level -= 1;
          attribute.xp += this.getXpForAttributeLevel(attribute.level);
        } else {
          attribute.xp = 0;
        }
      }
    }

    // Rollback linked outcome entry if any
    if (habit.linkedOutcomeId) {
      const outcome = this.state.outcomes.find(o => o.id === habit.linkedOutcomeId);
      if (outcome && outcome.history) {
        outcome.history = outcome.history.filter(h => h.date !== today);
      }
    }

    this.state.player.total_completed = Math.max(0, this.state.player.total_completed - 1);
    this.save();
    return { success: true };
  }

  // Mark habit as missed
  missHabit(habitId) {
    const habit = this.state.habits.find(h => h.id === habitId);
    if (!habit || habit.completed_today) return null;

    const today = this.getTodayString();
    habit.completed_today = 'missed';
    
    if (!habit.missed_history) habit.missed_history = [];
    if (!habit.missed_history.includes(today)) {
      habit.missed_history.push(today);
    }

    // Habit streak breaks on a miss
    habit.streak = 0;
    
    this.save();
    return habit;
  }

  // Custom Primary Mission update
  updatePrimaryMission(text) {
    this.state.primary_mission = text || "Build the person you want to become";
    this.save();
  }

  // Custom Daily reflections
  addDailyReflection(mood, notes) {
    if (!this.state.daily_reflections) this.state.daily_reflections = [];
    const today = this.getTodayString();
    
    this.state.daily_reflections = this.state.daily_reflections.filter(r => r.date !== today);
    this.state.daily_reflections.push({
      date: today,
      timestamp: new Date().toISOString(),
      mood,
      notes
    });
    this.save();
  }

  // Consistency score calculator
  getConsistencyScore(days = 30) {
    const lastNDays = [];
    for (let i = 0; i < days; i++) {
      lastNDays.push(this.getDateStringOffset(i));
    }
    
    let completedCount = 0;
    let missedCount = 0;
    
    this.state.habits.forEach(h => {
      if (h.history) {
        completedCount += h.history.filter(d => lastNDays.includes(d)).length;
      }
      if (h.missed_history) {
        missedCount += h.missed_history.filter(d => lastNDays.includes(d)).length;
      }
    });
    
    const total = completedCount + missedCount;
    if (total === 0) return 100;
    return Math.round((completedCount / total) * 100);
  }
}

// Global Single Instance
window.LifeRPGStore = new StorageEngine();
