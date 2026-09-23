import { defineConfig, devices } from '@playwright/test';

// Runs against the static export: `npm run build && npm run test:e2e`.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4321' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: { command: 'node tests/e2e/serve.mjs', port: 4321, reuseExistingServer: !process.env.CI },
});
