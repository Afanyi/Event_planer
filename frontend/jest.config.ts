import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transform: { "^.+\\.(ts|tsx)$": ["ts-jest", { useESM: true }] },
  moduleNameMapper: {
    "^.+\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  collectCoverageFrom: ["src/**/*.{ts,tsx}"],
  coverageReporters: ["text", "text-summary", "cobertura"],
  coverageDirectory: process.env.COVERAGE_DIR || "coverage",

  // 👇 test directories
  testMatch: [
    "<rootDir>/src/tests/unit/**/*.test.ts?(x)",
    "<rootDir>/src/tests/integration/**/*.test.ts?(x)",
  ],

  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
};

export default config;
