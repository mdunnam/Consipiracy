/**
 * fix-remaining.js
 * Fixes the ~32 pages that still have broken guessed thumb URLs.
 * Uses the Wikipedia REST summary API (fast, generous rate limits)
 * to get a real image URL, with fallbacks for topics with no WP image.
 *
 * Run: node fix-remaining.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');

const DIR = path.join(__dirname, 'topics', 'great-awakening');

// ── Map: HTML filename → best Wikipedia REST summary title ───────────────────
// These are the 32 pages skipped by fix-images-v4.js plus any unmapped ones.
const TARGETS = {
  '10m-stone-circles.html':       "Adam's_Calendar",
  'bilderberg.html':               'Bilderberg_meeting',
  'cancer-cure-suppressed.html':   'Cancer_treatment',
  'committee-300.html':            'Chatham_House',
  'corporate-media-control.html':  'Concentration_of_media_ownership',
  'dmt.html':                      'Dimethyltryptamine',
  'electric-universe.html':        'Plasma_(physics)',
  'false-flags.html':              'False_flag',
  'great-reset.html':              'World_Economic_Forum',
  'law-of-one.html':               'New_Age',
  'mandela-effect.html':           'False_memory',
  'maritime-law.html':             'Admiralty_law',
  'mkultra.html':                  'Project_MKUltra',
  'montauk-project.html':          'Camp_Hero_State_Park',
  'nazca-lines.html':              'Nazca_lines',
  'nesara-gesara.html':            'Gold_standard',
  'norway-spiral.html':            'Norway_spiral',
  'operation-mockingbird.html':    'CIA_influence_on_public_opinion',
  'petrodollar.html':              'Petrodollar_recycling',
  'predictive-programming.html':   'Mass_media',
  'project-blue-beam.html':        'Holography',
  'shadow-government.html':        'Deep_state',
  'simulation-theory.html':        'Simulation_hypothesis',
  'stolen-history.html':           'Tartary',
  'tartaria.html':                 'Tartary',
  'vril-society.html':             'Vril',
  'weaponized-food.html':          'Monsanto',
};

// ── HTTP GET with retry ───────────────────────────────────────────────────────
function get(url, retries = 4) {
  return new Promise((resolve, reject) => {
    const ua = 'TruthArchive-ImageFixer/5.0 (node.js; educational)';
    const attempt = (n) => {
      https.get(url, { headers: { 'User-Agent': ua } }, res => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          if (res.statusCode === 429) {
            if (n <= 0) return reject(new Error('Rate limited'));
            const ms = (5 - n) * 2000 + 1000;
            setTimeout(() => attempt(n - 1), ms);
          } else {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }).on('error', e => n > 0 ? setTimeout(() => attempt(n - 1), 1500) : reject(e));
    };
    attempt(retries);
  });
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Wikipedia REST summary → image URL ───────────────────────────────────────
async function wikiImage(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const { status, body } = await get(url);
  if (status !== 200) return null;
  const json = JSON.parse(body);
  // Prefer originalimage, fall back to thumbnail
  if (json.originalimage && json.originalimage.source) return json.originalimage.source;
  if (json.thumbnail    && json.thumbnail.source)    return json.thumbnail.source;
  return null;
}

// ── Rewrite src in the topic-image figure ────────────────────────────────────
function replaceSrc(html, newSrc) {
  return html.replace(
    /(<figure class="topic-image[^"]*"[^>]*>[\s\S]*?<img\s+src=")[^"]+(")/,
    `$1${newSrc}$2`
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  // Also detect pages that still have the old broken guessed-hash thumb URLs.
  // The telltale: URL is a /thumb/ URL where the file is not a known-good one.
  // Strategy: collect all pages with a topic-image figure that have a /thumb/ URL
  // (Wikipedia REST API returns direct /wikipedia/commons/X/XX/file.jpg URLs, not /thumb/).
  const allFiles = fs.readdirSync(DIR).filter(f => f.endsWith('.html') && f !== 'index.html');
  const broken = [];
  for (const f of allFiles) {
    const html = fs.readFileSync(path.join(DIR, f), 'utf8');
    if (!html.includes('topic-image')) continue;
    const m = html.match(/src="(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb[^"]+)"/);
    if (m) broken.push(f); // still has a /thumb/ URL = was not fixed by v4
  }

  console.log(`${broken.length} pages still have guessed /thumb/ URLs:\n`);
  broken.forEach(f => console.log('  ' + f));
  console.log();

  let updated = 0, failed = 0;

  for (const file of broken) {
    const wikiTitle = TARGETS[file];
    let newUrl = null;

    if (wikiTitle) {
      process.stdout.write(`  ${file} → querying "${wikiTitle}"... `);
      await wait(200);
      try {
        newUrl = await wikiImage(wikiTitle);
        if (newUrl) {
          console.log('✓');
        } else {
          console.log('no image from REST');
        }
      } catch (e) {
        console.log(`ERROR: ${e.message}`);
      }
    } else {
      console.log(`  ${file} → no TARGETS entry`);
    }

    if (!newUrl) { failed++; continue; }

    const fullPath = path.join(DIR, file);
    let html = fs.readFileSync(fullPath, 'utf8');
    html = replaceSrc(html, newUrl);
    fs.writeFileSync(fullPath, html, 'utf8');
    updated++;
  }

  console.log(`\nDone — ${updated} fixed, ${failed} still no image.`);
})();
