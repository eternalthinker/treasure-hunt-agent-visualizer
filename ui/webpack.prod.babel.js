import merge from 'webpack-merge';
import common from './webpack.common.babel.js';
import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

export default merge(common, {
	module: {
    loaders: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
        	use: ['css-loader']
        })
      },
    ]
  },
	plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
		new ExtractTextPlugin('[name].bundle.[chunkhash].css'),
		new webpack.optimize.UglifyJsPlugin({
			drop_console: true,
			minimize: true,
			output: {
				comments: false
			}
		}),
		new webpack.LoaderOptionsPlugin({
			minimize: true
		}),
	]
});
