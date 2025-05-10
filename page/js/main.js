import { compomint, tmpl } from "../../dist/compomint.esm.min.js"

// Main Application Script

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the application
  initApp();
});

// Initialize the application
function initApp() {
  // Icons for features section
  const featureIcons = {
    lightweight: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
    </svg>`,
    template: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
    </svg>`,
    component: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path>
    </svg>`,
    responsive: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
    </svg>`,
    easy: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>`,
    i18n: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
    </svg>`
  };

  // Create a counter component for an example
  const counter = tmpl.ui.Counter({
    title: compomint.i18n.demo.counter.title('Counter Component'),
    initialCount: 0
  });
  
  // Create a todo list component for an example
  const todoList = tmpl.ui.TodoList({
    title: compomint.i18n.demo.todo.title('Todo List'),
    initialTodos: [
      { text: 'Compomint 문서 읽기', completed: true },
      { text: '첫 번째 컴포넌트 만들기', completed: false },
      { text: '웹사이트에 적용하기', completed: false }
    ]
  });

  // Define the header component
  const header = tmpl.ui.Header({
    menuItems: [
      { label: compomint.i18n.footer.links.home('Home'), url: '#', active: true },
      { label: compomint.i18n.footer.links.features('Features'), url: '#features' },
      { label: compomint.i18n.footer.links.examples('Examples'), url: '#examples' },
      { label: compomint.i18n.footer.links.docs('Documentation'), url: '#documentation' }
    ]
  });

  // Define the hero section
  const hero = tmpl.ui.Hero({
    title: compomint.i18n.app.title('How to Create Web Components Easily'),
    subtitle: compomint.i18n.app.subtitle('Compomint is a lightweight JavaScript framework that provides a template-based component system.'),
    primaryButtonText: compomint.i18n.app.getStarted('Get Started'),
    primaryButtonUrl: '#documentation',
    secondaryButtonText: 'GitHub',
    secondaryButtonUrl: 'https://github.com/kurukona/compomint-core',
    codeExample: `<template id="hello-world">
  <style id="style-hello-world">
    .hello-world { color: ##=data.color || 'black'## }
  </style>
  <div class="hello-world">
    <h1>##=data.title || 'Hello'##</h1>
    <p>##=data.message##</p>
  </div>
</template>

// 컴포넌트 생성 및 사용
const hello = compomint.tmpl('hello-world')({
  title: 'Hello Compomint!',
  message: '쉽고 간단한 컴포넌트',
  color: '#4F46E5'
});

document.body.appendChild(hello.element);`
  });

  // Define the features section
  const features = tmpl.ui.Features({
    title: compomint.i18n.app.featuresTitle('Why Use Compomint?'),
    features: [
      { 
        title: compomint.i18n.features.lightweight.title('Lightweight Size'), 
        description: compomint.i18n.features.lightweight.description('Fast loading and execution with a small footprint (~14KB gzipped).'), 
        icon: featureIcons.lightweight 
      },
      { 
        title: compomint.i18n.features.template.title('Template-Based'), 
        description: compomint.i18n.features.template.description('Use a simple yet powerful string-based template syntax with JavaScript evaluation.'), 
        icon: featureIcons.template 
      },
      { 
        title: compomint.i18n.features.component.title('Component-Oriented'), 
        description: compomint.i18n.features.component.description('Build reusable UI components with proper encapsulation.'), 
        icon: featureIcons.component 
      },
      { 
        title: compomint.i18n.features.easy.title('Component Composition'), 
        description: compomint.i18n.features.easy.description('Combine components like building blocks to create complex UIs.'), 
        icon: featureIcons.easy 
      },
      { 
        title: compomint.i18n.features.responsive.title('State Management'), 
        description: compomint.i18n.features.responsive.description('Manage component state efficiently with automatic updates.'), 
        icon: featureIcons.responsive 
      },
      { 
        title: compomint.i18n.features.i18n.title('Internationalization'), 
        description: compomint.i18n.features.i18n.description('Built-in support for multiple languages with i18n system.'), 
        icon: featureIcons.i18n 
      }
    ]
  });

  // Define the examples section
  const examples = tmpl.ui.Examples({
    title: compomint.i18n.app.examplesTitle('Code Examples'),
    examples: [
      {
        title: compomint.i18n.examples.basicComponent.title('Basic Component'),
        description: compomint.i18n.examples.basicComponent.description('Simple template definition and usage'),
        code: `// 템플릿 정의
compomint.addTmpl('ui-Button', \`
  <button class="ui-Button ##=data.variant ? 'ui-Button--' + data.variant : ''##"
    data-co-event="##:data.onClick##">
    ##=data.label##
  </button>
\`);

// 컴포넌트 사용
const button = tmpl.ui.Button({
  label: '클릭하세요',
  variant: 'primary',
  onClick: function() {
    alert('버튼이 클릭되었습니다!');
  }
});

document.body.appendChild(button.element);`
      },
      {
        title: compomint.i18n.examples.stateManagement.title('State Management'),
        description: compomint.i18n.examples.stateManagement.description('How to manage internal component state and respond to events'),
        code: `compomint.addTmpl('ui-Counter', \`
  ##
    // 상태 초기화
    status.count = status.count || data.initialCount || 0;
    
    function increment() {
      status.count++;
      component.refresh();
    }
    
    function decrement() {
      status.count--;
      component.refresh();
    }
  ##
  <div class="ui-Counter">
    <h3>##=data.title || '카운터'##</h3>
    <p>현재 값: <span>##=status.count##</span></p>
    <div>
      <button data-co-event="##:{click: decrement}##">-</button>
      <button data-co-event="##:{click: increment}##">+</button>
    </div>
  </div>
\`);`,
        result: counter
      },
      {
        title: compomint.i18n.examples.complexComponent.title('Complex Component'),
        description: compomint.i18n.examples.complexComponent.description('A more complex component example: Todo List'),
        code: `// Todo 리스트 컴포넌트 - 코드 예시 (전체 코드는 GitHub에서 확인 가능)
compomint.addTmpl('ui-TodoList', \`
  ##
    // 상태 초기화
    status.todos = status.todos || data.initialTodos || [];
    
    function addTodo(text) {
      status.todos.push({ text: text, completed: false });
      component.refresh();
    }
    
    function toggleTodo(index) {
      status.todos[index].completed = !status.todos[index].completed;
      component.refresh();
    }
    
    function removeTodo(index) {
      status.todos.splice(index, 1);
      component.refresh();
    }
  ##
  <div class="ui-TodoList">
    <h3>##=data.title || '할 일 목록'##</h3>
    <!-- 입력 폼, 할 일 목록 등의 UI 요소 -->
  </div>
\`);`,
        result: todoList
      }
    ]
  });

  // Define the documentation section
  const documentation = tmpl.ui.Documentation({
    title: compomint.i18n.app.docTitle('Learn More'),
    description: compomint.i18n.app.docDescription('Check out detailed documentation and resources for Compomint.'),
    links: [
      { label: 'Getting Started', url: 'https://github.com/kurukona/compomint-core/blob/master/README.md' },
      { label: 'API Reference', url: 'https://github.com/kurukona/compomint-core/blob/master/README.md#api-reference' },
      { label: 'Examples', url: 'https://github.com/kurukona/compomint-core/tree/master/examples' },
      { label: 'GitHub', url: 'https://github.com/kurukona/compomint-core' }
    ]
  });

  // Define the footer
  const footer = tmpl.ui.Footer({
    description: compomint.i18n.footer.description('Compomint is a lightweight JavaScript framework for creating web applications with a component-based architecture.'),
    links: [
      { label: compomint.i18n.footer.links.home('Home'), url: '#' },
      { label: compomint.i18n.footer.links.features('Features'), url: '#features' },
      { label: compomint.i18n.footer.links.examples('Examples'), url: '#examples' },
      { label: compomint.i18n.footer.links.docs('Documentation'), url: '#documentation' },
      { label: 'GitHub', url: 'https://github.com/kurukona/compomint-core' }
    ],
    email: 'info@example.com',
    github: 'kurukona/compomint-core',
    year: new Date().getFullYear(),
    copyright: 'Compomint'
  });

  // Create the main app layout
  const appLayout = tmpl.app.Layout({
    header: header,
    hero: hero,
    features: features,
    examples: examples,
    documentation: documentation,
    footer: footer
  });

  // Render the app to the DOM
  const appContainer = document.getElementById('app-container');
  appContainer.appendChild(appLayout.element);

  // Add smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 70, // Accounting for fixed header
          behavior: 'smooth'
        });
      }
    });
  });
}
