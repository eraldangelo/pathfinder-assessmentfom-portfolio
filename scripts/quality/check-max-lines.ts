import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MAX_LINES = 250;
const ROOT_DIRS = ['app', 'components', 'lib', 'scripts', 'e2e', 'docs'];
const ALLOWED_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.md']);

const readLines = (filePath: string) => readFileSync(filePath, 'utf8').split(/\r?\n/).length;

const hasAllowedExtension = (filePath: string) =>
  Array.from(ALLOWED_EXT).some((extension) => filePath.endsWith(extension));

const walk = (baseDir: string, output: string[]) => {
  for (const entry of readdirSync(baseDir)) {
    const entryPath = join(baseDir, entry);
    const stats = statSync(entryPath);
    if (stats.isDirectory()) {
      walk(entryPath, output);
      continue;
    }
    if (!hasAllowedExtension(entryPath)) continue;
    const lines = readLines(entryPath);
    if (lines > MAX_LINES) output.push(`${lines}\t${entryPath}`);
  }
};

const run = () => {
  const offenders: string[] = [];
  for (const root of ROOT_DIRS) {
    if (!existsSync(root)) continue;
    walk(root, offenders);
  }

  if (offenders.length === 0) {
    console.log(`PASS - all tracked source/docs files are <= ${MAX_LINES} lines`);
    return;
  }

  console.error(`FAIL - found ${offenders.length} file(s) over ${MAX_LINES} lines:`);
  offenders.forEach((file) => console.error(file));
  process.exit(1);
};

run();
