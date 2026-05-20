module.exports = function (api) {
  api.cache(true);
  const plugins = [
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    "react-native-reanimated/plugin",
  ];
  return {
    presets: ["babel-preset-expo"],
    plugins,
  };
};
