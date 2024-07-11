import type { Config } from "jest";

export default async (): Promise<Config> => {
  return {
    preset: "ts-jest",
    testEnvironment: "node",
    coverageDirectory: "coverage",
    collectCoverageFrom: ["src/**/*.{js,ts}"],
    transform: {
      "^.+\\.tsx?$": "ts-jest",
    },
    moduleNameMapper: { "src/(.*)": "<rootDir>/src/$1" },
    moduleDirectories: ["node_modules", "src"],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    verbose: true,
  };
};
