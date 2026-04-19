const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REQUIRED_ENV_KEYS = [
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
  'FIREBASE_ADMIN_SDK_JSON',
];

const parseEnvKeys = (filePath) =>
  new Set(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => line.split('=')[0].trim()),
  );

const runCommand = (command, args) => {
  const commandLine = [command, ...args].join(' ');
  const result = spawnSync(commandLine, { stdio: 'pipe', encoding: 'utf8', shell: true });
  const status = typeof result.status === 'number' ? result.status : 1;
  return { ok: status === 0 && !result.error, status };
};

const checkNode = () => {
  const major = Number(process.versions.node.split('.')[0]);
  return { ok: major >= 20, message: `Node ${process.versions.node}` };
};

const checkEnvFile = () => {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return { ok: false, message: '.env.local not found' };
  const keys = parseEnvKeys(envPath);
  const missing = REQUIRED_ENV_KEYS.filter((key) => !keys.has(key));
  if (missing.length > 0) return { ok: false, message: `Missing env keys: ${missing.join(', ')}` };
  return { ok: true, message: `.env.local has ${REQUIRED_ENV_KEYS.length} required keys` };
};

const main = () => {
  const checks = [
    { name: 'Node version', ...checkNode() },
    { name: 'Environment file', ...checkEnvFile() },
    (() => {
      const result = runCommand('npm', ['run', 'check:secrets']);
      return { name: 'Secret scan', ok: result.ok, message: result.ok ? 'Secret scan passed' : `Secret scan failed (${result.status})` };
    })(),
    (() => {
      const result = runCommand('npm', ['run', 'postdeploy:check']);
      return { name: 'Endpoint check', ok: result.ok, message: result.ok ? 'Post-deploy checks passed' : `Endpoint checks failed (${result.status})` };
    })(),
  ];

  let failed = 0;
  checks.forEach((check) => {
    console.log(`${check.ok ? 'PASS' : 'FAIL'} - ${check.name}: ${check.message}`);
    if (!check.ok) failed += 1;
  });

  if (failed > 0) process.exit(1);
  console.log('Doctor check passed');
};

main();
