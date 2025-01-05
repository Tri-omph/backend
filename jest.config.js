module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testSequencer: './tests/lexicographicSequencer.js',
  globalTeardown: './tests/globalTeardown.ts',
};
