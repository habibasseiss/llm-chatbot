import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  coverageProvider: "v8",
  preset: "ts-jest/presets/default-esm",
  testPathIgnorePatterns: ["/node_modules/"],
  transform: {},
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testEnvironment: "node",
};

export default config;
