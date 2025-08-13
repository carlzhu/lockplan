module.exports = {
  // Bundle configuration for production builds
  bundleOutput: 'ios/main.jsbundle',
  assetsDest: 'ios',
  entryFile: 'index.js',
  resetCache: true,
  sourcemapOutput: 'ios/main.jsbundle.map',
  dev: false,
  minify: true,
  platform: 'ios',
};