import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:5173",
    channel: "chrome",
    headless: true,
    viewport: { width: 1440, height: 1000 },
  },
  workers: 1,
  webServer: [
    { command: 'npm run dev -- --port 5173', url: 'http://localhost:5173', reuseExistingServer: true },
    { command: 'npm run preview -- --port 4173', url: 'http://localhost:4173', reuseExistingServer: true }
  ],
  reporter: "list",
});
