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

const RH_TIERS = [
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

function getRhTier(depth) {
  let tier = RH_TIERS[0];
  for (const t of RH_TIERS) { if (depth >= t.min) tier = t; }
  return tier;
}

function updateRabbitHoleWidget(depth) {
  const widget = document.getElementById('rabbit-hole-widget');
  if (!widget) return;
  const counter = widget.querySelector('.rh-depth');
  const label   = widget.querySelector('.rh-label');
  const tier    = widget.querySelector('.rh-tier');
  const tier2   = widget.querySelector('.rh-tier-next');
  const t       = getRhTier(depth);
  const nextIdx = RH_TIERS.findIndex(x => x.name === t.name) + 1;
  const nextTier = RH_TIERS[nextIdx];
  if (counter) counter.textContent = depth;
  if (tier)    tier.textContent    = t.name;
  if (label)   label.textContent   = t.label;
  if (tier2) {
    if (nextTier) {
      const toNext = nextTier.min - depth;
      tier2.textContent = toNext + ' pages to ' + nextTier.name;
      tier2.style.display = '';
    } else {
      tier2.style.display = 'none';
    }
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

function buildRestoreModal() {
  // Only on ebook page
  if (!window.location.pathname.includes('ebook')) return;
  // Build modal
  if (document.getElementById('restore-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'restore-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:99990;background:rgba(2,2,2,0.94);display:none;align-items:center;justify-content:center;padding:2rem;';
  modal.innerHTML = `
    <div style="background:#0a0a0a;border:1px solid rgba(201,162,39,0.35);max-width:480px;width:100%;padding:2rem;position:relative;">
      <button onclick="closeRestoreModal()" style="position:absolute;top:0.8rem;right:0.8rem;background:none;border:none;color:#4a4a4a;cursor:pointer;font-size:1rem;">&#x2715;</button>
      <div style="font-family:var(--font-mono);font-size:0.6rem;letter-spacing:0.3em;color:var(--red-bright);margin-bottom:1rem;">RESTORE ACCESS</div>
      <h3 style="color:var(--gold);font-size:1.1rem;margin-bottom:0.5rem;">Already purchased?</h3>
      <p style="font-size:0.85rem;color:#7a7a7a;margin-bottom:1.5rem;line-height:1.6;">Enter your purchase email and we'll resend your access link, or paste your session ID directly.</p>

      <div style="display:flex;gap:0;margin-bottom:1.2rem;border:1px solid #1a1a1a;">
        <button id="rmod-tab-email" onclick="switchRestoreTab('email')" style="flex:1;padding:0.45rem;font-family:var(--font-mono);font-size:0.6rem;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;background:#c9a227;color:#000;border:none;">Email Me</button>
        <button id="rmod-tab-session" onclick="switchRestoreTab('session')" style="flex:1;padding:0.45rem;font-family:var(--font-mono);font-size:0.6rem;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;background:transparent;color:#4a4a4a;border:none;">Session ID</button>
      </div>

      <div id="rmod-email-panel">
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <input id="rmod-email-input" type="email" placeholder="your@email.com"
            style="flex:1;min-width:160px;background:#111;border:1px solid #2a2a2a;color:#d8d8d8;padding:0.55rem 0.8rem;font-family:var(--font-mono);font-size:0.78rem;outline:none;" />
          <button onclick="modalResendAccess()" style="background:transparent;border:1px solid rgba(201,162,39,0.5);color:#c9a227;font-family:var(--font-mono);font-size:0.7rem;letter-spacing:0.1em;padding:0.55rem 1rem;cursor:pointer;white-space:nowrap;">SEND</button>
        </div>
        <div id="rmod-email-msg" style="font-family:var(--font-mono);font-size:0.68rem;margin-top:0.6rem;color:#4a4a4a;min-height:1rem;"></div>
      </div>

      <div id="rmod-session-panel" style="display:none;">
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <input id="rmod-session-input" type="text" placeholder="cs_live_..."
            style="flex:1;min-width:160px;background:#111;border:1px solid #2a2a2a;color:#d8d8d8;padding:0.55rem 0.8rem;font-family:var(--font-mono);font-size:0.78rem;outline:none;" />
          <button onclick="modalRestoreSession()" style="background:transparent;border:1px solid rgba(201,162,39,0.5);color:#c9a227;font-family:var(--font-mono);font-size:0.7rem;letter-spacing:0.1em;padding:0.55rem 1rem;cursor:pointer;white-space:nowrap;">RESTORE</button>
        </div>
        <div id="rmod-session-msg" style="font-family:var(--font-mono);font-size:0.68rem;margin-top:0.6rem;color:#4a4a4a;min-height:1rem;"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) closeRestoreModal(); });
}

window.openRestoreModal  = () => { const m = document.getElementById('restore-modal'); if(m) { m.style.display='flex'; document.body.style.overflow='hidden'; } };
window.closeRestoreModal = () => { const m = document.getElementById('restore-modal'); if(m) { m.style.display='none'; document.body.style.overflow=''; } };

window.switchRestoreTab = (tab) => {
  document.getElementById('rmod-email-panel').style.display   = tab==='email'   ? 'block' : 'none';
  document.getElementById('rmod-session-panel').style.display = tab==='session' ? 'block' : 'none';
  document.getElementById('rmod-tab-email').style.cssText   = 'flex:1;padding:0.45rem;font-family:var(--font-mono);font-size:0.6rem;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;border:none;' + (tab==='email'   ? 'background:#c9a227;color:#000;' : 'background:transparent;color:#4a4a4a;');
  document.getElementById('rmod-tab-session').style.cssText = 'flex:1;padding:0.45rem;font-family:var(--font-mono);font-size:0.6rem;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;border:none;' + (tab==='session' ? 'background:#c9a227;color:#000;' : 'background:transparent;color:#4a4a4a;');
};

window.modalResendAccess = async () => {
  const email = document.getElementById('rmod-email-input').value.trim();
  const msg   = document.getElementById('rmod-email-msg');
  if (!email || !email.includes('@')) { msg.style.color='#cc2222'; msg.textContent='Enter a valid email.'; return; }
  msg.style.color='#4a7a4a'; msg.textContent='Sending...';
  try {
    const res  = await fetch('/resend-access', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email}) });
    const data = await res.json();
    msg.textContent = data.sent ? 'If a purchase was found, your link has been sent. Check your inbox.' : (data.error || 'Error. Try again.');
    if (!data.sent) msg.style.color = '#cc2222';
  } catch(e) { msg.style.color='#cc2222'; msg.textContent='Server error.'; }
};

window.modalRestoreSession = async () => {
  const sessionId = document.getElementById('rmod-session-input').value.trim();
  const msg       = document.getElementById('rmod-session-msg');
  if (!sessionId.match(/^cs_/)) { msg.style.color='#cc2222'; msg.textContent='Should start with cs_'; return; }
  msg.style.color='#4a7a4a'; msg.textContent='Verifying...';
  try {
    const res  = await fetch('/verify-session/' + encodeURIComponent(sessionId));
    const data = await res.json();
    if (data.valid) {
      localStorage.setItem('ta_unlock', 'full_access');
      localStorage.setItem('ta_session_id', sessionId);
      msg.textContent = 'Restored! Reloading...';
      setTimeout(() => window.location.reload(), 800);
    } else { msg.style.color='#cc2222'; msg.textContent='Not found or payment incomplete.'; }
  } catch(e) { msg.style.color='#cc2222'; msg.textContent='Server error.'; }
};

function injectPersistentUI() {
  // Rabbit hole widget
  if (!document.getElementById('rabbit-hole-widget')) {
    const widget = document.createElement('div');
    widget.id = 'rabbit-hole-widget';
    widget.className = 'rabbit-hole-widget';
    widget.innerHTML = `
      <div class="rh-header">&#x2B21; RABBIT HOLE DEPTH</div>
      <div class="rh-count"><span class="rh-depth">0</span> <span class="rh-unit">levels deep</span></div>
      <div class="rh-tier">INITIATE</div>
      <div class="rh-label"></div>
      <div class="rh-tier-next"></div>
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


/* ============================================================
   FEATURE 1 — REDACTED TEXT REVEALS
   Usage: <span class="redacted">secret word</span>
   ============================================================ */

function initRedactedReveals() {
  const els = document.querySelectorAll('.redacted');
  if (!els.length) return;
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@%$';
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      obs.unobserve(e.target);
      const el = e.target;
      const original = el.dataset.text || el.textContent;
      el.dataset.text = original;
      el.classList.add('redacted-revealed');
      let iter = 0;
      const total = original.length;
      const interval = setInterval(() => {
        el.textContent = original.split('').map((c, i) => {
          if (c === ' ') return ' ';
          if (i < iter) return original[i];
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join('');
        iter += 0.4;
        if (iter >= total) {
          el.textContent = original;
          clearInterval(interval);
        }
      }, 30);
    });
  }, { threshold: 0.6 });
  els.forEach(el => {
    el.dataset.text = el.textContent;
    obs.observe(el);
  });
}

/* ============================================================
   FEATURE 2 — RECENTLY ACCESSED TICKER
   ============================================================ */

function initAccessTicker() {
  if (document.getElementById('ta-access-ticker')) return;
  const ENTRIES = [
    'Unknown user accessed: Banking Control',
    'New researcher entered: Deep State',
    'File opened: Secret Societies',
    'Anomalous access detected: Flat Earth',
    'Signal traced: Media Control',
    'Session began: The Great Awakening',
    'Document retrieved: False Flags',
    'Terminal unlocked: Space Deception',
    'Identity masked: Big Pharma',
    'Location: UNKNOWN — accessed: Suppressed History',
    'Clearance elevated: Tech Control',
    'WARNING: Monitored access to Metaphysical',
  ];
  const wrap = document.createElement('div');
  wrap.id = 'ta-access-ticker';
  wrap.className = 'access-ticker';
  const inner = document.createElement('div');
  inner.className = 'access-ticker-inner';
  const timeAgo = () => {
    const n = Math.floor(Math.random() * 9) + 1;
    return n === 1 ? '1 min ago' : n + ' min ago';
  };
  // Build double list for seamless loop
  const items = [...ENTRIES, ...ENTRIES].map(t => {
    const s = document.createElement('span');
    s.className = 'ticker-item';
    s.textContent = t + ' — ' + timeAgo();
    return s;
  });
  items.forEach(i => inner.appendChild(i));
  wrap.appendChild(inner);
  // Insert after nav
  const nav = document.querySelector('.site-nav');
  if (nav) nav.after(wrap);
  else document.body.prepend(wrap);
}

/* ============================================================
   FEATURE 3 — LOCKED CHAPTER 13 (injected into chapter grids)
   ============================================================ */

function injectLockedChapter() {
  const grids = document.querySelectorAll('.grid-3');
  if (!grids.length) return;
  const grid = grids[0];
  if (grid.querySelector('.chapter-locked')) return;
  const card = document.createElement('div');
  card.className = 'chapter-card chapter-locked fade-in';
  card.innerHTML = `
    <div class="chapter-card-body locked-body">
      <span class="chapter-icon locked-icon">🔒</span>
      <div class="locked-stamp">CLASSIFIED</div>
      <h3 class="locked-title">Chapter 13 — [REDACTED]</h3>
      <p class="locked-desc">This file has been restricted. Contents suppressed by order of the
      <span class="redacted" data-text="Oversight Committee">Oversight Committee</span>.
      Omega clearance required to proceed.</p>
      <div class="locked-blur-preview">
        <span></span><span></span><span></span><span></span>
      </div>
    </div>
    <div class="chapter-card-footer">
      <span class="chapter-number" style="color:var(--red-bright);">CHAPTER // 13</span>
      <a href="ebook.html" class="chapter-cta locked-cta">Unlock Access →</a>
    </div>
  `;
  grid.appendChild(card);
}

/* ============================================================
   FEATURE 4 — HERO CONSTELLATION CANVAS
   ============================================================ */

function initConstellationCanvas() {
  const hero = document.querySelector('.hero-redesign');
  if (!hero || document.getElementById('ta-constellation')) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'ta-constellation';
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.35;';
  hero.insertBefore(canvas, hero.firstChild);

  const ctx = canvas.getContext('2d');
  let W, H, nodes;
  const NUM = 38, MAX_DIST = 160;

  function resize() {
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
  }

  function makeNodes() {
    nodes = Array.from({ length: NUM }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.8 + 0.6,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Lines
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < MAX_DIST) {
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(201,162,39,${0.15 * (1 - d/MAX_DIST)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
    // Nodes
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(201,162,39,0.55)';
      ctx.fill();
    });
    // Move
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    });
    requestAnimationFrame(draw);
  }

  resize();
  makeNodes();
  draw();
  window.addEventListener('resize', () => { resize(); makeNodes(); });
}

/* ============================================================
   FEATURE 5 — CIPHER DECODE ON SECTION HEADERS
   ============================================================ */

function initCipherHeaders() {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%@!?';
  const headers = document.querySelectorAll('.section-header h2:not(.decode-done)');
  if (!headers.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      obs.unobserve(e.target);
      const el = e.target;
      el.classList.add('decode-done');
      const original = el.textContent;
      let iter = 0;
      const interval = setInterval(() => {
        el.textContent = original.split('').map((c, i) => {
          if (c === ' ') return ' ';
          if (i < iter) return original[i];
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join('');
        iter += 0.35;
        if (iter >= original.length) { el.textContent = original; clearInterval(interval); }
      }, 28);
    });
  }, { threshold: 0.5 });
  headers.forEach(h => obs.observe(h));
}

/* ============================================================
   FEATURE 6 — CORKBOARD / CONSPIRACY BOARD (injected section)
   ============================================================ */

function injectCorkboard() {
  if (document.getElementById('ta-corkboard-section')) return;
  const ref = document.querySelector('#spotlight');
  if (!ref) return;
  const section = document.createElement('section');
  section.id = 'ta-corkboard-section';
  section.className = 'section corkboard-section';
  section.innerHTML = `
    <div class="container">
      <div class="section-header fade-in">
        <span class="eyebrow">The Board</span>
        <h2>Everything Connects</h2>
        <div class="divider"></div>
        <p>Every thread leads back to the same origin. Pull one — and the whole board moves.</p>
      </div>
      <div class="corkboard fade-in">

        <!-- SVG thread overlay — coordinates match 4-col grid pin centres -->
        <svg class="cork-threads-svg" viewBox="0 0 100 100" preserveAspectRatio="none"
             xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- a(12.5,25) → b(37.5,25) -->
          <line x1="12.5" y1="25" x2="37.5" y2="25" class="ct ct-red"/>
          <!-- b(37.5,25) → d(87.5,25) passing over c -->
          <line x1="37.5" y1="25" x2="87.5" y2="25" class="ct ct-red"/>
          <!-- a(12.5,25) → f(37.5,75) diagonal cross -->
          <line x1="12.5" y1="25" x2="37.5" y2="75" class="ct ct-gold"/>
          <!-- b(37.5,25) → e(12.5,75) -->
          <line x1="37.5" y1="25" x2="12.5" y2="75" class="ct ct-gold"/>
          <!-- c(62.5,25) → g(62.5,75) vertical -->
          <line x1="62.5" y1="25" x2="62.5" y2="75" class="ct ct-red"/>
          <!-- d(87.5,25) → g(62.5,75) diagonal -->
          <line x1="87.5" y1="25" x2="62.5" y2="75" class="ct ct-white"/>
          <!-- b(37.5,25) → g(62.5,75) long cross -->
          <line x1="37.5" y1="25" x2="62.5" y2="75" class="ct ct-gold"/>
          <!-- e(12.5,75) → g(62.5,75) bottom row -->
          <line x1="12.5" y1="75" x2="62.5" y2="75" class="ct ct-red"/>
        </svg>

        <div class="cork-pin pin-a">
          <div class="cork-photo"><span>[ PHOTO ]</span><div class="photo-label">Bilderberg Meeting 2019</div></div>
        </div>
        <div class="cork-pin pin-b">
          <div class="cork-note note-red">The Fed was created<br>in secret — December 23,<br>1913. Congress was empty.</div>
        </div>
        <div class="cork-pin pin-c">
          <div class="cork-photo"><span>[ MAP ]</span><div class="photo-label">Known Deep State Nodes</div></div>
        </div>
        <div class="cork-pin pin-d">
          <div class="cork-note note-gold">"Who controls the<br>past controls the future."<br>— Orwell</div>
        </div>
        <div class="cork-pin pin-e">
          <div class="cork-photo"><span>[ DIAGRAM ]</span><div class="photo-label">Bloodline Family Tree</div></div>
        </div>
        <div class="cork-pin pin-f">
          <div class="cork-note note-white">Operation Mockingbird:<br>CIA planted journalists<br>in 25+ major outlets.</div>
        </div>
        <div class="cork-pin pin-g">
          <div class="cork-photo"><span>[ DOCUMENT ]</span><div class="photo-label">Declassified: Op. Northwoods</div></div>
        </div>
      </div>
    </div>
  `;
  ref.before(section);
}

/* ============================================================
   FEATURE 7 — ARCHIVE PROGRESS BAR
   ============================================================ */

function initArchiveProgress() {
  const TOTAL = 422;
  const visited = JSON.parse(localStorage.getItem('ta_visited') || '[]');
  const pct = Math.min(100, Math.round((visited.length / TOTAL) * 100));

  // Conspiracy-themed rank names
  // Every 10 pages up to 100, then every 25 up to 500, then every 50 up to 1000
  const LEVELS = [
    [0,   'Uninitiated'],
    [10,  'Curious Citizen'],
    [20,  'Normie Awakening'],
    [30,  'Red Pill Seeker'],
    [40,  'Pattern Watcher'],
    [50,  'Signal Receiver'],
    [60,  'Veil Lifter'],
    [70,  'Thread Puller'],
    [80,  'Rabbit Hole Diver'],
    [90,  'Archive Initiate'],
    [100, 'Order of the Initiated'],
    [125, 'Shadow Reader'],
    [150, 'Deep State Analyst'],
    [175, 'Bloodline Tracker'],
    [200, 'Symbol Decoder'],
    [225, 'False Flag Investigator'],
    [250, 'Network Cartographer'],
    [275, 'Omega Clearance Seeker'],
    [300, 'Cabal Architect'],
    [325, 'Reality Hacker'],
    [350, 'Firmament Witness'],
    [375, 'Level Omega Agent'],
    [400, 'The Awakened Elite'],
    [425, 'Black Site Operative'],
    [450, 'Cipher Breaker'],
    [475, 'Watcher of Watchers'],
    [500, 'Grandmaster of the Hidden Thread'],
    [550, 'Keeper of Forbidden Records'],
    [600, 'Architect of the Veil'],
    [650, 'Inner Sanctum Scholar'],
    [700, 'Oracle of the Deep State'],
    [750, 'Shepherd of Lost Signals'],
    [800, 'Chronicler of the Damned'],
    [850, 'The Unseen Hand'],
    [900, 'Lux et Tenebris'],
    [950, 'Sovereign of the Firmament'],
    [1000, 'Illuminated One'],
  ];

  /**
   * Returns the rank name for a given page count.
   * @param {number} count - Number of pages accessed.
   * @returns {string} The rank name.
   */
  function getRankName(count) {
    let name = LEVELS[0][1];
    for (const [threshold, label] of LEVELS) {
      if (count >= threshold) name = label;
      else break;
    }
    return name;
  }

  const bars = document.querySelectorAll('.archive-progress-wrap');
  bars.forEach(wrap => {
    wrap.querySelector('.ap-count').textContent  = visited.length;
    wrap.querySelector('.ap-total').textContent  = TOTAL;
    wrap.querySelector('.ap-pct').textContent    = pct + '%';
    const levelEl = wrap.querySelector('.ap-level');
    if (levelEl) levelEl.textContent = '\u25CF ' + getRankName(visited.length);
    const fill = wrap.querySelector('.ap-fill');
    setTimeout(() => { fill.style.width = Math.max(pct, 0.4) + '%'; }, 400);
  });
}

/* ============================================================
   FEATURE 8 — NAV EYE BLINK
   ============================================================ */

function initEyeBlink() {
  const eye = document.querySelector('.nav-logo .eye-symbol');
  if (!eye) return;
  eye.classList.add('eye-blink');
}


/* ============================================================
   FEATURE: COUNTDOWN TIMER — "Next document drop"
   ============================================================ */
function initDocumentDropCountdown() {
  const wraps = document.querySelectorAll('.doc-drop-countdown');
  if (!wraps.length) return;
  function getNextMidnight() {
    const d = new Date(); d.setHours(24,0,0,0); return d;
  }
  function fmt(ms) {
    const s = Math.floor(ms/1000);
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
    return [h,m,sec].map(n=>String(n).padStart(2,'0')).join(':');
  }
  function tick() {
    const remaining = getNextMidnight() - Date.now();
    wraps.forEach(w => { w.textContent = fmt(remaining); });
  }
  tick();
  setInterval(tick, 1000);
}

/* ============================================================
   FEATURE: SUBSCRIBER COUNTER — animated count-up
   ============================================================ */
function initSubscriberCounter() {
  const els = document.querySelectorAll('.sub-counter');
  if (!els.length) return;
  const TARGET = 847293;
  const base = parseInt(localStorage.getItem('ta_subbase') || '0');
  if (!base) localStorage.setItem('ta_subbase', TARGET + Math.floor(Math.random()*1200));
  const display = parseInt(localStorage.getItem('ta_subbase'));
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      obs.unobserve(e.target);
      const el = e.target;
      let cur = 0;
      const step = Math.ceil(display / 80);
      const iv = setInterval(() => {
        cur = Math.min(cur + step, display);
        el.textContent = cur.toLocaleString();
        if (cur >= display) clearInterval(iv);
      }, 18);
    });
  }, { threshold: 0.5 });
  els.forEach(el => obs.observe(el));
}

/* ============================================================
   FEATURE: ASK THE ORACLE widget
   ============================================================ */
const ORACLE_RESPONSES = [
  { keys:['bank','fed','money','debt','finance','rothschild','reserve'],  reply:'The Federal Reserve has never been fully audited. Chapter 05 holds the ledger.' },
  { keys:['flat','earth','globe','nasa','space','firmament','dome'],       reply:'The horizon does not curve. Begin your investigation at Chapter 01.' },
  { keys:['deep','state','cia','nsa','shadow','government','intel'],       reply:'The shadow government predates every administration. Chapter 03 is the entry point.' },
  { keys:['media','news','propaganda','cnn','mockingbird','press'],        reply:'Operation Mockingbird never ended. It merely evolved. See Chapter 06.' },
  { keys:['secret','society','mason','illuminati','skull','bohemian'],     reply:'The orders do not recruit — they select. Chapter 04 maps the bloodlines.' },
  { keys:['pharma','vaccine','medicine','cancer','cure','rockefeller'],    reply:'The cure has always existed. The suppression is the product. Chapter 08.' },
  { keys:['tech','5g','surveillance','ai','chip','transhumanist'],         reply:'Every smart device reports upward. Chapter 09 traces the nodes.' },
  { keys:['history','tartaria','mud','flood','reset','ancient'],           reply:'The civilisation you were taught about is an edited fiction. Chapter 11.' },
  { keys:['consciousness','pineal','dmt','spiritual','metaphysical'],      reply:'The deepest layer of control targets the mind itself. Chapter 12.' },
  { keys:['awakening','q','plan','storm','white','hat'],                   reply:'The Storm is not coming. It has already begun. Chapter 02.' },
  { keys:['false','flag','911','9/11','staged','operation'],               reply:'Every major event follows the same template. Chapter 10 runs the pattern.' },
  { keys:['ebook','book','download','read','buy','purchase'],              reply:'The complete archive — all 12 chapters — is available. Access via the eBook.' },
  { keys:['who','start','begin','new','first'],                            reply:'You did not find this archive by accident. Begin at Chapter 01 or consult the Connection Map.' },
];
const ORACLE_FALLBACK = [
  'That signal is classified at this clearance level.',
  'The archive does not yet index that thread. Keep descending.',
  'Seek first what you already suspect. The answer is already here.',
  'Every question leads to the same door. Which chapter calls to you?',
  'The pattern is visible to those who look. Begin anywhere.',
];

function initOracle() {
  if (document.getElementById('ta-oracle')) return;
  const wrap = document.createElement('div');
  wrap.id = 'ta-oracle';
  wrap.className = 'oracle-widget';
  wrap.innerHTML = `
    <div class="oracle-toggle" id="oracle-toggle" title="Ask the Oracle">&#x1F441;</div>
    <div class="oracle-panel" id="oracle-panel">
      <div class="oracle-header">
        <span class="oracle-title">&#x2B21; THE ORACLE</span>
        <button class="oracle-close" id="oracle-close">&#x2715;</button>
      </div>
      <div class="oracle-messages" id="oracle-messages">
        <div class="oracle-msg oracle-msg-in">Ask anything. The archive will answer.</div>
      </div>
      <div class="oracle-input-row">
        <input class="oracle-input" id="oracle-input" type="text" placeholder="Enter your query…" maxlength="120" autocomplete="off" />
        <button class="oracle-send" id="oracle-send">&#x21A9;</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  const toggle = document.getElementById('oracle-toggle');
  const panel  = document.getElementById('oracle-panel');
  const close  = document.getElementById('oracle-close');
  const input  = document.getElementById('oracle-input');
  const send   = document.getElementById('oracle-send');
  const msgs   = document.getElementById('oracle-messages');

  toggle.addEventListener('click', () => { wrap.classList.toggle('open'); if (wrap.classList.contains('open')) input.focus(); });
  close.addEventListener('click',  () => wrap.classList.remove('open'));

  function addMsg(text, dir) {
    const d = document.createElement('div');
    d.className = 'oracle-msg oracle-msg-' + dir;
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function respond(query) {
    const q = query.toLowerCase();
    let reply = null;
    for (const r of ORACLE_RESPONSES) {
      if (r.keys.some(k => q.includes(k))) { reply = r.reply; break; }
    }
    if (!reply) reply = ORACLE_FALLBACK[Math.floor(Math.random() * ORACLE_FALLBACK.length)];
    setTimeout(() => addMsg(reply, 'in'), 650);
  }

  function submit() {
    const val = input.value.trim();
    if (!val) return;
    addMsg(val, 'out');
    input.value = '';
    respond(val);
  }

  send.addEventListener('click', submit);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
}

/* ============================================================
   FEATURE: CHAPTER-SPECIFIC AMBIENT SOUND
   ============================================================ */
const PAGE_AUDIO_PROFILES = {
  'deep-state.html':       { type:'phone',     freq:440,  q:8,    gain:0.12 },
  'banking-control.html':  { type:'ticker',    freq:1200, q:20,   gain:0.08 },
  'space-deception.html':  { type:'shortwave', freq:600,  q:2,    gain:0.15 },
  'flat-earth.html':       { type:'wind',      freq:200,  q:1,    gain:0.10 },
  'secret-societies.html': { type:'drone',     freq:80,   q:0.5,  gain:0.14 },
  'metaphysical.html':     { type:'drone',     freq:40,   q:0.3,  gain:0.12 },
  'great-awakening.html':  { type:'shortwave', freq:900,  q:3,    gain:0.13 },
  'big-pharma.html':       { type:'phone',     freq:500,  q:6,    gain:0.10 },
};
function getPageAudioProfile() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  return PAGE_AUDIO_PROFILES[page] || null;
}
// Patch initAmbientSound to use per-page profile when available
const _origAmbient = typeof initAmbientSound === 'function' ? initAmbientSound : null;
function patchAmbientForPage(ctx, gainNode) {
  const profile = getPageAudioProfile();
  if (!profile) return;
  const filter = ctx.createBiquadFilter();
  filter.type = profile.type === 'ticker' ? 'bandpass' : profile.type === 'drone' ? 'lowpass' : 'bandpass';
  filter.frequency.value = profile.freq;
  filter.Q.value = profile.q;
  gainNode.gain.value = profile.gain;
  return filter;
}

/* ============================================================
   FEATURE: NEWSPAPER CLIPPINGS (inject section)
   ============================================================ */
function injectNewspaperClippings() {
  if (document.getElementById('ta-clippings-section')) return;
  const ref = document.getElementById('ta-corkboard-section') || document.querySelector('#spotlight');
  if (!ref) return;
  const section = document.createElement('section');
  section.id = 'ta-clippings-section';
  section.className = 'section clippings-section';
  section.innerHTML = `
    <div class="container">
      <div class="section-header fade-in">
        <span class="eyebrow">Suppressed Press</span>
        <h2>What They Didn't Want You to Read</h2>
        <div class="divider"></div>
        <p>These stories ran once. Then they disappeared.</p>
      </div>
      <div class="clippings-grid fade-in">
        <div class="clipping clipping-rotate-l">
          <div class="clipping-inner">
            <div class="clipping-dateline">THE NATIONAL HERALD &nbsp;·&nbsp; SEPT 14, 1963</div>
            <h3 class="clipping-headline">Senator Found Dead Day Before Scheduled Testimony</h3>
            <p class="clipping-body">Officials have ruled the death of Sen. — — — — — — as accidental, citing a fall from the — — — — floor of the — — — — — — hotel. No investigation has been opened. The Senate subcommittee hearing scheduled for Monday has been postponed indefinitely.</p>
            <div class="clipping-stamp">SUPPRESSED</div>
          </div>
        </div>
        <div class="clipping clipping-rotate-r">
          <div class="clipping-inner">
            <div class="clipping-dateline">THE EVENING WIRE &nbsp;·&nbsp; MAR 3, 1971</div>
            <h3 class="clipping-headline">Documents Reveal Federal Reserve Not Subject to Congressional Audit</h3>
            <p class="clipping-body">A memo circulated among senior Treasury officials confirms that the Federal Reserve Board of Governors operates outside the standard framework of congressional financial oversight. The memo was obtained by this reporter and is reprinted in full — — — — — — — —</p>
            <div class="clipping-stamp clipping-stamp-gold">CLASSIFIED</div>
          </div>
        </div>
        <div class="clipping clipping-rotate-l2">
          <div class="clipping-inner">
            <div class="clipping-dateline">PACIFIC DISPATCH &nbsp;·&nbsp; JUL 22, 1969</div>
            <h3 class="clipping-headline">NASA Engineer: "We Cannot Survive the Van Allen Belts"</h3>
            <p class="clipping-body">In a memo obtained by this correspondent, a senior propulsion engineer at the Manned Spacecraft Center raises serious doubts about crew survivability during the — — — — mission. The engineer, who requested anonymity, states the radiation levels in the — — — — belt would be — — — —</p>
            <div class="clipping-stamp">REDACTED</div>
          </div>
        </div>
      </div>
    </div>
  `;
  ref.before(section);
}

/* ============================================================
   FEATURE: THE PATTERN QUIZ
   ============================================================ */
const QUIZ_QUESTIONS = [
  {
    q: 'Which truth did you find first?',
    opts: [
      { label: '🌐 The world is not what it appears', chapter: 'flat-earth.html',       tier: 'COSMOLOGIST' },
      { label: '🏛️ Those in power are not elected',  chapter: 'deep-state.html',        tier: 'ANALYST' },
      { label: '💰 Money controls everything',        chapter: 'banking-control.html',   tier: 'ECONOMIST' },
      { label: '🔺 Symbols hide in plain sight',      chapter: 'secret-societies.html',  tier: 'DECODER' },
    ]
  },
  {
    q: 'What do you trust least?',
    opts: [
      { label: '📺 The media',       boost: 'media-control.html' },
      { label: '🏛️ The government',  boost: 'deep-state.html' },
      { label: '💊 Medicine',        boost: 'big-pharma.html' },
      { label: '🚀 Official science', boost: 'space-deception.html' },
    ]
  },
  {
    q: 'How deep are you willing to go?',
    opts: [
      { label: 'Show me the evidence',          depth: 'SEEKER'    },
      { label: 'I already know most of this',   depth: 'AWAKE'     },
      { label: 'I need the deepest layer',       depth: 'OMEGA'     },
      { label: 'I just woke up',                 depth: 'INITIATE'  },
    ]
  },
];

function injectQuiz() {
  if (document.getElementById('ta-quiz-section')) return;
  const ref = document.querySelector('#routes');
  if (!ref) return;
  const section = document.createElement('section');
  section.id = 'ta-quiz-section';
  section.className = 'section quiz-section';
  section.style.paddingBottom = '1rem';
  section.innerHTML = `
    <div class="container">
      <div class="section-header fade-in">
        <span class="eyebrow">Pattern Recognition</span>
        <h2>Find Your Thread</h2>
        <div class="divider"></div>
        <p>Three questions. We route you to the chapter that matches your instinct.</p>
      </div>
      <div class="quiz-shell fade-in" id="ta-quiz">
        <div class="quiz-step" id="quiz-step-0">
          <div class="quiz-q">${QUIZ_QUESTIONS[0].q}</div>
          <div class="quiz-opts">
            ${QUIZ_QUESTIONS[0].opts.map((o,i) => `<button class="quiz-opt" data-q="0" data-i="${i}">${o.label}</button>`).join('')}
          </div>
        </div>
        <div class="quiz-step hidden" id="quiz-step-1">
          <div class="quiz-q">${QUIZ_QUESTIONS[1].q}</div>
          <div class="quiz-opts">
            ${QUIZ_QUESTIONS[1].opts.map((o,i) => `<button class="quiz-opt" data-q="1" data-i="${i}">${o.label}</button>`).join('')}
          </div>
        </div>
        <div class="quiz-step hidden" id="quiz-step-2">
          <div class="quiz-q">${QUIZ_QUESTIONS[2].q}</div>
          <div class="quiz-opts">
            ${QUIZ_QUESTIONS[2].opts.map((o,i) => `<button class="quiz-opt" data-q="2" data-i="${i}">${o.label}</button>`).join('')}
          </div>
        </div>
        <div class="quiz-result hidden" id="quiz-result">
          <div class="quiz-result-inner">
            <div class="quiz-result-tier" id="qr-tier"></div>
            <h3 class="quiz-result-title" id="qr-title"></h3>
            <p class="quiz-result-desc" id="qr-desc"></p>
            <div class="quiz-result-actions">
              <a id="qr-cta" href="#" class="btn btn-gold">Enter Your Chapter →</a>
              <button class="btn btn-outline" id="qr-retry">Retake</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  ref.before(section);
  initQuizLogic();
}

function initQuizLogic() {
  let answers = {};
  document.querySelectorAll('.quiz-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = parseInt(btn.dataset.q);
      const i = parseInt(btn.dataset.i);
      answers[q] = i;
      const cur = document.getElementById('quiz-step-' + q);
      cur.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      setTimeout(() => {
        cur.classList.add('hidden');
        const next = document.getElementById('quiz-step-' + (q+1));
        if (next) { next.classList.remove('hidden'); }
        else { showQuizResult(answers); }
      }, 320);
    });
  });
  document.getElementById('qr-retry')?.addEventListener('click', () => {
    answers = {};
    document.querySelectorAll('.quiz-step').forEach((s,i) => { s.classList.toggle('hidden', i !== 0); });
    document.getElementById('quiz-result').classList.add('hidden');
    document.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('selected'));
  });
}

function showQuizResult(answers) {
  const q0 = QUIZ_QUESTIONS[0].opts[answers[0] ?? 0];
  const q2 = QUIZ_QUESTIONS[2].opts[answers[2] ?? 2];
  document.getElementById('qr-tier').textContent  = q2.depth || 'SEEKER';
  document.getElementById('qr-title').textContent = 'You are a ' + q2.depth;
  document.getElementById('qr-desc').textContent  = 'Your instinct points to ' + q0.label.replace(/^.{2}\s/,'') + '. The archive has been waiting for you.';
  document.getElementById('qr-cta').href          = q0.chapter;
  document.getElementById('quiz-result').classList.remove('hidden');
}

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
  buildRestoreModal();
  initRedactedReveals();
  initAccessTicker();
  injectLockedChapter();
  initConstellationCanvas();
  initCipherHeaders();
  injectCorkboard();
  initArchiveProgress();
  initEyeBlink();
  initDocumentDropCountdown();
  initSubscriberCounter();
  initOracle();
  injectNewspaperClippings();
  injectQuiz();
});
