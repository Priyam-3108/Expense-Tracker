const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure TS/TSX support
const { sourceExts } = config.resolver;
config.resolver.sourceExts = [...new Set([...sourceExts, 'ts', 'tsx', 'cjs'])];

config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    '@react-native-community/netinfo': require.resolve('@react-native-community/netinfo/lib/commonjs/index.js'),
};

module.exports = config;
