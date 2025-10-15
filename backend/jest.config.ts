import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest/presets/default-esm',   // ESM + TypeScript
    testEnvironment: 'jsdom',                // React-Komponenten testen
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    transform: { '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: true }] },
    moduleNameMapper: {
        '^.+\\.(css|less|scss|sass)$': 'identity-obj-proxy' // CSS-Imports stubben
    },
    collectCoverageFrom: ['src/**/*.{ts,tsx}'],
    coverageReporters: ['text', 'text-summary', 'cobertura'], // für GitLab MR-Diff
    coverageDirectory: process.env.COVERAGE_DIR || 'coverage'
};

export default config;
