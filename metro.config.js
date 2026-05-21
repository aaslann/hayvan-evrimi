const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force CJS resolution to avoid import.meta in ESM packages (e.g. zustand)
config.resolver.unstable_conditionNames = ['require', 'default', 'react-native'];

module.exports = config;
