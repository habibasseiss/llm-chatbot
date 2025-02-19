import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  coverageProvider: "v8",
  preset: "ts-jest/presets/default-esm",
  testPathIgnorePatterns: ["/node_modules/"],
  transform: {},
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^tests/(.*)$": "<rootDir>/tests/$1"
  },
  testEnvironment: "node",
  setupFiles: ["dotenv/config"],
};

export default config;
