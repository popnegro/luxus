/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  verbose: true,
  testMatch: ['**/assets/js/**/*.test.js'],
  collectCoverage: true,
};