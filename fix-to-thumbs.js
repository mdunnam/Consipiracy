/**
 * fix-to-thumbs.js
 * Converts all direct Wikimedia "original" image URLs in the great-awakening
 * pages to proper thumbnail URLs using the Wikipedia pageimages API with
 * pithumbsize=800. Wikimedia explicitly wants hotlinks to use thumb URLs.
 *
 * Run: node fix-to-thumbs.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');

const DIR = path.join(__dirname, 'topics', 'great-awakening');

// ── Same topic→article mapping as fix-images-v4 ──────────────────────────────
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
  'bohemian-grove.html':             'Bohemian Grove',
  'brics-alliance.html':             'BRICS',
  'cancer-cure-suppressed.html':     'Cancer treatment',
  'cbdc.html':                       'Central bank digital currency',
  'chemtrails.html':                 'Chemtrail conspiracy theory',
  'chinese-pyramids.html':           'Chinese pyramids',
  'cia-operations.html':             'Central Intelligence Agency',
  'cointelpro.html':                 'COINTELPRO',
  'committee-300.html':              'Chatham House',
  'corporate-media-control.html':    'Comcast',
  'council-foreign-relations.html':  'Council on Foreign Relations',
  'covid-plandemic.html':            'COVID-19 pandemic',
  'crop-circles.html':               'Crop circle',
  'cydonia-face-mars.html':          'Cydonia (Mars)',
  'cymatics.html':                   'Cymatics',
  'dew-weapons.html':                'Directed-energy weapon',
  'dmt.html':                        'Dimethyltryptamine',
  'dumbs.html':                      'Cheyenne Mountain Complex',
  'electric-universe.html':          'Plasma (physics)',
  'epstein-network.html':            'Jeffrey Epstein',
  'erich-von-daniken.html':          'Erich von Däniken',
  'false-flags.html':                'False flag',
  'federal-reserve.html':            'Federal Reserve',
  'five-eyes.html':                  'Five Eyes',
  'fluoride-poison.html':            'Water fluoridation',
  'freemasonry.html':                'Freemasonry',
  'gary-mckinnon.html':              'Gary McKinnon',
  'george-soros.html':               'George Soros',
  'georgia-guidestones.html':        'Georgia Guidestones',
  'giants-suppressed.html':          'Cardiff Giant',
  'giza-complex.html':               'Great Pyramid of Giza',
  'graham-hancock.html':             'Graham Hancock',
  'great-reset.html':                'World Economic Forum',
  'great-solar-flash.html':          'Solar flare',
  'haarp.html':                      'High-frequency Active Auroral Research Program',
  'illuminati.html':                 'Illuminati',
  'jfk-assassination.html':          'Assassination of John F. Kennedy',
  'knights-templar.html':            'Knights Templar',
  'law-of-one.html':                 'New Age',
  'luciferian-doctrine.html':        'Albert Pike',
  'mahabharata-nuclear-war.html':    'Mahabharata',
  'mandela-effect.html':             'Nelson Mandela',
  'maritime-law.html':               'Anchor',
  'mars-colony.html':                'Mars',
  'mkultra.html':                    'Project MKUltra',
  'montauk-project.html':            'Camp Hero State Park',
  'moon-structures.html':            'Moon',
  'moon-truth.html':                 'Moon',
  'mrna-vaccines.html':              'mRNA vaccine',
  'mud-flood.html':                  'Seattle Underground',
  'nasa-deceptions.html':            'NASA',
  'nazca-lines.html':                'Nazca Lines',
  'nazi-breakaway-group.html':       'Nazi UFOs',
  'nazi-occult.html':                'Ahnenerbe',
  'nesara-gesara.html':              'Gold standard',
  'nikola-tesla.html':               'Nikola Tesla',
  'norway-spiral.html':              'Norway spiral',
  'nsa-surveillance.html':           'National Security Agency',
  'nxivm.html':                      'NXIVM',
  'oklahoma-city-bombing.html':      'Oklahoma City bombing',
  'oopart.html':                     'Antikythera mechanism',
  'operation-highjump.html':         'Operation Highjump',
  'operation-mockingbird.html':      'Frank Church',
  'operation-northwoods.html':       'Operation Northwoods',
  'operation-paperclip.html':        'Operation Paperclip',
  'orgone-reich.html':               'Wilhelm Reich',
  'pearl-harbor-foreknowledge.html': 'Attack on Pearl Harbor',
  'pentagon-missile.html':           'Pentagon',
  'petrodollar.html':                'Petrodollar recycling',
  'philadelphia-experiment.html':    'Philadelphia Experiment',
  'pineal-gland.html':               'Pineal gland',
  'piri-reis-map.html':              'Piri Reis map',
  'precession-equinox.html':         'Axial precession',
  'predictive-programming.html':     'Propaganda',
  'project-blue-beam.html':          'Holography',
  'rfid-surveillance.html':          'Radio-frequency identification',
  'rockefellers.html':               'John D. Rockefeller',
  'rothschilds.html':                'Rothschild family',
  'sacred-geometry.html':            'Sacred geometry',
  'sandy-hook.html':                 'Sandy Hook Elementary School shooting',
  'saturn-rings.html':               'Rings of Saturn',
  'schumann-resonance.html':         'Schumann resonances',
  'shadow-government.html':          'Deep state',
  'simulation-theory.html':          'Simulation hypothesis',
  'skull-bones.html':                'Skull and Bones',
  'smart-cities.html':               'Smart city',
  'snowden-assange.html':            'Edward Snowden',
  'social-media-control.html':       'Social media',
  'stolen-history.html':             'Tartary',
  'tartaria.html':                   'Tartary',
  'three-city-states.html':          'City of London',
  'transhumanism.html':              'Transhumanism',
  'trilateral-commission.html':      'Trilateral Commission',
  'ufo-disclosure.html':             'Pentagon UFO videos',
  'vatican-jesuits.html':            'Vatican City',
  'vimanas.html':                    'Vimana',
  'vril-society.html':               'Vril',
  'weaponized-food.html':            'Bayer AG',
  'wef-schwab.html':                 'Klaus Schwab',
  'who-control.html':                'World Health Organization',
  'wtc7.html':                       '7 World Trade Center',
  'zero-point-free-energy.html':     'Zero-point energy',
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
            const ms = (5 - n) * 3000 + 1000;
            setTimeout(() => attempt(n - 1), ms);
          } else {
            resolve(data);
          }
        });
      }).on('error', e => n > 0 ? setTimeout(() => attempt(n - 1), 1500) : reject(e));
    };
    attempt(retries);
  });
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Batch pageimages with thumbnail (800px) ───────────────────────────────────
async function batchThumbImages(titles) {
  const t   = titles.map(encodeURIComponent).join('|');
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${t}&prop=pageimages&piprop=thumbnail&pithumbsize=800&format=json`;
  const raw = await get(url);
  const json = JSON.parse(raw);
  const result = {};
  for (const page of Object.values(json.query.pages)) {
    result[page.title] = page.thumbnail ? page.thumbnail.source : null;
  }
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

/** Replace the src in the topic-image figure */
function replaceSrc(html, newSrc) {
  return html.replace(
    /(<figure class="topic-image[^"]*"[^>]*>[\s\S]*?<img\s+src=")[^"]+(")/,
    `$1${newSrc}$2`
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  const files = fs.readdirSync(DIR)
    .filter(f => f.endsWith('.html') && f !== 'index.html' && WIKI_TITLE[f]);

  // Collect unique titles
  const uniqueTitles = [...new Set(files.map(f => WIKI_TITLE[f]))];
  console.log(`Querying Wikipedia thumbnail API for ${uniqueTitles.length} articles...\n`);

  const thumbMap = {};
  const BATCH = 50;
  for (let i = 0; i < uniqueTitles.length; i += BATCH) {
    const batch = uniqueTitles.slice(i, i + BATCH);
    console.log(`  Batch ${Math.floor(i/BATCH)+1}...`);
    const res = await batchThumbImages(batch);
    Object.assign(thumbMap, res);
    await wait(600);
  }

  // Apply to files
  let updated = 0, skipped = 0;
  for (const file of files) {
    const title  = WIKI_TITLE[file];
    const newUrl = thumbMap[title];
    if (!newUrl) { skipped++; continue; }

    const fullPath = path.join(DIR, file);
    let html = fs.readFileSync(fullPath, 'utf8');
    const patched = replaceSrc(html, newUrl);
    if (patched === html) { skipped++; continue; }

    fs.writeFileSync(fullPath, patched, 'utf8');
    process.stdout.write('.');
    updated++;
  }

  console.log(`\n\nDone — ${updated} pages now use proper 800px thumb URLs. ${skipped} skipped.`);
})();
