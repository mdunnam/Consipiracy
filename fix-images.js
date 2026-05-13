/**
 * fix-images.js  v3
 * Two-phase repair:
 *   Phase A — for each currently-broken src URL, determines the correct
 *             Commons filename via a search API call.
 *   Phase B — batch-resolves real direct URLs via imageinfo API.
 *   Phase C — patches HTML files in-place.
 *
 * Run: node fix-images.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');

const DIR = path.join(__dirname, 'topics', 'great-awakening');

// ─── Hardcoded search terms for every broken filename ────────────────────────
// Maps the (guessed) filename in our HTML → what to search for on Commons.
const SEARCH_TERMS = {
  'Banisteriopsis_caapi.jpg':                        'Banisteriopsis caapi vine',
  'Pfizer_headquarters_New_York.jpg':                'Pfizer world headquarters building',
  'Bilderberg2008.jpg':                              'Bilderberg Group hotel meeting',
  'Bill_Gates_2017_cropped.jpg':                     'Bill Gates portrait 2017',
  'BIS_Building_Basel.jpg':                          'Bank for International Settlements tower Basel',
  'Blackrock_Inc_Logo.svg':                          'BlackRock logo',
  'BRICS_2023_Summit.jpg':                           'BRICS summit 2023 Johannesburg',
  'Royal_Rife.jpg':                                  'Royal Raymond Rife',
  'Central_bank_digital_currency.jpg':               'central bank digital currency CBDC',
  'Contrail_grid_over_Sacramento.jpg':               'aircraft contrails grid sky',
  'Maoling_mausoleum.jpg':                           'Maoling mausoleum Han dynasty China',
  'CIA_seal_new.png':                                'Central Intelligence Agency seal emblem',
  'FBI-COINTELPRO-Ghetto_Informant_Program.jpg':     'FBI COINTELPRO document declassified',
  'Chatham_House,_London.jpg':                       'Chatham House St James Square London',
  'Comcast_Center_(Philadelphia).jpg':               'Comcast Center Philadelphia skyscraper',
  'Harold_Pratt_House_CFR.jpg':                      'Harold Pratt House Council on Foreign Relations',
  'Crop_circle_at_Milk_Hill_1.jpg':                  'Milk Hill crop circle aerial Wiltshire',
  'The_face_on_Mars.jpg':                            'face on Mars Cydonia Viking orbiter',
  'Chladni_figures.jpg':                             'Chladni figures sand vibration acoustic',
  'Lahaina_Fire_from_air.jpg':                       'Lahaina Maui fire 2023 aerial',
  'Cheyenne_mtn_ent.jpg':                            'Cheyenne Mountain Complex entrance Colorado',
  'Electric_glow_discharge.jpg':                     'plasma glow discharge electric',
  'Little_St._James_Island.jpg':                     'Little Saint James Island Virgin Islands',
  'Erich_von_Däniken_2009.jpg':                      'Erich von Däniken author Chariots Gods',
  'USSLiberty1967.jpg':                              'USS Liberty AGTR-5 ship 1967',
  'GCHQ-panoramic.jpg':                              'GCHQ Cheltenham headquarters doughnut',
  'Water_fluoridation_by_country.svg':               'water fluoridation map world',
  'Masonic_lodge_Manitoba.jpg':                      'Masonic lodge room interior',
  'George_Soros_-_World_Economic_Forum_Annual_Meeting_Davos_2011.jpg': 'George Soros Davos World Economic Forum',
  'Georgia_Guidestones.jpg':                         'Georgia Guidestones Elbert County',
  'Cardiff_Giant_being_unearthed,_1869.jpg':         'Cardiff Giant excavation 1869',
  'Graham_Hancock_at_Hay_Festival_2015.jpg':         'Graham Hancock author',
  'WEF_Logo_White.png':                              'World Economic Forum logo Davos',
  'Solar_maximum_extreme_ultraviolet_prominence.jpg':'solar flare prominence NASA SDO ultraviolet',
  'HAARP_2.jpg':                                     'HAARP antenna array Gakona Alaska',
  'De_locis_ac_mirabilibus_mundi_Knights_Templar.jpg':'Knights Templar medieval illuminated manuscript',
  'All_Seeing_Eye.jpg':                              'Eye of Providence triangle symbol',
  'Albert_Pike_Portrait.jpg':                        'Albert Pike Freemason portrait',
  'US_Admiralty_flag.svg':                           'United States Admiralty flag naval',
  'Project_MKULTRA,_Subproject_68.jpg':              'MKUltra CIA document subproject',
  'Camp_Hero_radar.jpg':                             'Camp Hero State Park Montauk radar dish',
  'Lipid_nanoparticle_mRNA_vaccine.png':             'mRNA vaccine lipid nanoparticle delivery',
  'Seattle_underground_tour.jpg':                    'Seattle underground Pioneer Square subterranean',
  'White_side_of_the_moon.jpg':                      'Moon lunar surface NASA photograph',
  'Nazca_lineas_aero.jpg':                           'Nazca Lines aerial Peru hummingbird',
  'Neuschwabenland_1938.jpg':                        'German Antarctic expedition 1938 Schwabenland',
  'SS_Ahnenerbe_insignia.jpg':                       'SS Ahnenerbe Nazi occult',
  'Norway-spiral-by-Jan-Petter-Jorgensen.jpg':       'Norway spiral 2009 Tromsø sky',
  'Keith_Raniere_2009.jpg':                          'Keith Raniere NXIVM',
  'Oklahoma_City_bombing_-_alternate_view.jpg':      'Oklahoma City bombing 1995 federal building',
  'Operation_Highjump.jpg':                          'Operation Highjump Antarctica 1946',
  'Frank_Church.jpg':                                'Frank Church senator Idaho committee',
  'Operation_Northwoods.jpg':                        'Operation Northwoods document 1962 Joint Chiefs',
  'Operation_Paperclip_scientists.jpg':              'Operation Paperclip scientists Fort Bliss 1946',
  'Wilhelm_Reich_1940.jpg':                          'Wilhelm Reich psychologist portrait',
  'Dday_NAS_Kaneohe.jpg':                            'NAS Kaneohe Bay Pearl Harbor attack 1941',
  'Arlington_VA_USA_Pentagon_from_above.jpg':        'Pentagon Arlington Virginia aerial',
  'Oil_well_at_night.jpg':                           'oil well pump jack night',
  'USS_Eldridge_DE-173.jpg':                         'USS Eldridge destroyer escort DE-173',
  'Pineal_gland.jpg':                                'pineal gland brain anatomy MRI',
  'Piri_reis_world_map_01.jpg':                      'Piri Reis map 1513 world',
  'Television_set.jpg':                              'television set screen CRT',
  'Holographic_pyramid.jpg':                         'hologram holographic display technology',
  'RFID_smartcard_and_reader.jpg':                   'RFID smart card reader contactless',
  'Sandy_Hook_Elementary_School.jpg':                'Sandy Hook Elementary School Connecticut building',
  'Schumann_resonance_diagram.png':                  'Schumann resonance Earth ionosphere diagram',
  'Raven_Rock_Mountain_Complex_entrance.jpg':        'Raven Rock Mountain Complex Site R entrance',
  'Digital_rain_animation_medium_letters.gif':       'digital rain matrix code animation',
  'Smart_city_sensors_4ir.jpg':                      'smart city IoT sensors technology',
  'Edward_Snowden_2013-10-9_(cropped).jpg':          'Edward Snowden 2013 portrait',
  'Wikimedia_Foundation_Servers-8055_35.jpg':        'data center server racks',
  'Singer_Building_NYC_1908.jpg':                    'Singer Building New York City 1908 skyscraper',
  'Abraham_Ortelius-Tartariae_sive_Magni_Chami_Regni_typus.jpg': 'Tartaria map Ortelius 1570',
  'City_of_London_Arms.svg':                         'City of London Corporation coat of arms',
  'Neuralink_logo.png':                              'Neuralink corporation brain computer interface',
  'Zbigniew_Brzezinski_2009.jpg':                    'Zbigniew Brzezinski National Security Advisor',
  'US_Navy_UFO_FLIR1.png':                           'US Navy UAP Tic Tac FLIR video',
  'Vimana_in_the_Ramayana.jpg':                      'Vimana flying vehicle ancient India Ramayana',
  'Maria_Orsic_photograph.jpg':                      'Maria Orsic Vril Society medium',
  'Monsanto_cotton_field.jpg':                       'Monsanto GMO cotton field agricultural',
  'Klaus_Schwab_2008.jpg':                           'Klaus Schwab World Economic Forum',
  'World_Health_Organization_headquarters.jpg':      'World Health Organization headquarters Geneva Switzerland',
  'FEMA_-_wtc_burning.jpg':                          'World Trade Center 7 fire September 11',
  'Wardenclyffe_tower.jpg':                          'Wardenclyffe Tower Tesla Long Island',
  'Adamscalendar.jpg':                               'Adam Calendar Mpumalanga South Africa stone circle',
  'Area_51_The_Dirt_Road.jpg':                       'Area 51 Nevada restricted zone sign',
  'Arca_de_la_Alianza.jpg':                          'Ark of the Covenant replica gold',
  'Sustainable_Development_Goals.png':               'United Nations Sustainable Development Goals SDGs',
  'Face_detection.jpg':                              'facial recognition face detection technology',
};

// ── Extract filename from any wikimedia upload URL ────────────────────────────
function filenameFromUrl(url) {
  const clean = url.split('?')[0];
  const t = clean.match(/\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+)\//);
  if (t) return decodeURIComponent(t[1]);
  const d = clean.match(/\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+)$/);
  if (d) return decodeURIComponent(d[1]);
  return null;
}

// ── HTTP GET with rate-limit retry ───────────────────────────────────────────
function get(url, retries = 5) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      https.get(url, { headers: { 'User-Agent': 'TruthArchive-ImageFixer/3.0 (node.js; educational)' } }, res => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          if (res.statusCode === 429 || data.slice(0, 30).includes('You are mak')) {
            if (n <= 0) return reject(new Error('Rate limited'));
            const ms = (6 - n) * 3000;
            console.log(`    rate-limit, waiting ${ms}ms...`);
            setTimeout(() => attempt(n - 1), ms);
          } else {
            resolve(data);
          }
        });
      }).on('error', e => n > 0 ? setTimeout(() => attempt(n - 1), 2000) : reject(e));
    };
    attempt(retries);
  });
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Search Commons for a term → filename (best match) ───────────────────────
async function searchCommons(term) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=${encodeURIComponent(term)}&srlimit=1&format=json`;
  const raw = await get(url);
  const json = JSON.parse(raw);
  const results = json.query && json.query.search;
  if (!results || results.length === 0) return null;
  // result title is "File:Filename.jpg" — strip prefix
  return results[0].title.replace(/^File:/, '');
}

// ── Batch imageinfo query ─────────────────────────────────────────────────────
async function batchImageInfo(filenames) {
  const titles = filenames.map(f => 'File:' + f).join('|');
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url&format=json`;
  const raw = await get(url);
  const json = JSON.parse(raw);
  const result = {};
  for (const page of Object.values(json.query.pages)) {
    const name = page.title.replace(/^File:/, '');
    result[name] = page.missing !== undefined ? null
      : (page.imageinfo && page.imageinfo[0] && page.imageinfo[0].url) || null;
  }
  return result;
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  const htmlFiles = fs.readdirSync(DIR).filter(f => f.endsWith('.html') && f !== 'index.html');

  // 1. Collect every unique wikimedia src URL in all pages
  const allSrcs = new Set();
  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(DIR, file), 'utf8');
    for (const m of html.matchAll(/src="(https:\/\/upload\.wikimedia\.org[^"]+)"/g)) {
      allSrcs.add(m[1]);
    }
  }
  console.log(`Found ${allSrcs.size} unique Wikimedia image URLs.\n`);

  // 2. For each URL, figure out if it's broken and needs a search-based fix
  //    We determine "needs fix" if the filename is in our SEARCH_TERMS map
  //    (meaning it was one of our guessed filenames).
  const srcToFilename = new Map();  // src → real Commons filename
  const needsSearch  = [];          // { src, filename (guessed) } entries that need searching

  for (const src of allSrcs) {
    const fn = filenameFromUrl(src);
    if (!fn) continue;
    const fnNorm = fn.replace(/ /g, '_');
    if (SEARCH_TERMS[fnNorm]) {
      needsSearch.push({ src, guessedFn: fnNorm, term: SEARCH_TERMS[fnNorm] });
    } else {
      // Assume it's already a real filename (confirmed from previous run)
      srcToFilename.set(src, fn);
    }
  }

  console.log(`${srcToFilename.size} URLs look correct already.`);
  console.log(`${needsSearch.length} URLs need Commons search to find real filename.\n`);

  // 3. Search Commons for each broken filename
  const searchResults = {}; // guessedFn → realFn
  let searchOk = 0, searchFail = 0;

  for (let i = 0; i < needsSearch.length; i++) {
    const { src, guessedFn, term } = needsSearch[i];
    process.stdout.write(`  [${i+1}/${needsSearch.length}] searching: ${term.slice(0,50)}... `);
    await wait(400);
    try {
      const found = await searchCommons(term);
      if (found) {
        searchResults[guessedFn] = found;
        srcToFilename.set(src, found);
        console.log(`→ ${found}`);
        searchOk++;
      } else {
        console.log('NOT FOUND');
        searchFail++;
      }
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
      searchFail++;
    }
  }

  console.log(`\nSearch complete: ${searchOk} found, ${searchFail} not found.\n`);

  // 4. Batch-resolve real URLs for all unique filenames
  const uniqueFns = [...new Set(srcToFilename.values())].filter(Boolean);
  console.log(`Resolving real URLs for ${uniqueFns.length} unique filenames...`);
  const urlMap = {}; // filename → real direct URL

  const BATCH = 50;
  for (let i = 0; i < uniqueFns.length; i += BATCH) {
    const batch = uniqueFns.slice(i, i + BATCH);
    const res = await batchImageInfo(batch);
    Object.assign(urlMap, res);
    await wait(800);
  }

  // 5. Build src → new URL replacements
  const replacements = new Map();
  for (const [src, fn] of srcToFilename) {
    const realUrl = urlMap[fn];
    if (realUrl && realUrl !== src) replacements.set(src, realUrl);
  }
  console.log(`\n${replacements.size} URL replacements to apply.\n`);

  // 6. Patch HTML files
  let pagesUpdated = 0;
  for (const file of htmlFiles) {
    const fullPath = path.join(DIR, file);
    let html = fs.readFileSync(fullPath, 'utf8');
    let changed = false;
    for (const [oldSrc, newSrc] of replacements) {
      if (html.includes(oldSrc)) {
        html = html.split(oldSrc).join(newSrc);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(fullPath, html, 'utf8');
      pagesUpdated++;
      process.stdout.write('.');
    }
  }
  console.log(`\n\nDone — ${pagesUpdated} pages patched with real Wikimedia URLs.`);
})();


