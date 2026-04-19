const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.cwd(), 'scripts', 'config', 'env-keys.json');
const ENV_EXAMPLE_PATH = path.join(process.cwd(), '.env.example');

const parseKeys = (text) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => line.split('=')[0].trim());

const main = () => {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const required = new Set(config.required || []);
  const optional = new Set(config.optional || []);
  const known = new Set([...required, ...optional]);

  const envKeys = parseKeys(fs.readFileSync(ENV_EXAMPLE_PATH, 'utf8'));
  const envSet = new Set(envKeys);
  const missing = [...required].filter((key) => !envSet.has(key));
  const unknown = [...envSet].filter((key) => !known.has(key));

  if (missing.length > 0 || unknown.length > 0) {
    console.error('Env example drift detected:');
    if (missing.length > 0) {
      console.error('Missing required keys:');
      missing.forEach((key) => console.error(`- ${key}`));
    }
    if (unknown.length > 0) {
      console.error('Unknown keys in .env.example:');
      unknown.forEach((key) => console.error(`- ${key}`));
    }
    process.exit(1);
  }
  console.log(`Env example check passed (${required.size} required + ${optional.size} optional known keys).`);
};

main();
