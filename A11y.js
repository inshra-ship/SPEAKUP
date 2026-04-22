/* ============================================
   SPEAKUP — ACCESSIBILITY SYSTEM (a11y.js)
   Features:
   - Font size control (SM / MD / LG / XL)
   - High contrast toggle
   - Reduced motion toggle
   - Dyslexia-friendly font
   - Line spacing boost
   - Underline links toggle
   - Strong focus indicators
   - Color blind simulation filters
   - Screen reader announcer
   - Keyboard navigation helpers
   - Preference persistence (localStorage)
   ============================================ */

(function() {

  // ── SVG filters for color blindness (injected once) ──
  function injectColorFilters() {
    if (document.getElementById('a11y-svg-filters')) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'a11y-svg-filters';
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
    svg.innerHTML = `
      <defs>
        <filter id="protanopia-filter">
          <feColorMatrix type="matrix" values="
            0.567 0.433 0     0 0
            0.558 0.442 0     0 0
            0     0.242 0.758 0 0
            0     0     0     1 0"/>
        </filter>
        <filter id="deuteranopia-filter">
          <feColorMatrix type="matrix" values="
            0.625 0.375 0   0 0
            0.700 0.300 0   0 0
            0     0.300 0.700 0 0
            0     0     0   1 0"/>
        </filter>
        <filter id="tritanopia-filter">
          <feColorMatrix type="matrix" values="
            0.950 0.050 0     0 0
            0     0.433 0.567 0 0
            0     0.475 0.525 0 0
            0     0     0     1 0"/>
        </filter>
      </defs>
    `;
    document.body.appendChild(svg);
  }

  // ── Build the accessibility panel HTML ──
  function buildA11yPanel() {
    // Skip link
    if (!document.querySelector('.skip-link')) {
      const skip = document.createElement('a');
      skip.className = 'skip-link';
      skip.href = '#main-content';
      skip.textContent = 'Skip to main content';
      document.body.insertBefore(skip, document.body.firstChild);
    }

    // Live region for screen readers
    if (!document.getElementById('a11y-announcer')) {
      const ann = document.createElement('div');
      ann.id = 'a11y-announcer';
      ann.setAttribute('aria-live', 'polite');
      ann.setAttribute('aria-atomic', 'true');
      ann.setAttribute('role', 'status');
      document.body.appendChild(ann);
    }

    // Don't build twice
    if (document.getElementById('a11y-toolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.id = 'a11y-toolbar';
    toolbar.setAttribute('role', 'complementary');
    toolbar.setAttribute('aria-label', 'Accessibility options');
    toolbar.innerHTML = `
      <button id="a11y-toolbar-toggle" aria-expanded="false" aria-controls="a11y-panel" title="Open accessibility options">
        Accessibility
      </button>
    `;
    document.body.appendChild(toolbar);

    const panel = document.createElement('div');
    panel.id = 'a11y-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Accessibility settings');
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = `
      <div class="a11y-panel-title">Accessibility Options</div>

      <div class="a11y-option">
        <div class="a11y-option-label">Text Size</div>
        <div class="a11y-btn-group">
          <button class="a11y-btn" data-action="font" data-value="font-sm" title="Small text">A-</button>
          <button class="a11y-btn active" data-action="font" data-value="font-md" title="Default text">A</button>
          <button class="a11y-btn" data-action="font" data-value="font-lg" title="Large text">A+</button>
          <button class="a11y-btn" data-action="font" data-value="font-xl" title="Extra large text">A++</button>
        </div>
      </div>

      <div class="a11y-option">
        <div class="a11y-option-label">Display</div>
        <div class="a11y-btn-group">
          <button class="a11y-btn" data-action="toggle" data-value="high-contrast" title="High contrast mode">High Contrast</button>
          <button class="a11y-btn" data-action="toggle" data-value="reduce-motion" title="Reduce animations">No Motion</button>
          <button class="a11y-btn" data-action="toggle" data-value="extra-spacing" title="More line spacing">Spacing</button>
          <button class="a11y-btn" data-action="toggle" data-value="underline-links" title="Underline all links">Underline Links</button>
          <button class="a11y-btn" data-action="toggle" data-value="strong-focus" title="Stronger focus rings">Strong Focus</button>
        </div>
      </div>

      <div class="a11y-option">
        <div class="a11y-option-label">Reading</div>
        <div class="a11y-btn-group">
          <button class="a11y-btn" data-action="toggle" data-value="dyslexia-font" title="Dyslexia-friendly font">Dyslexia Font</button>
          <button class="a11y-btn" data-action="toggle" data-value="show-hints" title="Show all form hints">Show Hints</button>
        </div>
      </div>

      <div class="a11y-option">
        <div class="a11y-option-label">Color Vision</div>
        <div class="a11y-btn-group">
          <button class="a11y-btn" data-action="colorblind" data-value="" title="Normal vision">Normal</button>
          <button class="a11y-btn" data-action="colorblind" data-value="protanopia" title="Red-blind simulation">Protanopia</button>
          <button class="a11y-btn" data-action="colorblind" data-value="deuteranopia" title="Green-blind simulation">Deuteranopia</button>
          <button class="a11y-btn" data-action="colorblind" data-value="tritanopia" title="Blue-blind simulation">Tritanopia</button>
        </div>
      </div>

      <div class="a11y-option" style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);">
        <button class="a11y-btn" id="a11y-reset" style="width:100%;justify-content:center;text-align:center;" title="Reset all accessibility settings">
          Reset All Settings
        </button>
      </div>

      <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);">
        <p style="font-size:11px;color:var(--text-muted);line-height:1.6;">
          Your preferences are saved automatically and will apply every time you visit SpeakUp.
        </p>
      </div>
    `;
    document.body.appendChild(panel);
  }

  // ── Preferences saved to localStorage ──
  const PREFS_KEY = 'sps_a11y';

  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); }
    catch { return {}; }
  }
  function savePrefs(prefs) {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }

  // ── Apply a single class group (font size — only one active at a time) ──
  const FONT_CLASSES = ['font-sm', 'font-md', 'font-lg', 'font-xl'];
  const COLORBLIND_CLASSES = ['protanopia', 'deuteranopia', 'tritanopia'];

  function applyFont(val) {
    FONT_CLASSES.forEach(c => document.body.classList.remove(c));
    if (val) document.body.classList.add(val);
    document.querySelectorAll('[data-action="font"]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === val);
    });
  }

  function applyColorblind(val) {
    COLORBLIND_CLASSES.forEach(c => document.body.classList.remove(c));
    if (val) document.body.classList.add(val);
    document.querySelectorAll('[data-action="colorblind"]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === val);
    });
  }

  function applyToggle(val, active) {
    document.body.classList.toggle(val, active);
    const btn = document.querySelector(`[data-action="toggle"][data-value="${val}"]`);
    if (btn) btn.classList.toggle('active', active);
  }

  function applyAllPrefs(prefs) {
    applyFont(prefs.font || 'font-md');
    applyColorblind(prefs.colorblind || '');
    const toggles = ['high-contrast','reduce-motion','extra-spacing','underline-links','strong-focus','dyslexia-font','show-hints'];
    toggles.forEach(t => applyToggle(t, !!prefs[t]));
  }

  // ── Screen reader announcer ──
  function announce(msg) {
    const el = document.getElementById('a11y-announcer');
    if (!el) return;
    el.textContent = '';
    setTimeout(() => { el.textContent = msg; }, 50);
  }

  // ── Main init ──
  function initA11y() {
    injectColorFilters();
    buildA11yPanel();

    // Add id to main content if missing
    const main = document.querySelector('main') || document.querySelector('.page-wrapper');
    if (main && !main.id) main.id = 'main-content';

    const prefs = loadPrefs();
    applyAllPrefs(prefs);

    // Toggle panel open/close
    const toggleBtn = document.getElementById('a11y-toolbar-toggle');
    const panel = document.getElementById('a11y-panel');

    toggleBtn?.addEventListener('click', () => {
      const isOpen = panel.classList.contains('open');
      panel.classList.toggle('open', !isOpen);
      toggleBtn.setAttribute('aria-expanded', String(!isOpen));
      panel.setAttribute('aria-hidden', String(isOpen));
      if (!isOpen) announce('Accessibility options panel opened');
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && panel?.classList.contains('open')) {
        panel.classList.remove('open');
        toggleBtn?.setAttribute('aria-expanded', 'false');
        panel.setAttribute('aria-hidden', 'true');
        toggleBtn?.focus();
      }
    });

    // Close if clicking outside panel
    document.addEventListener('click', e => {
      if (panel?.classList.contains('open') &&
          !panel.contains(e.target) &&
          !toggleBtn?.contains(e.target)) {
        panel.classList.remove('open');
        toggleBtn?.setAttribute('aria-expanded', 'false');
        panel.setAttribute('aria-hidden', 'true');
      }
    });

    // Button interactions inside panel
    panel?.addEventListener('click', e => {
      const btn = e.target.closest('.a11y-btn');
      if (!btn || btn.id === 'a11y-reset') return;

      const action = btn.dataset.action;
      const val = btn.dataset.value;
      const prefs = loadPrefs();

      if (action === 'font') {
        prefs.font = val;
        applyFont(val);
        announce('Text size changed to ' + val.replace('font-',''));
      } else if (action === 'toggle') {
        const isOn = document.body.classList.contains(val);
        prefs[val] = !isOn;
        applyToggle(val, !isOn);
        announce(val.replace(/-/g,' ') + ' ' + (!isOn ? 'enabled' : 'disabled'));
      } else if (action === 'colorblind') {
        prefs.colorblind = val;
        applyColorblind(val);
        announce('Color vision mode: ' + (val || 'normal'));
      }

      savePrefs(prefs);
    });

    // Reset button
    document.getElementById('a11y-reset')?.addEventListener('click', () => {
      const defaults = { font: 'font-md' };
      savePrefs(defaults);
      applyAllPrefs(defaults);
      announce('Accessibility settings reset to defaults');
    });

    // ── Keyboard nav: trap focus inside panel when open ──
    panel?.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const focusable = panel.querySelectorAll('button, a, input, select, [tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });

    // ── Add ARIA labels to interactive elements missing them ──
    document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(btn => {
      if (!btn.textContent.trim()) btn.setAttribute('aria-label', 'Button');
    });
    document.querySelectorAll('img:not([alt])').forEach(img => img.setAttribute('alt', ''));
    document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').forEach(input => {
      const label = input.closest('.form-group')?.querySelector('.form-label');
      if (label) input.setAttribute('aria-labelledby', label.id || (label.id = 'lbl-' + Math.random().toString(36).slice(2)));
    });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initA11y);
  } else {
    initA11y();
  }

  // Expose announce globally for other scripts
  window.a11yAnnounce = announce;

})();