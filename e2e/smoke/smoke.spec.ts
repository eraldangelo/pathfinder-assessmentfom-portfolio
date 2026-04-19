import { expect, test, type Page } from '@playwright/test';

const buildWeekdayIso = () => {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1);
  }
  return next.toISOString().slice(0, 10);
};

const mockTurnstile = async (page: Page) => {
  await page.route('https://challenges.cloudflare.com/turnstile/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        window.turnstile = {
          render: function (_container, options) {
            if (options && typeof options.callback === 'function') {
              setTimeout(function () { options.callback('e2e-token'); }, 10);
            }
            return 1;
          },
          remove: function () {},
          reset: function () {}
        };
      `,
    });
  });
};

const completeStepOne = async (page: Page) => {
  await page.getByTestId('current-location-input').fill('Makati City');
  await page.getByTestId('preferred-branch-select').selectOption('Manila');
  await page.getByTestId('referred-by-staff-select').selectOption('no');
  await page.getByTestId('wizard-next-button').click();
};

const fillStepTwoFields = async (page: Page) => {
  await page.getByTestId('full-name-input').fill('Juan Dela Cruz');
  await page.getByTestId('mobile-number-input').fill('09171112222');
  await page.getByTestId('email-address-input').fill('juan+smoke@example.com');
  await page.getByTestId('date-of-birth-input').fill('1999-05-12');
  await page.getByTestId('us-passport-select').selectOption('no');
};

const completeStepTwo = async (page: Page) => {
  await fillStepTwoFields(page);
  await page.getByTestId('wizard-next-button').click();
};

const completeRemainingSteps = async (page: Page) => {
  await page.getByTestId('education-attainment-select').selectOption("Bachelor's Degree");
  await page.getByTestId('english-test-select').selectOption('IELTS - Academic');
  await page.getByTestId('has-worked-select').selectOption('yes');
  await page.getByTestId('visa-refusal-select').selectOption('no');
  await page.getByTestId('wizard-next-button').click();

  await page.getByLabel('Australia').check();
  await page.getByLabel("Master's Degree - Coursework").check();
  await page.getByTestId('planned-study-start-input').fill('2099-10');
  await page.getByTestId('wizard-next-button').click();

  await page.getByTestId('consultation-method-select').selectOption('Online Consultation (Zoom, Teams, Meets)');
  await page.getByTestId('consultation-date-input').fill(buildWeekdayIso());
  await page.getByTestId('consultation-time-select').selectOption('11:00');
  await page.getByTestId('wizard-next-button').click();

  await page.getByLabel('Official Website').check();
};

test('happy path submission smoke', async ({ page }) => {
  await mockTurnstile(page);
  await page.route('**/api/check-contact-usage', async (route) => {
    await route.fulfill({ json: { ok: true, emailInUse: false, mobileInUse: false } });
  });
  await page.route('**/api/check-duplicate', async (route) => {
    await route.fulfill({ json: { ok: true, exists: false, branch: null } });
  });
  await page.route('**/api/submit', async (route) => {
    await route.fulfill({ json: { ok: true } });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'I Agree & Continue' }).click();
  await expect(page.getByTestId('current-location-input')).toBeVisible();

  await completeStepOne(page);
  await completeStepTwo(page);
  await completeRemainingSteps(page);

  await page.getByTestId('wizard-submit-button').click();
  await expect(page.getByText('Thank you for completing the Assessment Form!')).toBeVisible();
});

test('duplicate submission path smoke', async ({ page }) => {
  await mockTurnstile(page);
  await page.route('**/api/check-contact-usage', async (route) => {
    await route.fulfill({ json: { ok: true, emailInUse: false, mobileInUse: false } });
  });
  await page.route('**/api/check-duplicate', async (route) => {
    await route.fulfill({ json: { ok: true, exists: true, branch: 'Manila' } });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'I Agree & Continue' }).click();
  await expect(page.getByTestId('current-location-input')).toBeVisible();

  await completeStepOne(page);
  await completeStepTwo(page);

  await expect(page.getByText('Information Already Found!!')).toBeVisible();
  await expect(page.getByRole('link', { name: 'manila.office@example.com' })).toBeVisible();
});

test('duplicate precheck transient failure blocks step 2 and retries safely', async ({ page }) => {
  await mockTurnstile(page);
  await page.route('**/api/check-contact-usage', async (route) => {
    await route.fulfill({ json: { ok: true, emailInUse: false, mobileInUse: false } });
  });

  let duplicateCalls = 0;
  await page.route('**/api/check-duplicate', async (route) => {
    duplicateCalls += 1;
    if (duplicateCalls <= 2) {
      await route.fulfill({
        status: 503,
        json: { ok: false, message: 'Duplicate precheck is temporarily unavailable. Please retry.' },
      });
      return;
    }
    await route.fulfill({ json: { ok: true, exists: false, branch: null } });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'I Agree & Continue' }).click();
  await completeStepOne(page);
  await completeStepTwo(page);

  await expect.poll(() => duplicateCalls).toBeGreaterThanOrEqual(2);
  await expect(page.getByTestId('full-name-input')).toBeVisible();
  await expect(page.getByTestId('education-attainment-select')).toHaveCount(0);
  await expect(page.getByText('Duplicate precheck is temporarily unavailable. Please retry.')).toBeVisible();

  await page.getByTestId('wizard-next-button').click();
  await expect(page.getByTestId('education-attainment-select')).toBeVisible();
});

test('contact precheck transient failure blocks step 2 and retries safely', async ({ page }) => {
  await mockTurnstile(page);

  let contactCalls = 0;
  await page.route('**/api/check-contact-usage', async (route) => {
    contactCalls += 1;
    if (contactCalls <= 2) {
      await route.fulfill({
        status: 503,
        json: { ok: false, message: 'Contact usage precheck is temporarily unavailable. Please retry.' },
      });
      return;
    }
    await route.fulfill({ json: { ok: true, emailInUse: false, mobileInUse: false } });
  });

  await page.route('**/api/check-duplicate', async (route) => {
    await route.fulfill({ json: { ok: true, exists: false, branch: null } });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'I Agree & Continue' }).click();
  await completeStepOne(page);
  await fillStepTwoFields(page);

  await expect.poll(() => contactCalls).toBeGreaterThanOrEqual(2);
  await page.getByTestId('wizard-next-button').click();

  await expect.poll(() => contactCalls).toBeGreaterThanOrEqual(3);
  await expect(page.getByTestId('full-name-input')).toBeVisible();
  await expect(page.getByTestId('education-attainment-select')).toHaveCount(0);

  await page.getByTestId('wizard-next-button').click();
  await expect(page.getByTestId('education-attainment-select')).toBeVisible();
});

test('security headers are present on page and api', async ({ request }) => {
  const pageResponse = await request.get('/');
  expect(pageResponse.status()).toBe(200);
  expect(pageResponse.headers()['x-frame-options']).toBe('DENY');
  expect(pageResponse.headers()['x-content-type-options']).toBe('nosniff');
  expect(pageResponse.headers()['content-security-policy']).toContain("default-src 'self'");

  const apiResponse = await request.post('/api/submit', {
    data: {},
  });
  expect(apiResponse.status()).toBe(400);
  expect(apiResponse.headers()['x-frame-options']).toBe('DENY');
});

test('submit endpoint rejects missing turnstile token', async ({ request }) => {
  const response = await request.post('/api/submit', {
    data: {},
  });
  expect(response.status()).toBe(400);
  const payload = await response.json();
  expect(payload.ok).toBe(false);
  expect(String(payload.message || '')).toContain('Captcha');
});

