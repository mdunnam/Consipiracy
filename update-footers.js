const fs = require('fs');
const path = require('path');

const newFooter = `  <footer class="site-footer">
<div class="footer-grid" style="max-width: 1320px; grid-template-columns: 2fr 1fr 1fr 1fr;">
      <div class="footer-brand">
        <h3>The Truth Archive</h3>
        <p>An independent research network dedicated to exposing the hidden architecture of power.</p>
        <p style="margin-top:1rem; font-family:var(--font-mono); font-size:0.68rem; color:var(--text-muted); letter-spacing:0.1em;">
          "Once you see it, you cannot unsee it."
        </p>
      </div>
      <div class="footer-links">
        <h5>Start Here</h5>
        <ul>
          <li><a href="index.html">Homepage</a></li>
          <li><a href="map.html">Connection Map</a></li>
          <li><a href="ebook.html">Complete eBook</a></li>
        </ul>
      </div>
      <div class="footer-links">
        <h5>Core Chapters</h5>
        <ul>
          <li><a href="deep-state.html">Deep State</a></li>
          <li><a href="flat-earth.html">Flat Earth</a></li>
          <li><a href="secret-societies.html">Secret Societies</a></li>
          <li><a href="banking-control.html">Banking Control</a></li>
          <li><a href="great-awakening.html">Great Awakening</a></li>
          <li><a href="media-control.html">Media Control</a></li>
        </ul>
      </div>
      <div class="footer-links">
        <h5>More Chapters</h5>
        <ul>
          <li><a href="big-pharma.html">Big Pharma</a></li>
          <li><a href="space-deception.html">Space Deception</a></li>
          <li><a href="tech-control.html">Tech &amp; Control</a></li>
          <li><a href="false-flags.html">False Flags</a></li>
          <li><a href="suppressed-history.html">Suppressed History</a></li>
          <li><a href="metaphysical.html">Metaphysical</a></li>
        </ul>
      </div>
    </div>
<div class="footer-bottom" style="max-width: 1320px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.62rem; letter-spacing: 0.1em;">
  <p style="white-space: nowrap;">&#9670; &nbsp; THE TRUTH ARCHIVE &nbsp; &#9670; &nbsp; RESEARCH &amp; EDUCATION &nbsp; &#9670; &nbsp; QUESTION EVERYTHING &nbsp; &#9670; &nbsp; ONCE YOU SEE IT YOU CANNOT UNSEE IT &nbsp; &#9670;</p>
</div>
  </footer>`;

const pages = [
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
  'index.html',
];

const dir = __dirname;
let updated = 0;

for (const page of pages) {
  const filePath = path.join(dir, page);
  if (!fs.existsSync(filePath)) { console.log(`SKIP (not found): ${page}`); continue; }

  let content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(/<footer class="site-footer">[\s\S]*?<\/footer>/, newFooter);

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`UPDATED: ${page}`);
    updated++;
  } else {
    console.log(`NO CHANGE: ${page}`);
  }
}

console.log(`\nDone. Updated ${updated} pages.`);
