/* ================================================
   Advanced JavaScript - Claude Code Statusline Manager
   Parallax, Animations, and Interactive Components
   ================================================ */

(function() {
  'use strict';

  /* ========== Parallax Scrolling System ========== */
  class ParallaxController {
    constructor() {
      this.elements = [];
      this.rafId = null;
      this.scrollY = 0;
      this.windowHeight = window.innerHeight;
      this.init();
    }

    init() {
      // Find all parallax elements
      document.querySelectorAll('[data-parallax]').forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0.5;
        const offset = parseFloat(el.dataset.parallaxOffset) || 0;
        
        this.elements.push({
          element: el,
          speed: speed,
          offset: offset,
          bounds: el.getBoundingClientRect()
        });
      });

      // Start animation loop if elements exist
      if (this.elements.length > 0) {
        this.bindEvents();
        this.animate();
      }
    }

    bindEvents() {
      window.addEventListener('scroll', () => {
        this.scrollY = window.scrollY;
        if (!this.rafId) {
          this.rafId = requestAnimationFrame(() => this.animate());
        }
      });

      window.addEventListener('resize', () => {
        this.windowHeight = window.innerHeight;
        this.updateBounds();
      });
    }

    updateBounds() {
      this.elements.forEach(item => {
        item.bounds = item.element.getBoundingClientRect();
      });
    }

    animate() {
      this.elements.forEach(item => {
        const { element, speed, offset } = item;
        const yPos = -(this.scrollY * speed) + offset;
        
        element.style.transform = `translate3d(0, ${yPos}px, 0)`;
      });

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
      // Standard reveal observer
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
              // Add stagger delay for children
              if (entry.target.classList.contains('stagger-children')) {
                const children = entry.target.children;
                Array.from(children).forEach((child, i) => {
                  child.style.setProperty('--stagger-index', i);
                  setTimeout(() => {
                    child.classList.add('animate-in');
                  }, i * 100);
                });
              }
              
              // Animate the element
              setTimeout(() => {
                entry.target.classList.add('animate-in');
              }, index * 50);

              // Optional: unobserve after animation
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

      // Counter animation observer
      const counterObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.animateCounter(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );

      // Apply observers
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        revealObserver.observe(el);
      });

      document.querySelectorAll('[data-counter]').forEach(el => {
        counterObserver.observe(el);
      });
    }

    setupScrollProgress() {
      const progressBar = document.createElement('div');
      progressBar.className = 'scroll-progress';
      progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, var(--color-accent-claude), var(--color-info-fg));
        z-index: 9999;
        transition: width 0.1s ease;
      `;
      document.body.appendChild(progressBar);

      window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
      });
    }

    setupRevealAnimations() {
      // Add reveal animations to sections
      const sections = document.querySelectorAll('section');
      sections.forEach((section, index) => {
        section.classList.add('animate-on-scroll');
        if (index % 2 === 0) {
          section.classList.add('from-left');
        } else {
          section.classList.add('from-right');
        }
      });
    }

    animateCounter(element) {
      const target = parseInt(element.dataset.counter);
      const duration = parseInt(element.dataset.duration) || 2000;
      const start = 0;
      const startTime = performance.now();

      const updateCounter = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (target - start) * easeOutQuart);
        
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          element.textContent = target.toLocaleString();
        }
      };

      requestAnimationFrame(updateCounter);
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

      // Create canvas
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'cost-visualizer-canvas';
      this.container.appendChild(this.canvas);
      
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      
      // Bind events
      window.addEventListener('resize', () => this.resize());
      
      // Start animation
      this.animate();
    }

    resize() {
      this.canvas.width = this.container.offsetWidth;
      this.canvas.height = this.container.offsetHeight;
    }

    createParticle(x, y, cost) {
      const hue = cost > 0.10 ? 0 : cost > 0.05 ? 45 : 120;
      return {
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 3 - 1,
        life: 1,
        hue: hue,
        size: Math.random() * 3 + 1
      };
    }

    updateCost(cost) {
      const x = this.canvas.width / 2;
      const y = this.canvas.height / 2;
      
      // Create particles based on cost
      const particleCount = Math.floor(cost * 100);
      for (let i = 0; i < particleCount; i++) {
        this.particles.push(this.createParticle(x, y, cost));
      }
    }

    animate() {
      this.ctx.fillStyle = 'rgba(13, 17, 23, 0.1)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Update and draw particles
      this.particles = this.particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.01;
        particle.vy += 0.05; // Gravity

        if (particle.life <= 0) return false;

        // Draw particle
        this.ctx.save();
        this.ctx.globalAlpha = particle.life;
        this.ctx.fillStyle = `hsl(${particle.hue}, 100%, 50%)`;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = `hsl(${particle.hue}, 100%, 50%)`;
        
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        return true;
      });

      requestAnimationFrame(() => this.animate());
    }
  }

  /* ========== Terminal Matrix Effect ========== */
  class MatrixEffect {
    constructor(element) {
      this.element = element;
      this.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:<>?,./';
      this.drops = [];
      this.init();
    }

    init() {
      if (!this.element) return;

      const text = this.element.textContent;
      this.element.textContent = '';
      
      // Create character spans
      for (let i = 0; i < text.length; i++) {
        const span = document.createElement('span');
        span.textContent = text[i];
        span.style.opacity = '0';
        span.style.display = 'inline-block';
        span.style.transition = 'all 0.5s ease';
        this.element.appendChild(span);
        
        // Animate in with matrix effect
        setTimeout(() => {
          this.matrixReveal(span, text[i]);
        }, i * 50);
      }
    }

    matrixReveal(span, finalChar) {
      let iterations = 0;
      const maxIterations = 10;
      
      const interval = setInterval(() => {
        if (iterations >= maxIterations) {
          span.textContent = finalChar;
          span.style.opacity = '1';
          span.style.color = '';
          clearInterval(interval);
          return;
        }
        
        span.textContent = this.chars[Math.floor(Math.random() * this.chars.length)];
        span.style.opacity = '1';
        span.style.color = 'var(--color-success-fg)';
        iterations++;
      }, 50);
    }
  }

  /* ========== Ripple Effect Controller ========== */
  class RippleEffect {
    constructor() {
      this.init();
    }

    init() {
      document.querySelectorAll('[data-ripple]').forEach(element => {
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
      
      // Remove any existing ripples
      const existingRipple = button.querySelector('.ripple');
      if (existingRipple) {
        existingRipple.remove();
      }
      
      button.appendChild(ripple);
      
      // Remove ripple after animation
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
      // Create custom cursor elements
      this.cursor = document.createElement('div');
      this.cursor.className = 'magnetic-cursor';
      this.cursor.style.cssText = `
        position: fixed;
        width: 40px;
        height: 40px;
        border: 2px solid var(--color-accent-claude);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transition: transform 0.2s ease, opacity 0.2s ease;
        mix-blend-mode: difference;
      `;
      
      this.cursorDot = document.createElement('div');
      this.cursorDot.className = 'magnetic-cursor-dot';
      this.cursorDot.style.cssText = `
        position: fixed;
        width: 6px;
        height: 6px;
        background: var(--color-accent-claude);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
      `;
      
      document.body.appendChild(this.cursor);
      document.body.appendChild(this.cursorDot);
      
      this.bindEvents();
      this.animate();
    }

    bindEvents() {
      document.addEventListener('mousemove', (e) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
      });

      // Magnetic effect for interactive elements
      document.querySelectorAll('button, a, [data-magnetic]').forEach(element => {
        element.addEventListener('mouseenter', () => {
          this.cursor.style.transform = 'scale(1.5)';
        });
        
        element.addEventListener('mouseleave', () => {
          this.cursor.style.transform = 'scale(1)';
        });
      });
    }

    animate() {
      // Smooth cursor movement
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
        position: fixed;
        top: 10px;
        right: 10px;
        background: var(--color-canvas-overlay);
        border: 1px solid var(--color-border-default);
        padding: 10px;
        border-radius: 4px;
        font-family: var(--font-mono);
        font-size: var(--font-size-xs);
        z-index: 9999;
      `;
      document.body.appendChild(display);
    }

    monitor() {
      const currentTime = performance.now();
      this.frames++;
      
      if (currentTime >= this.lastTime + 1000) {
        this.fps = Math.round(this.frames * 1000 / (currentTime - this.lastTime));
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
    // Initialize all advanced features
    new ParallaxController();
    new ScrollAnimator();
    new RippleEffect();
    
    // Initialize matrix effect on hero title
    const heroTitle = document.querySelector('.hero__title');
    if (heroTitle) {
      new MatrixEffect(heroTitle);
    }
    
    // Initialize cost visualizer
    const costContainer = document.getElementById('cost-visualizer');
    if (costContainer) {
      window.costVisualizer = new CostVisualizer(costContainer);
    }
    
    // Initialize magnetic cursor on desktop only
    if (window.innerWidth > 1024 && !('ontouchstart' in window)) {
      new MagneticCursor();
    }
    
    // Initialize performance monitor
    new PerformanceMonitor();
    
    console.log('🚀 Advanced features initialized');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdvancedFeatures);
  } else {
    initAdvancedFeatures();
  }

})();