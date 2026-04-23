/**
 * HTML template renderer — converts an AI-generated content object into
 * a fully formed HTML page matching the existing Truth Archive topic format.
 */

/**
 * Renders a complete HTML topic page.
 *
 * @param {Object} topic   - Queue entry (slug, title, section, mapBadge, category)
 * @param {Object} content - AI-generated structured content
 * @returns {string}       - Complete HTML document
 */
export function renderHTML(topic, content) {
  const title    = esc(topic.title);
  const badge    = esc(topic.mapBadge || topic.section || 'Research');
  const subtitle = esc(content.subtitle || '');
  const sections = (content.sections || []).map(renderSection).join('\n');
  const crossRefs = (content.cross_refs || []).map(r =>
    `          <a href="${esc(r.slug)}.html" class="cross-ref-link">` +
    `<span class="ref-map">${esc(r.map)}</span>` +
    `<span class="ref-title">${esc(r.title)}</span></a>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Great Awakening Topics — Truth Archive</title>
  <link rel="stylesheet" href="../../css/style.css" />
  <style>.fade-in{opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s ease}.fade-in.visible{opacity:1;transform:none}</style>
</head>
<body>
  <div id="reading-progress"></div>
  <nav class="site-nav" role="navigation"><a href="../../index.html" class="nav-logo"><span class="eye-symbol">👁</span> Truth Archive</a><button class="nav-toggle" aria-expanded="false" aria-label="Toggle menu">☰</button><ul class="nav-links"><li><a href="../../index.html">Home</a></li><li><a href="../index.html">All Topics</a></li><li><a href="index.html">GA Topics</a></li><li><a href="../../great-awakening.html">GA Chapter</a></li><li><a href="../../ebook.html" class="ebook-link">eBook</a></li></ul></nav>

  <header class="page-header">
    <div class="container-narrow">
      <span class="map-badge map-badge-ga">◆ Great Awakening Map · ${badge}</span>
      <div class="breadcrumb"><a href="../../index.html">Home</a><span class="sep">›</span><a href="../index.html">Topics</a><span class="sep">›</span><a href="index.html">Great Awakening</a><span class="sep">›</span><span class="current">${title}</span></div>
      <h1 class="glitch" data-text="${title.toUpperCase()}">${title.toUpperCase()}</h1>
      <div class="divider"></div>
      <p class="subtitle">${subtitle}</p>
    </div>
  </header>

  <main class="section">
    <div class="container-narrow">
      <div class="chapter-content">
${sections}
      </div>

      <div class="cross-refs fade-in">
        <h3>Cross-References</h3>
        <div class="cross-refs-grid">
${crossRefs}
        </div>
      </div>
    </div>
  </main>

  <footer class="site-footer"><div class="footer-grid" style="max-width:1200px;margin:0 auto;"><div class="footer-brand"><h3>The Truth Archive</h3><p>Independent research. Unfiltered truth.</p></div><div class="footer-links"><h5>Navigate</h5><ul><li><a href="../../index.html">Home</a></li><li><a href="../index.html">All Topics</a></li><li><a href="index.html">GA Topics</a></li><li><a href="../../ebook.html">Full eBook</a></li><li><a href="../image-credits.html">Image Credits</a></li></ul></div></div><div class="footer-bottom"><p>◆ THE TRUTH ARCHIVE ◆ QUESTION EVERYTHING ◆</p></div></footer>

  <script src="../../js/app.js"></script>
</body>
</html>`;
}

/**
 * Renders a single content section block into HTML.
 * @param {Object} s - Section descriptor from AI output
 * @returns {string}
 */
function renderSection(s) {
  switch (s.type) {
    case 'h2+paragraphs':
      return `        <h2 class="fade-in">${esc(s.heading)}</h2>\n` +
        (s.paragraphs || []).map(p => `        <p class="fade-in">${esc(p)}</p>`).join('\n');

    case 'alert_box':
      return `        <div class="alert-box fade-in">\n` +
        `          <span class="alert-label">${esc(s.label)}</span>\n` +
        `          <p>${esc(s.content)}</p>\n` +
        `        </div>`;

    case 'fact_box':
      return `        <div class="fact-box fade-in">\n` +
        `          <span class="fact-label">${esc(s.label || 'Key Fact')}</span>\n` +
        `          <p>${esc(s.content)}</p>\n` +
        `        </div>`;

    case 'connection_nodes':
      return (s.nodes || []).map(n =>
        `        <div class="connection-node fade-in">` +
        `<span class="node-number">${esc(n.number)}</span>` +
        `<div class="node-content"><h4>${esc(n.title)}</h4><p>${esc(n.content)}</p></div>` +
        `</div>`
      ).join('\n');

    default:
      return '';
  }
}

/**
 * HTML-escapes a string to prevent XSS from AI-generated content.
 * @param {string} str
 * @returns {string}
 */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
