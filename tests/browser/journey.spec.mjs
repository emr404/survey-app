import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
async function noOverflow(page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true); }
async function screenshot(page, info, name) {
  await noOverflow(page); mkdirSync('artifacts/qa', { recursive: true });
  await page.screenshot({ path: `artifacts/qa/${info.project.name}-${name}.png`, fullPage: true });
}
test.beforeEach(async ({ page }) => {
  await page.route('**/api/destination-photo?**', route => route.fulfill({ json: { photo: null } }));
});
async function shortlist(page, days = 5) {
  await page.goto('/');
  await page.getByLabel('Where are you leaving from?').fill('London');
  await page.getByLabel('Trip length').fill(String(days));
  await page.getByLabel('Where are you drawn to?').selectOption('Europe');
  await page.getByRole('button', { name: /Find destinations/ }).click();
  await expect(page.locator('.destination-card')).toHaveCount(3);
}
async function openRefinements(page) { await page.locator('.refinement-panel > summary').click(); }
test('preferences to recommendations and details retains results without comparison', async ({ page }, info) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.locator('#main-content')).toBeFocused();
  await expect(page.locator('body')).toHaveCSS('font-family', /Neohellenic/);
  await screenshot(page, info, 'preferences');
  await shortlist(page, 21); await screenshot(page, info, 'recommendations');
  await expect(page.getByRole('link', { name: /Compare/ })).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: /Compare/ })).toHaveCount(0);
  await expect(page.locator('footer svg')).toHaveCount(0);
  await expect(page.locator('footer')).toContainText(`Talaria © ${new Date().getFullYear()}`);
  await expect(page.locator('.destination-photo')).toHaveCount(3);
  await page.getByRole('link', { name: /Explore Porto/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Porto');
  await screenshot(page, info, 'destination');
  await page.getByRole('link', { name: /Back to recommendations/ }).click();
  await expect(page.locator('.destination-card')).toHaveCount(3);
  await page.reload(); await expect(page.locator('.destination-card')).toHaveCount(3);
  await page.getByRole('link', { name: /Edit your trip brief/ }).click();
  await expect(page.getByLabel('Trip length')).toHaveValue('21');
  await expect(page.getByLabel('Where are you leaving from?')).toHaveValue('London');
  await noOverflow(page); expect(errors).toEqual([]);
});
test('refinements explicitly change the brief, with partial and empty matches', async ({ page }) => {
  let posts = 0; page.on('request', r => { if (r.url().endsWith('/api/recommendations') && r.method() === 'POST') posts++; });
  await shortlist(page); await openRefinements(page);
  await page.getByRole('button', { name: 'Lower budget −20%' }).click();
  await expect(page.getByText('Daily budget per person: 120 → 96', { exact: true })).toBeVisible(); expect(posts).toBe(1);
  await page.getByRole('button', { name: /Update recommendations/ }).click();
  await expect(page.locator('.pending-changes')).toHaveCount(0); expect(posts).toBe(2);
  await openRefinements(page); await page.getByRole('button', { name: 'Less crowded' }).click();
  await expect(page.getByText('Crowds: No preference → Quieter places', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Discard pending changes' }).click();
  await openRefinements(page); await page.getByText('View and edit refinement values', { exact: true }).click();
  await page.getByLabel('Daily budget / person (GBP)').fill('66');
  await page.getByRole('button', { name: /Update recommendations/ }).click();
  await expect(page.locator('.destination-card')).toHaveCount(1);
  await expect(page.getByText(/A partial shortlist/)).toBeVisible();
  await openRefinements(page); await page.getByText('View and edit refinement values', { exact: true }).click();
  await page.getByLabel('Daily budget / person (GBP)').fill('20');
  await page.getByRole('button', { name: /Update recommendations/ }).click();
  await expect(page.getByRole('heading', { name: 'No suitable matches this time.' })).toBeVisible();
  await expect(page.locator('.destination-card')).toHaveCount(0); await noOverflow(page);
});
test('visible T spinner, cancellation, invalid responses and retry preserve earlier results', async ({ page }, info) => {
  await shortlist(page); await openRefinements(page);
  await page.route('**/api/recommendations', async route => { await new Promise(r => setTimeout(r, 1500)); await route.fulfill({ json: { mode: 'groq', summary: 'invalid' } }).catch(() => {}); });
  await page.getByRole('button', { name: 'Less crowded' }).click();
  await page.getByRole('button', { name: /Update recommendations/ }).click();
  await expect(page.locator('.loading-emblem svg')).toBeVisible();
  await expect(page.locator('.loading-orbit')).toBeVisible();
  await expect(page.locator('.destination-card')).toHaveCount(0);
  await screenshot(page, info, 'loading');
  await page.getByRole('button', { name: 'Cancel request' }).click();
  await expect(page.getByText('Request cancelled. Your preferences and previous results are saved.')).toBeVisible();
  await expect(page.locator('.destination-card')).toHaveCount(3);
  await page.waitForTimeout(1700); await expect(page.locator('.error-state')).toHaveCount(0);
  await page.unroute('**/api/recommendations');
  await page.route('**/api/recommendations', route => route.fulfill({ json: { mode: 'groq', summary: 'invalid' } }));
  await page.locator('.notice').getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('alert')).toContainText('response failed validation');
  await expect(page.locator('.destination-card')).toHaveCount(3);
  await page.unroute('**/api/recommendations'); await page.getByRole('alert').getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('.error-state')).toHaveCount(0); await expect(page.locator('.pending-changes')).toHaveCount(0);
});
test('unfinished edits persist and invalid fields show red rings and receive focus', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: /Find destinations/ }).click();
  await expect(page.getByRole('alert')).toContainText('Enter a departure city'); await expect(page.getByLabel('Where are you leaving from?')).toBeFocused();
  await expect(page.getByLabel('Where are you leaving from?')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Where are you leaving from?')).toHaveCSS('box-shadow', /rgba\(178, 56, 50/);
  await expect(page.getByText('A few details need your attention')).toHaveCount(0);
  await page.getByLabel('Where are you leaving from?').fill('London');
  await page.getByLabel('Anything we should work around?').fill('No driving');
  await page.getByLabel('Trip length').clear(); await page.reload();
  await expect(page.getByLabel('Anything we should work around?')).toHaveValue('No driving');
  await page.getByRole('button', { name: /Find destinations/ }).click();
  await expect(page.getByRole('alert')).toContainText('positive whole number of days');
  await expect(page.getByLabel('Trip length')).toBeFocused();
  await expect(page.getByLabel('Trip length')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Trip length')).toHaveCSS('box-shadow', /rgba\(178, 56, 50/);
  await expect(page.locator('.preference-form')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.getByLabel('Trip length').fill('20'); await page.getByRole('button', { name: /Find destinations/ }).click();
  await expect(page.locator('.destination-card')).toHaveCount(3); await noOverflow(page);
});
test('Groq uses one small credit and rate limits preserve the shortlist', async ({ page }) => {
  await page.route('**/api/status', route => route.fulfill({ json: { mode: 'groq', available: true } }));
  await page.route('**/api/recommendations', async route => { const response = await route.fetch(); const result = await response.json(); await route.fulfill({ json: { ...result, mode: 'groq' } }); });
  await shortlist(page); await expect(page.getByText('Powered by Groq', { exact: true })).toHaveCount(1);
  await page.unroute('**/api/recommendations');
  await page.route('**/api/recommendations', route => route.fulfill({ status: 503, json: { code: 'groq_rate_limit', error: 'The free request limit has been reached. Wait a moment and try again.' } }));
  await openRefinements(page); await page.getByRole('button', { name: 'Lower budget −20%' }).click(); await page.getByRole('button', { name: /Update recommendations/ }).click();
  await expect(page.getByRole('alert')).toContainText('free request limit'); await expect(page.locator('.destination-card')).toHaveCount(3);
  await page.reload(); await expect(page.locator('.destination-card')).toHaveCount(3);
});

test('passport selections persist, reach recommendations and show individual entry checks', async ({ page }, info) => {
  const requests = []; page.on('request', r => { if (r.url().endsWith('/api/recommendations') && r.method() === 'POST') requests.push(r.postDataJSON()); });
  await page.goto('/'); await page.getByLabel('Where are you leaving from?').fill('London');
  await page.getByLabel('Passport nationality', { exact: false }).selectOption('GB');
  await page.getByLabel('Passport nationality', { exact: false }).selectOption('IN');
  await page.getByLabel('Country of residence', { exact: false }).selectOption('GB');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Remove United Kingdom passport' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove India passport' })).toBeVisible();
  await expect(page.getByLabel('Country of residence', { exact: false })).toHaveValue('GB');
  await screenshot(page, info, 'passports');
  await page.getByRole('button', { name: /Find destinations/ }).click();
  await expect(page.locator('.destination-card')).toHaveCount(3);
  expect(requests[0].preferences.passportCountries).toEqual(['GB', 'IN']); expect(requests[0].preferences.residenceCountry).toBe('GB');
  const card = page.locator('.destination-card').first();
  await expect(card.locator('.visa-status-list li')).toHaveCount(2);
  await expect(card.locator('.visa-status-list')).toContainText('United Kingdom'); await expect(card.locator('.visa-status-list')).toContainText('India');
  await card.getByText('Entry details & checks', { exact: true }).click();
  await expect(card.getByRole('link', { name: /Check entry rules with IATA/ })).toHaveAttribute('href', 'https://www.iatatravelcentre.com/');
  await expect(card.getByText(/This fixture does not evaluate entry rules/)).toHaveCount(2);
  await screenshot(page, info, 'passport-recommendations');
  await page.getByRole('link', { name: /Edit your trip brief/ }).click();
  await page.getByRole('button', { name: 'Remove India passport' }).click();
  await page.getByLabel('Travel document', { exact: true }).selectOption('other');
  await page.getByRole('button', { name: /Find destinations/ }).click();
  await expect(page.locator('.pending-changes')).toHaveCount(0);
  await expect(page.locator('.destination-card').first().locator('.visa-status-list li')).toHaveCount(1);
  await noOverflow(page);
});
