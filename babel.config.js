module.exports = function (api) {
  api.cache(true);
  const isProduction = process.env.NODE_ENV === "production";
  const plugins = [
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    ...(isProduction ? [["transform-remove-console", { exclude: ["error"] }]] : []),
    "react-native-reanimated/plugin",
  ];
  return {
    presets: ["babel-preset-expo"],
    plugins,
  };
};
