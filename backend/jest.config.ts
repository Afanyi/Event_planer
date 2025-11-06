import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests/unit"],
  testMatch: ["**/*.spec.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.jest.json" }],
  },
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/index.ts",
    "!src/app.ts",
    "!src/routes/**",
    "!src/db.ts",
  ],
  coverageDirectory: "coverage/unit",
  reporters: ["default", "jest-junit"],
};

export default config;
