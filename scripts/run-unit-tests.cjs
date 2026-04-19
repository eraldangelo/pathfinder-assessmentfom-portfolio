const { readdirSync, statSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT_DIR = join(process.cwd(), 'app');

const collectTestFiles = (dirPath) => {
  const entries = readdirSync(dirPath);
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...collectTestFiles(fullPath));
      continue;
    }
    if (entry.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }

  return files;
};

const testFiles = collectTestFiles(ROOT_DIR).sort();
if (!testFiles.length) {
  console.error('No unit test files found under app/**/*.test.ts');
  process.exit(1);
}

const run = spawnSync(
  process.execPath,
  ['--import', 'tsx', '--test', ...testFiles],
  { stdio: 'inherit' },
);

if (typeof run.status === 'number') {
  process.exit(run.status);
}

process.exit(1);
