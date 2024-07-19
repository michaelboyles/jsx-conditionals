/** @type {import('jest').Config} */
const config = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
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