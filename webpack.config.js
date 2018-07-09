const path = require('path');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const templates = ['index', 'restaurant']

const createTemplate = function(template) {
  return new HtmlWebpackPlugin({
    filename: `${template}.html`,
    template: `src/views/${template}.html`,
    minify: {
      removeComments: true,
      collapseWhitespace: true,
      conservativeCollapse: true
    },
    inject: false
  })
}

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
    new MiniCssExtractPlugin({
      filename: 'main.css'
    }),
    new CopyWebpackPlugin([
      {
	from: path.join(__dirname, './src/img'),
	to: 'img'
      }
    ]),
    ...templates.map((template) => createTemplate(template))
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader'
        ]
      }
    ]
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    watchContentBase: true,
    stats: 'errors-only',
    port: 8000
  },
  mode: 'production'
};