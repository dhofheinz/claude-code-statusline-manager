/* ================================================
   Accessibility JavaScript - Claude Code Statusline Manager
   WCAG 2.1 AAA Compliance Features
   ================================================ */

(function() {
  'use strict';

  /* ========== Accessibility Manager ========== */
  class AccessibilityManager {
    constructor() {
      this.preferences = this.loadPreferences();
      this.announcer = null;
      this.focusTrap = null;
      this.init();
    }

    init() {
      this.createAnnouncer();
      this.setupKeyboardNavigation();
      this.setupSkipLinks();
      this.setupARIA();
      this.setupPreferencesPanel();
      this.applyPreferences();
      this.bindEvents();
      
      console.log('♿ Accessibility features initialized');
    }

    loadPreferences() {
      const stored = localStorage.getItem('a11y-preferences');
      return stored ? JSON.parse(stored) : {
        highContrast: false,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        largeText: false,
        keyboardIndicators: true,
        screenReaderMode: false,
        colorBlindMode: null
      };
    }

    savePreferences() {
      localStorage.setItem('a11y-preferences', JSON.stringify(this.preferences));
    }

    /* ========== Screen Reader Announcements ========== */
    createAnnouncer() {
      // Create live regions for screen reader announcements
      this.announcer = {
        polite: document.createElement('div'),
        assertive: document.createElement('div')
      };

      this.announcer.polite.setAttribute('aria-live', 'polite');
      this.announcer.polite.setAttribute('aria-atomic', 'true');
      this.announcer.polite.className = 'sr-only';

      this.announcer.assertive.setAttribute('aria-live', 'assertive');
      this.announcer.assertive.setAttribute('aria-atomic', 'true');
      this.announcer.assertive.className = 'sr-only';

      document.body.appendChild(this.announcer.polite);
      document.body.appendChild(this.announcer.assertive);
    }

    announce(message, priority = 'polite') {
      const region = this.announcer[priority];
      if (region) {
        region.textContent = '';
        setTimeout(() => {
          region.textContent = message;
        }, 100);
      }
    }

    /* ========== Keyboard Navigation ========== */
    setupKeyboardNavigation() {
      // Global keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        // Alt + A: Toggle accessibility panel
        if (e.altKey && e.key === 'a') {
          e.preventDefault();
          this.togglePreferencesPanel();
        }

        // Alt + H: Toggle high contrast
        if (e.altKey && e.key === 'h') {
          e.preventDefault();
          this.toggleHighContrast();
        }

        // Alt + K: Show keyboard shortcuts
        if (e.altKey && e.key === 'k') {
          e.preventDefault();
          this.showKeyboardShortcuts();
        }

        // Escape: Close modals/panels
        if (e.key === 'Escape') {
          this.closeAllModals();
        }

        // Tab navigation improvements
        if (e.key === 'Tab') {
          this.handleTabNavigation(e);
        }

        // Arrow key navigation for menus
        if (e.key.startsWith('Arrow')) {
          this.handleArrowNavigation(e);
        }
      });
    }

    handleTabNavigation(event) {
      // Add visible focus indicator
      document.body.classList.add('keyboard-nav');
      
      // Remove on mouse movement
      document.addEventListener('mousemove', () => {
        document.body.classList.remove('keyboard-nav');
      }, { once: true });
    }

    handleArrowNavigation(event) {
      const activeElement = document.activeElement;
      
      // Handle navigation menu
      if (activeElement.closest('.nav__menu')) {
        event.preventDefault();
        const links = Array.from(document.querySelectorAll('.nav__link'));
        const currentIndex = links.indexOf(activeElement);
        
        if (event.key === 'ArrowRight' && currentIndex < links.length - 1) {
          links[currentIndex + 1].focus();
        } else if (event.key === 'ArrowLeft' && currentIndex > 0) {
          links[currentIndex - 1].focus();
        }
      }

      // Handle select elements
      if (activeElement.tagName === 'SELECT' && !event.altKey) {
        return; // Let default behavior handle it
      }

      // Handle custom dropdowns
      if (activeElement.closest('[role="combobox"]')) {
        this.handleComboboxNavigation(event);
      }
    }

    handleComboboxNavigation(event) {
      const combobox = event.target.closest('[role="combobox"]');
      const listbox = combobox.querySelector('[role="listbox"]');
      const options = Array.from(listbox.querySelectorAll('[role="option"]'));
      const currentOption = listbox.querySelector('[aria-selected="true"]');
      const currentIndex = options.indexOf(currentOption);

      let newIndex = currentIndex;

      switch (event.key) {
        case 'ArrowDown':
          newIndex = Math.min(currentIndex + 1, options.length - 1);
          break;
        case 'ArrowUp':
          newIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'Home':
          newIndex = 0;
          break;
        case 'End':
          newIndex = options.length - 1;
          break;
        case 'Enter':
        case ' ':
          this.selectOption(options[currentIndex]);
          return;
        case 'Escape':
          this.closeCombobox(combobox);
          return;
      }

      if (newIndex !== currentIndex) {
        event.preventDefault();
        this.highlightOption(options[newIndex], options[currentIndex]);
      }
    }

    /* ========== Skip Links ========== */
    setupSkipLinks() {
      const skipLinksContainer = document.createElement('div');
      skipLinksContainer.className = 'skip-links';
      
      const skipLinks = [
        { href: '#main-content', text: 'Skip to main content' },
        { href: '#nav', text: 'Skip to navigation' },
        { href: '#playground', text: 'Skip to playground' },
        { href: '#footer', text: 'Skip to footer' }
      ];

      skipLinks.forEach(link => {
        const skipLink = document.createElement('a');
        skipLink.href = link.href;
        skipLink.className = 'skip-link';
        skipLink.textContent = link.text;
        skipLink.addEventListener('click', (e) => {
          e.preventDefault();
          const target = document.querySelector(link.href);
          if (target) {
            target.setAttribute('tabindex', '-1');
            target.focus();
            target.scrollIntoView({ behavior: 'smooth' });
            this.announce(`Navigated to ${link.text.replace('Skip to ', '')}`);
          }
        });
        skipLinksContainer.appendChild(skipLink);
      });

      document.body.insertBefore(skipLinksContainer, document.body.firstChild);
    }

    /* ========== ARIA Setup ========== */
    setupARIA() {
      // Add ARIA labels to navigation
      const nav = document.querySelector('.nav');
      if (nav) {
        nav.setAttribute('role', 'navigation');
        nav.setAttribute('aria-label', 'Main navigation');
      }

      // Add ARIA labels to main content
      const main = document.querySelector('main');
      if (main) {
        main.setAttribute('role', 'main');
        main.setAttribute('aria-label', 'Main content');
      }

      // Add ARIA labels to footer
      const footer = document.querySelector('.footer');
      if (footer) {
        footer.setAttribute('role', 'contentinfo');
        footer.setAttribute('aria-label', 'Site footer');
      }

      // Label form controls
      document.querySelectorAll('input, select, textarea').forEach(control => {
        if (!control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby')) {
          const label = control.previousElementSibling;
          if (label && label.tagName === 'LABEL') {
            const id = 'label-' + Math.random().toString(36).substr(2, 9);
            label.id = id;
            control.setAttribute('aria-labelledby', id);
          } else {
            // Try to find a descriptive label
            const text = control.placeholder || control.name || control.id || 'Input field';
            control.setAttribute('aria-label', text);
          }
        }
      });

      // Add button roles where needed
      document.querySelectorAll('[data-clickable]').forEach(element => {
        if (!element.getAttribute('role')) {
          element.setAttribute('role', 'button');
          element.setAttribute('tabindex', '0');
          
          // Add keyboard support
          element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              element.click();
            }
          });
        }
      });

      // Label icons
      document.querySelectorAll('.icon').forEach(icon => {
        const parent = icon.parentElement;
        if (parent.tagName === 'A' || parent.tagName === 'BUTTON') {
          if (!parent.textContent.trim().replace(icon.textContent, '')) {
            icon.setAttribute('aria-hidden', 'true');
            parent.setAttribute('aria-label', parent.title || 'Icon button');
          }
        }
      });
    }

    /* ========== Focus Management ========== */
    trapFocus(container) {
      const focusableElements = container.querySelectorAll(
        'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      // Store current focus
      this.previousFocus = document.activeElement;

      // Focus first element
      firstFocusable?.focus();

      // Create focus trap handler
      this.focusTrap = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
              e.preventDefault();
              lastFocusable?.focus();
            }
          } else {
            if (document.activeElement === lastFocusable) {
              e.preventDefault();
              firstFocusable?.focus();
            }
          }
        }
      };

      container.addEventListener('keydown', this.focusTrap);
    }

    releaseFocus(container) {
      if (this.focusTrap) {
        container.removeEventListener('keydown', this.focusTrap);
        this.focusTrap = null;
      }
      
      // Restore previous focus
      if (this.previousFocus) {
        this.previousFocus.focus();
        this.previousFocus = null;
      }
    }

    /* ========== Preferences Panel ========== */
    setupPreferencesPanel() {
      const panel = document.createElement('div');
      panel.className = 'a11y-panel'; // Start collapsed by default (CSS handles this)
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', 'Accessibility preferences');
      panel.setAttribute('aria-hidden', 'true');

      panel.innerHTML = `
        <button class="a11y-toggle" aria-label="Toggle accessibility preferences" aria-expanded="false">
          <span aria-hidden="true">♿</span>
        </button>
        <div class="a11y-options">
          <h3 style="margin-bottom: var(--space-3); font-size: var(--font-size-md);">Accessibility</h3>
          
          <div class="a11y-option">
            <input type="checkbox" id="a11y-high-contrast">
            <label for="a11y-high-contrast">High Contrast</label>
          </div>
          
          <div class="a11y-option">
            <input type="checkbox" id="a11y-reduced-motion">
            <label for="a11y-reduced-motion">Reduce Motion</label>
          </div>
          
          <div class="a11y-option">
            <input type="checkbox" id="a11y-large-text">
            <label for="a11y-large-text">Large Text</label>
          </div>
          
          <div class="a11y-option">
            <input type="checkbox" id="a11y-keyboard-indicators">
            <label for="a11y-keyboard-indicators">Show Focus Indicators</label>
          </div>
          
          <div class="a11y-option">
            <input type="checkbox" id="a11y-screen-reader">
            <label for="a11y-screen-reader">Screen Reader Mode</label>
          </div>
          
          <div class="a11y-option" style="margin-top: var(--space-3);">
            <label for="a11y-color-blind">Color Blind Mode:</label>
            <select id="a11y-color-blind" style="width: 100%; margin-top: var(--space-2);">
              <option value="">None</option>
              <option value="protanopia">Protanopia</option>
              <option value="deuteranopia">Deuteranopia</option>
              <option value="tritanopia">Tritanopia</option>
              <option value="monochrome">Monochrome</option>
            </select>
          </div>
          
          <button class="btn-primary" style="margin-top: var(--space-4); width: 100%;" id="a11y-reset">
            Reset to Defaults
          </button>
        </div>
      `;

      document.body.appendChild(panel);
      this.preferencesPanel = panel;

      // Bind panel events
      const toggle = panel.querySelector('.a11y-toggle');
      toggle.addEventListener('click', () => this.togglePreferencesPanel());

      // Bind preference changes
      panel.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const pref = e.target.id.replace('a11y-', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          this.preferences[pref] = e.target.checked;
          this.applyPreference(pref, e.target.checked);
          this.savePreferences();
          this.announce(`${e.target.nextElementSibling.textContent} ${e.target.checked ? 'enabled' : 'disabled'}`);
        });
      });

      const colorBlindSelect = panel.querySelector('#a11y-color-blind');
      colorBlindSelect.addEventListener('change', (e) => {
        this.preferences.colorBlindMode = e.target.value || null;
        this.applyColorBlindMode(e.target.value);
        this.savePreferences();
        this.announce(`Color blind mode: ${e.target.value || 'none'}`);
      });

      panel.querySelector('#a11y-reset').addEventListener('click', () => {
        this.resetPreferences();
        this.announce('Accessibility preferences reset to defaults');
      });
    }

    togglePreferencesPanel() {
      const isExpanded = this.preferencesPanel.classList.contains('expanded');
      this.preferencesPanel.classList.toggle('expanded');
      this.preferencesPanel.setAttribute('aria-hidden', isExpanded ? 'true' : 'false');
      this.preferencesPanel.querySelector('.a11y-toggle').setAttribute('aria-expanded', !isExpanded);
      
      if (isExpanded) {
        this.releaseFocus(this.preferencesPanel);
      } else {
        this.trapFocus(this.preferencesPanel);
      }
      
      this.announce(isExpanded ? 'Accessibility panel closed' : 'Accessibility panel opened');
    }

    applyPreferences() {
      Object.entries(this.preferences).forEach(([key, value]) => {
        this.applyPreference(key, value);
      });
    }

    applyPreference(preference, value) {
      switch (preference) {
        case 'highContrast':
          document.body.classList.toggle('high-contrast', value);
          break;
        case 'reducedMotion':
          document.body.classList.toggle('reduce-motion', value);
          break;
        case 'largeText':
          document.documentElement.style.fontSize = value ? '125%' : '';
          break;
        case 'keyboardIndicators':
          document.body.classList.toggle('show-focus', value);
          break;
        case 'screenReaderMode':
          document.body.classList.toggle('screen-reader-mode', value);
          if (value) {
            this.enhanceForScreenReaders();
          }
          break;
      }
    }

    applyColorBlindMode(mode) {
      document.body.classList.remove('protanopia', 'deuteranopia', 'tritanopia', 'monochrome');
      if (mode) {
        document.body.classList.add(mode);
        this.addColorBlindFilters();
      }
    }

    addColorBlindFilters() {
      // Add SVG filters for color blind modes
      if (!document.getElementById('colorblind-filters')) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.display = 'none';
        svg.innerHTML = `
          <defs id="colorblind-filters">
            <filter id="protanopia">
              <feColorMatrix type="matrix" values="
                0.567, 0.433, 0,     0, 0
                0.558, 0.442, 0,     0, 0
                0,     0.242, 0.758, 0, 0
                0,     0,     0,     1, 0"/>
            </filter>
            <filter id="deuteranopia">
              <feColorMatrix type="matrix" values="
                0.625, 0.375, 0,   0, 0
                0.7,   0.3,   0,   0, 0
                0,     0.3,   0.7, 0, 0
                0,     0,     0,   1, 0"/>
            </filter>
            <filter id="tritanopia">
              <feColorMatrix type="matrix" values="
                0.95, 0.05,  0,     0, 0
                0,    0.433, 0.567, 0, 0
                0,    0.475, 0.525, 0, 0
                0,    0,     0,     1, 0"/>
            </filter>
            <filter id="monochrome">
              <feColorMatrix type="saturate" values="0"/>
            </filter>
          </defs>
        `;
        document.body.appendChild(svg);
      }
    }

    enhanceForScreenReaders() {
      // Add additional context for screen readers
      document.querySelectorAll('.statusline-preview').forEach(preview => {
        const text = preview.textContent;
        preview.setAttribute('aria-label', `Statusline preview: ${text}`);
      });

      // Add descriptions to color-coded elements
      document.querySelectorAll('[style*="color"]').forEach(element => {
        const color = element.style.color || window.getComputedStyle(element).color;
        if (color.includes('green')) {
          element.setAttribute('aria-description', 'Success indicator');
        } else if (color.includes('red')) {
          element.setAttribute('aria-description', 'Error or high cost indicator');
        } else if (color.includes('yellow')) {
          element.setAttribute('aria-description', 'Warning indicator');
        }
      });
    }

    /* ========== Keyboard Shortcuts Modal ========== */
    showKeyboardShortcuts() {
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-label', 'Keyboard shortcuts');
      
      modal.innerHTML = `
        <div class="modal-content">
          <h2>Keyboard Shortcuts</h2>
          <button class="close-btn" aria-label="Close">×</button>
          
          <table>
            <thead>
              <tr>
                <th>Shortcut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><kbd>Alt</kbd> + <kbd>A</kbd></td><td>Toggle accessibility panel</td></tr>
              <tr><td><kbd>Alt</kbd> + <kbd>H</kbd></td><td>Toggle high contrast</td></tr>
              <tr><td><kbd>Alt</kbd> + <kbd>K</kbd></td><td>Show keyboard shortcuts</td></tr>
              <tr><td><kbd>Esc</kbd></td><td>Close modals/panels</td></tr>
              <tr><td><kbd>Tab</kbd></td><td>Navigate forward</td></tr>
              <tr><td><kbd>Shift</kbd> + <kbd>Tab</kbd></td><td>Navigate backward</td></tr>
              <tr><td><kbd>←</kbd> <kbd>→</kbd></td><td>Navigate menus</td></tr>
              <tr><td><kbd>Enter</kbd> / <kbd>Space</kbd></td><td>Activate buttons</td></tr>
            </tbody>
          </table>
        </div>
      `;

      document.body.appendChild(modal);
      this.trapFocus(modal);
      
      modal.querySelector('.close-btn').addEventListener('click', () => {
        this.releaseFocus(modal);
        modal.remove();
      });

      this.announce('Keyboard shortcuts dialog opened');
    }

    closeAllModals() {
      document.querySelectorAll('.modal').forEach(modal => {
        this.releaseFocus(modal);
        modal.remove();
      });
      
      if (this.preferencesPanel.classList.contains('expanded')) {
        this.togglePreferencesPanel();
      }
    }

    resetPreferences() {
      this.preferences = {
        highContrast: false,
        reducedMotion: false,
        largeText: false,
        keyboardIndicators: true,
        screenReaderMode: false,
        colorBlindMode: null
      };
      
      this.applyPreferences();
      this.savePreferences();
      
      // Update UI
      this.preferencesPanel.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        const pref = checkbox.id.replace('a11y-', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        checkbox.checked = this.preferences[pref] || false;
      });
      
      this.preferencesPanel.querySelector('#a11y-color-blind').value = '';
    }

    /* ========== Event Handlers ========== */
    bindEvents() {
      // Monitor preference changes from system
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        if (this.preferences.reducedMotion !== e.matches) {
          this.preferences.reducedMotion = e.matches;
          this.applyPreference('reducedMotion', e.matches);
          this.savePreferences();
          this.announce(`Reduced motion ${e.matches ? 'enabled' : 'disabled'} based on system preference`);
        }
      });

      window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
        if (this.preferences.highContrast !== e.matches) {
          this.preferences.highContrast = e.matches;
          this.applyPreference('highContrast', e.matches);
          this.savePreferences();
          this.announce(`High contrast ${e.matches ? 'enabled' : 'disabled'} based on system preference`);
        }
      });

      // Announce page changes for screen readers
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1 && node.classList?.contains('status-message')) {
                this.announce(node.textContent, 'assertive');
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    toggleHighContrast() {
      this.preferences.highContrast = !this.preferences.highContrast;
      this.applyPreference('highContrast', this.preferences.highContrast);
      this.savePreferences();
      
      // Update checkbox
      const checkbox = document.getElementById('a11y-high-contrast');
      if (checkbox) {
        checkbox.checked = this.preferences.highContrast;
      }
      
      this.announce(`High contrast ${this.preferences.highContrast ? 'enabled' : 'disabled'}`);
    }
  }

  /* ========== Initialize Accessibility ========== */
  function initAccessibility() {
    window.a11y = new AccessibilityManager();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccessibility);
  } else {
    initAccessibility();
  }

})();