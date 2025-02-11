const { getDefaultConfig } = require('@expo/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.transformer.babelTransformerPath = require.resolve('metro-react-native-babel-transformer');

defaultConfig.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

module.exports = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    assetExts: [...defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'), 'db', 'mp3', 'ttf', 'obj', 'png', 'jpg'],
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg']
  },
  transformer: {
    ...defaultConfig.transformer,
    babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
    assetPlugins: ['expo-asset/tools/hashAssetFiles']
  }
};
