const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const PORT = 4173;
const LOCK_PATH = path.join(process.cwd(), '.next', 'dev', 'lock');

const canConnect = (port) =>
  new Promise((resolve) => {
    const socket = net.createConnection({ port, host: '127.0.0.1' });
    const done = (result) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(1000);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });

const run = async () => {
  if (fs.existsSync(LOCK_PATH)) {
    const hasDevServer = await canConnect(PORT);
    if (!hasDevServer) {
      fs.rmSync(LOCK_PATH, { force: true });
      console.log('[smoke] Removed stale Next.js dev lock before Playwright startup.');
    }
  }

  const cliPath = require.resolve('@playwright/test/cli');
  const result = spawnSync(
    process.execPath,
    [cliPath, 'test', 'e2e/smoke/smoke.spec.ts', '--reporter=line', ...process.argv.slice(2)],
    { stdio: 'inherit' },
  );
  process.exit(typeof result.status === 'number' ? result.status : 1);
};

run().catch((error) => {
  console.error('[smoke] failed to start', error);
  process.exit(1);
});
