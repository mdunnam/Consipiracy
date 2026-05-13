'use strict';

const { execFileSync, spawn } = require('child_process');

const CHECK_FILES = [
  'server.js',
  'js/app.js',
  'autopilot/lambda/ai.mjs',
  'autopilot/lambda/index.mjs',
  'autopilot/lambda/ssh-deploy.mjs',
  'autopilot/lambda/template.mjs',
  'autopilot/lambda-pkg/ai.mjs',
  'autopilot/lambda-pkg/index.mjs',
  'autopilot/lambda-pkg/ssh-deploy.mjs',
  'autopilot/lambda-pkg/template.mjs',
];

const PORT = 3999;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function checkSyntax() {
  for (const file of CHECK_FILES) {
    execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const res = await fetch(`${BASE_URL}/ebook.html`);
      if (res.status === 200) return;
    } catch (err) {
      // Server is still booting.
    }
    await delay(250);
  }
  throw new Error('Server did not start in time.');
}

async function expectStatus(path, expectedStatus) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (res.status !== expectedStatus) {
    throw new Error(`${path} returned ${res.status}; expected ${expectedStatus}`);
  }
}

async function runHttpSmoke() {
  const child = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore',
  });

  try {
    await waitForServer();

    await expectStatus('/ebook.html', 200);
    await expectStatus('/js/app.js', 200);
    await expectStatus('/verify-session/not-a-session', 400);

    await expectStatus('/server.js', 404);
    await expectStatus('/package.json', 404);
    await expectStatus('/protected/ebook-content.html', 404);
    await expectStatus('/.env', 404);
    await expectStatus('/ebook.pdf', 404);
  } finally {
    child.kill('SIGTERM');
  }
}

(async () => {
  checkSyntax();
  await runHttpSmoke();
  console.log('Smoke checks passed.');
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
