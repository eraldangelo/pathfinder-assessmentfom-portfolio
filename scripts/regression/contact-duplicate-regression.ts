import assert from 'node:assert/strict';

import { isSamePersonByName } from '../../lib/assessment/server/duplicateMatcher';
import { normalizeEmail, normalizePhilippineMobile } from '../../lib/assessment/utils/contact';
import { buildDuplicateKey } from '../../lib/assessment/server/leadIndexKeys';

export const runContactDuplicateRegression = () => {
  const checks: string[] = [];

  assert.equal(normalizeEmail('  USER@Example.COM  '), 'user@example.com');
  checks.push('email normalization is stable');

  assert.equal(normalizePhilippineMobile('+63 917 111 2222'), '9171112222');
  assert.equal(normalizePhilippineMobile('0917-111-2222'), '9171112222');
  assert.equal(normalizePhilippineMobile('9171112222'), '9171112222');
  checks.push('mobile normalization supports +63, 0-prefixed, and plain local format');

  assert.equal(isSamePersonByName('Juan Dela Cruz', 'juan dela cruz'), true);
  assert.equal(isSamePersonByName('Juan Dela Cruz', 'Juan dela-cruz'), true);
  checks.push('duplicate matcher handles case and punctuation variants');

  assert.equal(isSamePersonByName('Juan Dela Cruz', 'Maria Santos'), false);
  assert.equal(isSamePersonByName('Juan', 'Juan Dela Cruz'), false);
  checks.push('duplicate matcher rejects weak token overlaps');

  assert.equal(
    buildDuplicateKey('Juan Dela Cruz', '1999-05-12'),
    buildDuplicateKey('juan dela-cruz', '1999-05-12'),
  );
  assert.equal(
    buildDuplicateKey('Juan---Dela   Cruz', '1999-05-12'),
    buildDuplicateKey('juan dela cruz', '1999-05-12'),
  );
  checks.push('deterministic duplicate key is stable across punctuation/case variants');

  return checks;
};
