/**
 * deploy-images.js
 * Uploads all files in topics/great-awakening/images/ to the VPS via SFTP,
 * then uploads every updated great-awakening HTML file.
 *
 * Uses the ssh2 package already in the project.
 * Run: node deploy-images.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const LOCAL_DIR  = path.join(__dirname, 'topics', 'great-awakening');
const REMOTE_DIR = '/var/www/truth-archive/topics/great-awakening';
const SSH_KEY    = path.join(process.env.USERPROFILE || process.env.HOME, '.ssh', 'trutharchive.pem');
const HOST       = '100.50.29.179';
const USER       = 'ubuntu';

const cfg = {
  host:       HOST,
  username:   USER,
  privateKey: fs.readFileSync(SSH_KEY),
};

// ── SFTP helpers ──────────────────────────────────────────────────────────────

/** Open an SFTP session on conn */
function openSftp(conn) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => err ? reject(err) : resolve(sftp));
  });
}

/** Ensure a remote directory exists */
function mkdirRemote(sftp, dir) {
  return new Promise((resolve) => {
    sftp.mkdir(dir, () => resolve()); // ignore error (already exists)
  });
}

/** Upload one local file to a remote path */
function putFile(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    sftp.fastPut(localPath, remotePath, {}, (err) => err ? reject(err) : resolve());
  });
}

/** Open SSH connection */
function connect() {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => resolve(conn)).connect(cfg);
    conn.on('error', reject);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`Connecting to ${HOST}...`);
  const conn = await connect();
  const sftp = await openSftp(conn);
  console.log('Connected.\n');

  // 1. Ensure remote images directory exists
  await mkdirRemote(sftp, `${REMOTE_DIR}/images`);

  // 2. Upload all images
  const imgDir    = path.join(LOCAL_DIR, 'images');
  const imgFiles  = fs.readdirSync(imgDir).filter(f => fs.statSync(path.join(imgDir, f)).isFile());
  console.log(`Uploading ${imgFiles.length} images...`);
  let imgOk = 0, imgFail = 0;
  for (const f of imgFiles) {
    try {
      await putFile(sftp, path.join(imgDir, f), `${REMOTE_DIR}/images/${f}`);
      process.stdout.write('.');
      imgOk++;
    } catch (e) {
      process.stdout.write('✗');
      imgFail++;
    }
  }
  console.log(`\n  ${imgOk} uploaded, ${imgFail} failed.\n`);

  // 3. Upload all great-awakening HTML files
  const htmlFiles = fs.readdirSync(LOCAL_DIR).filter(f => f.endsWith('.html'));
  console.log(`Uploading ${htmlFiles.length} HTML files...`);
  let htmlOk = 0;
  for (const f of htmlFiles) {
    try {
      await putFile(sftp, path.join(LOCAL_DIR, f), `${REMOTE_DIR}/${f}`);
      process.stdout.write('.');
      htmlOk++;
    } catch (e) {
      console.error(`\n  FAIL: ${f} — ${e.message}`);
    }
  }
  console.log(`\n  ${htmlOk} HTML files uploaded.\n`);

  conn.end();
  console.log('Done — server is up to date.');
})();
