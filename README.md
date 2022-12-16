[![Build status](https://img.shields.io/github/actions/workflow/status/michaelboyles/jsx-conditionals/build.yml?branch=develop)](https://github.com/michaelboyles/jsx-conditionals/actions)
[![NPM release](https://img.shields.io/npm/v/jsx-conditionals)](https://www.npmjs.com/package/jsx-conditionals)
[![License](https://img.shields.io/github/license/michaelboyles/jsx-conditionals)](https://github.com/michaelboyles/jsx-conditionals/blob/develop/LICENSE)

Add `<If>` and `<Else>` to JSX using TypeScript compiler transforms. 
    
```javascript
import { If, Else } from 'jsx-conditionals';
```
```xml
<If condition={!!foo}>
    { foo.name }
</If>
<Else>
    False!
</Else>
```

Unlike other implementations, **jsx-conditionals** retains the lazy evaluation of ternary expressions.

In a naive implementation,
`foo.name` above would throw a '*foo is not defined*' error. This implementation only evaluates the necessary expressions.
You can read more about it [on my blog](https://boyl.es/post/add-control-flow-to-jsx/).

Because it happens at compile-time, there's no runtime dependency at all. It's purely syntactic sugar.

## Install

**jsx-conditionals** works by using TypeScript compiler transforms. Even though this is a [native TypeScript feature](https://github.com/microsoft/TypeScript-wiki/blob/master/Using-the-Compiler-API.md), it's not yet exposed publically. You need
[**ttypescript**](https://github.com/cevek/ttypescript) which is a smaller wrapper around TypeScript which exposes that feature.

```
npm install --save-dev jsx-conditionals ttypescript
```

Follow [**ttypescript**'s setup](https://github.com/cevek/ttypescript#how-to-use) for the specific tools you're using. There is
different configuration for Webpack, Rollup, Jest, etc but mostly they're just 1 or 2 lines of configuration to re-point the compiler.
If you're confused, there's a [full sample project using Webpack](https://github.com/michaelboyles/jsx-conditionals/tree/develop/sample).

Then in your `tsconfig.json` add the transformation:

```json
{
    "compilerOptions": {
        "plugins": [
            { "transform": "jsx-conditionals/transform" },
        ]
    }
}
```
