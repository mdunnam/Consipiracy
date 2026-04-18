/**
 * Truth Archive — Enhanced Experience Layer
 * Loading screen, rabbit hole tracker, ambient sound,
 * visitor counter, text decode, search, share mechanic.
 */

'use strict';

/* ============================================================
   1. LOADING SCREEN — "Establishing secure connection…"
   ============================================================ */

function dismissLoadingScreen(screen) {
  if (!screen || screen._dismissed) return;
  screen._dismissed = true;
  screen.classList.add('fade-out');
  setTimeout(() => {
    screen.remove();
    sessionStorage.setItem('ta_loaded', '1');
  }, 600);
}

function initLoadingScreen() {
  // Only show on first visit per session
  if (sessionStorage.getItem('ta_loaded')) {
    document.getElementById('ta-loading-screen')?.remove();
    return;
  }

  const screen = document.getElementById('ta-loading-screen');
  if (!screen) return;

  // Hard safety timeout — always dismiss after 6s no matter what
  const safetyTimer = setTimeout(() => dismissLoadingScreen(screen), 6000);

  const lines = [
    'ESTABLISHING SECURE CONNECTION…',
    'DECRYPTING ARCHIVE CONTENTS…',
    'BYPASSING CONTENT FILTERS…',
    'ANONYMISING REQUEST…',
    'LOADING CLASSIFIED MATERIALS…',
    'ACCESS GRANTED.',
  ];

  const log = screen.querySelector('.loading-log');
  const bar = screen.querySelector('.loading-bar-fill');
  let lineIndex = 0;

  const appendLine = () => {
    try {
      if (log) {
        const span = document.createElement('div');
        span.className = 'loading-line';
        span.textContent = '> ' + lines[lineIndex];
        if (lineIndex === lines.length - 1) span.classList.add('access-granted');
        log.appendChild(span);
      }
      if (bar) {
        bar.style.width = ((lineIndex + 1) / lines.length * 100) + '%';
      }
      lineIndex++;

      if (lineIndex < lines.length) {
        setTimeout(appendLine, 280 + Math.random() * 220);
      } else {
        clearTimeout(safetyTimer);
        setTimeout(() => dismissLoadingScreen(screen), 700);
      }
    } catch(e) {
      clearTimeout(safetyTimer);
      dismissLoadingScreen(screen);
    }
  };

  setTimeout(appendLine, 300);
}

/* ============================================================
   2. RABBIT HOLE TRACKER — depth + chapter counter
   ============================================================ */

function updateRabbitHoleWidget(depth) {
  const widget = document.getElementById('rabbit-hole-widget');
  if (!widget) return;
  const counter = widget.querySelector('.rh-depth');
  const label   = widget.querySelector('.rh-label');
  if (counter) counter.textContent = depth;
  if (label) {
    if (depth < 3)       label.textContent = "Surface level. You've barely started.";
    else if (depth < 10) label.textContent = "Going deeper. There's no coming back.";
    else if (depth < 25) label.textContent = "They're watching you now.";
    else if (depth < 50) label.textContent = "You know too much.";
    else                 label.textContent = "LEVEL OMEGA. You see what they don't want you to see.";
  }
  setTimeout(() => widget.classList.add('visible'), 2000);
}

function initRabbitHoleTracker() {
  const visited = JSON.parse(localStorage.getItem('ta_visited') || '[]');
  const current = window.location.pathname.split('/').pop() || 'index.html';

  if (!visited.includes(current)) {
    visited.push(current);
    localStorage.setItem('ta_visited', JSON.stringify(visited));
  }

  const localDepth = visited.length;
  updateRabbitHoleWidget(localDepth);

  // If the user has a paid session ID, sync with server
  const sessionId = localStorage.getItem('ta_session_id');
  if (!sessionId) return;

  // Push local state to server, get back merged depth
  fetch('/depth/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, depth: localDepth, visited })
  })
  .then(r => r.ok ? r.json() : null)
  .then(data => {
    if (!data) return;
    // Server may know about more pages from other devices
    if (data.depth > localDepth) {
      // Merge server visited list into local
      const merged = [...new Set([...visited, ...(data.visited || [])])];
      localStorage.setItem('ta_visited', JSON.stringify(merged));
      updateRabbitHoleWidget(data.depth);
    }
  })
  .catch(() => {}); // fail silently — tracker is non-critical
}

// On new device: pull server depth immediately after unlock restores session ID
function syncDepthFromServer(sessionId) {
  fetch('/depth/' + encodeURIComponent(sessionId))
  .then(r => r.ok ? r.json() : null)
  .then(data => {
    if (!data || !data.depth) return;
    const local = JSON.parse(localStorage.getItem('ta_visited') || '[]');
    const merged = [...new Set([...local, ...(data.visited || [])])];
    localStorage.setItem('ta_visited', JSON.stringify(merged));
    updateRabbitHoleWidget(data.depth);
  })
  .catch(() => {});
}

/* ============================================================
   3. AMBIENT SOUND — atmospheric toggle
   ============================================================ */

function initAmbientSound() {
  const btn = document.getElementById('ambient-toggle');
  if (!btn) return;

  // Generate white noise via Web Audio API — no external file needed
  let audioCtx = null;
  let sourceNode = null;
  let gainNode = null;
  let playing = false;

  function createNoise() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const bufferSize = audioCtx.sampleRate * 3; // 3-second looping buffer
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.08;
    }

    // Add occasional morse-code-like blips
    for (let i = 0; i < 6; i++) {
      const pos = Math.floor(Math.random() * (bufferSize - 200));
      for (let j = 0; j < 120; j++) {
        data[pos + j] += Math.sin(j * 0.3) * 0.06;
      }
    }

    sourceNode = audioCtx.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.loop = true;

    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0;

    // Low-pass filter for "shortwave radio" feel
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    sourceNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    sourceNode.start();
  }

  btn.addEventListener('click', () => {
    if (!audioCtx) createNoise();

    if (!playing) {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      gainNode.gain.setTargetAtTime(0.35, audioCtx.currentTime, 0.5);
      btn.classList.add('active');
      btn.title = 'Disable ambient sound';
      playing = true;
    } else {
      gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
      btn.classList.remove('active');
      btn.title = 'Enable ambient sound';
      playing = false;
    }
  });
}

/* ============================================================
   4. VISITOR COUNTER — "X researchers currently active"
   ============================================================ */

function initVisitorCounter() {
  const el = document.querySelector('.live-visitor-count');
  if (!el) return;

  // Base count: seeded from localStorage so it looks consistent per device
  const seed = parseInt(localStorage.getItem('ta_vseed') || '0');
  if (!seed) {
    const s = 600 + Math.floor(Math.random() * 400);
    localStorage.setItem('ta_vseed', s);
  }

  const base = parseInt(localStorage.getItem('ta_vseed'));

  function getCount() {
    const t = Math.floor(Date.now() / 1000);
    // Oscillate ±80 on a slow sine wave
    const wave = Math.round(Math.sin(t / 180) * 80);
    // Fast noise: ±12
    const noise = Math.round(Math.sin(t / 13) * 12);
    return Math.max(100, base + wave + noise);
  }

  const update = () => {
    el.textContent = getCount().toLocaleString();
  };

  update();
  setInterval(update, 7000);
}

/* ============================================================
   5. TEXT DECODE ANIMATION — characters scramble then resolve
   ============================================================ */

const DECODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

function decodeText(el) {
  const target = el.dataset.decode || el.textContent;
  el.dataset.decode = target;
  let frame = 0;
  const totalFrames = target.length * 3;

  const tick = () => {
    const progress = frame / totalFrames;
    let output = '';
    for (let i = 0; i < target.length; i++) {
      const charProgress = (frame - i * 2) / (totalFrames * 0.5);
      if (charProgress >= 1 || target[i] === ' ') {
        output += target[i];
      } else {
        output += DECODE_CHARS[Math.floor(Math.random() * DECODE_CHARS.length)];
      }
    }
    el.textContent = output;
    frame++;
    if (frame <= totalFrames) requestAnimationFrame(tick);
    else el.textContent = target;
  };

  requestAnimationFrame(tick);
}

function initDecodeOnScroll() {
  const elements = document.querySelectorAll('.decode-on-scroll');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        decodeText(e.target);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  elements.forEach(el => observer.observe(el));
}

/* ============================================================
   6. SEARCH MODAL — classified database search
   ============================================================ */

// Full topic index — slug → title → keywords
const SEARCH_INDEX = [
  { url:'flat-earth.html', title:'Flat Earth & The Cosmological Lie', tags:'flat earth firmament dome ice wall globe psyop' },
  { url:'great-awakening.html', title:'The Great Awakening', tags:'q qanon white hats plan storm cabal' },
  { url:'deep-state.html', title:'The Deep State & Shadow Government', tags:'deep state cia shadow government false flags agenda 2030' },
  { url:'secret-societies.html', title:'Secret Societies & Ancient Orders', tags:'illuminati freemasons skull bones bohemian grove jesuits' },
  { url:'banking-control.html', title:'The Central Banking Cartel', tags:'rothschild federal reserve bis petrodollar debt slavery' },
  { url:'media-control.html', title:'Media Control & Propaganda', tags:'operation mockingbird media control propaganda censorship' },
  { url:'space-deception.html', title:'The Space Program Deception', tags:'nasa space lies moon landing hoax van allen belt' },
  { url:'big-pharma.html', title:'Big Pharma & Medical Control', tags:'big pharma vaccines covid fluoride cancer cures suppressed' },
  { url:'tech-control.html', title:'Technology & Digital Control', tags:'5g surveillance ai smart cities prism digital id' },
  { url:'false-flags.html', title:'False Flags & Staged Events', tags:'false flags 911 jfk staged sandy hook las vegas' },
  { url:'suppressed-history.html', title:'Suppressed History & The SSP', tags:'tartaria mud flood secret space program ancient history' },
  { url:'metaphysical.html', title:'Metaphysical & Spiritual Truth', tags:'consciousness pineal dmt law of one ascension 5d' },
  // Topics
  { url:'topics/great-awakening/rothschilds.html', title:'Rothschild Family', tags:'rothschild banking dynasty war finance bloodline' },
  { url:'topics/great-awakening/federal-reserve.html', title:'Federal Reserve', tags:'federal reserve private bank fiat money currency' },
  { url:'topics/great-awakening/mkultra.html', title:'MKUltra', tags:'mkultra cia mind control experiments monarch' },
  { url:'topics/great-awakening/epstein-network.html', title:'Epstein Network', tags:'epstein maxwell trafficking blackmail elite' },
  { url:'topics/great-awakening/9-11-inside-job.html', title:'9/11 Inside Job', tags:'911 inside job wtc7 nanothermite false flag pnac' },
  { url:'topics/great-awakening/chemtrails.html', title:'Chemtrails / Geoengineering', tags:'chemtrails geoengineering weather control haarp' },
  { url:'topics/great-awakening/draco-reptilians.html', title:'Draco & Reptilian Alliance', tags:'reptilians draco shapeshifting alien control' },
  { url:'topics/great-awakening/annunaki.html', title:'Annunaki', tags:'annunaki sumerian creation aliens nibiru genes' },
  { url:'topics/great-awakening/nikola-tesla.html', title:'Nikola Tesla', tags:'tesla free energy suppressed wardenclyffe 369' },
  { url:'topics/great-awakening/dmt.html', title:'DMT & The Spirit Molecule', tags:'dmt psychedelic consciousness machine elves spirit molecule' },
  { url:'topics/great-awakening/tartaria.html', title:'Tartaria & Suppressed History', tags:'tartaria mud flood hidden empire reset history' },
  { url:'topics/great-awakening/jfk-assassination.html', title:'JFK Assassination', tags:'jfk kennedy assassination conspiracy single bullet' },
  { url:'topics/great-awakening/pizzagate.html', title:'Pizzagate', tags:'pizzagate podesta comet ping pong trafficking elite' },
  { url:'topics/great-awakening/bill-gates.html', title:'Bill Gates', tags:'bill gates vaccine population control microsoft who' },
  { url:'topics/flat-earth/firmament.html', title:'The Firmament', tags:'firmament dome flat earth sky solid biblical' },
  { url:'topics/flat-earth/nasa-space-fakery.html', title:'NASA Space Fakery', tags:'nasa fakery cgi moon footage lies studio' },
  { url:'topics/great-awakening/secret-space-program.html', title:'Secret Space Program', tags:'secret space program ssp solar warden dark fleet' },
  { url:'topics/great-awakening/dumbs.html', title:'DUMBs — Deep Underground Military Bases', tags:'dumbs underground bases military bunkers tunnels' },
  { url:'topics/great-awakening/adrenochrome.html', title:'Adrenochrome', tags:'adrenochrome elite harvesting trafficking ritual' },
  { url:'topics/great-awakening/covid-plandemic.html', title:'COVID-19 Plandemic', tags:'covid plandemic event 201 gain of function bioweapon' },
  { url:'topics/great-awakening/transhumanism.html', title:'Transhumanism & Neurotech', tags:'transhumanism neuralink darpa graphene microchip merge' },
  { url:'ebook.html', title:'The Truth Archive eBook', tags:'ebook download read classified archive full access' },
];

function buildSearchModal() {
  const modal = document.createElement('div');
  modal.id = 'search-modal';
  modal.className = 'search-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Archive Search');
  modal.innerHTML = `
    <div class="search-modal-inner">
      <div class="search-header">
        <span class="search-label">SEARCH CLASSIFIED ARCHIVE</span>
        <button class="search-close" aria-label="Close search">✕</button>
      </div>
      <div class="search-input-wrap">
        <span class="search-prompt">&gt;</span>
        <input type="text" class="search-input" placeholder="Enter search query…" autocomplete="off" spellcheck="false" />
      </div>
      <div class="search-results"></div>
      <div class="search-footer">
        <span class="search-count"></span>
        <span class="search-hint">Press <kbd>ESC</kbd> to close</span>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const input   = modal.querySelector('.search-input');
  const results = modal.querySelector('.search-results');
  const countEl = modal.querySelector('.search-count');
  const closeBtn= modal.querySelector('.search-close');

  closeBtn.addEventListener('click', closeSearch);
  modal.addEventListener('click', e => { if (e.target === modal) closeSearch(); });

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { results.innerHTML = ''; countEl.textContent = ''; return; }

    const matches = SEARCH_INDEX.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.tags.toLowerCase().includes(q)
    ).slice(0, 12);

    countEl.textContent = matches.length ? `${matches.length} file${matches.length > 1 ? 's' : ''} found` : 'No files found';

    if (!matches.length) {
      results.innerHTML = '<div class="search-no-result">[ NO MATCHING RECORDS — QUERY MAY BE CLASSIFIED ]</div>';
      return;
    }

    results.innerHTML = matches.map((item, i) => `
      <a href="${item.url}" class="search-result-item" style="animation-delay:${i * 40}ms">
        <span class="sr-icon">▶</span>
        <span class="sr-title">${highlightMatch(item.title, q)}</span>
        <span class="sr-url">${item.url}</span>
      </a>
    `).join('');
  });

  return modal;
}

function highlightMatch(text, q) {
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(re, '<mark>$1</mark>');
}

let searchModal = null;

function openSearch() {
  if (!searchModal) searchModal = buildSearchModal();
  searchModal.classList.add('open');
  setTimeout(() => searchModal.querySelector('.search-input').focus(), 50);
  document.body.style.overflow = 'hidden';
}

function closeSearch() {
  searchModal?.classList.remove('open');
  document.body.style.overflow = '';
}

function initSearch() {
  // Keyboard shortcut: Ctrl+K or /
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeSearch(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
      return;
    }
    // '/' key when not in an input
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      openSearch();
    }
  });

  // Search button in nav
  document.querySelectorAll('.search-trigger').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); openSearch(); });
  });
}

/* ============================================================
   7. SHARE MECHANIC — "You were sent here" interstitial
   ============================================================ */

function initShareMechanic() {
  // Check if this is a "classified access" share URL
  const params = new URLSearchParams(window.location.search);
  if (params.get('access') === 'classified') {
    showAccessInterstitial();
  }

  // Build share buttons
  document.querySelectorAll('.share-classified-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const url = new URL(window.location.href);
      url.searchParams.set('access', 'classified');
      const shareText = 'Someone accessed a classified file and shared it with you. You have been granted limited access.';
      if (navigator.share) {
        navigator.share({ title: 'You have been granted access', url: url.toString(), text: shareText });
      } else {
        navigator.clipboard?.writeText(url.toString()).then(() => {
          btn.textContent = 'LINK COPIED';
          setTimeout(() => btn.textContent = 'SHARE THIS FILE', 2000);
        });
      }
    });
  });
}

function showAccessInterstitial() {
  const overlay = document.createElement('div');
  overlay.className = 'access-interstitial';
  overlay.innerHTML = `
    <div class="access-inner">
      <div class="access-icon">⚠</div>
      <div class="access-label">CLASSIFIED ACCESS</div>
      <h2 class="access-title">You Were Sent Here</h2>
      <p class="access-body">Someone who has gone deep into the Archive has granted you access to this classified file. Read carefully. This information is actively suppressed.</p>
      <button class="access-enter-btn">ENTER THE ARCHIVE</button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // Remove the ?access= param from the URL without reload
  const clean = new URL(window.location.href);
  clean.searchParams.delete('access');
  window.history.replaceState({}, '', clean.toString());

  overlay.querySelector('.access-enter-btn').addEventListener('click', () => {
    overlay.classList.add('fade-out');
    document.body.style.overflow = '';
    setTimeout(() => overlay.remove(), 500);
  });
}

/* ============================================================
   8. INJECT PERSISTENT UI ELEMENTS into every page
   ============================================================ */

function initDepthSync() {
  // On page load: if we have a session ID but visited list is short,
  // pull from server (handles "new device" case where localStorage was blank)
  const sessionId = localStorage.getItem('ta_session_id');
  if (!sessionId) return;
  const visited = JSON.parse(localStorage.getItem('ta_visited') || '[]');
  // Only sync from server if local is sparse (new device)
  if (visited.length < 3) {
    syncDepthFromServer(sessionId);
  }
}

function injectPersistentUI() {
  // Rabbit hole widget
  if (!document.getElementById('rabbit-hole-widget')) {
    const widget = document.createElement('div');
    widget.id = 'rabbit-hole-widget';
    widget.className = 'rabbit-hole-widget';
    widget.innerHTML = `
      <div class="rh-header">🐇 RABBIT HOLE DEPTH</div>
      <div class="rh-count"><span class="rh-depth">0</span> <span class="rh-unit">levels deep</span></div>
      <div class="rh-label"></div>
    `;
    document.body.appendChild(widget);
  }

  // Ambient sound toggle button
  if (!document.getElementById('ambient-toggle')) {
    const btn = document.createElement('button');
    btn.id = 'ambient-toggle';
    btn.className = 'ambient-toggle';
    btn.title = 'Enable ambient sound';
    btn.innerHTML = '📻';
    document.body.appendChild(btn);
  }

  // Live visitor counter — inject into any .live-counter-wrap elements
  document.querySelectorAll('.live-counter-wrap').forEach(wrap => {
    if (!wrap.querySelector('.live-visitor-count')) {
      wrap.innerHTML = `<span class="live-dot"></span> <span class="live-visitor-count">—</span> researchers currently active`;
    }
  });

  // Add search trigger to nav if not present
  const nav = document.querySelector('.nav-links');
  if (nav && !nav.querySelector('.search-trigger')) {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#" class="search-trigger" title="Search archive (Ctrl+K)">🔍</a>`;
    nav.appendChild(li);
  }

  // Add share button to every page's header
  const pageHeader = document.querySelector('.page-header .container-narrow, .hero .container');
  if (pageHeader && !pageHeader.querySelector('.share-classified-btn')) {
    const btn = document.createElement('button');
    btn.className = 'share-classified-btn';
    btn.textContent = 'SHARE THIS FILE';
    pageHeader.appendChild(btn);
  }
}

/* ============================================================
   BOOT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  injectPersistentUI();
  initLoadingScreen();
  initRabbitHoleTracker();
  initAmbientSound();
  initVisitorCounter();
  initDecodeOnScroll();
  initSearch();
  initShareMechanic();
  initDepthSync();
});
