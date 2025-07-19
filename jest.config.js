/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|js)$",
  testTimeout: 30000, // 30초로 타임아웃 설정
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        useESM: false,
      },
    ],
    "^.+\\.js$": "babel-jest",
  },

  projects: [
    {
      displayName: "node",
      testEnvironment: "node",
      testMatch: ["**/compomint-ssr.test.ts"],
      transform: {
        "^.+\\.ts$": [
          "ts-jest",
          {
            tsconfig: "tsconfig.json",
            useESM: false,
          },
        ],
      },
    },
    {
      displayName: "jsdom",
      testEnvironment: "jsdom",
      testMatch: ["**/!(compomint-ssr).test.ts"],
      transform: {
        "^.+\\.ts$": [
          "ts-jest",
          {
            tsconfig: "tsconfig.json",
            useESM: false,
          },
        ],
        "^.+\\.js$": "babel-jest",
      },
    },
  ],
  moduleFileExtensions: ["ts", "js", "json", "node"],
};
