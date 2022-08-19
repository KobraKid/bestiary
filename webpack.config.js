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
    entry: {
      app: './src/app.tsx', 
      pkgBuilder: './src/pkgBuilder.tsx'
    },
    target: 'electron-renderer',
    devtool: 'source-map',
    resolve: { extensions: ['.ts', '.tsx', '.scss', '.png', '.ttf', '...'] },
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
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource'
        },
        {
          test: /\.(ttf)$/i,
          type: 'asset/resource'
        }
      ]
    },
    output: {
      path: __dirname + '/dist',
      filename: '[name].js'
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        chunks: ['app']
      }),
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'pkgBuilder.html',
        chunks: ['pkgBuilder']
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
