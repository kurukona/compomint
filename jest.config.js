/** @type {import('ts-jest').JestConfigWithTsJest} */
//module.exports = {
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|js)$',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      /* ts-jest config goes here in Jest */
      // babel: true,
      tsconfig: 'tsconfig.json',
      useESM: false
    }],
    '^.+\\.js$': 'babel-jest'
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node']
};
