// @ts-check
const { defineConfig } = require('@playwright/test');
const { getApiBaseUrl } = require('./resources/dataobjects/config');

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
require('dotenv').config();

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  /* Global timeout for each test */
  timeout: 500_000,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  workers: 5,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'reports/playwright-report' }],
    ['json', { outputFile: 'reports/json-report/report.json' }],
    ['allure-playwright', { outputFolder: 'reports/allure-results' }],
    ['./resources/utility/jira.reporter.js']
  ],
  outputDir: 'test-results',
  use: {
    baseURL: getApiBaseUrl(),
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    trace: 'on-first-retry',
  },

  /* Configure projects for API testing */
  projects: [
    {
      name: 'API',
      use: {},
    },
  ],
});
