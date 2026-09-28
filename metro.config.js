const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Support Drizzle SQL migrations
config.resolver.sourceExts.push('sql');

// NativeWind setup
module.exports = withNativeWind(config, { input: './global.css' });
