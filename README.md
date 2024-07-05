[![Build status](https://img.shields.io/github/actions/workflow/status/michaelboyles/jsx-conditionals/build.yml?branch=develop)](https://github.com/michaelboyles/jsx-conditionals/actions)
[![NPM release](https://img.shields.io/npm/v/jsx-conditionals)](https://www.npmjs.com/package/jsx-conditionals)
[![License](https://img.shields.io/github/license/michaelboyles/jsx-conditionals)](https://github.com/michaelboyles/jsx-conditionals/blob/develop/LICENSE)

Add `<If>`, `<ElseIf>` and `<Else>` to JSX using TypeScript compiler transforms. 
    
```javascript
import { If, Else, ElseIf } from 'jsx-conditionals';
```
```xml
<If condition={student}>
    { student.name }
</If>
<ElseIf condition={teacher}>
    { teacher.age }
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

**jsx-conditionals** works by using TypeScript compiler transforms. Even though it's a [native TypeScript feature](https://github.com/microsoft/TypeScript-wiki/blob/master/Using-the-Compiler-API.md),
it's only exposed via API. In the future, this may be as simple as [an entry in your `tsconfig`](https://github.com/microsoft/TypeScript/issues/54276).
For now, setup will depend on your build system.

If you're not using the typescript compiler (e.g. Vite (and so esbuild) or Next.js (and so SWC)), then it's not possible.

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
    <summary>ts-patch</summary>
    
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

