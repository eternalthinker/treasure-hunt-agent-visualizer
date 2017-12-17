import path from 'path';
import CleanWebpackPlugin from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import 'babel-polyfill';
import webpack from 'webpack';

// Phaser webpack config
const phaserModule = path.join(__dirname, '/node_modules/phaser-ce/')
const phaser = path.join(phaserModule, 'build/custom/phaser-split.js')
const pixi = path.join(phaserModule, 'build/custom/pixi.js')
const p2 = path.join(phaserModule, 'build/custom/p2.js')

export default {
  entry: {
    app: [
      'babel-polyfill', 
      path.join(__dirname, '/src/index.js')
    ],
    vendor: ['pixi', 'p2', 'phaser', 'webfontloader']
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.[chunkhash].js',
  },
  module: {
    loaders: [
      { 
        test: /\.js$/, 
        loaders: ['babel-loader'], 
        exclude: /node_modules/,
        include: path.join(__dirname, 'src')
      },
      {
        test: /\.(jpe?g|gif|png|svg|woff|ttf|wav|mp3)$/,
        loaders: ['file-loader']
      },
      {
        test: /pixi\.js$/,
        loaders: ['expose-loader?PIXI']
      },
      { 
        test: /phaser-split\.js$/,
        loaders: ['expose-loader?Phaser']
      },
      {
        test: /p2\.js$/,
        loaders: ['expose-loader?p2']
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loaders: ['eslint-loader']
      },
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(JSON.parse(process.env.BUILD_ENV || 'true'))
    }),
    new CleanWebpackPlugin(['dist']),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor'/* chunkName= */, 
      filename: 'vendor.bundle.[chunkhash].js'/* filename= */
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      inject: 'body',
      chunks: ['vendor', 'app'],
      chunksSortMode: 'manual'
    }),
  ],
  resolve: {
    alias: {
      'phaser': phaser,
      'pixi': pixi,
      'p2': p2
    }
  }
}
