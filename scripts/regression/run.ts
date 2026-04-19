import { runContactDuplicateRegression } from './contact-duplicate-regression';
import { runValidationRegression } from './validation-regression';

const run = async () => {
  const results: string[] = [];
  const syncChecks = runContactDuplicateRegression();
  results.push(...syncChecks);
  const asyncChecks = await runValidationRegression();
  results.push(...asyncChecks);

  results.forEach((message) => {
    console.log(`PASS - ${message}`);
  });
  console.log(`\nRegression checks passed: ${results.length}`);
};

run().catch((error) => {
  console.error('Regression checks failed.');
  console.error(error);
  process.exit(1);
});

