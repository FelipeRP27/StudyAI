module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/__tests__/integracao/**/*.test.js'],
  setupFiles: ['<rootDir>/src/__tests__/integracao/ambiente.js'],
  globalSetup: '<rootDir>/src/__tests__/integracao/prepararBanco.js',
  testTimeout: 30000,
  maxWorkers: 1,
  clearMocks: true
};
