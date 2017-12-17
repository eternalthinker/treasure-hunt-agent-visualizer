import merge from 'webpack-merge';
import common from './webpack.common.babel.js';

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
  }
});
