/** @type {import('jest').Config} */
const config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    transform: {
        ".*": ["ts-jest", {
            astTransformers: {
                before: [
                    { path: './jest-factory.js' },
                ],
            },
            // Prevents some type errors
            isolatedModules: true
        }]
    }
};

module.exports = config;