import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}
async function screenshot(page, info, name) {
  await page.locator('h1').focus();
  await noOverflow(page); mkdirSync('artifacts/qa', { recursive: true });
  await page.screenshot({ path: `artifacts/qa/${info.project.name}-${name}.png`, fullPage: true });
}
async function shortlist(page, days = 3) {
  await page.goto('/');
  await page.getByLabel('Where are you leaving from?').fill('London');
  await page.getByLabel('Trip length').fill(String(days));
  await page.getByLabel('Where are you drawn to?').selectOption('Europe');
  await page.getByRole('button', { name: /Review my trip/ }).click();
  await expect(page.getByRole('heading', { name: 'Does this feel like you?' })).toBeVisible();
  await page.getByRole('button', { name: /Explore demo recommendations/ }).click();
  await expect(page.locator('.destination-card')).toHaveCount(3);
}

test('complete journey: compare, edit, approve, restore and invalidate approval', async ({ page }, info) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.locator('#main-content')).toBeFocused();
  await screenshot(page, info, 'preferences');
  await shortlist(page);
  await expect(page.getByText('Simulated suggestions. Real control.')).toBeVisible();
  await screenshot(page, info, 'shortlist');
  await page.getByRole('checkbox', { name: 'Compare Porto', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Compare Ljubljana', exact: true }).check();
  await page.getByRole('link', { name: /Compare destinations/ }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await screenshot(page, info, 'comparison');
  await page.getByRole('link', { name: /Explore Porto/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Porto');
  await page.getByRole('link', { name: /Back to comparison/ }).click();
  await expect(page.getByRole('columnheader', { name: /Porto/ })).toBeVisible();
  await page.getByRole('link', { name: /Explore Porto/ }).click();
  await page.getByRole('button', { name: /Build my 3-day itinerary/ }).click();
  await expect(page.locator('.day-panel')).toHaveCount(3);
  await screenshot(page, info, 'itinerary');
  const firstDay = page.locator('.day-panel').first();
  const firstTitle = await firstDay.locator('.activity-body h3').first().textContent();
  await firstDay.getByRole('button', { name: `Move ${firstTitle} later`, exact: true }).click();
  await expect(firstDay.locator('.activity-body h3').nth(1)).toHaveText(firstTitle);
  await firstDay.getByRole('button', { name: /Replace \/ edit/ }).first().click();
  await page.getByLabel('Activity name').fill('My own slow food walk');
  await page.getByLabel('Plan or practical notes').fill('Choose a short route and leave room for breaks.');
  await page.getByLabel('Low estimate (GBP)').fill('5');
  await page.getByLabel('High estimate (GBP)').fill('15');
  await page.getByRole('button', { name: 'Save activity', exact: true }).click();
  await expect(firstDay.getByRole('heading', { name: 'My own slow food walk' })).toBeVisible();
  await firstDay.getByRole('button', { name: /Remove / }).last().click();
  await expect(firstDay.locator('.activity-item')).toHaveCount(1);
  const approval = page.getByRole('button', { name: /Approve this plan/ });
  await expect(approval).toBeDisabled();
  await page.getByRole('checkbox', { name: /I’ve reviewed the activities/ }).check();
  await approval.click();
  await expect(page.getByText('Approved plan', { exact: true })).toBeVisible();
  await screenshot(page, info, 'approved');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Save plan as text/ }).click();
  expect((await download).suggestedFilename()).toBe('porto-travel-plan.txt');
  await page.reload(); await expect(page.getByText('Approved plan', { exact: true })).toBeVisible();
  await page.locator('.day-panel').first().getByRole('button', { name: /Replace \/ edit/ }).first().click();
  await page.getByLabel('Activity name').fill('An updated walk');
  await page.getByRole('button', { name: 'Save activity', exact: true }).click();
  await expect(page.getByText('Approved plan', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Approve this plan/ })).toBeDisabled();
  await page.getByRole('checkbox', { name: /I’ve reviewed the activities/ }).check();
  await page.getByRole('button', { name: /Approve this plan/ }).click();
  await page.getByRole('link', { name: /1 Your trip/ }).click();
  await page.getByLabel('Currency', { exact: true }).selectOption('EUR');
  await page.getByRole('link', { name: /4 Your plan/ }).click();
  await expect(page.getByText('Your trip brief has changed.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: /Approve this plan/ })).toBeDisabled();
  await noOverflow(page); expect(errors).toEqual([]);
});

test('refinements are explicit, preserve the brief and support partial and empty states', async ({ page }) => {
  let posts = 0; page.on('request', request => { if (request.url().endsWith('/api/recommendations') && request.method() === 'POST') posts++; });
  await shortlist(page, 2); expect(posts).toBe(1);
  await page.getByRole('button', { name: 'Lower budget −20%' }).click();
  await expect(page.getByText('Daily budget per person: 120 → 96', { exact: true })).toBeVisible(); expect(posts).toBe(1);
  await page.getByRole('button', { name: /Update recommendations/ }).click();
  await expect(page.locator('.pending-changes')).toHaveCount(0);
  expect(posts).toBe(2);
  await page.getByRole('button', { name: 'Less crowded' }).click();
  await expect(page.getByText('Crowds: No preference → Quieter places', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Discard pending changes' }).click();
  await expect(page.locator('.pending-changes')).toHaveCount(0);
  await page.getByText('View and edit refinement values', { exact: true }).click();
  await page.getByLabel('Daily budget / person (GBP)').fill('66');
  await page.getByRole('button', { name: /Update recommendations/ }).click();
  await expect(page.locator('.destination-card')).toHaveCount(1);
  await expect(page.getByText(/A partial shortlist/)).toBeVisible();
  await page.getByLabel('Daily budget / person (GBP)').fill('20');
  await page.getByRole('button', { name: /Update recommendations/ }).click();
  await expect(page.getByRole('heading', { name: 'No suitable matches this time.' })).toBeVisible();
  await expect(page.locator('.destination-card')).toHaveCount(0); await noOverflow(page);
  await page.getByRole('link', { name: /Edit your trip brief/ }).click();
  await expect(page.getByLabel('Daily budget per person', { exact: true })).toHaveValue('20');
  await expect(page.getByLabel('Where are you leaving from?')).toHaveValue('London');
});

test('invalid responses retain previous results; retry and cancellation are honest', async ({ page }) => {
  await shortlist(page, 2);
  await page.route('**/api/recommendations', route => route.fulfill({ json: { mode: 'demo', summary: 'bad' } }));
  await page.getByRole('button', { name: 'Lower budget −20%' }).click();
  await page.getByRole('button', { name: /Update recommendations/ }).click();
  await expect(page.getByText(/response failed validation/)).toBeVisible();
  await expect(page.locator('.destination-card')).toHaveCount(3);
  await page.unroute('**/api/recommendations');
  await page.getByRole('button', { name: 'Retry request', exact: true }).click();
  await expect(page.locator('.error-state')).toHaveCount(0);
  await expect(page.locator('.pending-changes')).toHaveCount(0);
  await page.route('**/api/recommendations', async route => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    await route.fulfill({ json: { mode: 'demo', summary: 'late invalid response' } }).catch(() => {});
  });
  await page.getByRole('button', { name: 'Less crowded' }).click();
  await page.getByRole('button', { name: /Update recommendations/ }).click();
  await expect(page.getByRole('button', { name: 'Cancel request' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel request' }).click();
  await expect(page.getByText('Request cancelled. Your preferences and previous work are unchanged.')).toBeVisible();
  await expect(page.locator('.destination-card')).toHaveCount(3);
  await page.waitForTimeout(1400);
  await expect(page.getByText('Request cancelled. Your preferences and previous work are unchanged.')).toBeVisible();
  await expect(page.locator('.error-state')).toHaveCount(0); await noOverflow(page);
});

test('approachable validation and a keyboard-editable activity form', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Review my trip/ }).click();
  await expect(page.getByRole('alert')).toContainText('Enter a departure city');
  await expect(page.locator('.error-summary')).toBeFocused();
  await shortlist(page, 1);
  await page.getByRole('link', { name: /Explore Porto/ }).click();
  await page.getByRole('button', { name: /Build my 1-day itinerary/ }).click();
  await expect(page.locator('.day-panel')).toHaveCount(1);
  await page.getByRole('button', { name: /Replace \/ edit/ }).first().click();
  await expect(page.getByLabel('Activity name')).toBeFocused();
  await page.getByLabel('Low estimate (GBP)').fill('100');
  await page.getByLabel('High estimate (GBP)').fill('10');
  await page.getByRole('button', { name: 'Save activity', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('cost range');
  await expect(page.getByRole('button', { name: /Approve this plan/ })).toBeDisabled();
  await noOverflow(page);
});

test('holidays beyond two weeks keep their full itinerary length', async ({ page }) => {
  await shortlist(page, 21);
  await page.getByRole('link', { name: /Explore Porto/ }).click();
  await page.getByRole('button', { name: /Build my 21-day itinerary/ }).click();
  await expect(page.locator('.day-panel')).toHaveCount(21);
  await expect(page.locator('.day-panel').last().getByText('Day 21', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('.day-panel')).toHaveCount(21);
  await noOverflow(page);
});

test('unfinished trip edits survive refresh and stay blocked until corrected', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Where are you leaving from?').fill('London');
  await page.getByLabel('Anything we should work around?').fill('No driving');
  await page.getByLabel('Trip length').clear();
  await page.reload();
  await expect(page.getByLabel('Where are you leaving from?')).toHaveValue('London');
  await expect(page.getByLabel('Anything we should work around?')).toHaveValue('No driving');
  await page.getByRole('button', { name: /Review my trip/ }).click();
  await expect(page.getByRole('alert')).toContainText('positive whole number of days');
  await expect(page).toHaveURL(/\/$/);
  await page.getByLabel('Trip length').fill('20');
  await page.getByRole('button', { name: /Review my trip/ }).click();
  await expect(page.getByRole('heading', { name: 'Does this feel like you?' })).toBeVisible();
  await expect(page.getByText('20 days, Flexible dates', { exact: true })).toBeVisible();
});

test('quota errors explain the account action and preserve saved recommendations', async ({ page }) => {
  await shortlist(page, 2);
  await page.route('**/api/recommendations', route => route.fulfill({ status: 503, json: {
    code: 'insufficient_quota', error: 'OpenAI reports insufficient API quota. Check your API credit balance, billing and project or organisation limits. Retrying alone will not restore access.',
  } }));
  await page.getByRole('button', { name: 'Lower budget −20%' }).click();
  await page.getByRole('button', { name: /Update recommendations/ }).click();
  await expect(page.getByRole('heading', { name: 'Your AI account needs attention.' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Check API billing/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Check API limits/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry after updating account' })).toBeVisible();
  await expect(page.locator('.destination-card')).toHaveCount(3);
});
