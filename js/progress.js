/**
 * LifeRPG Progress & Analytics Engine
 * Generates dynamic SVG line/bar/heatmap charts with time-filtering and attribute analysis.
 */

class ProgressEngine {
  constructor() {
    this.store = window.LifeRPGStore;
    this.misc = window.LifeRPGMisc;
    this.tooltip = document.getElementById('chart-tooltip-element');
    this.activeRange = 7; // Default 7 days
    this.showAllDiagnostics = false;
  }

  init() {
    this.ensureSampleData();
    this.setupEvents();
    this.renderAll();
  }

  // Generate realistic historical data for the last 45 days if history is empty
  ensureSampleData() {
    const state = this.store.state;
    if (Object.keys(state.history).length > 0) return;

    console.log('Generating realistic sample history for prototype display...');
    
    const difficulties = ['Easy', 'Medium', 'Hard'];
    const categories = ['Fitness', 'Knowledge', 'Wealth', 'Creativity'];
    
    // Generate 45 days of completions
    for (let i = 45; i >= 0; i--) {
      // 75% chance of activity
      if (Math.random() > 0.25) {
        const dateStr = this.getDateStringOffset(i);
        const count = Math.floor(Math.random() * 3) + 1; // 1 to 3 completions
        let dailyXP = 0;
        
        for (let c = 0; c < count; c++) {
          const diff = difficulties[Math.floor(Math.random() * difficulties.length)];
          dailyXP += this.store.getXpReward(diff);
        }

        state.history[dateStr] = {
          count: count,
          xp: dailyXP
        };

        // Also add completions inside habit histories for diagnostic accuracy
        state.habits.forEach(h => {
          if (Math.random() > 0.4) {
            if (!h.history) h.history = [];
            h.history.push(dateStr);
            h.streak = Math.floor(Math.random() * 5) + 1;
          } else {
            if (!h.missed_history) h.missed_history = [];
            h.missed_history.push(dateStr);
          }
        });
      }
    }

    state.player.streak = 5;
    state.player.longest_streak = 14;
    state.player.xp = 3240 % this.store.getXpForLevel(12);
    state.player.level = 12;
    state.player.total_completed = 86;

    this.store.save(state);
  }

  getDateStringOffset(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  setupEvents() {
    // 1. Time filter tabs
    const tabBtns = document.querySelectorAll('.filter-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeRange = parseInt(btn.getAttribute('data-range'), 10);
        this.renderAll();
      });
    });

    // 2. Consistency Info icon triggers
    const infoIcon = document.getElementById('btn-consistency-info');
    const infoModal = document.getElementById('consistency-info-modal');
    const closeInfoModal = document.getElementById('btn-close-consistency-modal');

    if (infoIcon && infoModal) {
      infoIcon.addEventListener('click', () => {
        infoModal.classList.add('active');
      });
    }
    if (closeInfoModal && infoModal) {
      closeInfoModal.addEventListener('click', () => {
        infoModal.classList.remove('active');
      });
    }

    // 3. Diagnostics View All Toggle
    const toggleDiag = document.getElementById('btn-toggle-diagnostics');
    if (toggleDiag) {
      toggleDiag.style.display = 'block';
      toggleDiag.addEventListener('click', () => {
        this.showAllDiagnostics = !this.showAllDiagnostics;
        toggleDiag.textContent = this.showAllDiagnostics ? 'Show Top 3' : 'View All';
        this.renderDiagnostics();
      });
    }
  }

  renderAll() {
    this.renderStats();
    this.renderHeatmap();
    this.renderXPLineChart();
    this.renderQuestsBarChart();
    this.renderDiagnostics();
  }

  renderStats() {
    const state = this.store.state;
    
    // Total GP Earned
    let cumulativeGP = 0;
    for (let l = 1; l < state.player.level; l++) {
      cumulativeGP += this.store.getXpForLevel(l);
    }
    cumulativeGP += state.player.xp;
    document.getElementById('stat-total-xp').textContent = cumulativeGP.toLocaleString();
    
    // Streaks
    document.getElementById('stat-current-streak').textContent = `${state.player.streak} Day${state.player.streak !== 1 ? 's' : ''}`;
    document.getElementById('stat-longest-streak').textContent = `${state.player.longest_streak} Day${state.player.longest_streak !== 1 ? 's' : ''}`;
    
    // Consistency Score
    const score = this.store.getConsistencyScore(this.activeRange);
    document.getElementById('stat-consistency').textContent = `${score}%`;
  }

  // Draw 53-week GitHub style contribution heatmap in SVG with Month/Year labels
  renderHeatmap() {
    const svg = document.getElementById('heatmap-svg-root');
    if (!svg) return;

    const state = this.store.state;
    svg.innerHTML = ''; 

    const cellWidth = 11;
    const gap = 3;
    const padding = 20; // Extra padding for month labels at the top
    
    svg.setAttribute('viewBox', '0 0 800 135');

    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 365); // 365 days ago
    
    const startDayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    let totalActivities = 0;
    let lastMonth = -1;

    for (let week = 0; week < 53; week++) {
      const colDate = new Date(startDate.getTime());
      colDate.setDate(startDate.getDate() + (week * 7));
      
      // Render Month Labels when it changes
      const currentMonth = colDate.getMonth();
      if (currentMonth !== lastMonth) {
        lastMonth = currentMonth;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', padding + week * (cellWidth + gap));
        text.setAttribute('y', 12);
        text.setAttribute('fill', 'var(--text-muted)');
        text.setAttribute('font-size', '0.65rem');
        text.setAttribute('font-weight', '600');
        text.textContent = colDate.toLocaleDateString(undefined, { month: 'short' });
        svg.appendChild(text);
      }

      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate.getTime());
        currentDate.setDate(startDate.getDate() + (week * 7) + day);
        
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        const dayData = state.history[dateStr] || { count: 0, xp: 0 };
        totalActivities += dayData.count;

        let fill = 'rgba(255, 255, 255, 0.02)';
        if (dayData.count === 1) fill = 'rgba(99, 102, 241, 0.25)';
        else if (dayData.count === 2) fill = 'rgba(99, 102, 241, 0.50)';
        else if (dayData.count === 3) fill = 'rgba(99, 102, 241, 0.75)';
        else if (dayData.count >= 4) fill = 'rgba(99, 102, 241, 1)';

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', padding + week * (cellWidth + gap));
        rect.setAttribute('y', padding + day * (cellWidth + gap));
        rect.setAttribute('width', cellWidth);
        rect.setAttribute('height', cellWidth);
        rect.setAttribute('rx', 2);
        rect.setAttribute('fill', fill);
        rect.style.cursor = 'pointer';

        const todayStr = this.getDateStringOffset(0);
        if (dateStr === todayStr) {
          rect.setAttribute('stroke', 'var(--color-accent)');
          rect.setAttribute('stroke-width', '1');
        }

        rect.addEventListener('mouseover', (e) => {
          const readableDate = currentDate.toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'});
          this.showTooltip(e, `<strong>${dayData.count} quest${dayData.count !== 1 ? 's' : ''} completed</strong><br><span style="color:var(--text-secondary);">${readableDate}</span>`);
        });

        rect.addEventListener('mouseout', () => this.hideTooltip());

        svg.appendChild(rect);
      }
    }

    document.getElementById('heatmap-total-label').textContent = `${totalActivities} quests completed in the last year`;
  }

  // Draw Time-Filtered GP Growth Line Chart
  renderXPLineChart() {
    const container = document.getElementById('xp-chart-container');
    if (!container) return;
    container.innerHTML = '';

    const state = this.store.state;
    const rawData = [];

    // 1. Gather all raw daily data for the filter range
    for (let i = this.activeRange - 1; i >= 0; i--) {
      const dateStr = this.getDateStringOffset(i);
      const dayData = state.history[dateStr] || { count: 0, xp: 0 };
      rawData.push({ dateStr, xp: dayData.xp });
    }

    // 2. Group data if range is large to prevent crowding
    let chartData = [];
    if (this.activeRange === 90) {
      // Group into 13 weeks
      for (let w = 0; w < 13; w++) {
        const slice = rawData.slice(w * 7, (w + 1) * 7);
        const sumXP = slice.reduce((sum, d) => sum + d.xp, 0);
        chartData.push({ label: `W${w+1}`, xp: sumXP });
      }
      document.getElementById('growth-chart-title').textContent = 'GP Gains (Weekly View - Last 90 Days)';
    } else if (this.activeRange === 365) {
      // Group into 12 months
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const monthlySums = Array(12).fill(0);
      
      rawData.forEach(d => {
        const m = new Date(d.dateStr).getMonth();
        monthlySums[m] += d.xp;
      });

      // Shift months so today's month is at the end
      const currentMonth = new Date().getMonth();
      for (let i = 11; i >= 0; i--) {
        const mIndex = (currentMonth - i + 12) % 12;
        chartData.push({ label: months[mIndex], xp: monthlySums[mIndex] });
      }
      document.getElementById('growth-chart-title').textContent = 'GP Gains (Monthly View - Last Year)';
    } else {
      // 7D or 30D (Daily points)
      rawData.forEach(d => {
        const label = this.activeRange === 7 
          ? new Date(d.dateStr).toLocaleDateString(undefined, { weekday: 'short' })
          : new Date(d.dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        chartData.push({ label, xp: d.xp });
      });
      document.getElementById('growth-chart-title').textContent = `GP Gains (Last ${this.activeRange} Days)`;
    }

    const width = container.clientWidth || 360;
    const height = 200;
    const paddingLeft = 45;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxVal = Math.max(...chartData.map(d => d.xp), 150);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const id = 'grad_' + Math.floor(Math.random() * 100000);
    svg.innerHTML = `
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
    `;

    // Horizontal Grid Lines
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
      const yVal = paddingTop + (i * chartHeight) / gridCount;
      const labelVal = Math.round(maxVal - (i * maxVal) / gridCount);
      
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', paddingLeft);
      line.setAttribute('y1', yVal);
      line.setAttribute('x2', width - paddingRight);
      line.setAttribute('y2', yVal);
      line.setAttribute('stroke', 'rgba(255,255,255,0.05)');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', paddingLeft - 8);
      text.setAttribute('y', yVal + 4);
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('fill', 'var(--text-muted)');
      text.setAttribute('font-size', '0.65rem');
      text.textContent = labelVal;
      svg.appendChild(text);
    }

    // Points & Paths
    let pathD = '';
    let areaD = `M ${paddingLeft} ${height - paddingBottom} `;
    const points = [];
    const stepX = chartWidth / (chartData.length - 1 || 1);

    chartData.forEach((d, idx) => {
      const cx = paddingLeft + (idx * stepX);
      const cy = height - paddingBottom - (d.xp / maxVal) * chartHeight;
      points.push({ cx, cy, xp: d.xp, label: d.label });

      if (idx === 0) {
        pathD += `M ${cx} ${cy} `;
      } else {
        pathD += `L ${cx} ${cy} `;
      }
      areaD += `L ${cx} ${cy} `;
    });
    areaD += `L ${paddingLeft + chartWidth} ${height - paddingBottom} Z`;

    // Area Fill
    const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    areaPath.setAttribute('d', areaD);
    areaPath.setAttribute('fill', `url(#${id})`);
    svg.appendChild(areaPath);

    // Line Path
    const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    linePath.setAttribute('d', pathD);
    linePath.setAttribute('fill', 'none');
    linePath.setAttribute('stroke', 'var(--color-primary)');
    linePath.setAttribute('stroke-width', '2');
    svg.appendChild(linePath);

    // Draw Points and interactive larger hover hit area (vibration fix)
    const showDots = chartData.length <= 31;
    points.forEach((p, idx) => {
      if (showDots) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', p.cx);
        circle.setAttribute('cy', p.cy);
        circle.setAttribute('r', 4);
        circle.setAttribute('fill', 'var(--bg-base)');
        circle.setAttribute('stroke', 'var(--color-primary)');
        circle.setAttribute('stroke-width', '2');
        svg.appendChild(circle);

        // Invisible Hover hit zone
        const hoverArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hoverArea.setAttribute('cx', p.cx);
        hoverArea.setAttribute('cy', p.cy);
        hoverArea.setAttribute('r', 12);
        hoverArea.setAttribute('fill', 'transparent');
        hoverArea.style.cursor = 'pointer';

        hoverArea.addEventListener('mouseover', (e) => {
          circle.setAttribute('r', 6);
          this.showTooltip(e, `<strong>+${p.xp} GP</strong><br><span style="color:var(--text-secondary);">${p.label}</span>`);
        });
        hoverArea.addEventListener('mouseout', () => {
          circle.setAttribute('r', 4);
          this.hideTooltip();
        });
        svg.appendChild(hoverArea);
      }

      // X Labels
      const shouldDrawLabel = this.activeRange <= 7 || idx % Math.round(chartData.length / 5 || 1) === 0 || idx === chartData.length - 1;
      if (shouldDrawLabel) {
        const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xLabel.setAttribute('x', p.cx);
        xLabel.setAttribute('y', height - 8);
        xLabel.setAttribute('text-anchor', 'middle');
        xLabel.setAttribute('fill', 'var(--text-muted)');
        xLabel.setAttribute('font-size', '0.65rem');
        xLabel.textContent = p.label;
        svg.appendChild(xLabel);
      }
    });

    container.appendChild(svg);
  }

  // Draw Stacked Bar completions (Habits vs One-Time Tasks)
  renderQuestsBarChart() {
    const container = document.getElementById('quests-chart-container');
    if (!container) return;
    container.innerHTML = '';

    const state = this.store.state;
    const rawData = [];

    // Gather Daily data
    for (let i = this.activeRange - 1; i >= 0; i--) {
      const dateStr = this.getDateStringOffset(i);
      const dayData = state.history[dateStr] || { count: 0, xp: 0 };
      
      // Calculate split count: completed habits vs completed tasks
      let habitCompletions = 0;
      let taskCompletions = 0;

      state.habits.forEach(h => {
        if (h.history && h.history.includes(dateStr)) {
          if ((h.frequency || '').toLowerCase() === 'one-time') {
            taskCompletions++;
          } else {
            habitCompletions++;
          }
        }
      });

      // Fallback if no specific habit histories were logged, distribute counts
      if (habitCompletions === 0 && taskCompletions === 0 && dayData.count > 0) {
        habitCompletions = dayData.count;
      }

      rawData.push({ dateStr, habits: habitCompletions, tasks: taskCompletions, count: dayData.count });
    }

    // Grouping
    let chartData = [];
    if (this.activeRange === 90) {
      for (let w = 0; w < 13; w++) {
        const slice = rawData.slice(w * 7, (w + 1) * 7);
        const sumHabits = slice.reduce((sum, d) => sum + d.habits, 0);
        const sumTasks = slice.reduce((sum, d) => sum + d.tasks, 0);
        chartData.push({ label: `W${w+1}`, habits: sumHabits, tasks: sumTasks, count: sumHabits + sumTasks });
      }
      document.getElementById('quests-chart-title').textContent = 'Quests Completed (Weekly View - Last 90 Days)';
    } else if (this.activeRange === 365) {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const habitsMonthly = Array(12).fill(0);
      const tasksMonthly = Array(12).fill(0);
      
      rawData.forEach(d => {
        const m = new Date(d.dateStr).getMonth();
        habitsMonthly[m] += d.habits;
        tasksMonthly[m] += d.tasks;
      });

      const currentMonth = new Date().getMonth();
      for (let i = 11; i >= 0; i--) {
        const mIndex = (currentMonth - i + 12) % 12;
        chartData.push({ 
          label: months[mIndex], 
          habits: habitsMonthly[mIndex], 
          tasks: tasksMonthly[mIndex],
          count: habitsMonthly[mIndex] + tasksMonthly[mIndex] 
        });
      }
      document.getElementById('quests-chart-title').textContent = 'Quests Completed (Monthly View - Last Year)';
    } else {
      rawData.forEach(d => {
        const label = this.activeRange === 7 
          ? new Date(d.dateStr).toLocaleDateString(undefined, { weekday: 'short' })
          : new Date(d.dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        chartData.push({ label, habits: d.habits, tasks: d.tasks, count: d.count });
      });
      document.getElementById('quests-chart-title').textContent = `Quests Completed (Last ${this.activeRange} Days)`;
    }

    const width = container.clientWidth || 360;
    const height = 200;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxVal = Math.max(...chartData.map(d => d.count), 4);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    // Y Axis Grid lines
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
      const yVal = paddingTop + (i * chartHeight) / gridCount;
      const labelVal = Math.round(maxVal - (i * maxVal) / gridCount);
      
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', paddingLeft);
      line.setAttribute('y1', yVal);
      line.setAttribute('x2', width - paddingRight);
      line.setAttribute('y2', yVal);
      line.setAttribute('stroke', 'rgba(255,255,255,0.05)');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', paddingLeft - 8);
      text.setAttribute('y', yVal + 4);
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('fill', 'var(--text-muted)');
      text.setAttribute('font-size', '0.65rem');
      text.textContent = labelVal;
      svg.appendChild(text);
    }

    // Stacked Bars
    const barWidth = Math.max(4, Math.min(24, (chartWidth / chartData.length) - 8));
    const stepX = chartWidth / chartData.length;

    chartData.forEach((d, idx) => {
      const habitsHeight = (d.habits / maxVal) * chartHeight;
      const tasksHeight = (d.tasks / maxVal) * chartHeight;
      
      const x = paddingLeft + (idx * stepX) + (stepX - barWidth) / 2;

      // Draw habits bar (Bottom)
      let currentY = height - paddingBottom;
      if (d.habits > 0) {
        const habitsRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        habitsRect.setAttribute('x', x);
        habitsRect.setAttribute('y', currentY - habitsHeight);
        habitsRect.setAttribute('width', barWidth);
        habitsRect.setAttribute('height', habitsHeight);
        habitsRect.setAttribute('fill', 'var(--color-primary)');
        habitsRect.setAttribute('rx', 2);
        habitsRect.style.cursor = 'pointer';
        svg.appendChild(habitsRect);
        
        currentY -= habitsHeight;
      }

      // Draw tasks bar (Stacked on top)
      if (d.tasks > 0) {
        const tasksRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        tasksRect.setAttribute('x', x);
        tasksRect.setAttribute('y', currentY - tasksHeight);
        tasksRect.setAttribute('width', barWidth);
        tasksRect.setAttribute('height', tasksHeight);
        tasksRect.setAttribute('fill', 'var(--color-accent)');
        tasksRect.setAttribute('rx', 2);
        tasksRect.style.cursor = 'pointer';
        svg.appendChild(tasksRect);
      }

      // Invisible Hover hit zone for tooltips
      const totalBarHeight = habitsHeight + tasksHeight;
      const hitRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      hitRect.setAttribute('x', x);
      hitRect.setAttribute('y', height - paddingBottom - Math.max(totalBarHeight, 15));
      hitRect.setAttribute('width', barWidth);
      hitRect.setAttribute('height', Math.max(totalBarHeight, 15));
      hitRect.setAttribute('fill', 'transparent');
      hitRect.style.cursor = 'pointer';

      hitRect.addEventListener('mouseover', (e) => {
        this.showTooltip(e, `<strong>${d.count} Completed</strong><br><span style="color:var(--text-secondary);">${d.habits} Habits • ${d.tasks} Tasks</span><br><span style="color:var(--text-muted); font-size: 0.65rem;">${d.label}</span>`);
      });
      hitRect.addEventListener('mouseout', () => this.hideTooltip());
      svg.appendChild(hitRect);

      // Label
      const shouldDrawLabel = this.activeRange <= 7 || idx % Math.round(chartData.length / 5 || 1) === 0 || idx === chartData.length - 1;
      if (shouldDrawLabel) {
        const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xLabel.setAttribute('x', paddingLeft + (idx * stepX) + stepX / 2);
        xLabel.setAttribute('y', height - 8);
        xLabel.setAttribute('text-anchor', 'middle');
        xLabel.setAttribute('fill', 'var(--text-muted)');
        xLabel.setAttribute('font-size', '0.65rem');
        xLabel.textContent = d.label;
        svg.appendChild(xLabel);
      }
    });

    container.appendChild(svg);
  }

  // Calculate diagnostic data and render diagnostic lists
  renderDiagnostics() {
    const container = document.getElementById('diagnostics-container');
    if (!container) return;
    container.innerHTML = '';

    const state = this.store.state;
    const activeDays = [];
    for (let i = 0; i < this.activeRange; i++) {
      activeDays.push(this.getDateStringOffset(i));
    }

    // 1. Calculate GP growth and completion count per attribute
    const attrMetrics = {};
    state.attributes.forEach(attr => {
      attrMetrics[attr.name] = {
        name: attr.name,
        color: attr.color,
        gpGained: 0,
        completedCount: 0,
        missedCount: 0
      };
    });

    state.habits.forEach(h => {
      if (attrMetrics[h.category]) {
        const completions = h.history ? h.history.filter(d => activeDays.includes(d)).length : 0;
        const misses = h.missed_history ? h.missed_history.filter(d => activeDays.includes(d)).length : 0;
        const xpGained = completions * this.store.getXpReward(h.difficulty);

        attrMetrics[h.category].gpGained += xpGained;
        attrMetrics[h.category].completedCount += completions;
        attrMetrics[h.category].missedCount += misses;
      }
    });

    // 2. Classify and sort attributes
    const attributesList = Object.values(attrMetrics);

    // Calculate rates
    attributesList.forEach(a => {
      const total = a.completedCount + a.missedCount;
      a.completionRate = total > 0 ? Math.round((a.completedCount / total) * 100) : 0;
      a.missedRate = total > 0 ? Math.round((a.missedCount / total) * 100) : 0;
    });

    // Sorting categories
    const sortedByGP = [...attributesList].sort((a, b) => b.gpGained - a.gpGained);
    const sortedByRate = [...attributesList].sort((a, b) => b.completionRate - a.completionRate);
    const sortedByMiss = [...attributesList].sort((a, b) => b.missedRate - a.missedRate);

    // Determine classifications
    const topGrowing = sortedByGP[0]?.gpGained > 0 ? sortedByGP[0].name : 'None';
    const topConsistent = sortedByRate[0]?.completedCount > 0 ? sortedByRate[0].name : 'None';
    
    // Needs attention: lowest growth or highest missed rate
    let needsAttention = 'None';
    const lowestGrowth = sortedByGP[sortedByGP.length - 1];
    if (lowestGrowth && lowestGrowth.gpGained === 0) {
      needsAttention = lowestGrowth.name;
    } else if (sortedByMiss[0] && sortedByMiss[0].missedCount > 0) {
      needsAttention = sortedByMiss[0].name;
    }

    // Show List Items (Top 3 default, toggleable to show all)
    const listItems = [
      { type: 'Top Growing', value: topGrowing, icon: '🚀', desc: `Gained the most Growth Points (+${attrMetrics[topGrowing]?.gpGained || 0} GP) this period.` },
      { type: 'Top Consistent', value: topConsistent, icon: '🎯', desc: `Highest completion rate (${attrMetrics[topConsistent]?.completionRate || 0}%) this period.` },
      { type: 'Needs Attention', value: needsAttention, icon: '⚠️', desc: needsAttention !== 'None' ? `Lowest progress or highest misses. Needs focus.` : 'Doing well in all focus areas!' }
    ];

    listItems.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.style.display = 'flex';
      itemEl.style.gap = '12px';
      itemEl.style.background = 'rgba(255,255,255,0.01)';
      itemEl.style.border = '1px solid var(--border-color)';
      itemEl.style.padding = '12px';
      itemEl.style.borderRadius = '8px';
      
      const themeColor = item.value !== 'None' ? (attrMetrics[item.value]?.color || 'var(--text-muted)') : 'var(--text-muted)';

      itemEl.innerHTML = `
        <div style="font-size: 1.5rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          ${item.icon}
        </div>
        <div>
          <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">${item.type}</div>
          <div style="font-size: 0.9rem; font-weight: 700; color: ${themeColor}">${item.value}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${item.desc}</div>
        </div>
      `;
      container.appendChild(itemEl);
    });

    // If "View All" is toggled, append general performance per focus area
    if (this.showAllDiagnostics) {
      const spacer = document.createElement('div');
      spacer.style.borderTop = '1px dashed var(--border-color)';
      spacer.style.margin = '8px 0';
      container.appendChild(spacer);

      attributesList.forEach(a => {
        const itemEl = document.createElement('div');
        itemEl.style.display = 'flex';
        itemEl.style.justifyContent = 'space-between';
        itemEl.style.alignItems = 'center';
        itemEl.style.background = 'rgba(255,255,255,0.01)';
        itemEl.style.padding = '8px 12px';
        itemEl.style.borderRadius = '8px';
        itemEl.style.border = '1px solid var(--border-color)';
        itemEl.style.borderLeft = `3px solid ${a.color}`;

        itemEl.innerHTML = `
          <div>
            <strong style="color: var(--text-primary); font-size: 0.85rem;">${a.name}</strong>
            <span style="display: block; font-size: 0.7rem; color: var(--text-muted);">Completions: ${a.completedCount} • Misses: ${a.missedCount}</span>
          </div>
          <div style="text-align: right;">
            <strong style="color: ${a.color}; font-size: 0.85rem;">+${a.gpGained} GP</strong>
            <span style="display: block; font-size: 0.7rem; color: var(--text-secondary); font-weight: 600;">CR: ${a.completionRate}%</span>
          </div>
        `;
        container.appendChild(itemEl);
      });
    }
  }

  showTooltip(event, htmlContent) {
    this.tooltip.innerHTML = htmlContent;
    this.tooltip.style.opacity = 1;
    this.tooltip.style.display = 'block';

    const rect = event.target.getBoundingClientRect();
    const tooltipWidth = this.tooltip.clientWidth;
    const tooltipHeight = this.tooltip.clientHeight;

    this.tooltip.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
    this.tooltip.style.top = `${rect.top + window.scrollY}px`;
  }

  hideTooltip() {
    this.tooltip.style.opacity = 0;
    this.tooltip.style.display = 'none';
  }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
  if (!window.location.pathname.includes('/pages/progress.html')) return;
  const engine = new ProgressEngine();
  engine.init();
});
