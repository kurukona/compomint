# Compomint 웹사이트

Compomint 프레임워크를 소개하기 위한 웹사이트입니다. 이 웹사이트는 Tailwind CSS와 Compomint를 사용하여 구축되었습니다.

## 구조

- `/index.html` - 메인 HTML 파일
- `/css/style.css` - 커스텀 CSS 스타일
- `/js/templates.js` - Compomint 템플릿 정의
- `/js/main.js` - 메인 애플리케이션 로직
- `/js/theme-switcher.js` - 테마 전환 기능
- `/js/syntax-highlighter.js` - 코드 구문 강조 기능

## 특징

- **반응형 디자인** - 모든 디바이스에서 잘 작동합니다.
- **다크 모드 지원** - 사용자가 라이트/다크 모드를 전환할 수 있습니다.
- **Compomint 컴포넌트** - 모든 UI 요소는 Compomint 템플릿으로 구축되었습니다.
- **코드 예제** - Compomint 사용 방법을 보여주는 예제가 포함되어 있습니다.
- **인터랙티브 데모** - 카운터 및 Todo 리스트와 같은 인터랙티브 데모가 포함되어 있습니다.

## 로컬에서 실행하기

이 웹사이트는 정적 HTML/CSS/JavaScript로 구성되어 있으므로, 로컬 서버를 사용하여 실행할 수 있습니다:

```bash
# Python을 사용한 간단한 HTTP 서버 실행
cd /workspaces/xlsx-template-vscode/compomint/page
python -m http.server 8000
```

그런 다음 브라우저에서 http://localhost:8000 으로 접속하시면 됩니다.

## GitHub Pages에 배포하기

이 웹사이트는 GitHub Pages에 쉽게 배포할 수 있습니다:

1. GitHub 저장소의 Settings > Pages로 이동
2. Source 섹션에서 브랜치와 디렉토리(일반적으로 main 브랜치와 /docs 또는 루트 디렉토리)를 선택
3. Save 버튼 클릭

몇 분 후에 웹사이트가 GitHub Pages 도메인(username.github.io/repo-name)에서 접근 가능해집니다.

## 커스터마이징하기

### 색상 테마 변경하기

`index.html` 파일의 `:root` CSS 변수를 수정하여 색상 테마를 변경할 수 있습니다:

```css
:root {
  --primary-color: #4F46E5; /* 인디고 색상 */
  --secondary-color: #6366F1;
  --accent-color: #818CF8;
  --text-primary: #1F2937;
  --text-secondary: #4B5563;
}
```

### 컴포넌트 추가/수정하기

새로운 컴포넌트를 추가하거나 기존 컴포넌트를 수정하려면 `js/templates.js` 파일을 편집하세요:

```javascript
compomint.addTmpls(`
  <template id="ui-NewComponent">
    <!-- 여기에 컴포넌트 내용 추가 -->
  </template>
`);
```

그런 다음 `js/main.js`에서 컴포넌트를 초기화하고 사용하세요:

```javascript
const newComponent = tmpl.ui.NewComponent({
  // 컴포넌트에 전달할 데이터
});

// DOM에 추가
document.querySelector('#target-container').appendChild(newComponent.element);
```

## 라이센스

이 프로젝트는 MIT 라이센스에 따라 사용할 수 있습니다. 자세한 내용은 LICENSE 파일을 참조하세요.
