/**
 * fix-direct-urls.js
 * The 5 pages that still have direct (non-thumb) Wikimedia URLs cannot be
 * downloaded because Wikimedia blocks bulk direct downloads from our IP.
 * Solution: convert the 4 valid image URLs to their proper thumb format,
 * and replace the PDF URL (vril-society) with a local image we already have.
 *
 * Run: node fix-direct-urls.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');

const DIR = path.join(__dirname, 'topics', 'great-awakening');
const IMG  = path.join(DIR, 'images');

/**
 * Given a direct Wikimedia URL like:
 *   https://upload.wikimedia.org/wikipedia/commons/f/fd/Foo.jpg
 * returns the thumb URL:
 *   https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Foo.jpg/800px-Foo.jpg
 * @param {string} directUrl
 * @param {number} width
 * @returns {string}
 */
function toThumbUrl(directUrl, width = 800) {
  // Extract hash + filename from  .../commons/H/HH/Filename.ext
  const m = directUrl.match(/\/commons\/([0-9a-f])\/([0-9a-f]{2})\/(.+)$/);
  if (!m) return directUrl;
  const [, h1, h2, filename] = m;
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${h1}/${h2}/${filename}/${width}px-${filename}`;
}

// HTTP GET helper
function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'TruthArchive/1.0 (node.js)' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    }).on('error', reject);
  });
}

/** Download binary to file */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'TruthArchive/1.0 (node.js)' } }, res => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
      const out = fs.createWriteStream(dest);
      res.pipe(out);
      out.on('finish', () => out.close(resolve));
      out.on('error', reject);
    }).on('error', reject);
  });
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

/** Replace the src in the topic-image figure */
function replaceSrc(html, oldSrc, newSrc) {
  return html.split(oldSrc).join(newSrc);
}

(async () => {
  // ── The 5 direct URLs still in pages ──────────────────────────────────────
  const fixes = [
    {
      file:    'chinese-pyramids.html',
      oldSrc:  'https://upload.wikimedia.org/wikipedia/commons/f/f6/%E6%BC%A2%E5%AD%9D%E6%88%90%E7%9A%87%E5%B8%9D%E9%99%B5%C2%B7%E5%BB%B6%E9%99%B5%C2%B7%E5%92%B8%E9%99%BD%C2%B7%EF%BC%88%E4%BF%AF%EF%BC%89.jpg',
      // Use a different freely-licensed image of the Maoling pyramid mound
      newSrc:  null, // will be set below from Wikipedia API
      wikiTitle: 'Mausoleum_of_the_First_Qin_Emperor',
    },
    {
      file:   'giants-suppressed.html',
      oldSrc: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Cardiff_giant_exhumed_1869.jpg',
      newSrc: toThumbUrl('https://upload.wikimedia.org/wikipedia/commons/f/fd/Cardiff_giant_exhumed_1869.jpg'),
      localName: 'Cardiff_giant_exhumed_1869.jpg',
    },
    {
      file:   'mud-flood.html',
      oldSrc: 'https://upload.wikimedia.org/wikipedia/commons/5/58/Seattle_Underground_Tour_03.jpg',
      newSrc: toThumbUrl('https://upload.wikimedia.org/wikipedia/commons/5/58/Seattle_Underground_Tour_03.jpg'),
      localName: 'Seattle_Underground_Tour_03.jpg',
    },
    {
      file:   'nazi-breakaway-group.html',
      oldSrc: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Naziufo-large.png',
      newSrc: toThumbUrl('https://upload.wikimedia.org/wikipedia/commons/f/f9/Naziufo-large.png'),
      localName: 'Naziufo-large.png',
    },
    {
      file:   'vril-society.html',
      oldSrc: 'https://upload.wikimedia.org/wikipedia/commons/d/dc/The_Coming_Race_%281871%29.png',
      // We already have an Operation_Paperclip image locally — use that as a thematic stand-in
      // Actually use the Ahnenerbe SVG we already downloaded
      newSrc: 'images/Ahnenerbe.svg',
    },
  ];

  // ── Resolve the Chinese pyramids replacement via Wikipedia REST ──────────
  const chineseFix = fixes[0];
  console.log(`Looking up thumbnail for "${chineseFix.wikiTitle}"...`);
  try {
    const { body } = await get(`https://en.wikipedia.org/api/rest_v1/page/summary/${chineseFix.wikiTitle}`);
    const json = JSON.parse(body);
    const thumb = json.thumbnail && json.thumbnail.source;
    if (thumb) {
      // Download it locally
      const localName = 'Mausoleum_of_First_Qin_Emperor.jpg';
      const dest = path.join(IMG, localName);
      console.log(`  Downloading ${thumb.slice(0, 70)}...`);
      try {
        await downloadFile(thumb, dest);
        chineseFix.newSrc = `images/${localName}`;
        chineseFix.localName = localName;
        console.log(`  Saved as ${localName}`);
      } catch (e) {
        console.log(`  Download failed (${e.message}), using thumb URL directly`);
        chineseFix.newSrc = thumb;
      }
    } else {
      console.log('  No thumbnail found, using fallback (Göbekli Tepe)');
      chineseFix.newSrc = 'images/Göbekli_Tepe,_Urfa.jpg';
    }
  } catch (e) {
    console.log(`  API error: ${e.message}`);
    chineseFix.newSrc = 'images/Göbekli_Tepe,_Urfa.jpg';
  }

  // ── Download the 3 thumb URLs locally ────────────────────────────────────
  for (const fix of fixes.slice(1, 4)) {
    if (!fix.localName) continue;
    const dest = path.join(IMG, fix.localName);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      console.log(`  ${fix.localName}: already exists, using local`);
      fix.newSrc = `images/${fix.localName}`;
      continue;
    }
    console.log(`  Downloading ${fix.newSrc.slice(0, 70)}...`);
    await wait(800);
    try {
      await downloadFile(fix.newSrc, dest);
      fix.newSrc = `images/${fix.localName}`;
      console.log(`  Saved as ${fix.localName}`);
    } catch (e) {
      console.log(`  Download failed (${e.message}), keeping thumb URL`);
      // newSrc stays as the thumb URL — will load for real users
    }
  }

  // ── Apply all patches ─────────────────────────────────────────────────────
  console.log('\nApplying patches...');
  let updated = 0;
  for (const { file, oldSrc, newSrc } of fixes) {
    if (!newSrc) { console.log(`  SKIP ${file} (no newSrc resolved)`); continue; }
    const fullPath = path.join(DIR, file);
    let html = fs.readFileSync(fullPath, 'utf8');
    if (!html.includes(oldSrc)) { console.log(`  SKIP ${file} (src not found in HTML)`); continue; }
    html = replaceSrc(html, oldSrc, newSrc);
    fs.writeFileSync(fullPath, html, 'utf8');
    console.log(`  ✓ ${file} → ${newSrc.slice(0, 60)}`);
    updated++;
  }
  console.log(`\nDone — ${updated} pages patched.`);
})();
