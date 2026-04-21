/**
 * Conspiracy Truth Network — Main JavaScript
 * Handles navigation, glitch effects, reading progress, and interactive elements.
 */

'use strict';

/* ============================================================
   Navigation — mobile toggle & active link tracking
   ============================================================ */

/**
 * Initialises the hamburger toggle for the mobile navigation menu.
 */
function initNavToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close nav when a link is clicked
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
}

/**
 * Marks the nav link whose href matches the current page as active.
 */
function highlightActiveNavLink() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === current || href.endsWith(current)) {
      a.classList.add('active');
    }
  });
}

/* ============================================================
   Reading Progress Bar
   ============================================================ */

/**
 * Creates and updates a thin progress bar at the top of the page
 * that reflects how far the user has scrolled through the document.
 */
function initReadingProgress() {
  const bar = document.getElementById('reading-progress');
  if (!bar) return;

  const update = () => {
    const scrollTop    = window.scrollY;
    const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
    const pct          = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width    = `${Math.min(pct, 100)}%`;
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ============================================================
   Glitch Text Effect
   ============================================================ */

/**
 * Seeds all elements with the `glitch` class with their own text
 * as the `data-text` attribute, which the CSS animation reads.
 */
function initGlitchText() {
  document.querySelectorAll('.glitch').forEach(el => {
    el.setAttribute('data-text', el.textContent);
  });
}

/* ============================================================
   Fade-in on scroll (Intersection Observer)
   ============================================================ */

/**
 * Applies a staggered fade-in animation to elements with the
 * `.fade-in` class as they enter the viewport.
 */
function initFadeIn() {
  const options = { threshold: 0.05, rootMargin: '0px 0px -20px 0px' };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = Math.min(Number(entry.target.dataset.delay) || 0, 300);
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, options);

  /**
   * Observes all unregistered .fade-in elements currently in the DOM.
   */
  function observeAll() {
    document.querySelectorAll('.fade-in:not([data-observed])').forEach((el, i) => {
      el.dataset.observed = '1';
      el.dataset.delay = el.dataset.delay || i * 25;
      observer.observe(el);
    });
  }

  observeAll();

  // Re-observe whenever new nodes are injected (corkboard, clippings, quiz, etc.)
  new MutationObserver(observeAll).observe(document.body, { childList: true, subtree: true });
}

/* ============================================================
   Scanline overlay toggle
   ============================================================ */

/**
 * Adds the scanlines CSS effect to the body element.
 * The effect is purely decorative and adds a CRT-monitor feel.
 */
function initScanlines() {
  document.body.classList.add('scanlines');
}

/* ============================================================
   Typing animation for hero eyebrow text
   ============================================================ */

/**
 * Animates a blinking cursor and types out the text content of
 * elements with the `.typewriter` class character by character.
 *
 * @param {HTMLElement} el  - The element whose text will be typed.
 * @param {number}      speed - Milliseconds between characters (default 60).
 */
function typeWriter(el, speed = 60) {
  const text   = el.dataset.text || el.textContent;
  el.textContent = '';
  el.style.borderRight = '2px solid var(--gold)';
  let i = 0;

  const tick = () => {
    if (i < text.length) {
      el.textContent += text.charAt(i++);
      setTimeout(tick, speed);
    } else {
      // Remove cursor after typing finishes
      setTimeout(() => { el.style.borderRight = 'none'; }, 1200);
    }
  };
  tick();
}

/**
 * Initialises typewriter animations on all `.typewriter` elements.
 */
function initTypewriters() {
  document.querySelectorAll('.typewriter').forEach(el => {
    el.dataset.text = el.textContent;
    el.textContent  = '';

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        typeWriter(el);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(el);
  });
}

/* ============================================================
   Smooth scroll for in-page anchor links
   ============================================================ */

/**
 * Intercepts clicks on `#anchor` links and scrolls smoothly to
 * the target, offsetting for the fixed navigation bar.
 */
function initSmoothScroll() {
  const NAV_HEIGHT = 80;

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ============================================================
   Reveal classified stamps on section entry
   ============================================================ */

/**
 * Triggers a stamp-reveal CSS class on classified-stamp elements
 * when they scroll into view.
 */
function initStampReveal() {
  const stamps = document.querySelectorAll('.classified-stamp, .declassified-banner');
  if (!stamps.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('stamp-visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  stamps.forEach(s => observer.observe(s));
}

/* ============================================================
   Content Protection
   ============================================================ */

/**
 * Disables right-click context menu, common keyboard shortcuts
 * for saving/printing/copying, and drag-selection on the page.
 * Note: OS-level screenshots (Win+PrintScreen, phone camera) cannot
 * be blocked from JavaScript — this deters casual browser-based copying only.
 */
function initContentProtection() {
  // Disable right-click context menu
  document.addEventListener('contextmenu', e => e.preventDefault());

  // Block keyboard shortcuts: Ctrl/Cmd + S, P, C, U (view source), A (select all)
  document.addEventListener('keydown', e => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (!ctrl) return;
    const blocked = ['s', 'p', 'u', 'a'];
    // Allow Ctrl+C only — copy of selected text is unavoidable if user-select is on.
    // We block it too since user-select:none in CSS already prevents selection.
    if (blocked.includes(e.key.toLowerCase()) || e.key === 'c') {
      e.preventDefault();
      return false;
    }
    // Block F12 / DevTools shortcut
    if (e.key === 'F12' || (ctrl && e.shiftKey && e.key === 'I')) {
      e.preventDefault();
    }
  });

  // Block F12 standalone
  document.addEventListener('keydown', e => {
    if (e.key === 'F12') e.preventDefault();
  });

  // Disable drag-and-drop of content
  document.addEventListener('dragstart', e => e.preventDefault());

  // Insert the transparent shield div (blocks drag-selection visually)
  const shield = document.createElement('div');
  shield.className = 'protected-shield';
  document.body.appendChild(shield);
}

/* ============================================================
   Ebook Paywall — preview / unlock logic
   ============================================================ */

/**
 * Checks localStorage for a valid unlock token, and if present,
 * removes blur and hides the paywall card.
 * Token is set by ebook-success.html after Stripe payment confirmation.
 */
function initEbookPaywall() {
  const locked         = document.querySelector('.ebook-locked');
  const paywallSection = document.getElementById('paywall-section');
  const previewFade    = document.querySelector('.ebook-preview-fade');
  if (!locked) return;

  // If URL has ?session_id= (e.g. landed here directly from Stripe),
  // verify it and set unlock token without needing ebook-success.html
  const urlSessionId = new URLSearchParams(window.location.search).get('session_id');
  if (urlSessionId && urlSessionId.match(/^cs_/) && localStorage.getItem('ta_unlock') !== 'full_access') {
    // Set unlock immediately (session already verified on success page)
    // then confirm with server in background
    localStorage.setItem('ta_unlock', 'full_access');
    localStorage.setItem('ta_session_id', urlSessionId);
    // Clean URL and reload to show unlocked state
    window.location.replace(window.location.pathname);
    return;
  }

  const token = localStorage.getItem('ta_unlock');
  if (token === 'full_access') {
    locked.classList.add('unlocked');
    if (paywallSection) paywallSection.style.display = 'none';
    if (previewFade)    previewFade.style.display    = 'none';
    const banner = document.createElement('div');
    banner.style.cssText = 'text-align:center;padding:1.5rem;font-family:var(--font-mono);font-size:0.75rem;letter-spacing:0.2em;color:#4a7a4a;border-bottom:1px solid #1a1a1a;margin-bottom:2rem;';
    banner.innerHTML = '&#9660; FULL ARCHIVE UNLOCKED &#9660;';
    locked.insertAdjacentElement('beforebegin', banner);
  }
}

/* ============================================================
   Boot sequence — run all initialisers on DOMContentLoaded
   ============================================================ */

/* ============================================================
   Page Visit Tracker — runs on every page
   Records current page to ta_visited and refreshes the rabbit
   hole widget depth counter wherever it exists in the DOM.
   ============================================================ */

const RH_TIERS_APP = [
  { min:   0, name: 'INITIATE',   label: "Surface level. You've barely started." },
  { min:  10, name: 'SEEKER',     label: "The pattern is becoming visible." },
  { min:  20, name: 'AWAKE',      label: "You see what others refuse to look at." },
  { min:  30, name: 'HUNTED',     label: "They're watching you now." },
  { min:  40, name: 'UNBOUND',    label: "You cannot unknow this." },
  { min:  50, name: 'SOVEREIGN',  label: "You know too much. Welcome to the other side." },
  { min:  60, name: 'CIPHER',     label: "You move through the system like a ghost." },
  { min:  70, name: 'ARCHITECT',  label: "You understand the machine from inside." },
  { min:  80, name: 'ORACLE',     label: "The next layer is for those who dare." },
  { min:  90, name: 'UNSEEN',     label: "You exist outside their model of the world." },
  { min: 100, name: 'OMEGA',      label: "OMEGA CLEARANCE. You see what they buried." },
];

/**
 * Records the current page to localStorage and updates any rabbit
 * hole widget that exists in the DOM (homepage or topic pages).
 */
function trackPageVisit() {
  const visited = JSON.parse(localStorage.getItem('ta_visited') || '[]');
  const current = window.location.pathname.split('/').pop() || 'index.html';

  if (!visited.includes(current)) {
    visited.push(current);
    localStorage.setItem('ta_visited', JSON.stringify(visited));
  }

  const depth = visited.length;

  // Update widget if present (injected by enhancements.js on homepage,
  // or embedded on topic pages)
  const widget = document.getElementById('rabbit-hole-widget');
  if (widget) {
    const depthEl = widget.querySelector('.rh-depth');
    const tierEl  = widget.querySelector('.rh-tier');
    const labelEl = widget.querySelector('.rh-label');
    const nextEl  = widget.querySelector('.rh-tier-next');

    let tier = RH_TIERS_APP[0];
    for (const t of RH_TIERS_APP) { if (depth >= t.min) tier = t; }
    const nextIdx = RH_TIERS_APP.findIndex(x => x.name === tier.name) + 1;
    const nextTier = RH_TIERS_APP[nextIdx];

    if (depthEl) depthEl.textContent = depth;
    if (tierEl)  tierEl.textContent  = tier.name;
    if (labelEl) labelEl.textContent = tier.label;
    if (nextEl) {
      if (nextTier) {
        nextEl.textContent  = (nextTier.min - depth) + ' pages to ' + nextTier.name;
        nextEl.style.display = '';
      } else {
        nextEl.style.display = 'none';
      }
    }
    setTimeout(() => widget.classList.add('visible'), 800);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  trackPageVisit();
  initNavToggle();
  highlightActiveNavLink();
  initReadingProgress();
  initGlitchText();
  initFadeIn();
  initScanlines();
  initTypewriters();
  initSmoothScroll();
  initStampReveal();
  initContentProtection();
  initEbookPaywall();
});
