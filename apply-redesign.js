const fs = require('fs');
const path = require('path');

const dir = 'G:/APPS/Consipiracy';

const redesign = fs.readFileSync(path.join(dir, 'homepage-redesign.html'), 'utf8');

// ── 1. Extract the new nav from redesign ─────────────────────────────────────
const navStart = redesign.indexOf('<nav class="site-nav"');
const navEnd   = redesign.indexOf('</nav>', navStart) + 6;
const newNav   = redesign.substring(navStart, navEnd);

// ── 2. Extract the new footer from redesign ──────────────────────────────────
const footerStart = redesign.indexOf('<footer class="site-footer"');
const footerEnd   = redesign.indexOf('</footer>', footerStart) + 9;
const newFooter   = redesign.substring(footerStart, footerEnd);

// ── 3. Extract the new inline <style> block from redesign ────────────────────
//    (the one inside <head> — just the fade-in + hero-redesign additions)
const styleStart = redesign.indexOf('<style>');
const styleEnd   = redesign.indexOf('</style>', styleStart) + 8;
const newStyle   = redesign.substring(styleStart, styleEnd);

console.log('Nav extracted:', newNav.substring(0, 80) + '...');
console.log('Footer extracted:', newFooter.substring(0, 80) + '...');
console.log('Style extracted:', newStyle.substring(0, 80) + '...');

// ── 4. STEP 1: Make homepage-redesign the new index.html ─────────────────────
// Clean up the mockup-only notice at the bottom first
let newIndex = redesign
  .replace(/STANDALONE REDESIGN MOCKUP/g, 'THE TRUTH ARCHIVE')
  .replace(/<span class="hero-eyebrow"[^>]*>STANDALONE REDESIGN MOCKUP<\/span>/, '')
  .replace(/<h2[^>]*>This page is isolated from the live site<\/h2>/, '<h2>Join the Research Network</h2>')
  .replace(/It lives in the same directory so it can reuse the real site styling, but it does not replace or attach itself to the current homepage\.\s*If this direction feels right, I can turn it into the actual <strong>index\.html<\/strong> next\./,
    'An independent network of researchers dedicated to exposing the hidden architecture of power. Dive in — the rabbit hole goes deep.');

fs.writeFileSync(path.join(dir, 'index.html'), newIndex, 'utf8');
console.log('\nSTEP 1: index.html updated from homepage-redesign.html');

// ── 5. STEP 2: Apply nav + footer + style to all topic pages ─────────────────
const topicPages = [
  'banking-control.html',
  'big-pharma.html',
  'deep-state.html',
  'false-flags.html',
  'flat-earth.html',
  'great-awakening.html',
  'media-control.html',
  'metaphysical.html',
  'secret-societies.html',
  'space-deception.html',
  'suppressed-history.html',
  'tech-control.html',
  'map.html',
  'ebook.html',
  'ebook-success.html',
  'omega.html',
];

let updated = 0;

for (const page of topicPages) {
  const filePath = path.join(dir, page);
  if (!fs.existsSync(filePath)) { console.log(`SKIP: ${page}`); continue; }

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace nav
  const oldNavStart = content.indexOf('<nav class="site-nav"');
  const oldNavEnd   = content.indexOf('</nav>', oldNavStart) + 6;
  if (oldNavStart !== -1) {
    content = content.substring(0, oldNavStart) + newNav + content.substring(oldNavEnd);
    changed = true;
  }

  // Replace footer
  const oldFooterStart = content.indexOf('<footer class="site-footer"');
  const oldFooterEnd   = content.indexOf('</footer>', oldFooterStart) + 9;
  if (oldFooterStart !== -1) {
    content = content.substring(0, oldFooterStart) + newFooter + content.substring(oldFooterEnd);
    changed = true;
  }

  // Replace inline style block (fade-in etc)
  const oldStyleStart = content.indexOf('<style>');
  const oldStyleEnd   = content.indexOf('</style>', oldStyleStart) + 8;
  if (oldStyleStart !== -1) {
    content = content.substring(0, oldStyleStart) + newStyle + content.substring(oldStyleEnd);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`UPDATED: ${page}`);
    updated++;
  } else {
    console.log(`NO CHANGE: ${page}`);
  }
}

console.log(`\nDone. Updated ${updated} topic pages + index.html`);
