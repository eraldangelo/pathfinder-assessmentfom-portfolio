const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const REPORT_DIR = join(process.cwd(), 'reports');
const REPORT_FILE = join(REPORT_DIR, 'ts-prune-report.txt');
const IGNORE_PATTERN = '^\\\\.?[\\\\/]?.next[\\\\/]';
const STRICT = process.argv.includes('--strict') || process.env.STRICT_UNUSED_EXPORTS === 'true';
const ALLOWLIST_PATH = join(process.cwd(), 'scripts', 'config', 'unused-exports-allowlist.json');
const ROUTE_EXPORTS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

const runTsPrune = () => spawnSync('npx', ['ts-prune', '-p', 'tsconfig.json', '-i', IGNORE_PATTERN], {
  encoding: 'utf8',
  shell: true,
});

const parseLines = (stdout) =>
  stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const parseEntry = (line) => {
  const match = line.match(/^(.+?):\d+\s+-\s+(.+)$/);
  if (!match) return null;
  return { file: match[1].trim().replace(/\\/g, '/').replace(/^\.?\//, ''), name: match[2].trim() };
};

const toAllowlistKey = (line) => {
  const entry = parseEntry(line);
  if (!entry) return line;
  return `${entry.file} - ${entry.name}`;
};

const isNoise = (line) => {
  if (line.includes('(used in module)')) return true;
  const entry = parseEntry(line);
  if (!entry) return false;
  if (entry.file.startsWith('.next/')) return true;
  if (entry.file === 'next-env.d.ts') return true;
  if (/^(next|playwright|tailwind)\.config\.ts$/.test(entry.file) && entry.name === 'default') return true;
  if (entry.file === 'proxy.ts' && ['proxy', 'config'].includes(entry.name)) return true;
  if (entry.file === 'app/layout.tsx' && ['default', 'metadata'].includes(entry.name)) return true;
  if (entry.file.startsWith('app/') && /\/route\.ts$/.test(entry.file) && ROUTE_EXPORTS.has(entry.name)) return true;
  if (entry.file.startsWith('app/') && /\/(page|layout|loading|error|not-found|template)\.tsx?$/.test(entry.file) && entry.name === 'default') return true;
  return false;
};

const readAllowlist = () => {
  if (!existsSync(ALLOWLIST_PATH)) return new Set();
  const parsed = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8'));
  if (!Array.isArray(parsed)) throw new Error('unused exports allowlist must be an array');
  return new Set(parsed.map((item) => String(item).trim()).filter(Boolean));
};

const writeReport = ({ raw, actionable, unexpected, allowlisted, filtered, stderr }) => {
  mkdirSync(REPORT_DIR, { recursive: true });
  const lines = [
    `Generated: ${new Date().toISOString()}`,
    `Strict mode: ${STRICT ? 'on' : 'off'}`,
    `Raw entries: ${raw.length}`,
    `Actionable entries: ${actionable.length}`,
    `Unexpected entries: ${unexpected.length}`,
    `Allowlisted entries: ${allowlisted.length}`,
    `Filtered entries: ${filtered.length}`,
    '',
    '--- Unexpected actionable ---',
    unexpected.length ? unexpected.join('\n') : 'No unexpected unused exports detected.',
  ];
  if (allowlisted.length) lines.push('', '--- Allowlisted actionable ---', allowlisted.join('\n'));
  if (filtered.length) lines.push('', '--- Filtered noise ---', filtered.join('\n'));
  if (stderr) lines.push('', 'stderr:', stderr.trim());
  writeFileSync(REPORT_FILE, `${lines.join('\n')}\n`, 'utf8');
};

const main = () => {
  const result = runTsPrune();
  const raw = parseLines(result.stdout || '');
  const allowlist = readAllowlist();
  const actionable = raw.filter((line) => !isNoise(line));
  const unexpected = actionable.filter((line) => !allowlist.has(toAllowlistKey(line)));
  const allowlisted = actionable.filter((line) => allowlist.has(toAllowlistKey(line)));
  const filtered = raw.filter((line) => isNoise(line));

  writeReport({ raw, actionable, unexpected, allowlisted, filtered, stderr: result.stderr || '' });
  console.log(`ts-prune entries: raw=${raw.length}, actionable=${actionable.length}, unexpected=${unexpected.length}, allowlisted=${allowlisted.length}, filtered=${filtered.length}`);
  console.log(`report: ${REPORT_FILE}`);

  if (result.status !== 0 && !STRICT) {
    console.warn('ts-prune exited non-zero in advisory mode; continuing.');
    process.exit(0);
  }
  if (STRICT && unexpected.length > 0) {
    console.error('Unexpected unused exports detected.');
    process.exit(1);
  }
  process.exit(result.status || 0);
};

main();
