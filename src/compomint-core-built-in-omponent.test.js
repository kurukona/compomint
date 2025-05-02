/**
 * @jest-environment jsdom
 */

// Load the Compomint library script into the JSDOM environment
// This assumes compomint-core.js attaches 'compomint' and 'tmpl' to the global scope (window)
const fs = require('fs');
const path = require('path');
const compomintCoreCode = fs.readFileSync(path.resolve(__dirname, './compomint-core.js'), 'utf8');
// Execute the script in the current context (JSDOM's window)
// We wrap it to avoid polluting the test file's global scope directly if needed,
// although executing it directly should work fine with JSDOM.
(function () {
  // 'this' will refer to JSDOM's window
  eval(compomintCoreCode);
}).call(window);



// --- Built-in Component Tests ---
describe('Built-in Components', () => {
  let Compomint;
  let tools;
  let config;

  beforeAll(() => {
    // Ensure Compomint is available globally after script execution
    Compomint = window.compomint;
    tools = Compomint.tools;
    config = Compomint.config;
    if (!Compomint) {
      throw new Error("Compomint library not loaded correctly into JSDOM environment.");
    }
  });

  beforeEach(() => {
    // Reset DOM before each test
    document.body.innerHTML = '';
    document.head.innerHTML = ''; // Clear head as well for style tests

    // Reset Compomint cache and global tmpl object
    //Compomint.tmplCache.clear();
    //Compomint.tmplCache.set("anonymous", { elements: new Set() });
    //window.tmpl = {}; // Reset global tmpl namespace

    // Reset i18n
    //Compomint.i18n = {};

    // Reset debug/error config if needed (or set specific values for tests)
    config.debug = false;
    config.throwError = true; // Default to throwing errors for easier debugging in tests

    // Reset unique ID counter if possible (requires modifying source or using a test build)
    // For now, we assume IDs increment across tests, which is usually fine.
  });


  describe('co-Ele', () => {

    it('co-Ele should render an element using genElement', () => {
      // Note: genElement expects 'className' not 'class' for the class attribute
      const component = Compomint.tmpl('co-Ele')(['button', { id: 'btn1', class: 'btn', 'data-tmpl-name': 'element-test', innerHTML: "<span>click</span" }]);
      expect(component.element.tagName).toBe('BUTTON');
      expect(component.element.outerHTML).toBe('<button id="btn1" class="btn" data-tmpl-name="element-test"><span>click</span></button>');
    });

  });

  describe('co-Element', () => {

    it('co-Element should render a default div', () => {
      const component = Compomint.tmpl('co-Element')({});
      expect(component.element.tagName).toBe('DIV');
    });

    it('co-Element should render the specified tag', () => {
      const component = Compomint.tmpl('co-Element')({ tag: 'span' });
      expect(component.element.tagName).toBe('SPAN');
    });

    it('co-Element should render with id, class, and style', () => {
      const component = Compomint.tmpl('co-Element')({ id: 'myId', props: { class: 'my-class', style: 'color: red;', 'data-tmpl-name': 'element-test' } });
      expect(component.element.id).toBe('myId');
      expect(component.element.className).toBe('my-class');
      expect(component.element.style.color).toBe('red');
      expect(component.element.dataset.tmplName).toBe('element-test');
    });

    it('co-Element should render with component._id when data.id is true', () => {
      const component = Compomint.tmpl('co-Element')({ id: true });
      // The template uses `scope._id`, which likely refers to `component._id` in the execution context
      expect(component.element.id).toBe(component._id);
      expect(component._id).toMatch(/co-Element\d+/); // Check if the ID format is correct
    });

    it('co-Element should render with string content', () => {
      const component = Compomint.tmpl('co-Element')({ content: 'Hello World' });
      expect(component.element.innerHTML).toContain('Hello World');
    });

    it('co-Element should render with element/component content', () => {
      const innerSpan = document.createElement('span');
      innerSpan.textContent = 'Inner';
      const component = Compomint.tmpl('co-Element')({ content: innerSpan });
      expect(component.element.innerHTML).toBe('<span>Inner</span>');
    });

  });

});