import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    testMatch: [
        '<rootDir>/tests/**/*.test.ts',
        '<rootDir>/tests/**/*.int.test.ts'
    ],
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    globals: {
        'ts-jest': {
            useESM: true,
            tsconfig: '<rootDir>/tsconfig.jest.json',
            isolatedModules: true
        }
    },
    collectCoverageFrom: ['<rootDir>/src/**/*.{ts,tsx}'],
    coverageReporters: ['text', 'text-summary', 'cobertura'],
    coverageDirectory: '<rootDir>/coverage',
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    }
};

export default config;
