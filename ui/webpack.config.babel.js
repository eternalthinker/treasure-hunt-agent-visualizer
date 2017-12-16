import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import 'babel-polyfill';
import webpack from 'webpack';
// import BrowserSyncPlugin from 'browser-sync-webpack-plugin';

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
    pathinfo: true,
    path: path.resolve(__dirname, 'dist'),
    //publicPath: '/',
    filename: 'bundle.js',
  },
  // watch: true,
  module: {
    loaders: [
      { 
        test: /\.js$/, 
        loaders: ['babel-loader'], 
        exclude: /node_modules/,
        include: path.join(__dirname, 'src')
      },
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader']
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
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor'/* chunkName= */, 
      filename: 'vendor.bundle.js'/* filename= */
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      inject: 'body',
      chunks: ['vendor', 'app'],
      chunksSortMode: 'manual'
    }),
    /*new BrowserSyncPlugin({
      host: process.env.IP || 'localhost',
      port: process.env.PORT || 3000,
      server: {
        baseDir: ['./', './build']
      }
    })*/
  ],
  resolve: {
    alias: {
      'phaser': phaser,
      'pixi': pixi,
      'p2': p2
    }
  }
}
