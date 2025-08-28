/* ================================================
   Main JavaScript - Claude Code Statusline Manager
   Interactive Components and Animations (Production)
   ================================================ */

(function () {
  'use strict';

  /* ========== Constants & Utilities ========== */
  const ANIMATION_DURATION = 300; // ms (fade-out duration target)
  const TYPEWRITER_SPEED = 50;    // ms per character reveal
  const STATUSLINE_UPDATE_DELAY = 100; // ms
  const PASSIVE = { passive: true };

  const COST_THRESHOLDS = { low: 0.05, medium: 0.10 };

  const MODEL_EMOJIS = {
    OPUS: '🎭',
    SONNET: '🎵',
    HAIKU: '🍃'
  };

  // --- Typewriter animation registry (per element) ---
  const _twRegistry = new WeakMap();
  function _cancelTypewriter(el) {
    const h = _twRegistry.get(el);
    if (!h) return;
    if (h.raf) cancelAnimationFrame(h.raf);
    if (h.timer) clearTimeout(h.timer);
    _twRegistry.delete(el);
  }

  // Ensure only one hero interval exists even if init() re-runs
  let _heroIntervalId = null;

  /* ========== State Management ========== */
  const state = {
    currentStyle: 'segments',
    model: 'OPUS',
    cost: 0.0456,
    duration: 125000, // ms
    gitStatus: 'dirty', // 'none' | 'clean' | 'staged' | 'dirty'
    gitBranch: 'main',
    gitStats: { staged: 3, unstaged: 2, ahead: 1 },
    contextUsage: 45, // percent
    linesAdded: 45,
    linesRemoved: 12,
    currentDir: '~/projects/claude-statusline'
  };

  /* ========== Statusline Generators ========== */

  /**
   * Generate basic statusline format
   */
  function generateBasicStatusline() {
    const host = 'localhost';
    const user = 'user';
    const dir = state.currentDir.split('/').pop();
    return `<span class="text-green">${user}@${host}</span>:<span class="text-blue">~/${dir}</span>`;
  }

  /**
   * Generate minimal statusline format
   */
  function generateMinimalStatusline() {
    const segments = [];

    // Model segment
    segments.push(`<span class="segment segment--model">${state.model}</span>`);

    // Directory segment
    const shortDir =
      state.currentDir.length > 20
        ? '…/' + state.currentDir.split('/').slice(-2).join('/')
        : state.currentDir;
    segments.push(`<span class="segment segment--dir">${shortDir}</span>`);

    // Git segment
    if (state.gitStatus !== 'none') {
      const gitIcon = state.gitStatus === 'clean' ? '✓' : '*';
      segments.push(`<span class="segment segment--git">⎇ ${state.gitBranch}${gitIcon}</span>`);
    }

    // Cost segment
    const costClass = getCostClass(state.cost);
    segments.push(`<span class="segment segment--${costClass}">$${state.cost.toFixed(4)}</span>`);

    // Duration segment
    const timeStr = formatDuration(state.duration);
    segments.push(`<span class="segment segment--time">${timeStr}</span>`);

    return segments.join('<span class="segment-separator">▶</span>');
  }

  /**
   * Generate full segments statusline format
   */
  function generateSegmentsStatusline() {
    const segments = [];

    // Model segment with emoji
    const emoji = MODEL_EMOJIS[state.model] || '🤖';
    segments.push(`<span class="segment segment--model">${emoji} ${state.model}</span>`);

    // Directory segment
    const shortDir =
      state.currentDir.length > 25
        ? '…/' + state.currentDir.split('/').slice(-2).join('/')
        : state.currentDir;
    segments.push(`<span class="segment segment--dir">📁 ${shortDir}</span>`);

    // Git segment with stats
    if (state.gitStatus !== 'none') {
      let gitText = `⎇ ${state.gitBranch}`;
      if (state.gitStatus === 'staged') {
        gitText += ` +${state.gitStats.staged}`;
      } else if (state.gitStatus === 'dirty') {
        gitText += ` +${state.gitStats.staged} ~${state.gitStats.unstaged}`;
        if (state.gitStats.ahead > 0) gitText += ` ↑${state.gitStats.ahead}`;
      }
      segments.push(`<span class="segment segment--git">${gitText}</span>`);
    }

    // Cost segment with burn rate
    const costClass = getCostClass(state.cost);
    const burnRate = calculateBurnRate(state.cost, state.duration);
    const costEmoji = state.cost > COST_THRESHOLDS.medium ? '💸' : '💰';
    segments.push(
      `<span class="segment segment--${costClass}">${costEmoji} $${state.cost.toFixed(4)} ${burnRate}</span>`
    );

    // Duration with efficiency
    const timeStr = formatDuration(state.duration);
    const efficiency = state.duration > 60000 ? '⚡' : '✨';
    segments.push(`<span class="segment segment--time">⏱ ${timeStr} ${efficiency}</span>`);

    // Context usage
    const contextBar = generateContextBar(state.contextUsage);
    segments.push(`<span class="segment segment--context">📊 ${state.contextUsage}% ${contextBar}</span>`);

    // Line changes
    const netLines = state.linesAdded - state.linesRemoved;
    const netSymbol = netLines > 0 ? '↑' : netLines < 0 ? '↓' : '=';
    segments.push(
      `<span class="segment segment--changes">📝 +${state.linesAdded}/-${state.linesRemoved} ${netSymbol}${Math.abs(
        netLines
      )}</span>`
    );

    return segments.join('<span class="segment-separator">▶</span>');
  }

  /* ========== Utility Functions ========== */

  /**
   * Get cost class based on threshold
   */
  function getCostClass(cost) {
    if (cost > COST_THRESHOLDS.medium) return 'cost-high';
    if (cost > COST_THRESHOLDS.low) return 'cost-medium';
    return 'cost-low';
  }

  /**
   * Format duration to human readable
   */
  function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return minutes > 0 ? `${minutes}m${seconds}s` : `${seconds}s`;
  }

  /**
   * Calculate burn rate ($/hour), graceful for very short durations
   */
  function calculateBurnRate(cost, duration) {
    if (duration < 60000) return '';
    const hours = duration / 3600000;
    if (hours <= 0) return '';
    const rate = cost / hours;
    return `$${rate.toFixed(2)}/h`;
  }

  /**
   * Generate context usage bar
   */
  function generateContextBar(percentage) {
    const barWidth = 8;
    const filled = Math.round((percentage * barWidth) / 100);
    let bar = '[';
    for (let i = 0; i < barWidth; i++) bar += i < filled ? '█' : '░';
    bar += ']';
    return bar;
  }

  /**
   * Typewriter that preserves HTML structure. Cancellable and single-owner.
   * - Parses HTML into a fragment
   * - Wraps text nodes into spans with opacity 0
   * - Reveals characters in one rAF loop
   */
  function typewriterEffect(element, html, speed = TYPEWRITER_SPEED, done) {
    _cancelTypewriter(element);

    // Parse HTML once into a fragment
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    const frag = tpl.content;

    // Wrap text nodes into spans with opacity 0
    const spans = [];
    const walker = document.createTreeWalker(frag, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.nodeValue && /\S/.test(node.nodeValue)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    });

    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    for (let t = 0; t < textNodes.length; t++) {
      const node = textNodes[t];
      const text = node.nodeValue;
      const df = document.createDocumentFragment();
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const span = document.createElement('span');
        span.className = 'tw-ch';
        span.style.opacity = '0';
        span.style.transition = 'opacity 90ms linear';
        span.textContent = ch === ' ' ? '\u00A0' : ch;
        df.appendChild(span);
        spans.push(span);
      }
      node.parentNode.replaceChild(df, node);
    }

    // Swap content once
    element.innerHTML = '';
    element.appendChild(frag);

    // Reveal characters on a single rAF loop (time-based)
    let idx = 0;
    let last = 0;
    const handle = { raf: 0, timer: 0 };
    _twRegistry.set(element, handle);

    function step(ts) {
      if (!last) last = ts;
      // Reveal as many characters as time allows this frame
      while (idx < spans.length && ts - last >= speed) {
        spans[idx].style.opacity = '1';
        idx++;
        last += speed;
      }
      if (idx < spans.length) {
        handle.raf = requestAnimationFrame(step);
      } else {
        _twRegistry.delete(element);
        if (typeof done === 'function') done();
      }
    }

    handle.raf = requestAnimationFrame(step);
  }

  /**
   * Update statusline with optional animation (fade-out -> typewriter)
   */
  function updateStatusline(elementId, animate = true) {
    const element = document.getElementById(elementId);
    if (!element) return;

    let content;
    switch (state.currentStyle) {
      case 'basic':
        content = generateBasicStatusline();
        break;
      case 'minimal':
        content = generateMinimalStatusline();
        break;
      case 'segments':
      default:
        content = generateSegmentsStatusline();
        break;
    }

    // Cancel any running animation first
    _cancelTypewriter(element);

    if (!animate) {
      element.style.opacity = '1';
      element.innerHTML = content;
      return;
    }

    // Ensure we have a transition to listen for
    if (!element.style.transition) {
      element.style.transition = 'opacity 150ms ease';
    }

    // Fade out → then type
    element.style.opacity = '0';

    const startTyping = () => {
      _cancelTypewriter(element); // safety if another update landed
      element.style.opacity = '1';
      typewriterEffect(element, content, TYPEWRITER_SPEED);
    };

    const onEnd = () => {
      element.removeEventListener('transitionend', onEnd);
      startTyping();
    };
    element.addEventListener('transitionend', onEnd, { once: true });

    // Fallback in case transitionend doesn’t fire (e.g., element hidden)
    const handle = { raf: 0, timer: 0 };
    handle.timer = setTimeout(() => {
      element.removeEventListener('transitionend', onEnd);
      startTyping();
      _twRegistry.delete(element);
    }, Math.min(ANIMATION_DURATION, 200));
    _twRegistry.set(element, handle);
  }

  /* ========== Interactive Components ========== */

  /**
   * Initialize playground controls
   */
  function initPlayground() {
    // Style selector
    const styleSelect = document.getElementById('style-select');
    if (styleSelect) {
      styleSelect.addEventListener('change', (e) => {
        state.currentStyle = e.target.value;
        updateStatusline('playground-statusline');
      });
    }

    // Model selector
    const modelSelect = document.getElementById('model-select');
    if (modelSelect) {
      modelSelect.addEventListener('change', (e) => {
        state.model = e.target.value;
        updateStatusline('playground-statusline');
      });
    }

    // Cost slider
    const costSlider = document.getElementById('cost-slider');
    const costValue = document.getElementById('cost-value');
    if (costSlider && costValue) {
      costSlider.addEventListener(
        'input',
        (e) => {
          state.cost = parseFloat(e.target.value);
          costValue.textContent = `$${state.cost.toFixed(4)}`;

          // Update slider background based on range 0..0.20
          const maxCost = 0.2;
          const percentage = Math.max(0, Math.min(100, (state.cost / maxCost) * 100));
          const color =
            state.cost > COST_THRESHOLDS.medium
              ? 'var(--statusline-cost-high)'
              : state.cost > COST_THRESHOLDS.low
              ? 'var(--statusline-cost-medium)'
              : 'var(--statusline-cost-low)';

          costSlider.style.background = `linear-gradient(to right, ${color} ${percentage}%, var(--color-border-default) ${percentage}%)`;

          updateStatusline('playground-statusline', false);
        },
        PASSIVE
      );

      // Initialize slider background visually
      costSlider.dispatchEvent(new Event('input'));
    }

    // Git status selector
    const gitStatus = document.getElementById('git-status');
    if (gitStatus) {
      gitStatus.addEventListener('change', (e) => {
        state.gitStatus = e.target.value;

        // Update git stats based on status
        if (e.target.value === 'clean') {
          state.gitStats = { staged: 0, unstaged: 0, ahead: 0 };
        } else if (e.target.value === 'staged') {
          state.gitStats = { staged: 3, unstaged: 0, ahead: 0 };
        } else {
          state.gitStats = { staged: 3, unstaged: 2, ahead: 1 };
        }

        updateStatusline('playground-statusline');
      });
    }
  }

  /**
   * Initialize copy to clipboard functionality
   */
  function initCopyButtons() {
    const copyButtons = document.querySelectorAll('.install-command__copy');
    copyButtons.forEach((button) => {
      button.addEventListener('click', async () => {
        const textEl = button.parentElement.querySelector('.install-command__text');
        if (!textEl) return;
        const command = textEl.textContent.trim();

        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(command);
          } else {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = command;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }

          const copyText = button.querySelector('.copy-text');
          const originalText = copyText ? copyText.textContent : '';
          if (copyText) copyText.textContent = 'Copied!';
          button.classList.add('copied');

          setTimeout(() => {
            if (copyText) copyText.textContent = originalText;
            button.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      });
    });
  }

  /**
   * Initialize mobile navigation
   */
  function initMobileNav() {
    const mobileToggle = document.querySelector('.nav__mobile-toggle');
    const navMenu = document.querySelector('.nav__menu');

    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener('click', () => {
        const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
        mobileToggle.setAttribute('aria-expanded', String(!isExpanded));
        mobileToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
      });
    }
  }

  /**
   * Initialize smooth scrolling for internal anchors
   */
  function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (!targetId || targetId === '#') return;
        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();
        const nav = document.querySelector('.nav');
        const navHeight = nav ? nav.offsetHeight : 0;
        const rect = target.getBoundingClientRect();
        const targetPosition = rect.top + window.pageYOffset - navHeight - 20;

        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      });
    });
  }

  /**
   * Initialize intersection observer for animations
   */
  function initScrollAnimations() {
    if (!('IntersectionObserver' in window)) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe feature cards
    document.querySelectorAll('.feature-card').forEach((card) => observer.observe(card));
    // Observe sections
    document.querySelectorAll('section').forEach((section) => observer.observe(section));
  }

  /**
   * Initialize hero statusline animation (cycles styles safely)
   */
  function initHeroStatusline() {
    const heroStatusline = document.getElementById('hero-statusline');
    if (!heroStatusline) return;

    // Ensure only one active interval (in case init() runs more than once)
    if (_heroIntervalId !== null) {
      clearInterval(_heroIntervalId);
      _heroIntervalId = null;
    }

    let styleIndex = 0;
    const styles = ['segments', 'minimal', 'basic'];

    function cycleStyles() {
      state.currentStyle = styles[styleIndex];
      updateStatusline('hero-statusline', false); // no typewriter here for smooth swap

      styleIndex = (styleIndex + 1) % styles.length;

      // Vary data a bit for realism
      state.cost = 0.03 + Math.random() * 0.05;
      state.duration = 60000 + Math.random() * 120000;
      state.contextUsage = 30 + Math.floor(Math.random() * 40);
      state.linesAdded = 20 + Math.floor(Math.random() * 50);
      state.linesRemoved = 5 + Math.floor(Math.random() * 20);
    }

    // Initial render, then every 5s
    cycleStyles();
    _heroIntervalId = setInterval(cycleStyles, 5000);
  }

  /**
   * Add hover effects to feature cards
   */
  function initFeatureCardEffects() {
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach((card) => {
      const preview = card.querySelector('.mini-terminal');
      card.addEventListener(
        'mouseenter',
        () => {
          if (preview) preview.classList.add('glow');
        },
        PASSIVE
      );
      card.addEventListener(
        'mouseleave',
        () => {
          if (preview) preview.classList.remove('glow');
        },
        PASSIVE
      );
    });
  }

  /**
   * Initialize keyboard shortcuts
   */
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K to focus on install command
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        const installCommand = document.querySelector('.install-command');
        if (installCommand) {
          installCommand.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const copyButton = installCommand.querySelector('.install-command__copy');
          if (copyButton) copyButton.focus();
        }
      }
    });
  }

  /**
   * Initialize reduced motion support
   */
  function initReducedMotion() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) document.documentElement.classList.add('reduce-motion');
  }

  /* ========== Initialization ========== */

  /**
   * Initialize all components when DOM is ready
   */
  function init() {
    // Core initializations
    initPlayground();
    initCopyButtons();
    initMobileNav();
    initSmoothScroll();
    initScrollAnimations();
    initHeroStatusline();
    initFeatureCardEffects();
    initKeyboardShortcuts();
    initReducedMotion();

    // Initialize playground statusline with slight delay to ensure DOM is ready
    setTimeout(() => {
      updateStatusline('playground-statusline', false);
    }, STATUSLINE_UPDATE_DELAY);

    // Add loaded class for CSS animations
    document.body.classList.add('loaded');

    // Log initialization
    console.log('🎨 Claude Code Statusline Manager initialized');
  }

  // Wait for DOM to be ready (one-shot)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
