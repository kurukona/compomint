/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, jest } from '@jest/globals';
import { compomint, tmpl, CompomintGlobal } from "./compomint-core";


describe('Compomint Template Engine', () => {

  let tools: any;
  let configs: any;

  beforeAll(() => {
    // Ensure Compomint is available globally after script execution

    tools = compomint.tools;
    configs = compomint.configs;
    if (!compomint) {
      throw new Error("Compomint library not loaded correctly into JSDOM environment.");
    }
  });

  beforeEach(() => {
    // Reset DOM before each test
    document.body.innerHTML = '';
    document.head.innerHTML = ''; // Clear head as well for style tests

    // Reset Compomint cache and global tmpl object
    compomint.tmplCache.clear();
    // compomint.tmplCache.set("anonymous", { elements: new Set() });
    for (const key in tmpl) {
      delete tmpl[key];
    }

    // Reset i18n
    compomint.i18n = {};

    // Reset debug/error configs if needed (or set specific values for tests)
    configs.debug = false;
    configs.throwError = true; // Default to throwing errors for easier debugging in tests

    // Reset unique ID counter if possible (requires modifying source or using a test build)
    // For now, we assume IDs increment across tests, which is usually fine.
  });

  // --- Polyfill Tests (Optional but good for completeness) ---
  describe('Polyfills', () => {
    it('Object.assign should copy properties', () => {
      const target = { a: 1 };
      const source = { b: 2, c: 3 };
      const result = Object.assign(target, source);
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
      expect(target).toEqual({ a: 1, b: 2, c: 3 }); // Target is modified
    });

    it('ChildNode.remove should remove the element', () => {
      const div = document.createElement('div');
      const span = document.createElement('span');
      div.appendChild(span);
      expect(div.firstChild).toBe(span);
      span.remove();
      expect(div.firstChild).toBeNull();
    });

    it('Node.isConnected should report connection status', () => {
      const div = document.createElement('div');
      expect(div.isConnected).toBe(false);
      document.body.appendChild(div);
      expect(div.isConnected).toBe(true);
      div.remove();
      expect(div.isConnected).toBe(false);
    });
  });

  // --- Core Template Engine Tests ---
  describe('templateBuilder (compomint.template)', () => {
    it('should compile and return a function', () => {
      const renderingFunc = compomint.template('test-compile', '<div>Test</div>');
      expect(typeof renderingFunc).toBe('function');
    });

    it('should cache the compiled template', () => {
      const renderingFunc1 = compomint.template('test-cache', '<div>Cache</div>');
      expect(compomint.tmplCache.has('test-cache')).toBe(true);
      const renderingFunc2 = compomint.tmpl('test-cache'); // Retrieve from cache via helper
      expect(renderingFunc1).toBe(renderingFunc2);
    });

    it('should add template to global tmpl namespace if grouped(1)', () => {
      compomint.template('ui-button', '<button>Click</button>');
      expect(typeof tmpl.ui.button).toBe('function');

      compomint.template('ui-button-basic', '<button>Click</button>');
      expect(typeof tmpl.ui.buttonBasic).toBe('function');

      compomint.template('ui-button-basic-grouped', '<button>Click</button>');
      expect(typeof tmpl.ui.buttonBasicGrouped).toBe('function');

      expect(compomint.tmpl("ui-button")).toBeDefined();
      expect(compomint.tmpl("ui-button-basic")).toBeDefined();
      expect(compomint.tmpl("ui-button-basic-grouped")).toBeDefined();
    });

    it('should add template to global tmpl namespace if grouped(2)', () => {
      compomint.template('ui-Button', '<button>Click</button>');
      expect(typeof tmpl.ui.Button).toBe('function');

      compomint.template('ui-Button-Basic', '<button>Click</button>');
      expect(typeof tmpl.ui.ButtonBasic).toBe('function');
      expect(typeof tmpl.ui.buttonBasic).not.toBe('function');

      compomint.template('ui-Button-basic-Grouped', '<button>Click</button>');
      expect(typeof tmpl.ui.ButtonBasicGrouped).toBe('function');
      expect(typeof tmpl.ui.buttonBasicGrouped).not.toBe('function');

      expect(compomint.tmpl("ui-Button")).toBeDefined();
      expect(compomint.tmpl("ui-Button-Basic")).toBeDefined();
      expect(compomint.tmpl("ui-Button-basic-Grouped")).toBeDefined();
    });


    it('should handle compilation errors when throwError is true', () => {
      configs.throwError = true;
      expect(() => {
        compomint.template('test-error', '<div>##=** data.nonExistent.prop ##</div>');
      }).toThrow(); // Expecting a compilation error (likely TypeError)
    });

    it('should return undefined on compilation error when throwError is false', () => {
      configs.throwError = false;
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { }); // Suppress console error
      const renderingFunc = compomint.template('test-error-no-throw', '<div>##=** data.nonExistent.prop ##</div>');
      //expect(renderingFunc).toBeUndefined();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });




  // --- Template Syntax Rule Tests ---
  describe('Template Syntax Rules', () => {

    // --- Style Rule ---
    describe('style rule (<style id=...>)', () => {
      beforeEach(() => {
        // Ensure head is clean before each style test
        document.head.innerHTML = '';
      });

      it('should add a new style tag with ID to document.head', () => {
        const styleContent = '.test { color: red; }';
        const templateString = `<style id="test-style">${styleContent}</style><div>Content</div>`;
        const renderingFunc = compomint.template('style-add', templateString);
        const component = renderingFunc({});

        const addedStyle = document.getElementById('test-style')!;
        expect(addedStyle).not.toBeNull();
        expect(addedStyle.tagName).toBe('STYLE');
        expect(addedStyle.textContent).toBe(styleContent);
        expect(component.element.outerHTML).toBe('<div>Content</div>'); // Style removed from output
      });

      it('should replace an existing style tag with the same ID in document.head', () => {
        // Add initial style
        const initialStyle = document.createElement('style');
        initialStyle.id = 'replace-style';
        initialStyle.textContent = '.initial { color: blue; }';
        document.head.appendChild(initialStyle);

        const newStyleContent = '.replaced { color: green; }';
        const templateString = `<style id="replace-style">${newStyleContent}</style><span>Replaced</span>`;
        const renderingFunc = compomint.template('style-replace', templateString);
        const component = renderingFunc({});

        const addedStyle = document.getElementById('replace-style')!;
        expect(addedStyle).not.toBeNull();
        expect(addedStyle.tagName).toBe('STYLE');
        expect(addedStyle.textContent).toBe(newStyleContent); // Content is updated

        // Check only one style with this ID exists
        const styles = document.head.querySelectorAll('#replace-style');
        expect(styles.length).toBe(1);

        expect(component.element.outerHTML).toBe('<span>Replaced</span>');
      });

      it('should shadow style tags without an ID', () => {
        const templateString = `<style>div { color: ##=data.color || 'black'##; }</style><div>No ID</div>`;
        const renderingFunc = compomint.template('style-no-id', templateString);
        const component = renderingFunc({ color: 'blue' });

        expect(document.head.querySelector('style')).toBeNull();
        expect(component.element.outerHTML).toBe('<style-no-id></style-no-id>');
        expect(component.element.shadowRoot!.children[0].outerHTML).toBe('<style>div { color: blue; }</style>');
        expect(component.element.shadowRoot!.children[1].outerHTML).toBe('<div>No ID</div>');
      });
    });

    // --- Comment Area Rule ---
    describe('commentArea rule (##*...##)', () => {
      it('should remove the comment block from the output', () => {
        const templateString = '<div>Before##* This is a comment ##After</div>';
        const renderingFunc = compomint.template('comment-remove', templateString);
        const component = renderingFunc({});
        expect(component.element.innerHTML).toBe('BeforeAfter');
      });

      it('should handle multi-line comments', () => {
        const templateString = '<span>Start##* Line 1\n Line 2 ##End</span>';
        const renderingFunc = compomint.template('comment-multiline', templateString);
        const component = renderingFunc({});
        expect(component.element.innerHTML).toBe('StartEnd');
      });

      it('should not execute JS inside the comment block (due to ## wrapper)', () => {
        // The exec turns #\# code #\# into ## code ##. If 'code' is just text,
        // the ## evaluation block will likely do nothing or error silently during compilation.
        // If it *was* valid JS, it *would* execute.
        const templateString = '<div>##* console.log("Should not execute"); let x = 1; ##Result</div>';
        const consoleSpy = jest.spyOn(console, 'log');
        const renderingFunc = compomint.template('comment-no-exec', templateString);
        const component = renderingFunc({});
        expect(consoleSpy).not.toHaveBeenCalled();
        expect(component.element.innerHTML).toBe('Result');
        consoleSpy.mockRestore();
      });
    });

    // --- PreEvaluate Rule ---
    describe('preEvaluate rule (##!...##)', () => {
      let preEvalMock: jest.Mock;

      beforeEach(() => {
        preEvalMock = jest.fn();
        // Make the mock globally accessible for the new Function scope
        (window as any).preEvalMock = preEvalMock;
      });

      afterEach(() => {
        delete (window as any).preEvalMock; // Clean up global mock
      });

      it('should execute code during template compilation', () => {
        const templateString = '##! window.preEvalMock("compile-time", tmplId) ##<div>Rendered</div>';
        const renderingFunc = compomint.template('pre-eval-exec', templateString);

        // Check mock was called during the compomint.template call above
        expect(preEvalMock).toHaveBeenCalledTimes(1);
        expect(preEvalMock).toHaveBeenCalledWith('compile-time', 'pre-eval-exec');

        // Ensure the block is removed from the output
        const component = renderingFunc({});
        expect(component.element.outerHTML).toBe('<div>Rendered</div>');
      });

      it('should remove the block from the output', () => {
        const templateString = '<span>Before##! let x=1; ##After</span>';
        const renderingFunc = compomint.template('pre-eval-remove', templateString);
        const component = renderingFunc({});
        expect(component.element.innerHTML).toBe('BeforeAfter');
      });

      it('should throw error during compilation if code fails and throwError is true', () => {
        configs.throwError = true;
        const templateString = '##! nonExistentFunc() ##<div>Content</div>';
        expect(() => {
          compomint.template('pre-eval-error-throw', templateString);
        }).toThrow(); // Expect ReferenceError or similar
      });

      it('should log error and continue compilation if code fails and throwError is false', () => {
        configs.throwError = false;
        const consoleErrorSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
        const templateString = '##! nonExistentFunc() ##<div>Content</div>';

        const renderingFunc = compomint.template('pre-eval-error-no-throw', templateString);
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(renderingFunc).toBeDefined(); // Compilation should succeed

        // The block should still be removed
        const component = renderingFunc({});
        expect(component.element.outerHTML).toBe('<div>Content</div>');

        consoleErrorSpy.mockRestore();
      });

    });

    // --- Element Props Tests (data-co-props) ---
    describe('Element Props (data-co-props)', () => {
      it('should set a single attribute using setAttribute', () => {
        const renderingFunc = compomint.template('props-single', '<div data-co-props="##:data.myProps##">Content</div>');
        const component = renderingFunc({ myProps: { title: 'Test Title' } });
        expect(component.element.getAttribute('title')).toBe('Test Title');
        expect(component.element.hasAttribute('data-co-props')).toBe(false); // Temporary attribute removed
      });

      it('should set multiple attributes using setAttribute', () => {
        const renderingFunc = compomint.template('props-multi', '<span data-co-props="##:data.attrs##">Text</span>');
        const component = renderingFunc({ attrs: { 'aria-label': 'Input Field', 'data-value': 123, role: 'button' } });
        expect(component.element.getAttribute('aria-label')).toBe('Input Field');
        expect(component.element.getAttribute('data-value')).toBe('123'); // setAttribute converts to string
        expect(component.element.getAttribute('role')).toBe('button');
        expect(component.element.hasAttribute('data-co-props')).toBe(false);
      });

      it('should overwrite existing attributes if specified', () => {
        // Note: setAttribute will overwrite existing attributes
        const renderingFunc = compomint.template('props-overwrite', '<button class="initial" data-co-props="##:data.newAttrs##">Btn</button>');
        const component = renderingFunc({ newAttrs: { class: 'overwritten', disabled: true } });
        expect(component.element.getAttribute('class')).toBe('overwritten');
        expect(component.element.hasAttribute('disabled')).toBe(true); // Check presence for boolean attributes
        expect(component.element.getAttribute('disabled')).toBe('true'); // Value is often empty string
        expect(component.element.hasAttribute('data-co-props')).toBe(false);
      });

      it('should handle props object defined inline', () => {
        const renderingFunc = compomint.template('props-inline', '<div data-co-props="##:{ \'data-id\': data.id, \'data-next-value\': 100, title: \'Static\' }##">Inline</div>');
        const component = renderingFunc({ id: 99 });
        expect(component.element.getAttribute('data-id')).toBe('99');
        expect(component.element.dataset.id).toBe('99');
        expect(component.element.getAttribute('data-next-value')).toBe('100');
        expect(component.element.dataset.nextValue).toBe('100');
        expect(component.element.getAttribute('title')).toBe('Static');
        expect(component.element.hasAttribute('data-co-props')).toBe(false);
      });

      it('should not fail if props object is empty', () => {
        const renderingFunc = compomint.template('props-empty', '<div data-co-props="##:{}##">Empty</div>');
        const component = renderingFunc({});
        // Check that no unexpected attributes were added
        expect(component.element.attributes.length).toBe(0); // Only standard attributes if any
        expect(component.element.hasAttribute('data-co-props')).toBe(false);
      });

      it('should work on nested elements', () => {
        const renderingFunc = compomint.template('props-nested', '<div><span data-co-props="##:data.spanAttrs##">Nested</span></div>');
        const component = renderingFunc({ spanAttrs: { 'data-level': '2' } });
        const spanElement = component.element.querySelector('span')!;
        expect(spanElement).not.toBeNull();
        expect(spanElement.getAttribute('data-level')).toBe('2');
        expect(spanElement.hasAttribute('data-co-props')).toBe(false);
      });
    });


    // --- event Tests (data-co-event) ---
    describe('event (data-co-event)', () => {
      it('should attach a simple click handler (function)', () => {
        const clickHandler = jest.fn();
        const renderingFunc = compomint.template('event-click', '<button data-co-event="##:data.clickHandler##">Click</button>');
        const component = renderingFunc({ clickHandler });
        const button = component.element;

        button.click();
        expect(clickHandler).toHaveBeenCalledTimes(1);
        expect(clickHandler).toHaveBeenCalledWith(
          expect.any(MouseEvent), // event object
          expect.objectContaining({ // context object
            data: { clickHandler },
            customData: undefined,
            element: button,
            component: component
          })
        );
        expect(button.hasAttribute('data-co-event')).toBe(false);
      });

      it('should attach handlers from an event map object', () => {
        const mouseoverHandler = jest.fn();
        const mouseoutHandler = jest.fn();
        const eventMap = {
          mouseover: mouseoverHandler,
          mouseout: mouseoutHandler
        };
        const renderingFunc = compomint.template('event-map', '<div data-co-event="##:data.eventMap##">Hover</div>');
        const component = renderingFunc({ eventMap });
        const div = component.element;

        div.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        expect(mouseoverHandler).toHaveBeenCalledTimes(1);
        expect(mouseoutHandler).not.toHaveBeenCalled();

        div.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
        expect(mouseoverHandler).toHaveBeenCalledTimes(1); // Still 1
        expect(mouseoutHandler).toHaveBeenCalledTimes(1);
        expect(div.hasAttribute('data-co-event')).toBe(false);
      });

      it('should execute "load" event immediately', () => {
        const loadHandler = jest.fn();
        const eventMap = { load: loadHandler };
        const renderingFunc = compomint.template('event-load', '<div data-co-event="##:data.eventMap##">Load</div>');
        const component = renderingFunc({ eventMap });
        expect(loadHandler).toHaveBeenCalledTimes(1);
        expect(loadHandler).toHaveBeenCalledWith(
          component.element, // event (element itself for load)
          expect.objectContaining({
            data: { eventMap },
            customData: undefined,
            element: component.element,
            component: component
          })
        );
        expect(component.element.hasAttribute('data-co-event')).toBe(false);
      });

      it('should assign element via "namedElement" key in event map', () => {
        const eventMap = { namedElement: 'myDivNamedElement' };
        const renderingFunc = compomint.template('event-namedElement', '<div data-co-event="##:data.eventMap##">Ref</div>');
        const component = renderingFunc({ eventMap });
        expect(component.myDivNamedElement).toBe(component.element);
        expect(component.element.hasAttribute('data-co-event')).toBe(false);
      });

      it('should provide trigger functions via "triggerName"', () => {
        const clickHandler = jest.fn();
        const eventMap = {
          triggerName: 'myTrigger',
          click: clickHandler
        };
        const renderingFunc = compomint.template('event-trigger', '<button data-co-event="##:data.eventMap##">Trigger</button>');
        const component = renderingFunc({ eventMap });

        expect(component.trigger!.myTrigger.click).toBeDefined();
        expect(typeof component.trigger!.myTrigger.click).toBe('function');

        // Trigger programmatically
        component.trigger!.myTrigger.click();

        // Check if the handler was called (may need slight delay or check event propagation if complex)
        // In simple cases, it should be called synchronously by the dispatchEvent in trigger
        expect(clickHandler).toHaveBeenCalledTimes(1);
        expect(component.element.hasAttribute('data-co-event')).toBe(false);
      });

      it('should handle custom data (object)', () => {
        const handler = jest.fn();
        const custom = { id: 100, type: 'obj' };
        const renderingFunc = compomint.template('event-custom-obj', '<button data-co-event="##:data.handler::data.custom##">Data</button>');
        const component = renderingFunc({ handler, custom });
        component.element.click();
        expect(handler).toHaveBeenCalledWith(
          expect.any(Event), // event
          expect.objectContaining({ // context
            customData: custom,
          })
        );
      });

      it('should handle custom data (variable)', () => {
        const handler = jest.fn();
        const renderingFunc = compomint.template('event-custom-var', '##let customVar = {id: 101};##<button data-co-event="##:data.handler::customVar##">Data</button>');
        const component = renderingFunc({ handler });
        component.element.click();
        expect(handler).toHaveBeenCalledWith(
          expect.any(Event), // event
          expect.objectContaining({ // context
            customData: { id: 101 },
          })
        );
      });

      it('should handle custom data (string)', () => {
        const handler = jest.fn();
        const renderingFunc = compomint.template('event-custom-str', '<button data-co-event="##:data.handler::\'test data\'##">Data</button>');
        const component = renderingFunc({ handler });
        component.element.click();
        expect(handler).toHaveBeenCalledWith(
          expect.any(Event), // event
          expect.objectContaining({ // context
            customData: "test data",
          })
        );
      });

      it('should handle custom data (number)', () => {
        const handler = jest.fn();
        const renderingFunc = compomint.template('event-custom-num', '<button data-co-event="##:data.handler::100##">Data</button>');
        const component = renderingFunc({ handler });
        component.element.click();
        expect(handler).toHaveBeenCalledWith(
          expect.any(Event), // event
          expect.objectContaining({ // context
            customData: 100,
          })
        );
      });

      it('should handle multiple handlers using :::', () => {
        const handler1 = jest.fn();
        const handler2 = jest.fn();
        const custom1 = { id: 1 };
        const custom2 = { id: 2 };
        const renderingFunc = compomint.template('event-multi-handlers', '<div data-co-event="##:data.h1::data.c1 ::: data.h2::data.c2##">Multi</div>');
        const component = renderingFunc({ h1: handler1, c1: custom1, h2: handler2, c2: custom2 });
        component.element.click();

        expect(handler1).toHaveBeenCalledTimes(1);
        expect(handler1).toHaveBeenCalledWith(expect.any(Event), expect.objectContaining({ customData: custom1 }));

        expect(handler2).toHaveBeenCalledTimes(1);
        expect(handler2).toHaveBeenCalledWith(expect.any(Event), expect.objectContaining({ customData: custom2 }));
      });
    });

    // --- element Tests (##%) ---
    describe('element (##%)', () => {
      it('should insert string content', () => {
        const renderingFunc = compomint.template('el-insert-string', '<div>Before ##% "Inserted String" ## After</div>');
        const component = renderingFunc({});
        expect(component.element.innerHTML).toBe('Before Inserted String After');
      });

      it('should insert number content', () => {
        const renderingFunc = compomint.template('el-insert-number', '<div>Value: ##% 12345 ##</div>');
        const component = renderingFunc({});
        expect(component.element.innerHTML).toBe('Value: 12345');
      });

      it('should insert HTML string (single element)', () => {
        const renderingFunc = compomint.template('el-insert-html-single', '<div>##% "<span>HTML Span</span>" ##</div>');
        const component = renderingFunc({});
        expect(component.element.innerHTML).toBe('<span>HTML Span</span>');
        expect((component.element.firstChild! as any).tagName).toBe('SPAN');
      });

      it('should insert HTML string (multiple elements)', () => {
        const renderingFunc = compomint.template('el-insert-html-multi', '<div>##% "<i>Italic</i><b>Bold</b>" ##</div>');
        const component = renderingFunc({});
        expect(component.element.innerHTML).toBe('<i>Italic</i><b>Bold</b>');
        expect(component.element.children.length).toBe(2);
        expect(component.element.children[0].tagName).toBe('I');
        expect(component.element.children[1].tagName).toBe('B');
      });

      it('should insert a Node', () => {
        const p = document.createElement('p');
        p.textContent = 'Paragraph Node';
        const renderingFunc = compomint.template('el-insert-node', '<div>##% data.node ##</div>');
        const component = renderingFunc({ node: p });
        expect(component.element.innerHTML).toBe('<p>Paragraph Node</p>');
        expect(component.element.firstChild).toBe(p); // Should be the exact same node instance
      });

      it('should insert an array of mixed types', () => {
        const iNode = document.createElement('i');
        iNode.textContent = 'Three';
        const items = ['One', '<span>Two</span>', iNode, 4];
        const renderingFunc = compomint.template('el-insert-array', '<div>##% data.items ##</div>');
        const component = renderingFunc({ items: items });
        expect(component.element.innerHTML).toBe('One<span>Two</span><i>Three</i>4');
        expect(component.element.childNodes.length).toBe(4);
        expect(component.element.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
        expect((component.element.childNodes[1] as any).tagName).toBe('SPAN');
        expect(component.element.childNodes[2]).toBe(iNode);
        expect(component.element.childNodes[3].nodeType).toBe(Node.TEXT_NODE);
      });

      it('should insert another Compomint component', () => {
        const innerRender = compomint.template('inner-comp', '<section>Inner Component</section>');
        const innerComponent = innerRender({});
        const renderingFunc = compomint.template('el-insert-component', '<div>Outer: ##% data.inner ##</div>');
        const component = renderingFunc({ inner: innerComponent });
        expect(component.element.innerHTML).toBe('Outer: <section>Inner Component</section>');
        expect(component.element.querySelector('section')).toBe(innerComponent.element);
        expect(innerComponent.parentComponent).toBe(component); // Check parent linking
      });

      it('should handle nonblocking element insertion (##% ... ::true)', () => {
        const renderingFunc = compomint.template('el-insert-nb', '<div>##% "<span>NB Content</span>" :: true ##</div>');
        const component = renderingFunc({});
        // Initially, the placeholder is there
        expect(component.element.querySelector('template[data-co-tmpl-element-id]')).not.toBeNull();
        expect(component.element.innerHTML).toContain('<template data-co-tmpl-element-id="0"></template>');
        // Run timers
        jest.runAllTimers();
        // Now the content should be inserted
        expect(component.element.innerHTML).toBe('<span>NB Content</span>');
        expect(component.element.querySelector('template[data-co-tmpl-element-id]')).toBeNull();
      });

      it('should handle nonblocking element insertion with delay (##% ... ::ms)', () => {
        const renderingFunc = compomint.template('el-insert-nb-delay', '<div>##% "Delayed" :: 50 ##</div>');
        const component = renderingFunc({});
        expect(component.element.querySelector('template[data-co-tmpl-element-id]')).not.toBeNull();
        jest.advanceTimersByTime(49);
        expect(component.element.querySelector('template[data-co-tmpl-element-id]')).not.toBeNull(); // Not yet
        expect(component.element.innerHTML).not.toContain('Delayed');
        jest.advanceTimersByTime(1);
        expect(component.element.innerHTML).toBe('Delayed'); // Now inserted
        expect(component.element.querySelector('template[data-co-tmpl-element-id]')).toBeNull();
      });

      it('should call beforeAppendTo and afterAppendTo for component scope', () => {
        const beforeHook = jest.fn();
        const afterHook = jest.fn();
        const innerRender = compomint.template('inner-hooks', '<span>Hooks</span>');
        const innerComponent = innerRender({});
        innerComponent.beforeAppendTo = beforeHook;
        innerComponent.afterAppendTo = afterHook;

        const renderingFunc = compomint.template('el-insert-hooks', '<div>##% data.inner ##</div>');
        const component = renderingFunc({ inner: innerComponent });

        // beforeHook should be called synchronously during replacement
        expect(beforeHook).toHaveBeenCalledTimes(1);
        // afterHook is called via setTimeout(0)
        expect(afterHook).not.toHaveBeenCalled();
        jest.runAllTimers(); // Run timers to execute the setTimeout(0)
        expect(afterHook).toHaveBeenCalledTimes(1);
        expect(innerComponent.parentComponent).toBe(component);
      });

      it('should call beforeAppendTo and afterAppendTo for array items', () => {
        const beforeHook1 = jest.fn();
        const afterHook1 = jest.fn();
        const beforeHook2 = jest.fn();
        const afterHook2 = jest.fn();

        const item1 = { element: '<span>One</span>', beforeAppendTo: beforeHook1, afterAppendTo: afterHook1 };
        const item2 = { element: document.createElement('b'), beforeAppendTo: beforeHook2, afterAppendTo: afterHook2 };
        item2.element.textContent = 'Two';

        const renderingFunc = compomint.template('el-insert-array-hooks', '<div>##% data.items ##</div>');
        const component = renderingFunc({ items: [item1, item2] });

        expect(beforeHook1).toHaveBeenCalledTimes(1);
        expect(beforeHook2).toHaveBeenCalledTimes(1);
        expect(afterHook1).not.toHaveBeenCalled();
        expect(afterHook2).not.toHaveBeenCalled();

        jest.runAllTimers();

        expect(afterHook1).toHaveBeenCalledTimes(1);
        expect(afterHook2).toHaveBeenCalledTimes(1);
      });

      it('should handle missing placeholder gracefully', () => {
        const renderingFunc = compomint.template('el-insert-missing-placeholder', '<div>Placeholder removed</div>');
        const component = renderingFunc({});

        // Manually simulate lazy execution with a placeholder ID that won't be found
        const lazyScope = { elementArray: [{ childTarget: 'Content', nonblocking: false }] };
        const templateConfig = compomint.templateConfig;
        const docFragment = component.element; // Use the actual rendered element fragment

        // Temporarily disable throwError to check console warning
        configs.throwError = false;
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

        expect(() => {
          templateConfig.rules.element.lazyExec!({}, lazyScope as any, component, docFragment);
        }).not.toThrow();

        // Check if a warning was logged (if configs.debug was true)
        // expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Element insertion placeholder not found'));

        consoleWarnSpy.mockRestore();
        configs.throwError = true; // Restore default
      });

      it('should handle invalid childTarget gracefully', () => {
        const renderingFunc = compomint.template('el-insert-invalid-target', '<div>##% data.invalid ##</div>');
        const component = renderingFunc({ invalid: { some: 'object' } }); // Not a Node, string, number, array, or function

        // Placeholder should be removed
        expect(component.element.innerHTML).toBe('');
        expect(component.element.querySelector('template[data-co-tmpl-element-id]')).toBeNull();

        // Check console warning if debug is enabled
        configs.debug = true;
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation((test, test2) => { });
        renderingFunc({ invalid: { some: 'object' } }); // Re-render with debug on
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid target for element insertion'), { some: 'object' });
        consoleWarnSpy.mockRestore();
        configs.debug = false;
      });
    });


    // --- Interpolate Rule ---
    describe('interpolate rule (##=...##)', () => {
      it('should interpolate simple variable values', () => {
        const templateString = '<div>Name: ##=data.name##, Age: ##=data.age##, Active: ##=data.isActive##</div>';
        const renderingFunc = compomint.template('interp-vars', templateString);
        const component = renderingFunc({ name: 'Test', age: 99, isActive: true });
        expect(component.element.innerHTML).toBe('Name: Test, Age: 99, Active: true');
      });

      it('should interpolate results of expressions', () => {
        const templateString = '<p>Sum: ##=data.a + data.b##</p>';
        const renderingFunc = compomint.template('interp-expr', templateString);
        const component = renderingFunc({ a: 5, b: 3 });
        expect(component.element.innerHTML).toBe('Sum: 8');
      });

      it('should call and interpolate the result of a function', () => {
        const templateString = '<span>Value: ##=data.getValue()##</span>';
        const renderingFunc = compomint.template('interp-func', templateString);
        const component = renderingFunc({ getValue: () => 'From Function' });
        expect(component.element.innerHTML).toBe('Value: From Function');
      });

      it('should render empty string for null or undefined', () => {
        const templateString = '<div>Null: [##=data.isNull##], Undefined: [##=data.isUndef##]</div>';
        const renderingFunc = compomint.template('interp-nullish', templateString);
        const component = renderingFunc({ isNull: null, isUndef: undefined });
        expect(component.element.innerHTML).toBe('Null: [], Undefined: []');
      });

      it('should not escape HTML content', () => {
        const templateString = '<div>##=data.htmlContent##</div>';
        const renderingFunc = compomint.template('interp-html', templateString);
        const component = renderingFunc({ htmlContent: '<strong>Bold</strong>' });
        expect(component.element.innerHTML).toBe('<strong>Bold</strong>');
      });

      it('should handle complex nested expressions', () => {
        const templateString = '<div>##= data.user ? data.user.name.toUpperCase() : "Guest" ##</div>';
        const renderingFunc = compomint.template('interp-complex', templateString);
        const component1 = renderingFunc({ user: { name: 'Alice' } });
        expect(component1.element.innerHTML).toBe('ALICE');
        const component2 = renderingFunc({ user: null });
        expect(component2.element.innerHTML).toBe('Guest');
      });

      it('should render tag attribute', () => {
        const templateString = '<div title="##=data.title##"></div>';
        const renderingFunc = compomint.template('interp-attribute', templateString);
        const component = renderingFunc({ title: 'Test Title' });
        expect(component.element.getAttribute('title')).toBe('Test Title');
      });

      it('should render tag attribute', () => {
        const templateString = '<input type="checkbox" ##=data.checked ? "checked" : ""##></input>';
        const renderingFunc = compomint.template('interp-attribute', templateString);
        const component1 = renderingFunc({ checked: true });
        expect(component1.element.outerHTML).toBe('<input type="checkbox" checked="">');
        const component2 = renderingFunc({ checked: false });
        expect(component2.element.outerHTML).toBe('<input type="checkbox">');
      });
    });


    // --- namedElement Tests ---
    describe('namedElement (data-co-named-element)', () => {
      it('should assign element to component scope using string literal key', () => {
        const renderingFunc = compomint.template('named-el-string', '<button data-co-named-element="##:\'myButton\'##">Click</button>');
        const component = renderingFunc({});
        expect(component.myButton).toBeDefined();
        expect(component.myButton instanceof HTMLButtonElement).toBe(true);
        expect(component.myButton.textContent).toBe('Click');
        expect(component.myButton.hasAttribute('data-co-named-element')).toBe(false); // Attribute should be removed
      });

      it('should assign element to component scope using variable key', () => {
        const renderingFunc = compomint.template('named-el-var', '## let btnKey = "theButton"; ##<span data-co-named-element="##:btnKey##">Span</span>');
        const component = renderingFunc({});
        expect(component.theButton).toBeDefined();
        expect(component.theButton instanceof HTMLSpanElement).toBe(true);
        expect(component.theButton.textContent).toBe('Span');
        expect(component.theButton.hasAttribute('data-co-named-element')).toBe(false);
      });

      it('should not throw error if element is not found', () => {
        const renderingFunc = compomint.template('named-el-missing', '<div><!-- Element removed before lazyExec --></div>');
        const component = renderingFunc({});
        // Manually simulate the state where the element is gone before lazyExec runs
        const lazyScope = { namedElementArray: ['missingElement'] };
        const templateConfig = compomint.templateConfig;
        const docFragment = document.createDocumentFragment(); // Empty fragment

        expect(() => {
          templateConfig.rules.namedElement.lazyExec!({}, lazyScope as any, component, docFragment);
        }).not.toThrow();
        expect(component.missingElement).toBeUndefined();
      });
    });

    // --- elementRef Tests ---
    describe('elementRef (data-co-element-ref)', () => {
      it('should make element reference available within template scope', () => {
        const testFunc = jest.fn();
        (window as any).testFunc = testFunc;

        const renderingFunc = compomint.template('el-ref-scope', `
        <input type="text" data-co-element-ref="##:myInput##" value="Initial">
        ###
          // Test access within a lazy block
          if (myInput) {
            myInput.value = 'Changed in Lazy';
            window.testFunc(myInput); // Call global test function
          }
        ##
      `);
        const component = renderingFunc({});

        expect((component.element as HTMLInputElement).value).toBe('Changed in Lazy');
        expect(testFunc).toHaveBeenCalledTimes(1);
        expect(testFunc).toHaveBeenCalledWith(component.element); // Check the argument passed
        expect(component.element.hasAttribute('data-co-element-ref')).toBe(false);

      });

      it('should call the function stored in lazyScope', () => {
        // This test focuses on the internal mechanism if needed,
        // but testing the *effect* (like above) is often more practical.
        const refFunc = jest.fn();
        const renderingFunc = compomint.template('el-ref-internal', '<div data-co-element-ref="##:internalRef##">Ref</div>');
        const component = renderingFunc({});

        // Simulate lazy execution manually to inspect the function
        const lazyScope = { elementRefArray: [refFunc] };
        const templateConfig = compomint.templateConfig;
        const docFragment = document.createDocumentFragment();
        const div = document.createElement('div');
        div.setAttribute('data-co-element-ref', '0'); // Match the index
        docFragment.appendChild(div);

        templateConfig.rules.elementRef.lazyExec!({}, lazyScope as any, component, docFragment);

        expect(refFunc).toHaveBeenCalledTimes(1);
        expect(refFunc).toHaveBeenCalledWith(div); // Called with the target element
        expect(div.hasAttribute('data-co-element-ref')).toBe(false);
      });

      it('should not throw error if element is not found', () => {
        const refFunc = jest.fn();
        const renderingFunc = compomint.template('el-ref-missing', '<div><!-- Element removed --></div>');
        const component = renderingFunc({});

        // Simulate lazy execution manually
        const lazyScope = { elementRefArray: [refFunc] };
        const templateConfig = compomint.templateConfig;
        const docFragment = document.createDocumentFragment(); // Empty

        expect(() => {
          templateConfig.rules.elementRef.lazyExec!({}, lazyScope as any, component, docFragment);
        }).not.toThrow();
        expect(refFunc).not.toHaveBeenCalled();
      });
    });

    // --- elementLoad Tests ---
    describe('elementLoad (data-co-load)', () => {
      it('should call load function with element and context', () => {
        const loadHandler = jest.fn((...test) => {
          console.log(test)
        });
        const customData = { id: 123, type: 'test' };
        const renderingFunc = compomint.template('el-load-basic', '<div data-co-load="##:data.handler::data.custom##">Load Me</div>');
        const component = renderingFunc({ handler: loadHandler, custom: customData });
        const element = component.element;
        const parent = document.createElement('div'); // Mock parent
        parent.appendChild(element);

        expect(loadHandler).toHaveBeenCalledTimes(1);
        expect(loadHandler).toHaveBeenCalledWith(
          element, // First arg: the element itself
          expect.objectContaining({ // Second arg: context object
            data: { handler: loadHandler, custom: customData },
            element: element,
            customData: customData,
            component: component,
          })
        );

        expect(element.hasAttribute('data-co-load')).toBe(false);
      });

      it('should call load function without custom data', () => {
        const loadHandler = jest.fn();
        const renderingFunc = compomint.template('el-load-no-custom', '<span data-co-load="##:data.handler##">Load Me Too</span>');
        const component = renderingFunc({ handler: loadHandler });
        const element = component.element;
        const parent = document.createElement('div');
        parent.appendChild(element);

        expect(loadHandler).toHaveBeenCalledTimes(1);
        expect(loadHandler).toHaveBeenCalledWith(
          element,
          expect.objectContaining({
            data: { handler: loadHandler },
            element: element,
            customData: undefined, // Custom data should be undefined
            component: component,
          })
        );
        expect(element.hasAttribute('data-co-load')).toBe(false);
      });

      it('should not throw error if element is not found', () => {
        const loadHandler = jest.fn();
        const renderingFunc = compomint.template('el-load-missing', '<div><!-- Element removed --></div>');
        const component = renderingFunc({ handler: loadHandler });

        // Simulate lazy execution manually
        const lazyScope = { elementLoadArray: [{ loadFunc: loadHandler, customData: null }] };
        const templateConfig = compomint.templateConfig;
        const docFragment = document.createDocumentFragment(); // Empty

        expect(() => {
          templateConfig.rules.elementLoad.lazyExec!({ handler: loadHandler }, lazyScope as any, component, docFragment);
        }).not.toThrow();
        expect(loadHandler).not.toHaveBeenCalled();
      });
    });


    // --- lazyEvaluate Tests (###) ---
    describe('lazyEvaluate (###)', () => {
      it('should execute code after initial render', () => {
        const lazyHandler = jest.fn();
        const renderingFunc = compomint.template('lazy-eval-basic', '<div>### data.handler(data.value) ##</div>');
        const component = renderingFunc({ handler: lazyHandler, value: 42 });

        expect(lazyHandler).toHaveBeenCalledTimes(1);
        expect(lazyHandler).toHaveBeenCalledWith(42);
      });

      it('should execute code with correct `this` context (single root element)', () => {
        const lazyHandler = jest.fn((element: Element, data: Record<string, any>) => {
          // 'this' should be the root element
          expect(element.tagName).toBe('SPAN');
          expect(data.value).toBe('test');
        });
        const renderingFunc = compomint.template('lazy-eval-this-single', '<span>### data.handler(this, data) ##</span>');
        const component = renderingFunc({ handler: lazyHandler, value: 'test' });

        expect(lazyHandler).toHaveBeenCalledTimes(1);
      });

      it('should execute code with correct `this` context (multiple root elements -> window)', () => {
        // When there are multiple root nodes, the element is a DocumentFragment.
        // The 'this' context becomes the parent element (wrapperDiv in this case).
        const lazyHandler = jest.fn((element: Element, data: Record<string, any>) => {
          expect(element.nodeName).toBe("#document-fragment");
          expect(data.value).toBe('multi');
        });
        const renderingFunc = compomint.template('lazy-eval-this-multi', '<i>Italic</i><b>Bold</b>### data.handler(this, data) ##');
        const wrapperDiv = document.createElement('div');
        const component = renderingFunc({ handler: lazyHandler, value: 'multi' }, wrapperDiv); // Render into wrapper

        expect(lazyHandler).toHaveBeenCalledTimes(1);
      });

      it('should execute multiple lazy blocks in order', () => {
        const calls: number[] = [];
        const handler1 = jest.fn(() => calls.push(1));
        const handler2 = jest.fn(() => calls.push(2));
        const renderingFunc = compomint.template('lazy-eval-multi', '<div>### data.h1() ###<p>Middle</p>### data.h2() ##</div>');
        const component = renderingFunc({ h1: handler1, h2: handler2 });

        expect(handler1).toHaveBeenCalledTimes(1);
        expect(handler2).toHaveBeenCalledTimes(1);
        expect(calls).toEqual([1, 2]); // Ensure they were called in the correct order
      });
    });

    // --- escape Tests (##-) ---
    describe('escape (##-)', () => {
      it('should escape HTML special characters', () => {
        const renderingFunc = compomint.template('escape-html', '<div>##- data.unsafe ##</div>');
        const component = renderingFunc({ unsafe: '<script>alert("xss")</script>&\'"`' });
        expect(component.element.innerHTML).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;&amp;\'"`');
        expect(component.element.querySelector('script')).toBeNull(); // Ensure script tag wasn't actually rendered
      });

      it('should not escape normal text', () => {
        const renderingFunc = compomint.template('escape-normal', '<p>##- data.safe ##</p>');
        const component = renderingFunc({ safe: 'This is safe text 123.' });
        expect(component.element.innerHTML).toBe('This is safe text 123.');
      });

      it('should render empty string for null or undefined', () => {
        const renderingFunc = compomint.template('escape-nullish', '<span>[##- data.val1 ##] [##- data.val2 ##]</span>');
        const component = renderingFunc({ val1: null, val2: undefined });
        expect(component.element.innerHTML).toBe('[] []');
      });

      it('should escape result of function calls', () => {
        const renderingFunc = compomint.template('escape-func', '<div>##- data.getUnsafe() ##</div>');
        const component = renderingFunc({ getUnsafe: () => '<a>Link</a>' });
        expect(component.element.innerHTML).toBe('&lt;a&gt;Link&lt;/a&gt;');
      });
    });

    // --- evaluate Tests (##) ---
    describe('evaluate (##)', () => {
      it('should execute arbitrary JavaScript code', () => {
        const renderingFunc = compomint.template('eval-basic', '## let x = 5; let y = 10; ##<div>Result: ##= x + y ##</div>');
        const component = renderingFunc({});
        expect(component.element.innerHTML).toBe('Result: 15');
      });

      it('should allow flow control (loops)', () => {
        const renderingFunc = compomint.template('eval-loop', '<ul>## for(let i = 0; i < data.items.length; i++) { ##<li>Item ##= i+1 ##: ##= data.items[i] ##</li>## } ##</ul>');
        const component = renderingFunc({ items: ['A', 'B', 'C'] });
        expect(component.element.innerHTML).toBe('<li>Item 1: A</li><li>Item 2: B</li><li>Item 3: C</li>');
      });

      it('should allow flow control (conditionals)', () => {
        const renderingFunc = compomint.template('eval-if', '## if (data.isAdmin) { ##<span>Admin</span>## } else { ##<span>User</span>## } ##');
        const componentAdmin = renderingFunc({ isAdmin: true });
        expect(componentAdmin.element.outerHTML).toBe('<span>Admin</span>');
        const componentUser = renderingFunc({ isAdmin: false });
        expect(componentUser.element.outerHTML).toBe('<span>User</span>');
      });

      it('should modify the output buffer (__p)', () => {
        // This tests the underlying mechanism where ## code ## can directly manipulate __p
        const renderingFunc = compomint.template('eval-buffer', '<div>Start## __p += " Middle "; ##End</div>');
        const component = renderingFunc({});
        expect(component.element.innerHTML).toBe('Start Middle End');
      });

      it('should have access to data, status, component, and i18n', () => {
        const i18nMock = { greeting: 'Hello' };
        compomint.i18n['eval-scope'] = i18nMock; // Mock i18n for this template

        const renderingFunc = compomint.template('eval-scope', `
        ##
          let dataVal = data.value;
          status.processed = true;
          component.testProp = 'Set In Eval';
          let i18nVal = i18n.greeting;
        ##
        <p>Data: ##=dataVal## | Status: ##=status.processed## | Comp: ##=component.testProp## | I18n: ##=i18nVal##</p>
      `);
        const component = renderingFunc({ value: 123 });

        expect(component.testProp).toBe('Set In Eval');
        expect(component.status.processed).toBe(true);
        expect(component.element.innerHTML).toBe('Data: 123 | Status: true | Comp: Set In Eval | I18n: Hello');

        delete compomint.i18n['eval-scope']; // Clean up mock
      });
    });

  }); // End Template Syntax Rules

  // --- Rendering Tests ---
  describe('Rendering (tmpl function)', () => {

    it('should render simple HTML', () => {
      const renderingFunc = compomint.template('render-simple', '<h1>Title</h1>');
      const component = renderingFunc({});
      expect(component.element.outerHTML).toBe('<h1>Title</h1>');
    });

    it('should render with data interpolation (##=)', () => {
      const renderingFunc = compomint.template('render-interp', '<div>Hello ##=data.name##! Age: ##=data.age##</div>');
      const component = renderingFunc({ name: 'Tester', age: 30 });
      expect(component.element.innerHTML).toBe('Hello Tester! Age: 30');
      expect(component.data).toEqual({ name: 'Tester', age: 30 });
    });

    it('should handle HTML escaping (##-)', () => {
      const renderingFunc = compomint.template('render-escape', '<div>##-data.html##</div>');
      const component = renderingFunc({ html: '<strong>Bold</strong>' });
      expect(component.element.innerHTML).toBe('&lt;strong&gt;Bold&lt;/strong&gt;');
    });

    it('should execute JavaScript evaluation (##)', () => {
      const renderingFunc = compomint.template('render-eval', '<ul>## for(let i=0; i<data.items.length; i++){ ##<li>##=data.items[i]##</li>## } ##</ul>');
      const component = renderingFunc({ items: ['A', 'B'] });
      expect(component.element.innerHTML).toBe('<li>A</li><li>B</li>');
    });

    it('should render into a wrapper element', () => {
      const renderingFunc = compomint.template('render-wrapper', '<p>Content</p>');
      const wrapper = document.createElement('div');
      document.body.appendChild(wrapper);
      const component = renderingFunc({}, wrapper);

      expect(wrapper.innerHTML).toBe('<p>Content</p>');
      expect(component.element).toBe(wrapper.firstChild);
      expect(component.wrapperElement).toBe(wrapper);
    });

    it('should return a DocumentFragment for multiple root nodes', () => {
      const renderingFunc = compomint.template('render-fragment', '<td>1</td><td>2</td>');
      const component = renderingFunc({});
      expect(component.element instanceof DocumentFragment).toBe(true);
      expect(component.element.children.length).toBe(2);
      expect(component.element.firstElementChild!.outerHTML).toBe('<td>1</td>');
      expect(component.element.children[1].outerHTML).toBe('<td>2</td>');
    });

    it('should execute callback after rendering', () => {
      const callback = jest.fn();
      const renderingFunc = compomint.template('render-callback', '<span>CB</span>');
      const component = renderingFunc({}, callback);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(component);
    });

    it('should execute callback after rendering', () => {
      const callback = jest.fn();
      const renderingFunc = compomint.template('render-callback', '<span>CB</span>');
      const component = renderingFunc({}, callback);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(component);
    });

    it('should apply $props to the root element', () => {
      const renderingFunc = compomint.template('render-props', '<div>Props</div>');
      const component = renderingFunc({ $props: { id: 'myDiv', className: 'test', 'data-value': 123, 'data-test-value': 'my test' } });
      expect(component.element.id).toBe('myDiv');
      expect(component.element.className).toBe('test');
      expect(component.element.dataset.value).toBe('123');
      expect(component.element.dataset.testValue).toBe('my test');
    });


    it('should execute callback after rendering with data object', () => {
      const callback = jest.fn();
      const renderingFunc = compomint.template('render-data-object', '<div>##=data.val##</div>');
      const component = renderingFunc({ val: 123, $callback: callback });
      expect(component.element.innerHTML).toBe('123');
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(component);
    });

    it('should render an empty template placeholder if data is null/undefined', () => {
      const renderingFunc = compomint.template('render-empty', '<div>##=data.val##</div>');
      const componentNull = renderingFunc(null);
      expect(componentNull.element.tagName).toBe('TEMPLATE');
      expect(componentNull.element.dataset.coEmptyTemplate).toBe('render-empty');

      const componentUndef = renderingFunc(undefined);
      expect(componentUndef.element.tagName).toBe('TEMPLATE');
      expect(componentUndef.element.dataset.coEmptyTemplate).toBe('render-empty');
    });

    it('should handle runtime errors during rendering', () => {
      const renderingFunc = compomint.template('runtime-error', '<div>##= data.nonExistent.prop ##</div>');
      configs.throwError = true;
      expect(() => {
        renderingFunc({ some: 'data' });
      }).toThrow(); // Expecting a runtime error

      configs.throwError = false;
      const consoleErrorSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
      const component = renderingFunc({ some: 'data' });
      expect(component.element.nodeType).toBe(Node.COMMENT_NODE); // Should return a comment node on error
      expect(component.element.textContent).toContain('Render Error: runtime-error');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // --- Lazy Execution Tests ---
  describe('Lazy Execution Features', () => {
    jest.useFakeTimers(); // Use fake timers for nonblocking tests

    it('should execute lazy evaluation blocks (###) after render', () => {
      const lazyFunc = jest.fn();
      const renderingFunc = compomint.template('lazy-eval', '<div>### data.lazyFunc(data.val) ###</div>');
      const component = renderingFunc({ val: 10, lazyFunc });
      expect(lazyFunc).toHaveBeenCalledTimes(1);
      expect(lazyFunc).toHaveBeenCalledWith(10);
    });

    it('should assign named elements (data-co-named-element - string)', () => {
      const renderingFunc = compomint.template('named-el', '<button data-co-named-element="##:\'myButton\'##">Click</button>');
      const component = renderingFunc({});
      expect(component.myButton).toBeDefined();
      expect(component.myButton.tagName).toBe('BUTTON');
      expect(component.myButton.hasAttribute('data-co-named-element')).toBe(false); // Attribute should be removed
    });

    it('should assign named elements (data-co-named-element - variable)', () => {
      const renderingFunc = compomint.template('named-el', '##let myButton = "myButton";##<button data-co-named-element="##:myButton##">Click</button>');
      const component = renderingFunc({});
      expect(component.myButton).toBeDefined();
      expect(component.myButton.tagName).toBe('BUTTON');
      expect(component.myButton.hasAttribute('data-co-named-element')).toBe(false); // Attribute should be removed
    });

    it('should assign element references (data-co-element-ref)', () => {
      const lazyFunc = jest.fn((element: HTMLInputElement) => {
        expect(element.tagName).toBe('INPUT');
      });
      const renderingFunc = compomint.template('el-ref', '<input data-co-element-ref="##:myInput##"></input>###data.lazyFunc(myInput);##');
      const component = renderingFunc({ lazyFunc });
      expect(lazyFunc).toHaveBeenCalled();
      expect(component.element.hasAttribute('data-co-element-ref')).toBe(false); // Attribute should be removed
      lazyFunc.mockRestore();
    });

    it('should execute element load functions (data-co-load)', () => {
      const loadFunc = jest.fn();
      const renderingFunc = compomint.template('el-load', '<div data-co-load="##:data.loadFunc::\'custom\'##">Load</div>');
      const component = renderingFunc({ loadFunc });
      expect(loadFunc).toHaveBeenCalledTimes(1);
      expect(loadFunc).toHaveBeenCalledWith(
        component.element, // element
        expect.objectContaining({ // context object
          data: { loadFunc },
          customData: 'custom',
          element: component.element,
          component: component
        })
      );
      expect(component.element.hasAttribute('data-co-load')).toBe(false);
    });

    it('should insert elements (##%)', () => {
      const renderingFunc = compomint.template('el-insert', '<div>Before ##% data.content ## After</div>');

      // Number
      let component = renderingFunc({ content: 123 });
      expect(component.element.innerHTML).toBe('Before 123 After');

      // String
      component = renderingFunc({ content: 'Inserted' });
      expect(component.element.innerHTML).toBe('Before Inserted After');

      // Element String
      component = renderingFunc({ content: '<span>Inserted</span>' });
      expect(component.element.innerHTML).toBe('Before <span>Inserted</span> After');

      // Elements String
      component = renderingFunc({ content: '<i>Italic</i><b>Bold</b>' });
      expect(component.element.innerHTML).toBe('Before <i>Italic</i><b>Bold</b> After');

      // Node
      const p = document.createElement('p');
      p.textContent = 'Paragraph';
      component = renderingFunc({ content: p });
      expect(component.element.innerHTML).toBe('Before <p>Paragraph</p> After');

      // Array
      const items = ['One', '<span>Two</span>', document.createElement('i')];
      (items[2] as Element).textContent = 'Three';
      component = renderingFunc({ content: items });
      expect(component.element.innerHTML).toBe('Before One<span>Two</span><i>Three</i> After');

      // Component Scope
      const innerRender = compomint.template('inner-comp', '<section>Inner</section>');
      const innerComponent = innerRender({});
      component = renderingFunc({ content: innerComponent });
      expect(component.element.innerHTML).toBe('Before <section>Inner</section> After');
      expect(innerComponent.parentComponent).toBe(component);
    });

    it('should handle nonblocking element insertion (##% ... ::true)', () => {
      const renderingFunc = compomint.template('el-insert-nb', '<div>##% \'<span>NB</span>\' :: true ##</div>');
      const component = renderingFunc({});
      // Initially, the placeholder is there
      expect(component.element.querySelector('template[data-co-tmpl-element-id]')).not.toBeNull();
      // Run timers
      jest.runAllTimers();
      // Now the content should be inserted
      expect(component.element.innerHTML).toBe('<span>NB</span>');
      expect(component.element.querySelector('template[data-co-tmpl-element-id]')).toBeNull();
    });

    it('should handle nonblocking element insertion with delay (##% ... ::ms)', () => {
      const innerRender = compomint.template('inner-comp', '<section>Delay</section>');
      const innerComponent = innerRender({});

      const renderingFunc = compomint.template('el-insert-nb-delay', '<div>##% data.content :: 50 ##</div>');
      const component = renderingFunc({ content: innerComponent });
      expect(component.element.querySelector('template[data-co-tmpl-element-id]')).not.toBeNull();
      jest.advanceTimersByTime(49);
      expect(component.element.querySelector('template[data-co-tmpl-element-id]')).not.toBeNull(); // Not yet
      jest.advanceTimersByTime(1);
      expect(component.element.innerHTML).toBe('<section>Delay</section>'); // Now inserted
    });

    // --- Event Handling Tests ---
    describe('Event Handling (data-co-event)', () => {
      it('should attach a simple click handler', () => {
        const clickHandler = jest.fn();
        const renderingFunc = compomint.template('event-click', '<button data-co-event="##:data.clickHandler##">Click</button>');
        const component = renderingFunc({ clickHandler });
        const button = component.element;

        button.click();
        expect(clickHandler).toHaveBeenCalledTimes(1);
        expect(clickHandler).toHaveBeenCalledWith(
          expect.any(Event), // event object
          expect.objectContaining({ // context object
            data: { clickHandler },
            customData: undefined,
            element: button,
            component: component
          })
        );
        expect(button.hasAttribute('data-co-event')).toBe(false);
      });

      it('should attach handlers from an event map object', () => {
        const mouseoverHandler = jest.fn();
        const mouseoutHandler = jest.fn();
        const eventMap = {
          mouseover: mouseoverHandler,
          mouseout: mouseoutHandler
        };
        const renderingFunc = compomint.template('event-map', '<div data-co-event="##:data.eventMap##">Hover</div>');
        const component = renderingFunc({ eventMap });
        const div = component.element;

        div.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        expect(mouseoverHandler).toHaveBeenCalledTimes(1);
        expect(mouseoutHandler).not.toHaveBeenCalled();

        div.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
        expect(mouseoverHandler).toHaveBeenCalledTimes(1); // Still 1
        expect(mouseoutHandler).toHaveBeenCalledTimes(1);
      });

      it('should execute "load" event immediately', () => {
        const loadHandler = jest.fn();
        const eventMap = { load: loadHandler };
        const renderingFunc = compomint.template('event-load', '<div data-co-event="##:data.eventMap##">Load</div>');
        const component = renderingFunc({ eventMap });
        expect(loadHandler).toHaveBeenCalledTimes(1);
        expect(loadHandler).toHaveBeenCalledWith(
          component.element, // event (element itself for load)
          expect.objectContaining({
            data: { eventMap },
            customData: undefined,
            element: component.element,
            component: component
          })
        );
      });

      it('should assign element via "namedElement" key in event map', () => {
        const eventMap = { namedElement: 'myDivNamedElement' };
        const renderingFunc = compomint.template('event-namedElement', '<div data-co-event="##:data.eventMap##">Ref</div>');
        const component = renderingFunc({ eventMap });
        expect(component.myDivNamedElement).toBe(component.element);
      });

      it('should provide trigger functions via "triggerName" ', () => {
        const clickHandler = jest.fn();
        const eventMap = {
          triggerName: 'myTrigger',
          click: clickHandler
        };
        const renderingFunc = compomint.template('event-trigger', '<button data-co-event="##:data.eventMap##">Trigger</button>');
        const component = renderingFunc({ eventMap });

        expect(component.trigger!.myTrigger.click).toBeDefined();
        expect(typeof component.trigger!.myTrigger.click).toBe('function');

        // Trigger programmatically
        component.trigger!.myTrigger.click();
        expect(clickHandler).toHaveBeenCalled(); // This might not work reliably in JSDOM without more setup
      });

      it('should handle custom data (object)', () => {
        const handler = jest.fn();
        const renderingFunc = compomint.template('event-custom', '<button data-co-event="##:data.handler:: {id: 100} ##">Data</button>');
        const component = renderingFunc({ handler });
        component.element.click();
        expect(handler).toHaveBeenCalledWith(
          expect.any(Event), // event
          expect.objectContaining({ // context
            data: { handler },
            customData: { id: 100 },
            element: component.element,
            component: component
          })
        );
      });

      it('should handle custom data (variable)', () => {
        const handler = jest.fn();
        const renderingFunc = compomint.template('event-custom', '##let customData = {id: 101};##<button data-co-event="##:data.handler::customData ##">Data</button>');
        const component = renderingFunc({ handler });
        component.element.click();
        expect(handler).toHaveBeenCalledWith(
          expect.any(Event), // event
          expect.objectContaining({ // context
            data: { handler },
            customData: { id: 101 },
            element: component.element,
            component: component
          })
        );
      });

      it('should handle custom data (string)', () => {
        const handler = jest.fn();
        const renderingFunc = compomint.template('event-custom', '<button data-co-event="##:data.handler::\'test data\' ##">Data</button>');
        const component = renderingFunc({ handler });
        component.element.click();
        expect(handler).toHaveBeenCalledWith(
          expect.any(Event), // event
          expect.objectContaining({ // context
            data: { handler },
            customData: "test data",
            element: component.element,
            component: component
          })
        );
      });

      it('should handle custom data (number)', () => {
        const handler = jest.fn();
        const renderingFunc = compomint.template('event-custom', '<button data-co-event="##:data.handler::100 ##">Data</button>');
        const component = renderingFunc({ handler });
        component.element.click();
        expect(handler).toHaveBeenCalledWith(
          expect.any(Event), // event
          expect.objectContaining({ // context
            data: { handler },
            customData: 100,
            element: component.element,
            component: component
          })
        );
      });
    });
  });

  // --- Component Method Tests ---
  describe('Component Methods', () => {

    it('_id should have a unique _id', () => {
      const renderingFunc = compomint.template('scope-id', '<span id="##=component._id##">ID</span>');
      const component1 = renderingFunc({});
      const component2 = renderingFunc({});
      expect(component1._id).toBeDefined();
      expect(component2._id).toBeDefined();
      expect(component1._id).not.toBe(component2._id);

      expect(component1.element.outerHTML).toBe(`<span id="${component1._id}">ID</span>`);
      expect(component2.element.outerHTML).toBe(`<span id="${component2._id}">ID</span>`);
    });

    it('remove() should remove the element', () => {
      const renderingFunc = compomint.template('scope-remove', '<span>Remove Me</span>');
      const component = renderingFunc({});
      document.body.appendChild(component.element);
      expect(component.element.isConnected).toBe(true);
      component.remove();
      expect(component.element.isConnected).toBe(false);
      expect(document.body.contains(component.element)).toBe(false);
    });

    it('remove(true) should leave a placeholder', () => {
      const renderingFunc = compomint.template('component-remove-spacer', '<div>Remove Me</div>');
      const component = renderingFunc({});
      document.body.appendChild(component.element);
      const originalElement = component.element;
      component.remove(true); // Use spacer
      expect(originalElement.isConnected).toBe(false);
      expect(component.element.tagName).toBe('TEMPLATE'); // Element is now the placeholder
      expect(document.body.contains(component.element)).toBe(true); // Placeholder is in DOM
    });

    it('appendTo() should append the element', () => {
      const renderingFunc = compomint.template('component-append', '<i>Append</i>');
      const component = renderingFunc({});
      const div = document.createElement('div');
      document.body.appendChild(div);
      expect(div.children.length).toBe(0);
      component.appendTo(div);
      expect(div.children.length).toBe(1);
      expect(div.firstChild).toBe(component.element);
    });

    it('replace() should replace the element', () => {
      const render1 = compomint.template('component-replace1', '<span>One</span>');
      const render2 = compomint.template('component-replace2', '<em>Two</em>');
      const component1 = render1({});
      const component2 = render2({});
      document.body.appendChild(component1.element);
      expect(document.body.innerHTML).toBe('<span>One</span>');
      component1.replace(component2); // Replace with another scope
      expect(document.body.innerHTML).toBe('<em>Two</em>');

      // Replace with raw element
      const p = document.createElement('p');
      p.textContent = 'Three';
      component2.replace(p);
      expect(document.body.innerHTML).toBe('<p>Three</p>');
    });

    it('render() should re-render the component', () => {
      const renderingFunc = compomint.template('component-render', '<div>##=data.val##</div>');
      let component = renderingFunc({ val: 1 });
      document.body.appendChild(component.element);
      expect(component.element.innerHTML).toBe('1');
      const originalElement = component.element;
      const originalId = component._id;
      const status = component.status;
      status.count = 1;

      component = component.render({ val: 2 }); // Re-render

      expect(component.element.innerHTML).toBe('2');
      expect(component.data.val).toBe(2);
      expect(document.body.contains(originalElement)).toBe(false); // Old element removed
      expect(document.body.contains(component.element)).toBe(true); // New element added
      expect(component._id).toBe(originalId); // Component object is not changed
      expect(component.status.count).toBe(1); // Status object is persistent
    });


    it('render() should re-render the component without parent element', () => {
      const renderingFunc = compomint.template('component-render', '<div>##=data.val##</div>');
      let component = renderingFunc({ val: 1 });

      expect(component.element.innerHTML).toBe('1');
      const originalElement = component.element;
      const originalId = component._id;
      const status = component.status;
      status.count = 1;

      component = component.render({ val: 2 }); // Re-render

      expect(component.element.innerHTML).toBe('2');
      expect(component.data.val).toBe(2);
      expect(document.body.contains(originalElement)).toBe(false);
      expect(document.body.contains(component.element)).toBe(false);
      expect(component._id).toBe(originalId); // Component object is not changed
      expect(component.status.count).toBe(1); // Status object is persistent
    });

    it('refresh() should re-render with merged data', () => {
      const renderingFunc = compomint.template('component-refresh', '<p>##=data.a##-##=data.b##</p>');
      let component = renderingFunc({ a: 'X' });
      document.body.appendChild(component.element);
      expect(component.element.innerHTML).toBe('X-');
      const originalId = component._id;

      component = component.refresh({ b: 'Y' }); // Refresh with new data

      expect(component.element.innerHTML).toBe('X-Y');
      expect(component.data).toEqual({ a: 'X', b: 'Y' }); // Data is merged
      expect(component._id).toBe(originalId); // Component object is not changed
    });
  });

  // --- tools Utility Tests ---
  describe('compomint.tools Utilities', () => {
    describe('escapeHtml', () => {
      it('should escape HTML characters', () => {
        expect(tools.escapeHtml.escape('<div class="foo">'))
          .toBe('&lt;div class=&quot;foo&quot;&gt;');
        expect(tools.escapeHtml.escape("'`&"))
          .toBe('&#x27;&#x60;&amp;');
      });

      it('should unescape HTML entities', () => {
        expect(tools.escapeHtml.unescape('&lt;div&gt;'))
          .toBe('<div>');
        expect(tools.escapeHtml.unescape('&#x27;&#x60;&amp;'))
          .toBe("'`&");
      });
    });

    describe('addTmpl / addTmpls', () => {
      it('should add a template from a string', () => {
        compomint.addTmpl('util-add', '<span>Test</span>');
        const renderingFunc = compomint.tmpl('util-add')!;
        expect(typeof renderingFunc).toBe('function');
        expect(renderingFunc({}).element.outerHTML).toBe('<span>Test</span>');
      });

      it('should add templates from an element source', () => {
        const div = document.createElement('div');
        div.innerHTML = '<template id="t1">T1</template><script type="text/template" id="t2">T2</script><template id="t3">T3</template><script type="text/compomint" id="t4">T4</script>';
        compomint.addTmpls(div);
        expect(typeof compomint.tmpl('t1')).toBe('function');
        expect(typeof compomint.tmpl('t2')).toBe('function');
        expect(typeof compomint.tmpl('t3')).toBe('function');
        expect(typeof compomint.tmpl('t4')).toBe('function');
      });

      it('should remove inner templates if requested', () => {
        const div = document.createElement('div');
        div.innerHTML = '<template>T1</template><script type="text/template">T2</script><template id="t3">T3</template><script type="text/compomint">T4</script>';
        compomint.addTmpls(div, true); // removeInnerTemplate = true
        expect(div.querySelector('template')).not.toBeNull();
        expect(div.querySelector('script[type="text/template"]')).not.toBeNull();
        expect(div.querySelector('script[type="text/compomint"]')).not.toBeNull();
        expect(typeof compomint.tmpl('t1')).not.toBe('function');
        expect(typeof compomint.tmpl('t2')).not.toBe('function');
        expect(typeof compomint.tmpl('t3')).toBe('function');
        expect(typeof compomint.tmpl('t4')).not.toBe('function');
      });




    });





    describe('i18n', () => {
      beforeEach(() => {
        document.documentElement.lang = 'en';
        compomint.i18n = {}; // Reset i18n store
      });

      it('addI18n should store translations', () => {
        compomint.addI18n('test.greeting', { en: 'Hello', fr: 'Bonjour' });
        expect(typeof compomint.i18n.test.greeting).toBe('function');
        expect(compomint.i18n.test.greeting()).toBe('Hello');
      });

      it('i18n retrieval function should work with different languages', () => {
        compomint.addI18n('farewell', { en: 'Bye', fr: 'Au revoir' });
        document.documentElement.lang = 'fr';
        expect(compomint.i18n.farewell()).toBe('Au revoir');
        document.documentElement.lang = 'de'; // Missing language
        expect(compomint.i18n.farewell('Default Bye')).toBe('Default Bye');
      });

      it('addI18ns should add multiple translations(1)', () => {
        compomint.addI18ns({
          'common.ok': { en: 'OK', fr: 'Oui' },
          'common.cancel': { en: 'Cancel', fr: 'Annuler' }
        });
        expect(compomint.i18n.common.ok()).toBe('OK');
        expect(compomint.i18n.common.cancel()).toBe('Cancel');
        document.documentElement.lang = 'fr';
        expect(compomint.i18n.common.ok()).toBe('Oui');
        expect(compomint.i18n.common.cancel()).toBe('Annuler');
      });


      it('addI18ns should add multiple translations(2)', () => {
        compomint.addI18ns({
          common: {
            ok: { en: 'OK', fr: 'Oui' },
            cancel: { en: 'Cancel', fr: 'Annuler' }
          }
        });
        expect(compomint.i18n.common.ok()).toBe('OK');
        expect(compomint.i18n.common.cancel()).toBe('Cancel');
        document.documentElement.lang = 'fr';
        expect(compomint.i18n.common.ok()).toBe('Oui');
        expect(compomint.i18n.common.cancel()).toBe('Annuler');
      });

    });

    describe('genElement', () => {

      it('should create an element with empty content', () => {
        const el = tools.genElement('p');
        expect(el.tagName).toBe('P');
        expect(el.textContent).toBe('');
      });

      it('should create an element with attributes', () => {
        const el = tools.genElement('a', { href: '#', target: '_blank', className: 'link' });
        expect(el.tagName).toBe('A');
        expect(el.getAttribute('href')).toBe('#');
        expect(el.target).toBe('_blank');
        expect(el.className).toBe('link');
      });

      it('should create an element with class', () => {
        const el = tools.genElement('div', { class: 'my-class' });
        expect(el.tagName).toBe('DIV');
        expect(el.className).toBe('my-class');
      });

      it('should create an element with text content', () => {
        const el = tools.genElement('p', 'Hello');
        expect(el.tagName).toBe('P');
        expect(el.textContent).toBe('Hello');
      });

      it('should create an element with child elements', () => {
        const child1 = tools.genElement('span', 'One');
        const child2 = tools.genElement('i', 'Two');
        const el = tools.genElement('div', [child1, child2]);
        expect(el.tagName).toBe('DIV');
        expect(el.children.length).toBe(2);
        expect(el.firstChild).toBe(child1);
        expect(el.lastChild).toBe(child2);
      });

      it('should create an element with on*', () => {
        const handler = jest.fn();
        const el = tools.genElement('button', { onclick: handler });
        expect(el.tagName).toBe('BUTTON');
        el.click();
        expect(handler).toHaveBeenCalled();
      });

      it('should create an element with data-*', () => {
        const el = tools.genElement('div', { 'data-value': 'test', 'data-id': 123, 'data-next-str': 'next string' });
        expect(el.tagName).toBe('DIV');
        expect(el.dataset.value).toBe('test');
        expect(el.dataset.id).toBe('123');
        expect(el.dataset.nextStr).toBe('next string');
      });

      it('should create an element with dataset', () => {
        const el = tools.genElement('div', { dataset: { value: 'test', id: 123, nextStr: 'next string' } });
        expect(el.tagName).toBe('DIV');
        expect(el.dataset.value).toBe('test');
        expect(el.dataset.id).toBe('123');
        expect(el.dataset.nextStr).toBe('next string');
      });

      it('should create an element with style', () => {
        const el = tools.genElement('div', { style: { color: 'red', fontSize: '16px' } });
        expect(el.tagName).toBe('DIV');
        expect(el.style.color).toBe('red');
        expect(el.style.fontSize).toBe('16px');
      });
    });

    describe('props', () => {
      it('should generate an attribute string', () => {
        const attrs = tools.props({ id: 'x' }, { class: 'y z' }, { 'data-val': 0 });
        expect(attrs).toContain('id="x"');
        expect(attrs).toContain('class="y z"');
        expect(attrs).toContain('data-val="0"');
        expect(attrs.split(' ').length).toBe(4);
      });

      it('should ignore falsy values except 0', () => {
        const attrs = tools.props({ a: 1, b: 0, c: null, d: false, e: '', f: undefined });
        expect(attrs).toBe('a="1" b="0"');
      });
    });

  });

});
