## Problem

Since JSX compiles to JavaScript, we are limited in what methods of control flow we can use.
This poses a problem for React components which are rendered conditionally. Ternary expressions can be used but
they can become difficult to format nicely if the component has a lot of props, which makes them hard to read.

```jsx
<div>{
    Boolean(someObject) ?
        <MyComponent
            foo={getFoo()}
            bar={someObject.bar}
        /> : null
}
</div>
```

It's possible to write a wrapper component which significantly improves readability. The implementation
is trivial. The render method evaluates the condition, and either returns the child or null depending on the result.

```jsx
<If condition={Boolean(someObject)}>
    <MyComponent foo={getFoo()} bar={someObject.bar} />
</If>
```

However, this has one notable problem. It's better understood by looking at the generated code:

```js
React.createElement(If, { condition: Boolean(someObject) },
    React.createElement(MyComponent, {foo: getFoo(), bar: someObject.bar } })
)
```

Since all of the arguments to the first `createElement` invocation must be evaluated before entering the render
method of `<If >`, both `getFoo()` and `someObject.bar` are evaluated regardless of the condition as well. Calling
`getFoo()` is unlikely to be too much of a problem unless it's expensive but it's still wasted effort. Accessing
`someObject.bar` is worse, though. Since `someObject` may be falsy (i.e. undefined or null), trying to access `bar`
will throw an error.

## Solution

This repos demonstrates an example of using TypeScript transforms to convert instances of `<If condition={} />`
into ternary expressions at compile-time. By manipulating the AST, we can achieve the expressiveness we want but without
losing the desirable properties of short-circuiting.

## How to run

Simply install then start. A page will open in your browser.

```
npm install
npm start
```

To remove the transform and observe the non-short-circuiting behaviour, comment out the line starting `{ "transform":` in 
`tsconfig.json`. Now when you run `npm start`, the page will show an alert box.
