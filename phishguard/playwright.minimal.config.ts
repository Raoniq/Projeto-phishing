import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'https://projeto-phishing.pages.dev' },
  projects: [{ name: 'chromium', use: { channel: 'chromium' } }],
  reporter: 'list',
  webServer: undefined,
});