/**
 * LifeRPG Outcomes & Metrics Page Controller
 */

class OutcomesPageEngine {
  constructor() {
    this.store = window.LifeRPGStore;
    this.misc = window.LifeRPGMisc;

    // Metric Modal Elements
    this.metricModal = document.getElementById('outcome-modal-overlay');
    this.btnCreate = document.getElementById('btn-create-outcome');
    this.btnClose = document.getElementById('btn-close-modal');
    this.btnCancel = document.getElementById('btn-cancel-modal');
    this.btnSave = document.getElementById('btn-save-outcome');
    this.inputName = document.getElementById('outcome-name');
    this.inputUnit = document.getElementById('outcome-unit');
    this.inputTarget = document.getElementById('outcome-target');

    // Entry Log Modal Elements
    this.logModal = document.getElementById('log-modal-overlay');
    this.btnCloseLog = document.getElementById('btn-close-log-modal');
    this.btnCancelLog = document.getElementById('btn-cancel-log-modal');
    this.btnSaveLog = document.getElementById('btn-save-log');
    this.inputLogId = document.getElementById('log-outcome-id');
    this.inputLogVal = document.getElementById('log-value');
    this.inputLogDate = document.getElementById('log-date');
    this.logUnitLabel = document.getElementById('log-unit-label');

    this.container = document.getElementById('outcomes-container');
  }

  init() {
    this.registerEvents();
    this.render();
  }

  registerEvents() {
    // Open create metric modal
    this.btnCreate.addEventListener('click', () => this.openMetricModal());
    this.btnClose.addEventListener('click', () => this.closeMetricModal());
    this.btnCancel.addEventListener('click', () => this.closeMetricModal());
    this.btnSave.addEventListener('click', () => this.handleSaveMetric());

    // Close log modals
    this.btnCloseLog.addEventListener('click', () => this.closeLogModal());
    this.btnCancelLog.addEventListener('click', () => this.closeLogModal());
    this.btnSaveLog.addEventListener('click', () => this.handleSaveLog());

    // Click on overlay to close
    this.metricModal.addEventListener('click', (e) => {
      if (e.target === this.metricModal) this.closeMetricModal();
    });
    this.logModal.addEventListener('click', (e) => {
      if (e.target === this.logModal) this.closeLogModal();
    });
  }

  render() {
    const outcomes = this.store.state.outcomes || [];
    this.container.innerHTML = '';

    if (outcomes.length === 0) {
      this.container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 5rem; color: var(--text-muted); border: 1px dashed var(--border-color); border-radius: 16px;">
          <p style="font-size: 1.15rem; margin-bottom: 1rem;">No outcome metrics tracked yet.</p>
          <button class="btn btn-secondary" onclick="document.getElementById('btn-create-outcome').click()">Track Your First Metric</button>
        </div>
      `;
      return;
    }

    outcomes.forEach(out => {
      const card = document.createElement('div');
      card.className = 'card outcome-card';
      
      const latestVal = out.history.length > 0 ? out.history[out.history.length - 1].value : null;
      const latestValStr = latestVal !== null ? `${latestVal} ${out.unit}` : 'No values logged';
      
      // Progress bar if target value is specified
      let progressBarHtml = '';
      if (out.targetValue && latestVal !== null) {
        // Calculate progress percentage. Bound between 0 and 100
        let progressPct = 0;
        if (out.targetValue > 0) {
          progressPct = Math.min(100, Math.max(0, Math.round((latestVal / out.targetValue) * 100)));
        } else {
          progressPct = 0;
        }

        progressBarHtml = `
          <div class="outcome-progress-block">
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">
              <span>Target Progress</span>
              <span>${progressPct}% (Goal: ${out.targetValue} ${out.unit})</span>
            </div>
            <div class="progress-bar-outer" style="height: 6px; border-radius: 3px;">
              <div class="progress-bar-inner" style="width: ${progressPct}%; background: var(--color-primary); height: 100%; border-radius: 3px; box-shadow: 0 0 8px rgba(99,102,241,0.5);"></div>
            </div>
          </div>
        `;
      } else if (out.targetValue) {
        progressBarHtml = `
          <div class="outcome-progress-block">
            <div style="font-size: 0.75rem; color: var(--text-secondary);">
              Goal: ${out.targetValue} ${out.unit} (No values logged yet)
            </div>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="outcome-card-header">
          <div>
            <h3 class="outcome-title">${out.name}</h3>
            <span class="outcome-latest-val" style="font-size: 1.25rem; font-weight: 800; color: var(--color-accent); display: block; margin-top: 4px;">${latestValStr}</span>
          </div>
          <div class="outcome-options">
            <button class="btn btn-secondary btn-log-val" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;" data-id="${out.id}" data-unit="${out.unit}">Log Entry</button>
            <button class="btn btn-delete btn-icon" style="padding: 0.35rem; color: #EF4444; border-color: rgba(239, 68, 68, 0.1);" data-id="${out.id}">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        ${progressBarHtml}

        <!-- Trend Chart -->
        <div class="outcome-chart-box" id="chart-${out.id}">
          <!-- Chart dynamic canvas -->
        </div>

        <!-- Recent logs scroll list -->
        <div class="outcome-recent-logs" style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
          <h4 style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">Recent Logs</h4>
          <div class="logs-scroll-container" style="max-height: 100px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;">
            ${out.history.length === 0 ? 
              `<span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">No logs recorded.</span>` :
              [...out.history].reverse().slice(0, 10).map(h => `
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); background: rgba(255,255,255,0.01); padding: 4px 8px; border-radius: 4px;">
                  <span>${new Date(h.date).toLocaleDateString()}</span>
                  <strong>${h.value} ${out.unit}</strong>
                </div>
              `).join('')
            }
          </div>
        </div>
      `;

      // Complete click log entry
      card.querySelector('.btn-log-val').addEventListener('click', () => {
        this.openLogModal(out.id, out.unit);
      });

      // Delete metric click
      card.querySelector('.btn-delete').addEventListener('click', () => {
        if (confirm(`Delete the outcome metric "${out.name}"? This deletes all logged history for it.`)) {
          this.store.deleteOutcomeMetric(out.id);
          this.render();
          this.misc.showToast('Metric deleted.', 'info');
        }
      });

      this.container.appendChild(card);

      // Render chart
      this.renderTrendChart(`chart-${out.id}`, out);
    });
  }

  renderTrendChart(containerId, outcome) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const history = outcome.history || [];
    const unit = outcome.unit || '';

    if (history.length < 2) {
      container.innerHTML = `
        <div style="height: 100px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.75rem; font-style: italic; border: 1px dashed rgba(255,255,255,0.03); border-radius: 8px;">
          Add at least 2 entries to display trend chart.
        </div>
      `;
      return;
    }

    const width = container.clientWidth || 360;
    const height = 130;
    const paddingLeft = 40;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 25;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Get min/max values
    const values = history.map(h => h.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal === 0 ? 10 : (maxVal - minVal);
    
    // Pad range slightly so lines don't touch top/bottom edges
    const yMin = minVal - range * 0.15;
    const yMax = maxVal + range * 0.15;
    const yRange = yMax - yMin;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const id = 'grad_' + Math.floor(Math.random() * 100000);
    svg.innerHTML = `
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
    `;

    // Draw grid lines (horizontal)
    const gridRows = 3;
    for (let i = 0; i <= gridRows; i++) {
      const y = paddingTop + (i * chartHeight) / gridRows;
      const val = yMax - (i * yRange) / gridRows;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', paddingLeft);
      line.setAttribute('y1', y);
      line.setAttribute('x2', width - paddingRight);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', 'rgba(255,255,255,0.05)');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', paddingLeft - 8);
      label.setAttribute('y', y + 3);
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('fill', 'var(--text-muted)');
      label.setAttribute('font-size', '0.65rem');
      label.textContent = val.toFixed(1);
      svg.appendChild(label);
    }

    // Map history to points
    const stepX = chartWidth / (history.length - 1);
    const points = history.map((entry, idx) => {
      const cx = paddingLeft + idx * stepX;
      const cy = height - paddingBottom - ((entry.value - yMin) / yRange) * chartHeight;
      return { cx, cy, date: entry.date, value: entry.value };
    });

    // Build paths
    let linePath = `M ${points[0].cx} ${points[0].cy} `;
    let areaPath = `M ${points[0].cx} ${height - paddingBottom} L ${points[0].cx} ${points[0].cy} `;

    for (let i = 1; i < points.length; i++) {
      linePath += `L ${points[i].cx} ${points[i].cy} `;
      areaPath += `L ${points[i].cx} ${points[i].cy} `;
    }
    areaPath += `L ${points[points.length - 1].cx} ${height - paddingBottom} Z`;

    // Append area path
    const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    area.setAttribute('d', areaPath);
    area.setAttribute('fill', `url(#${id})`);
    svg.appendChild(area);

    // Append line path
    const lineNode = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    lineNode.setAttribute('d', linePath);
    lineNode.setAttribute('fill', 'none');
    lineNode.setAttribute('stroke', 'var(--color-primary)');
    lineNode.setAttribute('stroke-width', '2');
    svg.appendChild(lineNode);

    // Append points
    points.forEach((p, idx) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', p.cx);
      circle.setAttribute('cy', p.cy);
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', 'var(--bg-base)');
      circle.setAttribute('stroke', 'var(--color-primary)');
      circle.setAttribute('stroke-width', '2');
      circle.style.cursor = 'pointer';

      circle.addEventListener('mouseover', (e) => {
        circle.setAttribute('r', '6');
        
        let tooltip = document.getElementById('chart-tooltip');
        if (!tooltip) {
          tooltip = document.createElement('div');
          tooltip.id = 'chart-tooltip';
          tooltip.className = 'chart-tooltip';
          document.body.appendChild(tooltip);
        }

        const readableDate = new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        
        // Calculate Delta
        let deltaHtml = '';
        if (idx > 0) {
          const prevVal = points[idx - 1].value;
          const delta = p.value - prevVal;
          const deltaStr = delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
          const deltaColor = delta >= 0 ? 'var(--color-secondary)' : '#EF4444';
          deltaHtml = `
            <div style="display: flex; justify-content: space-between; gap: 12px; font-size: 0.7rem; margin-top: 2px;">
              <span>Change:</span>
              <strong style="color: ${deltaColor}">${deltaStr} ${unit}</strong>
            </div>
          `;
        }

        // Calculate Goal Progress
        let goalHtml = '';
        if (outcome.targetValue) {
          const progressPct = outcome.targetValue > 0 ? Math.round((p.value / outcome.targetValue) * 100) : 0;
          goalHtml = `
            <div style="display: flex; justify-content: space-between; gap: 12px; font-size: 0.7rem; margin-top: 4px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 4px;">
              <span>Goal Progress:</span>
              <strong>${progressPct}%</strong>
            </div>
          `;
        }

        tooltip.innerHTML = `
          <div style="font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 4px; font-family: var(--font-display); font-size: 0.75rem;">
            ${readableDate}
          </div>
          <div style="display: flex; justify-content: space-between; gap: 12px; font-size: 0.7rem;">
            <span>Value:</span>
            <strong>${p.value} ${unit}</strong>
          </div>
          ${deltaHtml}
          ${goalHtml}
        `;

        const rect = circle.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
        tooltip.style.top = `${rect.top + window.scrollY}px`;
        tooltip.style.display = 'block';
        tooltip.style.opacity = '1';
      });

      circle.addEventListener('mouseout', () => {
        circle.setAttribute('r', '4');
        const tooltip = document.getElementById('chart-tooltip');
        if (tooltip) {
          tooltip.style.display = 'none';
          tooltip.style.opacity = '0';
        }
      });

      svg.appendChild(circle);

      // Label first and last date
      if (idx === 0 || idx === points.length - 1) {
        const dateObj = new Date(p.date);
        const dateLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        dateLabel.setAttribute('x', p.cx);
        dateLabel.setAttribute('y', height - 8);
        dateLabel.setAttribute('text-anchor', idx === 0 ? 'start' : 'end');
        dateLabel.setAttribute('fill', 'var(--text-muted)');
        dateLabel.setAttribute('font-size', '0.65rem');
        dateLabel.textContent = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        svg.appendChild(dateLabel);
      }
    });

    container.appendChild(svg);
  }

  // Create Metric Modal Handlers
  openMetricModal() {
    this.metricModal.classList.add('active');
    this.inputName.value = '';
    this.inputUnit.value = '';
    this.inputTarget.value = '';
    this.inputName.focus();
  }

  closeMetricModal() {
    this.metricModal.classList.remove('active');
  }

  handleSaveMetric() {
    const name = this.inputName.value.trim();
    const unit = this.inputUnit.value.trim();
    const target = this.inputTarget.value.trim();

    if (!name || !unit) {
      alert('Please enter a metric name and measurement unit.');
      return;
    }

    this.store.addOutcomeMetric(name, unit, target);
    this.closeMetricModal();
    this.render();
    this.misc.showToast(`Metric "${name}" created!`, 'success');
  }

  // Log Modal Handlers
  openLogModal(outcomeId, unit) {
    this.logModal.classList.add('active');
    this.inputLogId.value = outcomeId;
    this.logUnitLabel.textContent = unit;
    this.inputLogVal.value = '';
    
    // Default log date to today
    const today = new Date();
    this.inputLogDate.value = today.toISOString().split('T')[0];
    this.inputLogVal.focus();
  }

  closeLogModal() {
    this.logModal.classList.remove('active');
  }

  handleSaveLog() {
    const id = this.inputLogId.value;
    const valStr = this.inputLogVal.value.trim();
    const date = this.inputLogDate.value;

    if (!valStr || !date) {
      alert('Please fill out all logging inputs.');
      return;
    }

    const value = parseFloat(valStr);
    if (isNaN(value)) {
      alert('Please input a valid numeric entry value.');
      return;
    }

    const result = this.store.logOutcomeValue(id, value, date);
    if (result) {
      this.closeLogModal();
      this.render();
      
      this.misc.playRewardChime();
      this.misc.showToast(`Value logged: ${value} ${result.unit}`, 'success');
    }
  }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
  if (!window.location.pathname.includes('/pages/outcomes.html')) return;
  const engine = new OutcomesPageEngine();
  engine.init();
});
