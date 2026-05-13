'use strict';
const fs   = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const SSH_KEY = path.join(process.env.USERPROFILE, '.ssh', 'trutharchive.pem');
const cfg     = { host: '100.50.29.179', username: 'ubuntu', privateKey: fs.readFileSync(SSH_KEY) };
const WEBROOT  = '/var/www/truth-archive';

const FILES = [
  // Updated existing pages
  'index.html','great-awakening.html','flat-earth.html','deep-state.html',
  'secret-societies.html','banking-control.html','media-control.html','space-deception.html',
  'big-pharma.html','tech-control.html','false-flags.html','suppressed-history.html',
  'metaphysical.html','rabbit-hole.html','tier-list.html',
  // New chapter pages
  'ufo-disclosure.html','ancient-civilisations.html','anomalous-zones.html',
  'elite-networks.html','internet-control.html','mandela-effect.html',
  'forensic-mysteries.html','secret-science.html',
  // CSS + JS
  'css/style.css','css/enhancements.css','js/app.js',
  // topics
  'topics/index.html',
];

function connect() {
  return new Promise((r, j) => {
    const c = new Client();
    c.on('ready', () => r(c)).connect(cfg);
    c.on('error', j);
  });
}
function openSftp(c) {
  return new Promise((r, j) => c.sftp((e, s) => e ? j(e) : r(s)));
}
function put(sftp, local, remote) {
  return new Promise((res, rej) => sftp.fastPut(local, remote, {}, e => e ? rej(e) : res()));
}

(async () => {
  console.log('Connecting...');
  const conn = await connect();
  const sftp = await openSftp(conn);
  console.log('Connected. Uploading ' + FILES.length + ' files...\n');
  let ok = 0, fail = 0;
  for (const f of FILES) {
    if (!fs.existsSync(f)) { console.log('SKIP (no file): ' + f); continue; }
    const remote = WEBROOT + '/' + f;
    try {
      await put(sftp, f, remote);
      console.log('OK   ' + f);
      ok++;
    } catch (e) {
      console.error('FAIL ' + f + ' — ' + e.message);
      fail++;
    }
  }
  conn.end();
  console.log('\nDone. ' + ok + ' uploaded, ' + fail + ' failed.');
})();
