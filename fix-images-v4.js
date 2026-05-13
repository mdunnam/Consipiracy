/**
 * fix-images-v4.js
 * Uses the English Wikipedia pageimages API to get the primary
 * image for each topic, then updates every <figure class="topic-image">
 * in the great-awakening pages.
 *
 * Run: node fix-images-v4.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');

const DIR = path.join(__dirname, 'topics', 'great-awakening');

// ── Map HTML filename → Wikipedia article title ───────────────────────────────
const WIKI_TITLE = {
  '10m-stone-circles.html':          "Adam's Calendar",
  '9-11-inside-job.html':            'September 11 attacks',
  'adrenochrome.html':               'Adrenochrome',
  'agenda-2030.html':                'Sustainable Development Goals',
  'ai-surveillance.html':            'Mass surveillance',
  'ancient-alien-ruins.html':        'Göbekli Tepe',
  'antarctica-hidden.html':          'Antarctica',
  'area-51.html':                    'Area 51',
  'ark-of-covenant.html':            'Ark of the Covenant',
  'atlantis-lemuria-mu.html':        'Atlantis',
  'ayahuasca.html':                  'Ayahuasca',
  'big-pharma.html':                 'Pharmaceutical industry',
  'bilderberg.html':                 'Bilderberg meeting',
  'bill-gates.html':                 'Bill Gates',
  'bis.html':                        'Bank for International Settlements',
  'blackrock-vanguard.html':         'BlackRock',
  'brics-alliance.html':             'BRICS',
  'cancer-cure-suppressed.html':     'Royal Raymond Rife',
  'cbdc.html':                       'Central bank digital currency',
  'chemtrails.html':                 'Chemtrail conspiracy theory',
  'chinese-pyramids.html':           'Chinese pyramids',
  'cia-operations.html':             'Central Intelligence Agency',
  'cointelpro.html':                 'COINTELPRO',
  'committee-300.html':              'Committee of 300',
  'corporate-media-control.html':    'Media cross-ownership',
  'council-foreign-relations.html':  'Council on Foreign Relations',
  'covid-plandemic.html':            'COVID-19 pandemic',
  'crop-circles.html':               'Crop circle',
  'cydonia-face-mars.html':          'Cydonia (Mars)',
  'cymatics.html':                   'Cymatics',
  'dew-weapons.html':                'Directed-energy weapon',
  'dmt.html':                        'N,N-Dimethyltryptamine',
  'dumbs.html':                      'Cheyenne Mountain Complex',
  'electric-universe.html':          'Electric universe theory',
  'epstein-network.html':            'Jeffrey Epstein',
  'erich-von-daniken.html':          'Erich von Däniken',
  'false-flags.html':                'False flag operation',
  'five-eyes.html':                  'Five Eyes',
  'fluoride-poison.html':            'Water fluoridation',
  'freemasonry.html':                'Freemasonry',
  'gary-mckinnon.html':              'Gary McKinnon',
  'george-soros.html':               'George Soros',
  'georgia-guidestones.html':        'Georgia Guidestones',
  'giants-suppressed.html':          'Cardiff Giant',
  'giza-complex.html':               'Great Pyramid of Giza',
  'graham-hancock.html':             'Graham Hancock',
  'great-reset.html':                'Great Reset',
  'great-solar-flash.html':          'Solar flare',
  'haarp.html':                      'High-frequency Active Auroral Research Program',
  'illuminati.html':                 'Illuminati',
  'knights-templar.html':            'Knights Templar',
  'law-of-one.html':                 'Law of One',
  'luciferian-doctrine.html':        'Albert Pike',
  'mahabharata-nuclear-war.html':    'Mahabharata',
  'mandela-effect.html':             'Mandela effect',
  'maritime-law.html':               'Admiralty law',
  'mars-colony.html':                'Mars',
  'mkultra.html':                    'Project MKUltra',
  'montauk-project.html':            'Montauk Project',
  'moon-structures.html':            'Moon',
  'moon-truth.html':                 'Moon',
  'mrna-vaccines.html':              'mRNA vaccine',
  'mud-flood.html':                  'Seattle Underground',
  'nasa-deceptions.html':            'NASA',
  'nazca-lines.html':                'Nazca Lines',
  'nazi-breakaway-group.html':       'Nazi UFOs',
  'nazi-occult.html':                'Ahnenerbe',
  'nesara-gesara.html':              'NESARA',
  'nikola-tesla.html':               'Nikola Tesla',
  'norway-spiral.html':              'Norway spiral',
  'nsa-surveillance.html':           'National Security Agency',
  'nxivm.html':                      'NXIVM',
  'oklahoma-city-bombing.html':      'Oklahoma City bombing',
  'oopart.html':                     'Antikythera mechanism',
  'operation-highjump.html':         'Operation Highjump',
  'operation-mockingbird.html':      'Operation Mockingbird',
  'operation-northwoods.html':       'Operation Northwoods',
  'operation-paperclip.html':        'Operation Paperclip',
  'orgone-reich.html':               'Wilhelm Reich',
  'pearl-harbor-foreknowledge.html': 'Attack on Pearl Harbor',
  'pentagon-missile.html':           'Pentagon',
  'petrodollar.html':                'Petrodollar system',
  'philadelphia-experiment.html':    'Philadelphia Experiment',
  'pineal-gland.html':               'Pineal gland',
  'piri-reis-map.html':              'Piri Reis map',
  'precession-equinox.html':         'Axial precession',
  'predictive-programming.html':     'Predictive programming',
  'project-blue-beam.html':          'Project Blue Beam',
  'rfid-surveillance.html':          'Radio-frequency identification',
  'rockefellers.html':               'John D. Rockefeller',
  'rothschilds.html':                'Rothschild family',
  'sacred-geometry.html':            'Sacred geometry',
  'sandy-hook.html':                 'Sandy Hook Elementary School shooting',
  'saturn-rings.html':               'Rings of Saturn',
  'schumann-resonance.html':         'Schumann resonances',
  'shadow-government.html':          'Shadow government (conspiracy)',
  'simulation-theory.html':          'Simulation hypothesis',
  'smart-cities.html':               'Smart city',
  'snowden-assange.html':            'Edward Snowden',
  'social-media-control.html':       'Social media',
  'stolen-history.html':             'Tartaria (conspiracy theory)',
  'tartaria.html':                   'Tartaria (conspiracy theory)',
  'three-city-states.html':          'City of London',
  'transhumanism.html':              'Transhumanism',
  'trilateral-commission.html':      'Trilateral Commission',
  'ufo-disclosure.html':             'Pentagon UFO videos',
  'vatican-jesuits.html':            'Vatican City',
  'vimanas.html':                    'Vimana',
  'vril-society.html':               'Vril Society',
  'weaponized-food.html':            'Monsanto',
  'wef-schwab.html':                 'Klaus Schwab',
  'who-control.html':                'World Health Organization',
  'wtc7.html':                       '7 World Trade Center',
  'zero-point-free-energy.html':     'Zero-point energy',
};

// ── HTTP GET with retry ───────────────────────────────────────────────────────
function get(url, retries = 4) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      https.get(url, { headers: { 'User-Agent': 'TruthArchive-ImageFixer/4.0 (node.js; educational)' } }, res => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          if (res.statusCode === 429) {
            if (n <= 0) return reject(new Error('Rate limited'));
            const ms = (5 - n) * 3000 + 2000;
            console.log(`    [429] waiting ${ms}ms...`);
            return setTimeout(() => attempt(n - 1), ms);
          }
          resolve(data);
        });
      }).on('error', e => n > 0 ? setTimeout(() => attempt(n - 1), 2000) : reject(e));
    };
    attempt(retries);
  });
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Batch Wikipedia pageimages query (up to 50 titles) ───────────────────────
async function wikiPageImages(titles) {
  const t   = titles.map(encodeURIComponent).join('|');
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${t}&prop=pageimages&piprop=original&format=json&pithumbsize=1200`;
  const raw = await get(url);
  const json = JSON.parse(raw);
  const result = {}; // title → image URL | null
  for (const page of Object.values(json.query.pages)) {
    const url = page.original ? page.original.source : null;
    result[page.title] = url;
    // also index by the query title (handles redirects/normalisation)
  }
  // also index by normalised titles if provided
  if (json.query.normalized) {
    for (const { from, to } of json.query.normalized) {
      result[from] = result[to] || null;
    }
  }
  if (json.query.redirects) {
    for (const { from, to } of json.query.redirects) {
      result[from] = result[to] || null;
    }
  }
  return result;
}

// ── Extract the current src from a figure in a page ──────────────────────────
function extractSrc(html) {
  const m = html.match(/<figure class="topic-image[^"]*"[^>]*>[\s\S]*?<img\s+src="([^"]+)"/);
  return m ? m[1] : null;
}

// ── Rewrite the src in the figure block ──────────────────────────────────────
function replaceSrc(html, newSrc) {
  return html.replace(
    /(<figure class="topic-image[^"]*"[^>]*>[\s\S]*?<img\s+src=")[^"]+(")/,
    `$1${newSrc}$2`
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.html') && f !== 'index.html');

  // Only process pages that have a topic-image figure
  const targets = files.filter(f => fs.readFileSync(path.join(DIR, f), 'utf8').includes('topic-image'));
  console.log(`${targets.length} pages have a topic-image figure.\n`);

  // Collect unique Wikipedia titles we need to look up
  const neededTitles = [...new Set(
    targets.map(f => WIKI_TITLE[f]).filter(Boolean)
  )];
  console.log(`Querying Wikipedia pageimages for ${neededTitles.length} articles...\n`);

  // Batch query Wikipedia (50 per request)
  const imageUrls = {}; // Wikipedia title → image URL
  const BATCH = 50;
  for (let i = 0; i < neededTitles.length; i += BATCH) {
    const batch = neededTitles.slice(i, i + BATCH);
    console.log(`  Batch ${Math.floor(i / BATCH) + 1}: querying ${batch.length} titles...`);
    const res = await wikiPageImages(batch);
    Object.assign(imageUrls, res);
    for (const [title, url] of Object.entries(res)) {
      if (url) console.log(`    ✓ ${title}`);
      else     console.log(`    ✗ ${title} (no image)`);
    }
    if (i + BATCH < neededTitles.length) await wait(800);
  }

  // Apply to HTML files
  let updated = 0, skipped = 0;
  for (const file of targets) {
    const wikiTitle = WIKI_TITLE[file];
    if (!wikiTitle) { skipped++; continue; }

    const newUrl = imageUrls[wikiTitle];
    if (!newUrl) { skipped++; continue; }

    const fullPath = path.join(DIR, file);
    let html = fs.readFileSync(fullPath, 'utf8');
    const oldSrc = extractSrc(html);
    if (!oldSrc || oldSrc === newUrl) { skipped++; continue; }

    html = replaceSrc(html, newUrl);
    fs.writeFileSync(fullPath, html, 'utf8');
    updated++;
    process.stdout.write('.');
  }

  console.log(`\n\nDone — ${updated} pages updated, ${skipped} skipped (no change / no mapping).`);
})();
