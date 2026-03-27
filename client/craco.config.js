const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          crypto: require.resolve('crypto-browserify'),
          buffer: require.resolve('buffer/'),
          stream: require.resolve('stream-browserify'),
          vm: require.resolve('vm-browserify'),
          process: require.resolve('process/browser')
        }
      }
    },
    plugins: {
      add: [
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.ProvidePlugin({
          process: 'process/browser',
        }),
      ]
    }
  }
}; 