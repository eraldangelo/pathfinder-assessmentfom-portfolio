const { readdirSync, statSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT_DIR = join(process.cwd(), 'tests', 'integration');

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
    if (entry.endsWith('.test.ts')) files.push(fullPath);
  }

  return files;
};

const testFiles = collectTestFiles(ROOT_DIR).sort();
if (!testFiles.length) {
  console.error('No integration test files found under tests/integration/**/*.test.ts');
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ['--import', 'tsx', '--test', ...testFiles],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      TURNSTILE_TEST_BYPASS: 'true',
      FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080',
      GCLOUD_PROJECT: process.env.GCLOUD_PROJECT || 'assessmentform-test',
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'assessmentform-test',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || 'integration-test-site-key',
      TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY || 'integration-test-secret',
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || '',
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    },
  },
);

if (typeof result.status === 'number') {
  process.exit(result.status);
}
process.exit(1);
