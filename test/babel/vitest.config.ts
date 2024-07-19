/// <reference types="vitest" />
import { defineConfig } from 'vite';
import babel from 'vite-plugin-babel';

export default defineConfig({
    plugins: [babel({
        babelConfig: {
            plugins: [
                ['@babel/plugin-syntax-typescript', { isTSX: true }],
                '../../dist/babel',
            ]
        },
        filter: /\.test\.tsx$/,
        exclude: "**/node_modules/**"
    })],
    test: {
        environment: 'jsdom'
    }
})
