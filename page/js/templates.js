import { compomint } from "../../dist/compomint.esm.min.js"

// Compomint Template Definitions

// Define all templates
compomint.addTmpls(`
  <!-- Main App Layout -->
  <template id="app-Layout">
    <div class="min-h-screen flex flex-col">
      ##%data.header##
      <main class="flex-grow">
        ##%data.hero##
        ##%data.features##
        ##%data.examples##
        ##%data.advancedExamples##
        ##%data.documentation##
      </main>
      ##%data.footer##
    </div>
  </template>

  <!-- Header Component -->
  <template id="ui-Header">
    <header class="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <svg class="w-8 h-8 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/>
            <path d="M7 12L10 15L17 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="text-xl font-bold text-indigo-600 dark:text-indigo-400">Compomint</span>
        </div>
        
        <nav>
          <ul class="flex space-x-6 text-gray-600 dark:text-gray-300">
            ##data.menuItems.forEach(item => {##
              <li>
                <a href="##=item.url##" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 ##=item.active ? 'font-medium text-indigo-600 dark:text-indigo-400' : ''##">
                  ##=item.label##
                </a>
              </li>
            ##})##
            <li>
              <a href="https://github.com/kurukona/compomint-core" target="_blank" rel="noopener" 
                 class="flex items-center space-x-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"></path>
                </svg>
                <span>GitHub</span>
              </a>
            </li>
            <li>
              ##%tmpl.ui.LanguageSwitcher({})##
            </li>
          </ul>
        </nav>
      </div>
    </header>
  </template>

  <!-- Hero Section -->
  <template id="ui-Hero">
    <section class="bg-gradient-to-br from-indigo-500 to-purple-600 text-white py-20">
      <div class="container mx-auto px-4 flex flex-col md:flex-row items-center">
        <div class="md:w-1/2 mb-10 md:mb-0">
          <h1 class="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            ##=data.title##
          </h1>
          <p class="text-xl md:text-2xl mb-8 text-indigo-100">
            ##=data.subtitle##
          </p>
          <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <a href="##=data.primaryButtonUrl##" class="bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium text-center hover:bg-indigo-50 transition-colors duration-200">
              ##=data.primaryButtonText##
            </a>
            <a href="##=data.secondaryButtonUrl##" class="border border-white text-white px-6 py-3 rounded-lg font-medium text-center hover:bg-white/10 transition-colors duration-200">
              ##=data.secondaryButtonText##
            </a>
          </div>
        </div>
        <div class="md:w-1/2 md:pl-10">
          <div class="bg-white rounded-xl shadow-2xl overflow-hidden text-gray-800">
            <div class="bg-gray-800 px-4 py-2 flex items-center space-x-2">
              <div class="flex space-x-1">
                <div class="w-3 h-3 rounded-full bg-red-500"></div>
                <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div class="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div class="text-gray-400 text-sm">example.html</div>
            </div>
            <pre class="p-4 text-sm font-mono overflow-x-auto"><code>##=data.codeExample##</code></pre>
          </div>
        </div>
      </div>
    </section>
  </template>

  <!-- Features Section -->
  <template id="ui-Features">
    <section class="py-16 bg-white dark:bg-gray-800">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">##=data.title##</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          ##data.features.forEach(feature => {##
            <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg hover:shadow-md transition-shadow duration-200">
              <div class="text-indigo-600 dark:text-indigo-400 mb-4 w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                ##%feature.icon##
              </div>
              <h3 class="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">##=feature.title##</h3>
              <p class="text-gray-600 dark:text-gray-300">##=feature.description##</p>
            </div>
          ##})##
        </div>
      </div>
    </section>
  </template>

  <!-- Code Examples Section -->
  <template id="ui-Examples">
    <section class="py-16 bg-gray-50 dark:bg-gray-900">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">##=data.title##</h2>
        
        <div class="max-w-4xl mx-auto">
          ##data.examples.forEach((example, index) => {##
            <div class="mb-10 bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div class="p-6 border-b dark:border-gray-700">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">##=example.title##</h3>
                <p class="text-gray-600 dark:text-gray-300">##=example.description##</p>
              </div>
              <div class="bg-gray-800 dark:bg-gray-900 text-white p-4 font-mono text-sm overflow-x-auto">
                <pre><code>##=example.code##</code></pre>
              </div>
              ##if (example.result) {##
                <div class="p-6 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
                  <h4 class="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">결과:</h4>
                  <div class="p-4 border border-gray-200 dark:border-gray-600 rounded">
                    ##%example.result##
                  </div>
                </div>
              ##}##
            </div>
          ##})##
        </div>
      </div>
    </section>
  </template>

  <!-- Documentation Section -->
  <template id="ui-Documentation">
    <section class="py-16 bg-white dark:bg-gray-800">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">##=data.title##</h2>
        <p class="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">##=data.description##</p>
        <div class="flex flex-wrap justify-center gap-4">
          ##data.links.forEach(link => {##
            <a href="##=link.url##" class="bg-indigo-50 dark:bg-indigo-900 hover:bg-indigo-100 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-200 px-6 py-3 rounded-lg font-medium transition-colors duration-200">
              ##=link.label##
            </a>
          ##})##
        </div>
      </div>
    </section>
  </template>

  <!-- Footer -->
  <template id="ui-Footer">
    <footer class="bg-gray-800 text-gray-300 py-12">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div class="flex items-center space-x-2 mb-6">
              <svg class="w-8 h-8 text-indigo-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/>
                <path d="M7 12L10 15L17 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="text-xl font-bold text-white">Compomint</span>
            </div>
            <p class="text-gray-400">##=data.description##</p>
          </div>
          
          <div>
            <h3 class="text-lg font-semibold mb-4 text-white">링크</h3>
            <ul class="space-y-2">
              ##data.links.forEach(link => {##
                <li>
                  <a href="##=link.url##" class="hover:text-indigo-300 transition-colors duration-200">
                    ##=link.label##
                  </a>
                </li>
              ##})##
            </ul>
          </div>
          
          <div>
            <h3 class="text-lg font-semibold mb-4 text-white">연락처</h3>
            <ul class="space-y-2">
              <li class="flex items-center space-x-2">
                <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <a href="mailto:##=data.email##" class="hover:text-indigo-300 transition-colors duration-200">
                  ##=data.email##
                </a>
              </li>
              <li class="flex items-center space-x-2">
                <svg class="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"></path>
                </svg>
                <a href="https://github.com/##=data.github##" target="_blank" rel="noopener" class="hover:text-indigo-300 transition-colors duration-200">
                  ##=data.github##
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div class="border-t border-gray-700 mt-10 pt-6 text-center text-gray-400">
          <p>© ##=data.year## ##=data.copyright##. MIT 라이센스에 따라 사용 가능합니다.</p>
        </div>
      </div>
    </footer>
  </template>

  <!-- Demo Components Section -->
  <template id="ui-Counter">
    <div class="border border-gray-200 dark:border-gray-700 rounded p-4 max-w-xs mx-auto text-center">
      <h3 class="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">##=data.title##</h3>
      <p class="text-3xl font-bold mb-4 dark:text-white">##=status.count##</p>
      <div class="flex justify-center space-x-2">
        <button data-co-event="##:{
          click: function() {
            status.count--;
            component.refresh();
          }
        }##" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">-</button>
        <button data-co-event="##:{
          click: function() {
            status.count++;
            component.refresh();
          }
        }##" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">+</button>
      </div>
    </div>
    ##
    // Initialize counter state
    status.count = status.count || data.initialCount || 0;
    ##
  </template>

  <!-- Todo List Component -->
  <template id="ui-TodoList">
    ##
    status.todos = status.todos || [];
    ##
    <div class="border border-gray-200 dark:border-gray-700 rounded p-4 max-w-md mx-auto">
      <h3 class="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">##=data.title##</h3>
      
      <div class="flex mb-4">
        <input 
          type="text" 
          placeholder="##=compomint.i18n.demo.todo.placeholder('Add a todo...')##" 
          class="flex-grow border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          data-co-element-ref="##:newTodoInput##"
          data-co-event="##:{
            keypress: function(event) {
              if (event.key === 'Enter') {
                addTodo();
              }
            }
          }##"
        >
        <button 
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r"
          data-co-event="##:{
            click: addTodo
          }##"
        >
          ##=compomint.i18n.demo.todo.addTodo('Add')##
        </button>
      </div>
      
      <ul class="space-y-2 mb-4">
        ##if (status.todos.length === 0) {##
          <li class="text-gray-500 dark:text-gray-400 text-center py-2">##=compomint.i18n.demo.todo.empty('No todos yet. Add one above!')##</li>
        ##} else {##
          ##status.todos.forEach((todo, index) => {##
            <li class="flex items-center p-2 border-b border-gray-100 dark:border-gray-700">
              <input 
                type="checkbox" 
                ##=todo.completed ? 'checked' : ''##
                data-co-event="##:{
                  change: function() {
                    toggleTodo(index);
                  }
                }##"
                class="mr-2"
              >
              <span class="flex-grow ##=todo.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'dark:text-gray-200'##">##=todo.text##</span>
              <button 
                class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                data-co-event="##:{
                  click: function() {
                    removeTodo(index);
                  }
                }##"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </li>
          ##})##
        ##}##
      </ul>
      
      ##if (status.todos.length > 0) {##
        <div class="text-sm text-gray-500 dark:text-gray-400 flex justify-between">
          <span>##=status.todos.filter(todo => !todo.completed).length## ##=compomint.i18n.demo.todo.itemsLeft('item(s) left')##</span>
          <button 
            class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            data-co-event="##:{
              click: clearCompleted
            }##"
          >
            ##=compomint.i18n.demo.todo.clearCompleted('Clear completed')##
          </button>
        </div>
      ##}##
    </div>
    ##
    // Initialize todo state
    status.todos = status.todos || data.initialTodos || [];
    
    // Add a new todo
    function addTodo() {
      const text = newTodoInput.value.trim();
      if (text) {
        status.todos.push({
          text: text,
          completed: false
        });
        newTodoInput.value = '';
        component.refresh();
      }
    }
    
    // Toggle todo completion status
    function toggleTodo(index) {
      status.todos[index].completed = !status.todos[index].completed;
      component.refresh();
    }
    
    // Remove a todo
    function removeTodo(index) {
      status.todos.splice(index, 1);
      component.refresh();
    }
    
    // Clear completed todos
    function clearCompleted() {
      status.todos = status.todos.filter(todo => !todo.completed);
      component.refresh();
    }
    ##
  </template>
`);
