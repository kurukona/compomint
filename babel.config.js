module.exports = {
  presets: [
    ['@babel/preset-env', { // <-- @babel/preset-env 프리셋과 그 옵션 시작
      // 여기에 @babel/preset-env 설정을 추가합니다.
      // 예시:
      targets: "> 0.25%, not dead", // <-- targets는 이 객체 안에 위치
      useBuiltIns: "usage",
      corejs: 3
    }] // <-- @babel/preset-env 프리셋과 그 옵션 끝
    // 다른 프리셋들...
  ]
  // 다른 Babel 설정 (plugins 등)...
};