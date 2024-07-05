This directory contains a working sample application using jsx-conditionals with Webpack and ts-loader.

To run it, run the following

```
npm install
npm start
```

In particular, see `webpack.config.js`. 

```js
options: {
    getCustomTransformers: (program) => ({
        before: [jsxConditionals(program, {})]
    })
}
```