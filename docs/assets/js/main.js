/* ================================================
   Main JavaScript - Claude Code Statusline Manager
   Interactive Components and Animations
   ================================================ */

(function() {
  'use strict';

  /* ========== Constants ========== */
  const ANIMATION_DURATION = 300;
  const TYPEWRITER_SPEED = 50;
  const STATUSLINE_UPDATE_DELAY = 100;
  
  const COST_THRESHOLDS = {
    low: 0.05,
    medium: 0.10
  };

  const MODEL_EMOJIS = {
    OPUS: '🎭',
    SONNET: '🎵',
    HAIKU: '🍃'
  };

  /* ========== State Management ========== */
  const state = {
    currentStyle: 'segments',
    model: 'OPUS',
    cost: 0.0456,
    duration: 125000,
    gitStatus: 'dirty',
    gitBranch: 'main',
    gitStats: { staged: 3, unstaged: 2, ahead: 1 },
    contextUsage: 45,
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
    const shortDir = state.currentDir.length > 20 
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
    const shortDir = state.currentDir.length > 25 
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
        if (state.gitStats.ahead > 0) {
          gitText += ` ↑${state.gitStats.ahead}`;
        }
      }
      segments.push(`<span class="segment segment--git">${gitText}</span>`);
    }
    
    // Cost segment with burn rate
    const costClass = getCostClass(state.cost);
    const burnRate = calculateBurnRate(state.cost, state.duration);
    const costEmoji = state.cost > COST_THRESHOLDS.medium ? '💸' : '💰';
    segments.push(`<span class="segment segment--${costClass}">${costEmoji} $${state.cost.toFixed(4)} ${burnRate}</span>`);
    
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
    segments.push(`<span class="segment segment--changes">📝 +${state.linesAdded}/-${state.linesRemoved} ${netSymbol}${Math.abs(netLines)}</span>`);
    
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
    
    if (minutes > 0) {
      return `${minutes}m${seconds}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Calculate burn rate
   */
  function calculateBurnRate(cost, duration) {
    if (duration < 60000) return '';
    const hours = duration / 3600000;
    const rate = cost / hours;
    return `$${rate.toFixed(2)}/h`;
  }

  /**
   * Generate context usage bar
   */
  function generateContextBar(percentage) {
    const barWidth = 8;
    const filled = Math.round(percentage * barWidth / 100);
    let bar = '[';
    
    for (let i = 0; i < barWidth; i++) {
      bar += i < filled ? '█' : '░';
    }
    
    bar += ']';
    return bar;
  }

  /**
   * Typewriter animation effect
   */
  function typewriterEffect(element, text, callback) {
    element.innerHTML = '';
    element.style.opacity = '1';
    
    // Create a wrapper to maintain visibility of the cursor
    const wrapper = document.createElement('span');
    wrapper.innerHTML = text;
    wrapper.style.visibility = 'hidden';
    element.appendChild(wrapper);
    
    // Get the final width
    const finalWidth = wrapper.offsetWidth;
    wrapper.style.visibility = 'visible';
    wrapper.innerHTML = '';
    
    // Animate
    let index = 0;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    function type() {
      if (index < text.length) {
        // Add the actual HTML character by character
        const currentHTML = text.substring(0, index + 1);
        wrapper.innerHTML = currentHTML;
        index++;
        setTimeout(type, TYPEWRITER_SPEED);
      } else {
        wrapper.innerHTML = text;
        if (callback) callback();
      }
    }
    
    type();
  }

  /**
   * Update statusline with animation
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
    
    if (animate) {
      element.style.opacity = '0';
      setTimeout(() => {
        typewriterEffect(element, content);
      }, ANIMATION_DURATION);
    } else {
      element.innerHTML = content;
    }
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
      costSlider.addEventListener('input', (e) => {
        state.cost = parseFloat(e.target.value);
        costValue.textContent = `$${state.cost.toFixed(4)}`;
        
        // Update slider color based on threshold
        const percentage = (state.cost / 0.20) * 100;
        const color = state.cost > COST_THRESHOLDS.medium ? 
          'var(--statusline-cost-high)' :
          state.cost > COST_THRESHOLDS.low ?
          'var(--statusline-cost-medium)' :
          'var(--statusline-cost-low)';
        
        costSlider.style.background = `linear-gradient(to right, ${color} ${percentage}%, var(--color-border-default) ${percentage}%)`;
        
        updateStatusline('playground-statusline', false);
      });
      
      // Initialize slider background
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
    
    copyButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const command = button.parentElement.querySelector('.install-command__text').textContent.trim();
        
        try {
          await navigator.clipboard.writeText(command);
          
          // Update button text
          const copyText = button.querySelector('.copy-text');
          const originalText = copyText.textContent;
          copyText.textContent = 'Copied!';
          button.classList.add('copied');
          
          // Reset after 2 seconds
          setTimeout(() => {
            copyText.textContent = originalText;
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
        mobileToggle.setAttribute('aria-expanded', !isExpanded);
        mobileToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
      });
    }
  }

  /**
   * Initialize smooth scrolling
   */
  function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const target = document.querySelector(targetId);
        
        if (target) {
          const navHeight = document.querySelector('.nav').offsetHeight;
          const targetPosition = target.offsetTop - navHeight - 20;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  /**
   * Initialize intersection observer for animations
   */
  function initScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    // Observe feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
      observer.observe(card);
    });
    
    // Observe sections
    document.querySelectorAll('section').forEach(section => {
      observer.observe(section);
    });
  }

  /**
   * Initialize hero statusline animation
   */
  function initHeroStatusline() {
    const heroStatusline = document.getElementById('hero-statusline');
    if (!heroStatusline) return;
    
    // Cycle through different styles
    let styleIndex = 0;
    const styles = ['segments', 'minimal', 'basic'];
    
    function cycleStyles() {
      state.currentStyle = styles[styleIndex];
      updateStatusline('hero-statusline', true);
      
      styleIndex = (styleIndex + 1) % styles.length;
      
      // Also vary the data slightly for realism
      state.cost = 0.03 + Math.random() * 0.05;
      state.duration = 60000 + Math.random() * 120000;
      state.contextUsage = 30 + Math.floor(Math.random() * 40);
      state.linesAdded = 20 + Math.floor(Math.random() * 50);
      state.linesRemoved = 5 + Math.floor(Math.random() * 20);
    }
    
    // Initial animation
    setTimeout(() => {
      cycleStyles();
    }, 1000);
    
    // Cycle every 5 seconds
    setInterval(cycleStyles, 5000);
  }

  /**
   * Add hover effects to feature cards
   */
  function initFeatureCardEffects() {
    const cards = document.querySelectorAll('.feature-card');
    
    cards.forEach(card => {
      const preview = card.querySelector('.mini-terminal');
      
      card.addEventListener('mouseenter', () => {
        if (preview) {
          preview.classList.add('glow');
        }
      });
      
      card.addEventListener('mouseleave', () => {
        if (preview) {
          preview.classList.remove('glow');
        }
      });
    });
  }

  /**
   * Initialize keyboard shortcuts
   */
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K to focus on install command
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
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
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    }
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
    
    // Initialize playground statusline
    updateStatusline('playground-statusline', false);
    
    // Add loaded class for CSS animations
    document.body.classList.add('loaded');
    
    // Log initialization
    console.log('🎨 Claude Code Statusline Manager initialized');
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();