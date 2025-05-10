import { compomint, tmpl } from "../../dist/compomint.esm.min.js"

// Theme Switcher Component and Functionality

document.addEventListener('DOMContentLoaded', function () {
  // Theme Switcher Template
  compomint.addTmpls(`
    <template id="ui-ThemeSwitcher">
      ##
      status.isDarkMode = status.isDarkMode || false;
      ##
      <div class="fixed bottom-4 right-4 z-50">
        <button 
          class="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg flex items-center justify-center transition-colors duration-200"
          data-co-event="##:{
            click: function() {
              toggleTheme();
            }
          }##"
        >
          <svg id="light-icon" class="##=status.isDarkMode ? 'hidden' : 'block'## w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
          </svg>
          <svg id="dark-icon" class="##=status.isDarkMode ? 'block' : 'hidden'## w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16.95 6.343l-.707.707M6.343 6.343l-.707-.707"></path>
          </svg>
        </button>
      </div>
      ##
        // Initialize theme state
        status.isDarkMode = status.isDarkMode || 
          (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        // Apply initial theme
        if (status.isDarkMode) {
          applyDarkMode();
        } else {
          applyLightMode();
        }
        
        // Toggle theme function
        function toggleTheme() {
          status.isDarkMode = !status.isDarkMode;

          if (status.isDarkMode) {
            applyDarkMode();
          } else {
            applyLightMode();
          }
          
          // component.refresh();
        }
        
        // Apply dark mode
        function applyDarkMode() {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark-mode');
        }
        
        // Apply light mode
        function applyLightMode() {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark-mode');
        }
      ##
    </template>
  `);

  // Initialize theme switcher component
  const themeSwitcher = tmpl.ui.ThemeSwitcher({});
  document.body.appendChild(themeSwitcher.element);

  // Listen for system theme changes
  if (window.matchMedia) {
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (colorSchemeQuery.addEventListener) {
      colorSchemeQuery.addEventListener('change', function (e) {
        themeSwitcher.status.isDarkMode = e.matches;
        themeSwitcher.refresh();
      });
    }
  }
});
