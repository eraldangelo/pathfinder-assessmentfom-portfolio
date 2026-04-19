#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const DEFAULTS = {
  service: 'assessment-form-service',
  project: 'your-gcp-project-id',
  region: 'asia-southeast1',
  appBaseUrl: 'https://assessment-form.example.com',
};

const parseArgs = () => {
  const out = { dryRun: false };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--dry-run') out.dryRun = true;
    else if (arg.startsWith('--service=')) out.service = arg.split('=')[1];
    else if (arg.startsWith('--project=')) out.project = arg.split('=')[1];
    else if (arg.startsWith('--region=')) out.region = arg.split('=')[1];
    else if (arg.startsWith('--app-base-url=')) out.appBaseUrl = arg.split('=')[1];
  }
  return out;
};

const quoteWin = (arg) => (/[\\s"&|<>^]/.test(arg) ? `"${String(arg).replace(/"/g, '\\"')}"` : String(arg));

const run = (cmd, args, options = {}) => {
  const printable = `${cmd} ${args.join(' ')}`;
  if (options.dryRun) {
    console.log(`[dry-run] ${printable}`);
    return '';
  }
  const isWin = process.platform === 'win32';
  const command = isWin ? `${cmd} ${args.map(quoteWin).join(' ')}` : cmd;
  const commandArgs = isWin ? [] : args;
  const result = spawnSync(command, commandArgs, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    shell: isWin,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${printable}\n${result.stderr || ''}`);
  }
  return (result.stdout || '').trim();
};

const toPairs = (obj) =>
  Object.entries(obj)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(',');

const readEnvConfig = () => {
  const file = path.join(process.cwd(), 'scripts', 'config', 'env-keys.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
};

const splitServiceEnv = (envList) => {
  const values = {};
  const secrets = {};
  for (const item of envList || []) {
    if (!item?.name) continue;
    if (typeof item.value === 'string') values[item.name] = item.value;
    if (item.valueFrom?.secretKeyRef?.name) {
      const key = item.valueFrom.secretKeyRef.key || 'latest';
      secrets[item.name] = `${item.valueFrom.secretKeyRef.name}:${key}`;
    }
  }
  return { values, secrets };
};

const ensureKeys = (map, keys, label) => {
  const missing = keys.filter((key) => !String(map[key] || '').trim());
  if (missing.length > 0) throw new Error(`${label} missing required keys: ${missing.join(', ')}`);
};

const ensurePairedKeys = (values, secrets, valueKey, secretKey, label) => {
  const hasValue = Boolean(String(values[valueKey] || '').trim());
  const hasSecret = Boolean(String(secrets[secretKey] || '').trim());
  if (hasValue === hasSecret) return;
  throw new Error(`${label} requires both ${valueKey} and ${secretKey} (or neither).`);
};

const verifyRuntime = async (baseUrl) => {
  const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/`);
  if (!response.ok) throw new Error(`Homepage check failed: ${response.status}`);
  const html = await response.text();
  const match = html.match(/<meta[^>]+name=["']assessment-public-env["'][^>]+content=["']([^"']+)["']/i);
  if (!match) throw new Error('Runtime public env meta tag is missing on homepage.');
  const envObj = JSON.parse(decodeURIComponent(match[1]));
  if (!envObj.NEXT_PUBLIC_TURNSTILE_SITE_KEY) throw new Error('Runtime turnstile site key is missing.');
};

async function main() {
  const cli = parseArgs();
  const cfg = { ...DEFAULTS, ...cli };
  const envCfg = readEnvConfig();
  const buildKeys = envCfg.required.filter((key) => key.startsWith('NEXT_PUBLIC_'));
  const requiredSecretBindings = ['TURNSTILE_SECRET_KEY', 'FIREBASE_ADMIN_SDK_JSON'];
  const requiredRuntimeValues = [];

  console.log(`Deploy target: ${cfg.service} (${cfg.project}/${cfg.region})`);
  const raw = run(
    'gcloud',
    ['run', 'services', 'describe', cfg.service, '--region', cfg.region, '--project', cfg.project, '--format=json'],
    { capture: true, dryRun: false },
  );
  const serviceJson = JSON.parse(raw);
  const envList = serviceJson?.spec?.template?.spec?.containers?.[0]?.env || [];
  const { values, secrets } = splitServiceEnv(envList);

  ensureKeys(values, buildKeys, 'Cloud Run runtime env');
  ensureKeys(values, requiredRuntimeValues, 'Cloud Run runtime env');
  ensureKeys(secrets, requiredSecretBindings, 'Cloud Run secret bindings');
  ensurePairedKeys(values, secrets, 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'Redis configuration');

  const buildEnvArg = toPairs(Object.fromEntries(buildKeys.map((key) => [key, values[key]])));
  const updateEnvArg = toPairs(values);
  const updateSecretsArg = toPairs(secrets);

  run(
    'gcloud',
    [
      'run',
      'deploy',
      cfg.service,
      '--source',
      '.',
      '--region',
      cfg.region,
      '--project',
      cfg.project,
      '--set-build-env-vars',
      buildEnvArg,
      '--update-env-vars',
      updateEnvArg,
      '--update-secrets',
      updateSecretsArg,
      '--quiet',
    ],
    { dryRun: cfg.dryRun },
  );

  if (cfg.dryRun) {
    console.log('Dry run complete.');
    return;
  }

  run('npm', ['run', 'postdeploy:check']);
  await verifyRuntime(cfg.appBaseUrl);
  console.log('Deploy succeeded: build/runtime env and postdeploy checks are valid.');
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
