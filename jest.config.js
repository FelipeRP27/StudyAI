module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/__tests__/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/src/__tests__/integracao/'],
  clearMocks: true,
  resetModules: true
};
