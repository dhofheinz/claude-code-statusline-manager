/* ================================================
   Advanced JavaScript - Claude Code Statusline Manager
   Parallax, Animations, and Interactive Components
   ================================================ */

(function () {
  'use strict';

  /* ========== Utilities ========== */
  const PASSIVE = { passive: true };
  const MATRIX_INSTANCE = Symbol('matrixEffectInstance');

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ========== Parallax Scrolling System ========== */
  class ParallaxController {
    constructor() {
      this.elements = [];
      this.rafId = null;
      this.scrollY = window.scrollY || 0;
      this.windowHeight = window.innerHeight;
      this._resizeQueued = false;
      this.init();
    }

    init() {
      document.querySelectorAll('[data-parallax]').forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0.5;
        const offset = parseFloat(el.dataset.parallaxOffset) || 0;

        this.elements.push({
          element: el,
          speed,
          offset
        });
      });

      if (this.elements.length > 0) {
        this.bindEvents();
        this.animate();
      }
    }

    bindEvents() {
      window.addEventListener(
        'scroll',
        () => {
          this.scrollY = window.scrollY || document.documentElement.scrollTop || 0;
          if (!this.rafId) this.rafId = requestAnimationFrame(() => this.animate());
        },
        PASSIVE
      );

      window.addEventListener(
        'resize',
        () => {
          if (this._resizeQueued) return;
          this._resizeQueued = true;
          requestAnimationFrame(() => {
            this.windowHeight = window.innerHeight;
            this._resizeQueued = false;
            if (!this.rafId) this.rafId = requestAnimationFrame(() => this.animate());
          });
        },
        PASSIVE
      );
    }

    animate() {
      const y = this.scrollY;
      for (let i = 0; i < this.elements.length; i++) {
        const { element, speed, offset } = this.elements[i];
        const yPos = -(y * speed) + offset;
        element.style.transform = `translate3d(0, ${yPos}px, 0)`;
      }
      this.rafId = null;
    }
  }

  /* ========== Advanced Scroll Animations ========== */
  class ScrollAnimator {
    constructor() {
      this.observers = new Map();
      this.init();
    }

    init() {
      this.setupIntersectionObservers();
      this.setupScrollProgress();
      this.setupRevealAnimations();
    }

    setupIntersectionObservers() {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
              if (entry.target.classList.contains('stagger-children')) {
                const children = entry.target.children;
                for (let i = 0; i < children.length; i++) {
                  const child = children[i];
                  child.style.setProperty('--stagger-index', i);
                  setTimeout(() => child.classList.add('animate-in'), i * 100);
                }
              }
              setTimeout(() => entry.target.classList.add('animate-in'), index * 50);

              if (entry.target.dataset.animateOnce !== 'false') {
                revealObserver.unobserve(entry.target);
              }
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        }
      );

      const counterObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.animateCounter(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );

      document.querySelectorAll('.animate-on-scroll').forEach((el) => revealObserver.observe(el));
      document.querySelectorAll('[data-counter]').forEach((el) => counterObserver.observe(el));
    }

    setupScrollProgress() {
      const progressBar = document.createElement('div');
      progressBar.className = 'scroll-progress';
      progressBar.style.cssText = `
        position: fixed; top: 0; left: 0; width: 0%; height: 3px;
        background: linear-gradient(90deg, var(--color-accent-claude), var(--color-info-fg));
        z-index: 9999; transition: width 0.1s ease;`;
      document.body.appendChild(progressBar);

      window.addEventListener(
        'scroll',
        () => {
          const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
          const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
          const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
          progressBar.style.width = scrolled + '%';
        },
        PASSIVE
      );
    }

    setupRevealAnimations() {
      const sections = document.querySelectorAll('section');
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        section.classList.add('animate-on-scroll');
        if (i % 2 === 0) section.classList.add('from-left');
        else section.classList.add('from-right');
      }
    }

    animateCounter(element) {
      const target = parseInt(element.dataset.counter, 10);
      const duration = parseInt(element.dataset.duration, 10) || 2000;
      const start = 0;
      const startTime = performance.now();

      const update = (t) => {
        const elapsed = t - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (target - start) * ease);
        element.textContent = current.toLocaleString();

        if (progress < 1) requestAnimationFrame(update);
        else element.textContent = target.toLocaleString();
      };

      requestAnimationFrame(update);
    }
  }

  /* ========== Interactive Cost Visualizer ========== */
  class CostVisualizer {
    constructor(container) {
      this.container = container;
      this.canvas = null;
      this.ctx = null;
      this.particles = [];
      this.init();
    }

    init() {
      if (!this.container) return;
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'cost-visualizer-canvas';
      this.container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize(), PASSIVE);
      this.animate();
    }

    resize() {
      this.canvas.width = this.container.offsetWidth;
      this.canvas.height = this.container.offsetHeight;
    }

    createParticle(x, y, cost) {
      const hue = cost > 0.1 ? 0 : cost > 0.05 ? 45 : 120;
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 3 - 1,
        life: 1,
        hue,
        size: Math.random() * 3 + 1
      };
    }

    updateCost(cost) {
      const x = this.canvas.width / 2;
      const y = this.canvas.height / 2;
      const particleCount = Math.max(1, Math.floor(cost * 100));
      for (let i = 0; i < particleCount; i++) {
        this.particles.push(this.createParticle(x, y, cost));
      }
    }

    animate() {
      const ctx = this.ctx;
      const { width: w, height: h } = this.canvas;
      ctx.fillStyle = 'rgba(13, 17, 23, 0.1)';
      ctx.fillRect(0, 0, w, h);

      const out = [];
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.01;
        p.vy += 0.05;
        if (p.life <= 0) continue;

        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = `hsl(${p.hue}, 100%, 50%)`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        out.push(p);
      }
      this.particles = out;
      requestAnimationFrame(() => this.animate());
    }
  }

  /* ========== Matrix Effect (refactored) ========== */
  /**
   * Highly efficient, reliable “Matrix” reveal for hero titles and any element.
   * - Single rAF loop; no per-character setInterval
   * - Lazy start when visible; respects prefers-reduced-motion
   * - Preserves nested structure; safe re-entry; destroyable
   */
  class MatrixEffect {
    /**
     * @param {HTMLElement} element
     * @param {Object} [opts]
     */
    constructor(element, opts = {}) {
      if (!element) return;

      // Avoid double-instantiation
      if (element[MATRIX_INSTANCE]) {
        element[MATRIX_INSTANCE].destroy();
      }
      element[MATRIX_INSTANCE] = this;

      const datasetChars = element.dataset.matrixChars;
      this.element = element;
      this.opts = Object.assign(
        {
          // Timing
          stagger: 22,                // ms per glyph start offset
          minDuration: 300,           // ms per glyph scramble min
          maxDuration: 900,           // ms per glyph scramble max
          changeIntervalMin: 16,      // min ms between scramble swaps
          changeIntervalMax: 50,      // max ms between scramble swaps
          // Pool & colors
          pool:
            datasetChars ||
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:<>?,./',
          activeColor: 'var(--color-success-fg)',
          finalColor: '',             // keep inherited color
          // Behavior
          once: true,                 // unobserve after first reveal
          lazy: true,                 // start only when visible
          respectReducedMotion: true
        },
        opts
      );

      this._spans = [];
      this._meta = [];               // per-glyph state
      this._running = false;
      this._raf = 0;
      this._startedAt = 0;
      this._observer = null;
      this._visible = !this.opts.lazy; // if not lazy, reveal immediately

      // Prepare DOM minimally; do not start animation yet
      this._prepare();

      if (this.opts.respectReducedMotion && prefersReducedMotion()) {
        this._finalizeAll(true);
        return;
      }

      if (this.opts.lazy) {
        this._observer = new IntersectionObserver(
          (entries) => {
            for (let i = 0; i < entries.length; i++) {
              const e = entries[i];
              if (e.isIntersecting) {
                this._visible = true;
                this.start();
                if (this.opts.once && this._observer) {
                  this._observer.disconnect();
                  this._observer = null;
                }
                break;
              }
            }
          },
          { threshold: 0.1 }
        );
        this._observer.observe(this.element);
      } else {
        this.start();
      }
    }

    /**
     * Recursively wraps text nodes in spans while preserving nested structure.
     * Produces spans with initial opacity 0 (no layout jump).
     */
    _prepare() {
      // If already wrapped, skip
      if (this.element.querySelector('.mx-ch')) {
        this._collectSpans();
        return;
      }

      const walker = document.createTreeWalker(
        this.element,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
            // Keep whitespace-only nodes as-is but skip wrapping them
            return /\S/.test(node.nodeValue)
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT;
          }
        }
      );

      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);

      for (let t = 0; t < textNodes.length; t++) {
        const node = textNodes[t];
        const text = node.nodeValue;
        const frag = document.createDocumentFragment();

        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (ch === ' ') {
            // Preserve spaces as text nodes (no span) to minimize DOM
            frag.appendChild(document.createTextNode('\u00A0'));
            continue;
          }
          const span = document.createElement('span');
          span.className = 'mx-ch';
          span.style.opacity = '0';
          span.style.display = 'inline-block'; // avoids reflow on opacity changes
          span.style.transition = 'opacity 120ms ease';
          span.textContent = ch; // final char as baseline
          span.dataset.final = ch;
          frag.appendChild(span);
        }

        node.parentNode.replaceChild(frag, node);
      }

      this._collectSpans();
    }

    _collectSpans() {
      this._spans = Array.from(this.element.querySelectorAll('.mx-ch'));
      this._meta = new Array(this._spans.length);
      const stagger = Number(this.element.dataset.stagger || this.opts.stagger);

      // Compute per-glyph timings up front
      for (let i = 0; i < this._spans.length; i++) {
        const startDelay = i * stagger;
        const duration =
          this.opts.minDuration +
          Math.floor(Math.random() * (this.opts.maxDuration - this.opts.minDuration + 1));
        const changeInterval =
          this.opts.changeIntervalMin +
          Math.floor(
            Math.random() * (this.opts.changeIntervalMax - this.opts.changeIntervalMin + 1)
          );

        this._meta[i] = {
          startDelay,
          duration,
          changeInterval,
          nextSwapAt: 0,
          done: false,
          started: false
        };
      }
    }

    start() {
      if (this._running || this._spans.length === 0) return;
      this._running = true;
      this._startedAt = performance.now();
      this._raf = requestAnimationFrame((t) => this._frame(t));
    }

    _frame(t) {
      if (!this._running || !this.element.isConnected) {
        this.destroy();
        return;
      }

      const base = this._startedAt;
      const pool = this.opts.pool;
      let remaining = 0;

      // Batch DOM updates: only touch spans that need a change
      for (let i = 0; i < this._spans.length; i++) {
        const span = this._spans[i];
        const m = this._meta[i];
        if (m.done) continue;

        const startAt = base + m.startDelay;
        if (t < startAt) {
          // Not started
          remaining++;
          continue;
        }

        if (!m.started) {
          m.started = true;
          // show it; color during scramble only
          span.style.opacity = '1';
          span.style.color = this.opts.activeColor;
          m.nextSwapAt = t; // allow immediate first swap
        }

        const endAt = startAt + m.duration;
        if (t >= endAt) {
          // Finalize
          span.textContent = span.dataset.final || span.textContent;
          if (this.opts.finalColor) span.style.color = this.opts.finalColor;
          else span.style.removeProperty('color');
          m.done = true;
          continue;
        }

        // Scramble at intervals
        if (t >= m.nextSwapAt) {
          const rnd = Math.floor(Math.random() * pool.length);
          span.textContent = pool[rnd];
          m.nextSwapAt = t + m.changeInterval;
        }

        remaining++;
      }

      if (remaining > 0) {
        this._raf = requestAnimationFrame((n) => this._frame(n));
      } else {
        this._running = false;
        if (this.opts.once && this._observer) {
          this._observer.disconnect();
          this._observer = null;
        }
      }
    }

    /**
     * Instantly finalize all characters (used for reduced motion or immediate completion).
     */
    _finalizeAll(skipObserve = false) {
      for (let i = 0; i < this._spans.length; i++) {
        const span = this._spans[i];
        span.style.opacity = '1';
        if (this.opts.finalColor) span.style.color = this.opts.finalColor;
        else span.style.removeProperty('color');
        span.textContent = span.dataset.final || span.textContent;
        this._meta[i] = { done: true, started: false, startDelay: 0, duration: 0, changeInterval: 0, nextSwapAt: 0 };
      }
      if (skipObserve && this._observer) {
        this._observer.disconnect();
        this._observer = null;
      }
      this._running = false;
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = 0;
    }

    /**
     * Clean up observers and animation frame.
     */
    destroy() {
      this._running = false;
      if (this._raf) {
        cancelAnimationFrame(this._raf);
        this._raf = 0;
      }
      if (this._observer) {
        this._observer.disconnect();
        this._observer = null;
      }
      // Element keeps finalized text; spans remain for idempotency.
      if (this.element) this.element[MATRIX_INSTANCE] = null;
    }
  }

  /* ========== Ripple Effect Controller ========== */
  class RippleEffect {
    constructor() {
      this.init();
    }

    init() {
      document.querySelectorAll('[data-ripple]').forEach((element) => {
        element.addEventListener('click', (e) => this.createRipple(e));
      });
    }

    createRipple(event) {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;

      ripple.style.width = ripple.style.height = `${diameter}px`;
      ripple.style.left = `${event.clientX - rect.left - radius}px`;
      ripple.style.top = `${event.clientY - rect.top - radius}px`;
      ripple.className = 'ripple';

      const existingRipple = button.querySelector('.ripple');
      if (existingRipple) existingRipple.remove();

      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }
  }

  /* ========== Magnetic Cursor Effect ========== */
  class MagneticCursor {
    constructor() {
      this.cursor = null;
      this.cursorDot = null;
      this.mouseX = 0;
      this.mouseY = 0;
      this.cursorX = 0;
      this.cursorY = 0;
      this.init();
    }

    init() {
      this.cursor = document.createElement('div');
      this.cursor.className = 'magnetic-cursor';
      this.cursor.style.cssText = `
        position: fixed; width: 40px; height: 40px; border: 2px solid var(--color-accent-claude);
        border-radius: 50%; pointer-events: none; z-index: 9999;
        transition: transform 0.2s ease, opacity 0.2s ease; mix-blend-mode: difference;`;

      this.cursorDot = document.createElement('div');
      this.cursorDot.className = 'magnetic-cursor-dot';
      this.cursorDot.style.cssText = `
        position: fixed; width: 6px; height: 6px; background: var(--color-accent-claude);
        border-radius: 50%; pointer-events: none; z-index: 9999; transform: translate(-50%, -50%);`;

      document.body.appendChild(this.cursor);
      document.body.appendChild(this.cursorDot);

      this.bindEvents();
      this.animate();
    }

    bindEvents() {
      document.addEventListener(
        'mousemove',
        (e) => {
          this.mouseX = e.clientX;
          this.mouseY = e.clientY;
        },
        PASSIVE
      );

      document.querySelectorAll('button, a, [data-magnetic]').forEach((element) => {
        element.addEventListener('mouseenter', () => {
          this.cursor.style.transform = 'scale(1.5)';
        });
        element.addEventListener('mouseleave', () => {
          this.cursor.style.transform = 'scale(1)';
        });
      });
    }

    animate() {
      this.cursorX += (this.mouseX - this.cursorX) * 0.1;
      this.cursorY += (this.mouseY - this.cursorY) * 0.1;

      this.cursor.style.left = `${this.cursorX - 20}px`;
      this.cursor.style.top = `${this.cursorY - 20}px`;
      this.cursorDot.style.left = `${this.mouseX}px`;
      this.cursorDot.style.top = `${this.mouseY}px`;

      requestAnimationFrame(() => this.animate());
    }
  }

  /* ========== Performance Monitor ========== */
  class PerformanceMonitor {
    constructor() {
      this.fps = 0;
      this.lastTime = performance.now();
      this.frames = 0;
      this.init();
    }

    init() {
      if (window.location.hash === '#debug') {
        this.createDisplay();
        this.monitor();
      }
    }

    createDisplay() {
      const display = document.createElement('div');
      display.id = 'performance-monitor';
      display.style.cssText = `
        position: fixed; top: 10px; right: 10px; background: var(--color-canvas-overlay);
        border: 1px solid var(--color-border-default); padding: 10px; border-radius: 4px;
        font-family: var(--font-mono); font-size: var(--font-size-xs); z-index: 9999;`;
      document.body.appendChild(display);
    }

    monitor() {
      const currentTime = performance.now();
      this.frames++;

      if (currentTime >= this.lastTime + 1000) {
        this.fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime));
        this.lastTime = currentTime;
        this.frames = 0;

        const display = document.getElementById('performance-monitor');
        if (display) {
          display.innerHTML = `
            FPS: ${this.fps}<br>
            Memory: ${this.getMemoryUsage()}<br>
            DOM Nodes: ${document.getElementsByTagName('*').length}
          `;
        }
      }

      requestAnimationFrame(() => this.monitor());
    }

    getMemoryUsage() {
      if (performance.memory) {
        const used = performance.memory.usedJSHeapSize / 1048576;
        const total = performance.memory.totalJSHeapSize / 1048576;
        return `${used.toFixed(2)}MB / ${total.toFixed(2)}MB`;
      }
      return 'N/A';
    }
  }

  /* ========== Initialize All Systems ========== */
  function initAdvancedFeatures() {
    new ParallaxController();
    new ScrollAnimator();
    new RippleEffect();

    // Initialize matrix effect on hero title
    const heroTitle = document.querySelector('.hero__title');
    if (heroTitle) {
      // Optional: tweak via data attributes on the element:
      // data-matrix-chars, data-stagger
      new MatrixEffect(heroTitle, {
        // You can override defaults here if desired:
        // stagger: 18,
        // minDuration: 250,
        // maxDuration: 800
      });
    }

    // Initialize cost visualizer
    const costContainer = document.getElementById('cost-visualizer');
    if (costContainer) {
      window.costVisualizer = new CostVisualizer(costContainer);
    }

    // Magnetic cursor remains disabled per your note
    // if (window.innerWidth > 1024 && !('ontouchstart' in window)) new MagneticCursor();

    new PerformanceMonitor();
    console.log('🚀 Advanced features initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdvancedFeatures, { once: true });
  } else {
    initAdvancedFeatures();
  }
})();
