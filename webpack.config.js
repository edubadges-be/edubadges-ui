const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const webpack = require("webpack")

const mode = process.env.NODE_ENV || "development";
const prod = mode === "production";

process.traceDeprecation = true;

module.exports = {
  entry: {
    bundle: ["./src/main.js"],
  },
  resolve: {
    alias: {
      svelte: path.resolve("node_modules", "svelte"),
    },
    extensions: [".mjs", ".js", ".svelte"],
    mainFields: ["svelte", "browser", "module", "main"],
  },
  output: {
    path: __dirname + "/public",
    filename: "[name].[hash].js",
    chunkFilename: "[name].[hash].js",
    publicPath: "/",
  },
  module: {
    rules: [
      {
        test: /\.svelte$/,
        use: {
          loader: "svelte-loader",
          options: {
            emitCss: true,
            hotReload: true,
            preprocess: require("svelte-preprocess")(),
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          prod ? MiniCssExtractPlugin.loader : "style-loader",
          "css-loader",
        ],
      },
      {
        test: /\.svg$/,
        loader: "svg-inline-loader",
        options: {
          removeSVGTagAttrs: false,
        },
      },
    ],
  },
  mode,
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].[hash].css",
    }),
    // load only `moment/locale/en.js` and `moment/locale/nl.js`
    new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /en|nl/),
    new HtmlWebpackPlugin({
      template: "src/index.html.ejs",
      favicon: "src/favicon.ico",
      hash: true,
    }),
    prod ? new BundleAnalyzerPlugin({
      analyzerMode: "disabled",
      generateStatsFile: true,
      openAnalyzer: false
    }) : false
  ].filter(Boolean),
  devtool: prod ? false : "source-map",
  devServer: {
    port: 4000,
    historyApiFallback: true,
  },
  performance: { hints: false }
};
