import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, workers: 1, timeout: 45000,
  expect: { timeout: 7000 },
  outputDir: 'artifacts/qa/test-results',
  reporter: [['list'], ['json', { outputFile: 'artifacts/qa/report.json' }]],
  use: { baseURL: 'http://127.0.0.1:8091', channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
    trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: [
    { command: 'node server/index.mjs', url: 'http://127.0.0.1:3011/api/status', timeout: 15000,
      env: { API_PORT: '3011', API_DISCOVERY: 'off', AI_MODE: 'demo', OPENAI_API_KEY: '' }, reuseExistingServer: false },
    { command: 'npm run serve -- --host 127.0.0.1 --port 8091', url: 'http://127.0.0.1:8091', timeout: 60000,
      env: { TRAVEL_API_PROXY: 'http://127.0.0.1:3011' }, reuseExistingServer: false },
  ],
});
