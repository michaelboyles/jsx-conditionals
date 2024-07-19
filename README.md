[![Build status](https://img.shields.io/github/actions/workflow/status/michaelboyles/jsx-conditionals/build.yml?branch=develop)](https://github.com/michaelboyles/jsx-conditionals/actions)
[![NPM release](https://img.shields.io/npm/v/jsx-conditionals)](https://www.npmjs.com/package/jsx-conditionals)

Add `<If>`, `<ElseIf>` and `<Else>` to JSX using compiler transforms.

```tsx
import { If, Else, ElseIf } from 'jsx-conditionals';

<If condition={student}>
    { student.name }
</If>
<ElseIf condition={teacher}>
    { teacher!.age }{ /* TS strict mode requires the ! operator */ }
</ElseIf>
<Else>
    Both false
</Else>
```

Unlike other implementations, **jsx-conditionals** retains the lazy evaluation of ternary expressions.

In a naive implementation,
`student.name` above would throw a '*student is not defined*' error. This implementation only evaluates the necessary expressions.
You can read more about it [on my blog](https://boyl.es/post/add-control-flow-to-jsx/).

Because it happens at compile-time, there's no runtime dependency at all. It's purely syntactic sugar.

## Install

```text
npm install --save-dev jsx-conditionals
```

**jsx-conditionals** works by using compiler transforms. Configuration will depend on your build setup. There are two
provided transformers: one for tsc, and one for Babel.

<details>
    <summary>Webpack and ts-loader</summary>

Configure your `webpack.config`

```js
const jsxConditionals = require('jsx-conditionals/transform').default;
//...
module.exports = {
    //...
    module: {
        rules: [
            {
                test: /\.tsx?$/,
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
    }
}
```

See the [Webpack and ts-loader sample](https://github.com/michaelboyles/jsx-conditionals/tree/develop/samples/webpack-ts-loader).
</details>

<details>
    <summary>Vite</summary>

You will additionally need to install the following

```
npm install -D vite-plugin-babel @babel/plugin-syntax-typescript 
```

Then in your `vite.config.ts`, configure the Babel plugin:

```js
import babel from 'vite-plugin-babel'

export default defineConfig({
    plugins: [
        babel({
            babelConfig: {
                plugins: [
                    ['@babel/plugin-syntax-typescript', { isTSX: true }],
                    'jsx-conditionals/babel'
                ],
            },
            filter: /\.[jt]sx$/,
            exclude: "**/node_modules/**"
        })
    ],
});
```
</details>

<details>
    <summary>Next.js</summary>

If you're using Next.js, by default you are compiling with SWC. This library does not yet provide a transformation for
SWC. However, if you have a `.babelrc` or `babel.config.js` then Next will compile with Babel instead.
([see docs](https://nextjs.org/docs/pages/building-your-application/configuring/babel)).

The downside is that Babel is slower than SWC.

Sample `.babelrc`:

```
{
  "presets": ["next/babel"],
  "plugins": ['jsx-conditionals/babel']
}
```

</details>

<details>
    <summary>tsc + ts-patch</summary>
    
Follow the [ts-patch installation/usage steps](https://github.com/nonara/ts-patch?tab=readme-ov-file#installation)

You can now add this entry in your `tsconfig.json`.

```json
{
    "compilerOptions": {
        "plugins": [
            { "transform": "jsx-conditionals/transform" },
        ]
    }
}
```
</details>

## TypeScript strict mode

In the above example, it was shown that properties of objects checked within a condition can be safely accessed thanks
to proper lazy evaluation.

In strict mode, `student.name` will produce an TypeScript error, since the type checker doesn't know about the
semantics of `<If>`. In a normal if-statement, the type would be narrowed, but that's not possible here.

You need to use `!` (the "non-null assertion operator"), i.e. `student!.name`. This is a safe assertion, and is
purely to tell the compiler that we know something it doesn't.