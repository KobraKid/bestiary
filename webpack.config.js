const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = [
  {
    mode: 'development',
    entry: './src/electron.ts',
    target: 'electron-main',
    resolve: { extensions: ['.ts', '.tsx', '...'] },
    module: {
      rules: [{
        test: /\.ts$/,
        include: /src/,
        use: [{ loader: 'ts-loader' }]
      }]
    },
    output: {
      path: __dirname + '/dist',
      filename: 'index.js'
    },
    stats: 'errors-only'
  },
  {
    mode: 'development',
    entry: './src/react.tsx',
    target: 'electron-renderer',
    devtool: 'source-map',
    resolve: { extensions: ['.ts', '.tsx', '.scss', '...'] },
    module: {
      rules: [
        {
          test: /\.ts(x?)$/,
          include: /src/,
          use: [{ loader: 'ts-loader' }]
        },
        {
          test: /\.s[ac]ss$/i,
          use: ['style-loader', 'css-loader', 'sass-loader']
        }
      ]
    },
    output: {
      path: __dirname + '/dist',
      filename: 'app.js'
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html'
      })
    ],
    stats: 'errors-only'
  },
  {
    mode: 'development',
    entry: './src/preload.ts',
    target: 'electron-preload',
    resolve: { extensions: ['.ts', '.tsx', '...'] },
    module: {
      rules: [{
        test: /\.ts$/,
        include: /src/,
        use: [{ loader: 'ts-loader' }]
      }]
    },
    output: {
      path: __dirname + '/dist',
      filename: 'preload.js'
    },
    stats: 'errors-only'
  }
];
