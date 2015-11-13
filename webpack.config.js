const Html = require('html-webpack-plugin')

const config = {
  entry: './src/client.jsx',
  output: {
    path: 'build',
    filename: 'bundle.js',
  },
  plugins: [
    new Html(),
  ],
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015'],
          plugins: ['transform-react-jsx'],
        },
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

module.exports = config
