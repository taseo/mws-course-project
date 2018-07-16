const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const templates = ['index', 'restaurant'];

const createTemplate = function(template) {
  return new HtmlWebpackPlugin({
    filename: `${template}.html`,
    inject: false,
    minify: {
      collapseWhitespace: true,
      conservativeCollapse: true,
      removeComments: true
    },
    template: `src/views/${template}.html`,
  });
};

module.exports = {
  entry: {
    index: [
      './src/js/index.js',
      './src/css/main.css'
    ],
    restaurant: './src/js/restaurant.js',
    sw: './src/js/sw.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, './src/img'),
        to: 'img'
      },
      {
        from: path.join(__dirname, './src/manifest.webmanifest'),
        to: ''
      }
    ]),
    ...templates.map((template) => createTemplate(template))
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader'
        ]
      }
    ]
  },
  devServer: {
    compress: true,
    contentBase: path.join(__dirname, 'dist'),
    port: 8000,
    stats: 'errors-only',
    watchContentBase: true
  },
  mode: 'production'
};