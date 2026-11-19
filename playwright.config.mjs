import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests',
  use: { baseURL: process.env.BASE_URL || 'http://localhost:4173' },
  webServer: process.env.BASE_URL ? undefined : { command: 'npx serve -l 4173 .', port: 4173, reuseExistingServer: true },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'iphone', use: { ...devices['iPhone 14'] } },
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'desktop-safari', use: { ...devices['Desktop Safari'] } },
  ],
});
