/**
 * fix-final.js
 * Hardcoded patch for the 14 pages that couldn't be auto-resolved.
 * Every URL below was verified live via the Wikipedia REST API.
 *
 * Run: node fix-final.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'topics', 'great-awakening');

/** Maps filename → verified Wikimedia Commons direct URL */
const PATCHES = {
  'bohemian-grove.html':         'https://upload.wikimedia.org/wikipedia/commons/8/8e/Owl_Shrine.jpg',
  'corporate-media-control.html':'https://upload.wikimedia.org/wikipedia/commons/e/ed/Comcast_Philly.JPG',
  'federal-reserve.html':        'https://upload.wikimedia.org/wikipedia/commons/1/1a/Seal_of_the_United_States_Federal_Reserve_System.svg',
  'jfk-assassination.html':      'https://upload.wikimedia.org/wikipedia/commons/5/59/JFK_Motorcade_GettyImages-517330536.jpg',
  'mandela-effect.html':         'https://upload.wikimedia.org/wikipedia/commons/0/02/Nelson_Mandela_1994.jpg',
  'maritime-law.html':           'https://upload.wikimedia.org/wikipedia/commons/d/d1/Kotwica_SS_Pozna%C5%84.JPG',
  'operation-mockingbird.html':  'https://upload.wikimedia.org/wikipedia/commons/f/fb/Frank_Church_1961_Congressional_Portrait.png',
  'predictive-programming.html': 'https://upload.wikimedia.org/wikipedia/commons/7/71/I_Want_You_for_U.S._Army_by_James_Montgomery_Flagg.jpg',
  'shadow-government.html':      'https://upload.wikimedia.org/wikipedia/commons/1/1a/Seal_of_the_United_States_Federal_Reserve_System.svg',
  'simulation-theory.html':      'https://upload.wikimedia.org/wikipedia/commons/8/8b/Typhoon_Mawar_2005_computer_simulation_thumbnail.gif',
  'skull-bones.html':            'https://upload.wikimedia.org/wikipedia/commons/4/41/Bones_logo.jpg',
  'stolen-history.html':         'https://upload.wikimedia.org/wikipedia/commons/0/0c/1806_Cary_Map_of_Tartary_or_Central_Asia_-_Geographicus_-_Tartary-cary-1806.jpg',
  'tartaria.html':               'https://upload.wikimedia.org/wikipedia/commons/0/0c/1806_Cary_Map_of_Tartary_or_Central_Asia_-_Geographicus_-_Tartary-cary-1806.jpg',
  'weaponized-food.html':        'https://upload.wikimedia.org/wikipedia/commons/f/f7/Logo_Bayer.svg',
};

/**
 * Replaces the src attribute in the first <figure class="topic-image"> block.
 * @param {string} html - Full page HTML
 * @param {string} newSrc - Verified image URL to inject
 * @returns {string} Updated HTML
 */
function replaceSrc(html, newSrc) {
  return html.replace(
    /(<figure class="topic-image[^"]*"[^>]*>[\s\S]*?<img\s+src=")[^"]+(")/,
    `$1${newSrc}$2`
  );
}

let updated = 0;
for (const [file, url] of Object.entries(PATCHES)) {
  const fullPath = path.join(DIR, file);
  if (!fs.existsSync(fullPath)) {
    console.log(`  skip (not found): ${file}`);
    continue;
  }
  let html = fs.readFileSync(fullPath, 'utf8');
  const patched = replaceSrc(html, url);
  if (patched === html) {
    console.log(`  skip (no figure): ${file}`);
    continue;
  }
  fs.writeFileSync(fullPath, patched, 'utf8');
  console.log(`  ✓ ${file}`);
  updated++;
}
console.log(`\nDone — ${updated} pages patched.`);
