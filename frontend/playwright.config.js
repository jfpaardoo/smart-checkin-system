const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e', // Apunta exactamente a la carpeta e2e
  testMatch: /.*\.spec\.js$/, // Solo ejecutará archivos que terminen en .spec.js dentro de e2e
  timeout: 60 * 1000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
    env: {
      BROWSER: 'none',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});