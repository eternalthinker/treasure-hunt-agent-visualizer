import merge from 'webpack-merge';
import common from './webpack.common.babel.js';
import WriteFilePlugin from 'write-file-webpack-plugin';
import webpack from 'webpack';

export default merge(common, {
  output: {
    pathinfo: true,
  },
	devtool: 'inline-source-map',
	devServer: {
		contentBase: './dist'
	},
  module: {
    loaders: [
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader']
      },
    ]
  },
  plugins: [
      new WriteFilePlugin(),
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(JSON.parse(process.env.BUILD_ENV || 'true'))
      }),
  ],
});
