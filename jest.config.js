/** @type {import('jest').Config} */
const config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    globals: {
        "ts-jest": {
            astTransformers: {
                before: [
                    { path: './jest-factory.js' },
                ],
            },
        },
        tsconfig: "./src/test/tsconfig-test.json"
    }
};

module.exports = config;