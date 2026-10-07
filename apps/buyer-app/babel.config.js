module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    // If you use reanimated, keep its plugin LAST: plugins: ['react-native-reanimated/plugin']
  };
};
