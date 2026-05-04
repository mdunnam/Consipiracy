/**
 * download-images.js
 * Downloads every Wikimedia image referenced in topics/great-awakening/*.html
 * into topics/great-awakening/images/, then rewrites every src attribute to
 * the local relative path.
 *
 * Run: node download-images.js
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');
const DIR       = path.join(__dirname, 'topics', 'great-awakening');
const IMG_DIR   = path.join(DIR, 'images');

if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR);

// ── Derive a safe local filename from a Wikimedia URL ────────────────────────
function localFilename(imgUrl) {
  // For thumb URLs: .../thumb/ab/abc/Actual_Filename.jpg/800px-Actual_Filename.jpg
  // We want just "Actual_Filename.jpg"
  const clean = imgUrl.split('?')[0];
  const thumbMatch = clean.match(/\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+)\//);
  if (thumbMatch) return decodeURIComponent(thumbMatch[1]);
  // For direct URLs: .../a/ab/Actual_Filename.jpg
  const directMatch = clean.match(/\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+)$/);
  if (directMatch) return decodeURIComponent(directMatch[1]);
  // SVG wrapped as PNG: ends with /NNNpx-filename.svg.png
  const svgPng = clean.match(/\/(\d+px-.+\.svg\.png)$/);
  if (svgPng) return decodeURIComponent(svgPng[1]);
  // Fallback: last path segment
  return decodeURIComponent(clean.split('/').pop());
}

// ── Sanitise filename for the filesystem ─────────────────────────────────────
function safeName(name) {
  return name.replace(/[<>:"/\\|?*]+/g, '_').replace(/\s+/g, '_');
}

// ── Download a URL to a local file (with redirect + retry on 429) ────────────
function downloadOnce(imgUrl, destPath, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(imgUrl);
    const client  = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      headers:  { 'User-Agent': 'TruthArchive-ImageDownloader/1.0 (node.js; educational)' },
    };
    client.get(options, res => {
      if ([301, 302, 307, 308].includes(res.statusCode)) {
        res.resume();
        if (redirectsLeft <= 0) return reject(new Error('Too many redirects'));
        return downloadOnce(res.headers.location, destPath, redirectsLeft - 1)
          .then(resolve).catch(reject);
      }
      if (res.statusCode === 429) {
        res.resume();
        return reject(Object.assign(new Error(`HTTP 429`), { rateLimit: true }));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const out = fs.createWriteStream(destPath);
      res.pipe(out);
      out.on('finish', () => out.close(resolve));
      out.on('error', reject);
    }).on('error', reject);
  });
}

async function download(imgUrl, destPath) {
  const delays = [3000, 8000, 20000, 45000]; // backoff: 3s, 8s, 20s, 45s
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      await downloadOnce(imgUrl, destPath);
      return; // success
    } catch (e) {
      if (e.rateLimit && attempt < delays.length) {
        process.stdout.write(`[wait ${delays[attempt]/1000}s]`);
        await wait(delays[attempt]);
        continue;
      }
      throw e;
    }
  }
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  const htmlFiles = fs.readdirSync(DIR)
    .filter(f => f.endsWith('.html') && f !== 'index.html');

  // 1. Collect all unique Wikimedia URLs
  const urlToLocal = new Map(); // wikimedia URL → local filename (no path)
  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(DIR, file), 'utf8');
    for (const m of html.matchAll(/src="(https:\/\/upload\.wikimedia\.org[^"]+)"/g)) {
      const imgUrl = m[1];
      if (!urlToLocal.has(imgUrl)) {
        const name = safeName(localFilename(imgUrl));
        // Handle collisions from different-sized thumbs of same file
        urlToLocal.set(imgUrl, name);
      }
    }
  }
  console.log(`Found ${urlToLocal.size} unique Wikimedia image URLs.\n`);

  // 2. Download each image
  let downloaded = 0, skipped = 0, failed = 0;
  const failedUrls = [];

  for (const [imgUrl, localName] of urlToLocal) {
    const destPath = path.join(IMG_DIR, localName);
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
      process.stdout.write('·');
      skipped++;
      continue;
    }
    await wait(600); // 600ms between downloads — polite but not too slow
    try {
      await download(imgUrl, destPath);
      process.stdout.write('✓');
      downloaded++;
    } catch (e) {
      process.stdout.write('✗');
      failedUrls.push({ imgUrl, localName, error: e.message });
      failed++;
      // Remove empty/partial file
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
    }
  }

  console.log(`\n\nDownloads: ${downloaded} new, ${skipped} already existed, ${failed} failed.`);
  if (failedUrls.length) {
    console.log('\nFailed:');
    failedUrls.forEach(({ imgUrl, error }) => console.log(`  ${error}: ${imgUrl.slice(0, 80)}`));
  }

  // 3. Rewrite src attributes in all HTML files
  console.log('\nRewriting HTML src attributes...');
  let pagesUpdated = 0;

  for (const file of htmlFiles) {
    const fullPath = path.join(DIR, file);
    let html = fs.readFileSync(fullPath, 'utf8');
    let changed = false;

    for (const [imgUrl, localName] of urlToLocal) {
      const destPath = path.join(IMG_DIR, localName);
      if (!fs.existsSync(destPath)) continue; // download failed, leave src alone
      const localSrc = `images/${localName}`;
      if (html.includes(imgUrl)) {
        html = html.split(imgUrl).join(localSrc);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(fullPath, html, 'utf8');
      pagesUpdated++;
      process.stdout.write('.');
    }
  }

  console.log(`\n\nDone — ${pagesUpdated} HTML pages updated to use local image paths.`);
  console.log(`Images stored in: topics/great-awakening/images/`);
})();
