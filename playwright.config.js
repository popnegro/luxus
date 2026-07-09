export default {
    testDir: '.',
    testMatch: 'fragment-integration.spec.js',
    timeout: 30_000,
    use: {
        baseURL: 'http://localhost:3000',
    },
    webServer: {
        command: 'npm run server',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 15_000,
    },
};
