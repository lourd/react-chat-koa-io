var path = require('path')
var webpack = require('webpack')

const devConfig = {
  devtool: '#source-map',
  entry: [
    'webpack-hot-middleware/client',
    './client/client.jsx',
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/static/',
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
  ],
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel',
      },
      {
        test: /\.css$/,
        loaders: [
          'style',
          'css',
        ],
      },
    ],
  },
}

module.exports.dev = devConfig
