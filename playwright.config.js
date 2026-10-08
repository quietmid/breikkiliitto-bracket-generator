import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4174';

export default defineConfig({
    testDir: './tests/e2e',
    use: {
        baseURL,
        browserName: 'chromium',
        headless: true
    },
    webServer: {
        command: 'node tests/e2e-server.js',
        url: baseURL,
        reuseExistingServer: !process.env.CI
    }
});
