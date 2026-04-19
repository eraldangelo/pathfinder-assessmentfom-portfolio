const BASE_URL = (process.env.APP_BASE_URL || 'https://assessment-form.example.com/')
  .replace(/\/+$/, '');
const CANONICAL_HOST = new URL(BASE_URL).host;

const normalize = (path) => (path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`);

const check = async ({ name, path, method = 'GET', expectStatus, body, headers, expectResponse }) => {
  const url = normalize(path);
  const reqHeaders = { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(headers || {}) };
  const response = await fetch(url, {
    method,
    redirect: 'manual',
    headers: Object.keys(reqHeaders).length ? reqHeaders : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const statusOk = typeof expectStatus === 'function' ? expectStatus(response.status) : response.status === expectStatus;
  const responseOk = typeof expectResponse === 'function' ? expectResponse(response) : true;
  return { ok: statusOk && responseOk, status: response.status, location: response.headers.get('location'), name, url };
};

const checks = [
  {
    name: 'Home route responds with hardened headers',
    path: '/',
    expectStatus: (s) => s >= 200 && s < 400,
    expectResponse: (response) => Boolean(response.headers.get('strict-transport-security')),
  },
  { name: 'Personnel endpoint responds', path: '/api/personnel?branch=Manila', expectStatus: (s) => s === 200 || s === 429 },
  { name: 'Submit without captcha rejected', path: '/api/submit', method: 'POST', body: {}, expectStatus: 400 },
  {
    name: 'Canonical host redirect stays enforced',
    path: '/',
    method: 'GET',
    headers: { 'x-forwarded-host': 'noncanonical-smoke.run.app' },
    expectStatus: 308,
    expectResponse: (response) => String(response.headers.get('location') || '').includes(CANONICAL_HOST),
  },
];

const main = async () => {
  const results = [];
  for (const item of checks) {
    try {
      results.push(await check(item));
    } catch (error) {
      results.push({
        ok: false,
        name: item.name,
        status: -1,
        url: normalize(item.path),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  let failed = 0;
  for (const result of results) {
    const prefix = result.ok ? 'PASS' : 'FAIL';
    const detail = result.error
      ? `${result.status} (${result.error})`
      : `${result.status}${result.location ? ` -> ${result.location}` : ''}`;
    console.log(`${prefix} - ${result.name} -> ${detail} [${result.url}]`);
    if (!result.ok) failed += 1;
  }

  if (failed > 0) {
    console.error(`postdeploy check failed: ${failed} issue(s)`);
    process.exit(1);
  }
  console.log('postdeploy check passed');
};

main();
