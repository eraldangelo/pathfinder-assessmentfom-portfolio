const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const { spawnSync } = require('node:child_process');

const ROOT = process.cwd();
const JAVA_ROOT = path.join(ROOT, 'java-tests');
const BUILD_DIR = path.join(JAVA_ROOT, 'build', 'classes');
const CACHE_DIR = path.join(JAVA_ROOT, '.cache');
const JUNIT_VERSION = '1.12.2';
const JUNIT_JAR = `junit-platform-console-standalone-${JUNIT_VERSION}.jar`;
const JUNIT_JAR_PATH = path.join(CACHE_DIR, JUNIT_JAR);
const JUNIT_URL = `https://repo1.maven.org/maven2/org/junit/platform/junit-platform-console-standalone/${JUNIT_VERSION}/${JUNIT_JAR}`;

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: false });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
};

const walkJavaFiles = (dirPath) => {
  if (!fs.existsSync(dirPath)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dirPath)) {
    const fullPath = path.join(dirPath, entry);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...walkJavaFiles(fullPath));
    } else if (entry.endsWith('.java')) {
      files.push(fullPath);
    }
  }
  return files;
};

const downloadIfMissing = (url, destination) => new Promise((resolve, reject) => {
  if (fs.existsSync(destination)) {
    resolve();
    return;
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const file = fs.createWriteStream(destination);
  https.get(url, (response) => {
    if (response.statusCode !== 200) {
      reject(new Error(`Failed to download JUnit runner (${response.statusCode})`));
      return;
    }
    response.pipe(file);
    file.on('finish', () => {
      file.close(resolve);
    });
  }).on('error', (error) => {
    fs.unlink(destination, () => reject(error));
  });
});

const main = async () => {
  await downloadIfMissing(JUNIT_URL, JUNIT_JAR_PATH);
  const sourceFiles = [
    ...walkJavaFiles(path.join(JAVA_ROOT, 'src', 'main', 'java')),
    ...walkJavaFiles(path.join(JAVA_ROOT, 'src', 'test', 'java')),
  ];
  if (!sourceFiles.length) {
    console.error('No Java sources found in java-tests.');
    process.exit(1);
  }

  fs.rmSync(path.join(JAVA_ROOT, 'build'), { recursive: true, force: true });
  fs.mkdirSync(BUILD_DIR, { recursive: true });

  run('javac', ['-encoding', 'UTF-8', '-cp', JUNIT_JAR_PATH, '-d', BUILD_DIR, ...sourceFiles]);
  run('java', ['-jar', JUNIT_JAR_PATH, 'execute', '--class-path', BUILD_DIR, '--scan-class-path']);
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
