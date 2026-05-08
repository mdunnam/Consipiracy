/**
 * deploy-fe.js
 * Deploys the flat-earth folder (all JS + HTML) to the server via SFTP.
 * Run: node deploy-fe.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const LOCAL_DIR  = path.join(__dirname, 'topics', 'flat-earth');
const REMOTE_DIR = '/var/www/truth-archive/topics/flat-earth';
const SSH_KEY    = path.join(process.env.USERPROFILE || process.env.HOME, '.ssh', 'trutharchive.pem');
const HOST       = '100.50.29.179';

const cfg = { host: HOST, username: 'ubuntu', privateKey: fs.readFileSync(SSH_KEY) };

function connect() {
  return new Promise((resolve, reject) => {
    const c = new Client();
    c.on('ready', () => resolve(c)).connect(cfg);
    c.on('error', reject);
  });
}
function openSftp(conn) {
  return new Promise((resolve, reject) => conn.sftp((e, s) => e ? reject(e) : resolve(s)));
}
function putFile(sftp, local, remote) {
  return new Promise((resolve, reject) => sftp.fastPut(local, remote, {}, e => e ? reject(e) : resolve()));
}

(async () => {
  console.log('Connecting...');
  const conn = await connect();
  const sftp = await openSftp(conn);
  console.log('Connected.\n');

  const files = fs.readdirSync(LOCAL_DIR).filter(f => {
    const s = fs.statSync(path.join(LOCAL_DIR, f));
    return s.isFile();
  });

  console.log(`Uploading ${files.length} files from topics/flat-earth/...`);
  let ok = 0;
  for (const f of files) {
    try {
      await putFile(sftp, path.join(LOCAL_DIR, f), `${REMOTE_DIR}/${f}`);
      process.stdout.write('.');
      ok++;
    } catch (e) {
      console.error(`\nFAIL: ${f} — ${e.message}`);
    }
  }
  console.log(`\n${ok} files uploaded.\n`);
  conn.end();
  console.log('Done.');
})();
