const jsxConditionals = require('jsx-conditionals/transform').default;
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    name: 'JSX If',
    mode: 'development',
    devtool: false,
    entry: './src/main.tsx',
    output: {
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        getCustomTransformers: (program) => ({
                            before: [jsxConditionals(program, {})]
                        })
                    }
                }]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/index.html'
        })
    ]
}