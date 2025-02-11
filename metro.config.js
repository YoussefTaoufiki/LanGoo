const { getDefaultConfig } = require('@expo/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

module.exports = {
  ...config,
  resolver: {
    ...config.resolver,
    assetExts: [...config.resolver.assetExts, 'db', 'mp3', 'ttf', 'obj', 'png', 'jpg'],
    sourceExts: [...config.resolver.sourceExts, 'svg']
  }
};
