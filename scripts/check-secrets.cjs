const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EXCLUDED_DIRS = ['node_modules', '.next', '.git', 'coverage', 'test-results', 'playwright-report', 'reports'];
const SAFE_EXAMPLES = new Set(['.env.example', '.env.local.example']);
const FORBIDDEN_FILENAMES = [
  /(^|\/)key\.json$/i,
  /(^|\/)service-account\.json$/i,
  /(^|\/)firebase-adminsdk-[^/]+\.json$/i,
];
const CONTENT_RULES = [
  { id: 'private-key', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/m },
  { id: 'service-account', regex: /"type"\s*:\s*"service_account"[\s\S]{0,1600}"private_key"\s*:\s*"/m },
  { id: 'openai-key', regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/m },
  { id: 'github-token', regex: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/m },
];

const getFiles = () =>
  execSync('git ls-files --cached --others --exclude-standard', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\\/g, '/'))
    .filter(Boolean);

const shouldSkip = (file) =>
  SAFE_EXAMPLES.has(file)
  || EXCLUDED_DIRS.some((dir) => file.startsWith(`${dir}/`) || file.includes(`/${dir}/`));

const likelyBinary = (buffer) => {
  const max = Math.min(buffer.length, 4096);
  for (let i = 0; i < max; i += 1) {
    if (buffer[i] === 0) return true;
  }
  return false;
};

const main = () => {
  const offenders = [];
  for (const file of getFiles()) {
    if (shouldSkip(file)) continue;
    if (FORBIDDEN_FILENAMES.some((pattern) => pattern.test(file))) {
      offenders.push({ file, reason: 'forbidden-credential-filename' });
      continue;
    }
    const fullPath = path.join(process.cwd(), file);
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) continue;
    const buffer = fs.readFileSync(fullPath);
    if (likelyBinary(buffer)) continue;
    const text = buffer.toString('utf8');
    const hit = CONTENT_RULES.find((rule) => rule.regex.test(text));
    if (hit) offenders.push({ file, reason: hit.id });
  }

  if (offenders.length > 0) {
    console.error('Secret scan failed. Remove credentials from repository files:');
    offenders.forEach((item) => console.error(`- ${item.file} (${item.reason})`));
    process.exit(1);
  }
  console.log('Secret scan passed.');
};

main();
