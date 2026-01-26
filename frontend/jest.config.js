module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  watcher: {
    cwd: __dirname,
  },
  setupFilesAfterEnv: ['./setupTests.js'],
};
