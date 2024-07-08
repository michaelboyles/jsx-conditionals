const transform = require('../../dist/transform.js');

// ts-jest seems to expect a different signature of transformer from tsc, with an additional name and a version.
// This just acts as a glue for the test. I kinda pieced it together from here:
// https://github.com/kulshekhar/ts-jest/tree/main/src/transformers
// https://kulshekhar.github.io/ts-jest/docs/getting-started/options/astTransformers/
module.exports = {
    version: 1,
    name: 'jsx-conditionals',
    factory() { return transform.default() }
}