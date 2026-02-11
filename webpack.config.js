const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    entry: "./src/visual.ts",
    output: {
        path: path.resolve(__dirname, ".tmp", "build"),
        filename: "visual.js",
        library: {
            type: "window",
        },
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.less$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    "less-loader",
                ],
            },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "visual.css",
        }),
    ],
    externals: {
        "powerbi-visuals-api": "null",
    },
    devtool: "source-map",
};
