/**
 * LifeRPG Global Utilities and Shared Actions
 * Handles: Confetti engine, floating XP notifications, audio effects,
 * theme management, and push notification toasts.
 */

class LifeRPGMisc {
  constructor() {
    this.confettiActive = false;
    this.particles = [];
    this.audioCtx = null;
  }

  // Synthesize a retro-premium chiptune chime for leveling up using Web Audio API
  playLevelUpChime() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const now = this.audioCtx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major Arpeggio upward
      
      notes.forEach((freq, idx) => {
        const time = now + idx * 0.08;
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        osc.type = 'triangle'; // Smooth, retro synth tone
        osc.frequency.setValueAtTime(freq, time);
        
        // Envelope
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.15, time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.6);
        
        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        
        osc.start(time);
        osc.stop(time + 0.6);
      });
    } catch (e) {
      console.warn('AudioContext not allowed or not supported on this browser.', e);
    }
  }

  // Synthesize a quick reward click chime
  playRewardChime() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // Slide up to A5
      
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      
      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      // Audio blocked or unsupported
    }
  }

  // Custom Confetti canvas particle engine
  triggerConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Generate particles
    const colors = ['#6366F1', '#10B981', '#EC4899', '#F59E0B', '#3B82F6', '#A855F7'];
    this.particles = [];
    
    // Spawn from the bottom edges upwards
    for (let i = 0; i < 100; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 20,
        vx: (Math.random() - 0.5) * 15,
        vy: -Math.random() * 15 - 10,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    if (!this.confettiActive) {
      this.confettiActive = true;
      this.animateConfetti(canvas, ctx);
    }
  }

  animateConfetti(canvas, ctx) {
    if (this.particles.length === 0) {
      this.confettiActive = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3; // Gravity
      p.vx *= 0.98; // Friction
      p.rotation += p.rotationSpeed;
      p.opacity -= 0.01;

      if (p.opacity <= 0 || p.y > canvas.height + 20) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }

    requestAnimationFrame(() => this.animateConfetti(canvas, ctx));
  }

  // Floating +XP Indicator near the clicked target
  spawnFloatingXP(element, xpAmount) {
    const rect = element.getBoundingClientRect();
    const floating = document.createElement('div');
    floating.className = 'floating-xp-indicator';
    floating.textContent = `+${xpAmount} GP`;
    
    // Position near the element, offset slightly upward
    floating.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
    floating.style.top = `${rect.top + window.scrollY - 10}px`;
    
    document.body.appendChild(floating);

    // Trigger transition and removal
    setTimeout(() => {
      floating.remove();
    }, 1000);
  }

  // Display toast notifications
  showToast(message, type = 'success') {
    const container = document.querySelector('.notification-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    if (type === 'success') {
      toast.style.borderLeftColor = 'var(--color-secondary)';
      toast.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--color-secondary)" stroke-width="2" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span>${message}</span>
      `;
    } else {
      toast.style.borderLeftColor = 'var(--color-primary)';
      toast.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--color-primary)" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>${message}</span>
      `;
    }

    container.appendChild(toast);
    
    // Animate show
    setTimeout(() => {
      toast.classList.add('show');
    }, 50);

    // Animate hide and remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 400);
    }, 3000);
  }

  // Execute level up UI display
  triggerLevelUp(newLevel) {
    const overlay = document.getElementById('level-up-modal-overlay');
    const levelNum = document.getElementById('modal-level-num');
    
    if (levelNum) levelNum.textContent = newLevel;
    if (overlay) overlay.classList.add('active');
    
    this.playLevelUpChime();
    this.triggerConfetti();
    
    // Automatically update sidebar layout stats
    if (window.LifeRPGLayout) {
      window.LifeRPGLayout.updateUserSummary();
    }
  }

  // Initialize selected visual theme
  initTheme() {
    const theme = window.LifeRPGStore.state.activeTheme || 'dark-default';
    document.documentElement.className = theme;
  }
}

// Global Single Instance
window.LifeRPGMisc = new LifeRPGMisc();

// Add floating CSS class on script load
const style = document.createElement('style');
style.textContent = `
  .floating-xp-indicator {
    position: absolute;
    color: var(--color-primary);
    font-weight: 800;
    font-family: var(--font-display);
    font-size: 1.15rem;
    pointer-events: none;
    z-index: 5000;
    animation: floatUpFade 1s cubic-bezier(0.25, 1, 0.5, 1) forwards;
    text-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
  }

  @keyframes floatUpFade {
    0% { transform: translate(-50%, 0) scale(0.8); opacity: 1; }
    50% { transform: translate(-50%, -30px) scale(1.1); opacity: 1; }
    100% { transform: translate(-50%, -60px) scale(1); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Run theme setup on load
document.addEventListener('DOMContentLoaded', () => {
  window.LifeRPGMisc.initTheme();
});
