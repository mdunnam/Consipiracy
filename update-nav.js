'use strict';
const fs = require('fs');

const ROOT_NAV = `    <ul class="nav-links">
      <li class="nav-group">
        <button class="nav-group-toggle" aria-expanded="false" aria-label="Browse all chapters">
          <span class="nav-rail-icon" aria-hidden="true">&#x25A6;</span><span class="nav-rail-label">Chapters &#x25BE;</span>
        </button>
        <ul class="nav-sub">
          <li><a href="flat-earth.html">Ch 01 &middot; Flat Earth</a></li>
          <li><a href="great-awakening.html">Ch 02 &middot; Great Awakening</a></li>
          <li><a href="deep-state.html">Ch 03 &middot; Deep State</a></li>
          <li><a href="secret-societies.html">Ch 04 &middot; Secret Societies</a></li>
          <li><a href="banking-control.html">Ch 05 &middot; Banking Control</a></li>
          <li><a href="media-control.html">Ch 06 &middot; Media Control</a></li>
          <li><a href="space-deception.html">Ch 07 &middot; Space Deception</a></li>
          <li><a href="big-pharma.html">Ch 08 &middot; Big Pharma</a></li>
          <li><a href="tech-control.html">Ch 09 &middot; Tech &amp; Control</a></li>
          <li><a href="false-flags.html">Ch 10 &middot; False Flags</a></li>
          <li><a href="suppressed-history.html">Ch 11 &middot; Suppressed History</a></li>
          <li><a href="metaphysical.html">Ch 12 &middot; Metaphysical</a></li>
          <li><a href="ufo-disclosure.html">Ch 13 &middot; UFO Disclosure</a></li>
          <li><a href="ancient-civilisations.html">Ch 14 &middot; Ancient Civilisations</a></li>
          <li><a href="anomalous-zones.html">Ch 15 &middot; Anomalous Zones</a></li>
          <li><a href="elite-networks.html">Ch 16 &middot; Elite Networks</a></li>
          <li><a href="internet-control.html">Ch 17 &middot; Internet Control</a></li>
          <li><a href="mandela-effect.html">Ch 18 &middot; Mandela Effect</a></li>
          <li><a href="forensic-mysteries.html">Ch 19 &middot; Forensic Mysteries</a></li>
          <li><a href="secret-science.html">Ch 20 &middot; Secret Science</a></li>
        </ul>
      </li>
      <li><a href="rabbit-hole.html">Rabbit Hole</a></li>
      <li><a href="tier-list.html">Tier List</a></li>
      <li><a href="map.html">Connection Map</a></li>
      <li><a href="ebook.html" class="ebook-link">eBook</a></li>
    </ul>`;

// For topics/ subfolder, prepend ../ to every local href
const TOPICS_NAV = ROOT_NAV.replace(/href="(?!http|#)/g, 'href="../');

/**
 * Finds and replaces the <ul class="nav-links">...</ul> block using
 * depth-counting so nested lists don't confuse the match.
 * @param {string} html
 * @param {string} newNav
 * @returns {string|null} updated HTML, or null if marker not found
 */
function replaceNavLinks(html, newNav) {
  const marker = '<ul class="nav-links">';
  const s = html.indexOf(marker);
  if (s === -1) return null;

  let depth = 0;
  let i = s;
  while (i < html.length) {
    if (html[i] === '<') {
      if (html.startsWith('<ul', i) && (html[i + 3] === ' ' || html[i + 3] === '>')) {
        depth++; i += 3;
      } else if (html.startsWith('</ul>', i)) {
        depth--;
        if (depth === 0) { i += 5; break; }
        i += 5;
      } else {
        i++;
      }
    } else {
      i++;
    }
  }
  return html.slice(0, s) + newNav + html.slice(i);
}

const ROOT_FILES = [
  'index.html', 'great-awakening.html', 'flat-earth.html', 'deep-state.html',
  'secret-societies.html', 'banking-control.html', 'media-control.html',
  'space-deception.html', 'big-pharma.html', 'tech-control.html',
  'false-flags.html', 'suppressed-history.html', 'metaphysical.html',
  'rabbit-hole.html', 'tier-list.html',
];

let ok = 0, skipped = 0;
ROOT_FILES.forEach(f => {
  if (!fs.existsSync(f)) { console.log('SKIP(no file) ' + f); skipped++; return; }
  const orig = fs.readFileSync(f, 'utf8');
  const updated = replaceNavLinks(orig, ROOT_NAV);
  if (updated === null) { console.log('SKIP(no nav) ' + f); skipped++; return; }
  if (updated === orig) { console.log('UNCHANGED   ' + f); return; }
  fs.writeFileSync(f, updated, 'utf8');
  console.log('OK          ' + f);
  ok++;
});

// topics/index.html needs ../ prefixed hrefs
const tPath = 'topics/index.html';
if (fs.existsSync(tPath)) {
  const orig = fs.readFileSync(tPath, 'utf8');
  const updated = replaceNavLinks(orig, TOPICS_NAV);
  if (updated && updated !== orig) {
    fs.writeFileSync(tPath, updated, 'utf8');
    console.log('OK          ' + tPath);
    ok++;
  } else {
    console.log('SKIP        ' + tPath);
  }
}

console.log('\nDone. ' + ok + ' updated, ' + skipped + ' skipped.');
