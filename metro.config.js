const { getSentryExpoConfig } = require("@sentry/react-native/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname);

// Metro reads config.resolver.useWatchman (not config.watcher.useWatchman).
// macOS blocks Watchman from ~/Documents: "Operation not permitted".
config.resolver = {
  ...config.resolver,
  useWatchman: false,
};

module.exports = config;
