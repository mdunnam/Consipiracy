/**
 * SSH deployment helpers — upload files and patch HTML on the VPS using SFTP/SSH.
 * Uses the ssh2 package which is bundled with the Lambda deployment zip.
 */

import { Client } from 'ssh2';

// ─── Core SSH primitives ─────────────────────────────────────────────────────

/**
 * Executes a shell command on the remote server.
 * @param {Object} cfg - { host, username, privateKey }
 * @param {string} cmd
 * @returns {Promise<string>} stdout
 */
function sshExec(cfg, cmd) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let out = '';
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) { conn.end(); return reject(err); }
        stream.on('data',   d => out += d.toString());
        stream.stderr.on('data', d => console.error('SSH STDERR:', d.toString()));
        stream.on('close', () => { conn.end(); resolve(out); });
      });
    }).connect(sshConnectOpts(cfg));
  });
}

/**
 * Writes a string to a remote file via SFTP.
 * @param {Object} cfg - { host, username, privateKey }
 * @param {string} remotePath
 * @param {string} content
 * @returns {Promise<void>}
 */
function sftpWrite(cfg, remotePath, content) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) { conn.end(); return reject(err); }
        const stream = sftp.createWriteStream(remotePath);
        stream.on('close', () => { conn.end(); resolve(); });
        stream.on('error', e => { conn.end(); reject(e); });
        stream.end(content, 'utf8');
      });
    }).connect(sshConnectOpts(cfg));
  });
}

/**
 * Reads a remote file as a UTF-8 string via SFTP.
 * @param {Object} cfg
 * @param {string} remotePath
 * @returns {Promise<string>}
 */
function sftpRead(cfg, remotePath) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) { conn.end(); return reject(err); }
        const chunks = [];
        const stream = sftp.createReadStream(remotePath);
        stream.on('data',  d => chunks.push(d));
        stream.on('close', () => { conn.end(); resolve(Buffer.concat(chunks).toString('utf8')); });
        stream.on('error', e => { conn.end(); reject(e); });
      });
    }).connect(sshConnectOpts(cfg));
  });
}

/** Builds connection options from our config object. */
function sshConnectOpts(cfg) {
  return {
    host:       cfg.host,
    port:       cfg.port || 22,
    username:   cfg.username,
    privateKey: cfg.privateKey,
    readyTimeout: 20000,
  };
}

// ─── High-level deploy operations ────────────────────────────────────────────

/**
 * Uploads the generated HTML page to the correct path on the VPS.
 *
 * @param {Object} cfg     - SSH config
 * @param {string} webRoot - e.g. /var/www/truth-archive
 * @param {Object} topic
 * @param {string} html
 */
export async function deployFile(cfg, webRoot, topic, html) {
  const remotePath = `${webRoot}/topics/${topic.category}/${topic.slug}.html`;
  console.log(`SFTP write → ${remotePath}`);
  await sftpWrite(cfg, remotePath, html);
}

/**
 * Injects a new topic card at the top of the section index grid.
 *
 * @param {Object} cfg
 * @param {string} webRoot
 * @param {Object} topic
 * @param {Object} content - AI content (used for subtitle on card)
 */
export async function updateSectionIndex(cfg, webRoot, topic, content) {
  const indexPath = `${webRoot}/topics/${topic.category}/index.html`;
  let html;
  try {
    html = await sftpRead(cfg, indexPath);
  } catch (e) {
    console.warn('Could not read index, skipping index update:', e.message);
    return;
  }

  const card =
    `<a href="${topic.slug}.html" class="topic-hub-card ga new-today">` +
    `<span class="hub-cat">${topic.section}</span>` +
    `<span class="hub-title">${topic.title}</span>` +
    `<span class="hub-desc">${(content.subtitle || '').substring(0, 120)}</span>` +
    `<span class="hub-new">NEW</span></a>`;

  // Inject directly after the first topic-hub-grid opening tag
  const updated = html.replace(
    /(<div class="topic-hub-grid[^"]*"[^>]*>)/,
    `$1\n        ${card}`
  );

  if (updated === html) {
    console.warn('Index injection pattern not found — skipping');
    return;
  }

  await sftpWrite(cfg, indexPath, updated);
  console.log('Section index updated');
}

/**
 * Writes /data/latest-topic.json to the server — consumed by the homepage
 * "New Today" banner.
 *
 * @param {Object} cfg
 * @param {string} webRoot
 * @param {Object} topic
 * @param {Object} content
 */
export async function writeLatestTopic(cfg, webRoot, topic, content) {
  // Ensure the data directory exists
  await sshExec(cfg, `mkdir -p ${webRoot}/data`);

  const payload = JSON.stringify({
    title:       topic.title,
    slug:        topic.slug,
    category:    topic.category,
    section:     topic.section,
    subtitle:    (content.subtitle || '').substring(0, 150),
    url:         `/topics/${topic.category}/${topic.slug}.html`,
    publishedAt: new Date().toISOString(),
  }, null, 2);

  await sftpWrite(cfg, `${webRoot}/data/latest-topic.json`, payload);
  console.log('latest-topic.json written');
}
