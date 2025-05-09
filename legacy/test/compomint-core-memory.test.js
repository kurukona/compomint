/**
 * @jest-environment jsdom
 */

import { compomint, tmpl } from '../src/compomint-core';

describe('Compomint Core - Memory Leak Prevention', () => {
  let tools;
  let configs;

  beforeAll(() => {
    tools = compomint.tools;
    configs = compomint.configs;
    if (!compomint) {
      throw new Error("Compomint library not loaded correctly into JSDOM environment.");
    }
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';

    compomint.tmplCache.clear();
    compomint.tmplCache.set("anonymous", { elements: new Set() }); // As in original setup
    for (const key in tmpl) {
      delete tmpl[key];
    }
    compomint.i18n = {};
    configs.debug = false;
    configs.throwError = true;
  });

  it('component.release() should remove custom properties and data to aid GC', () => {
    const renderingFunc = compomint.template('mem-release', '<div>##=data.message##</div>');
    const largeObject = new Array(1000).fill('large data');
    const component = renderingFunc({ message: 'Test', largeData: largeObject });

    // Add some custom properties
    component.customProp = 'custom value';
    component.status.customStatus = 'active';

    expect(component.data.message).toBe('Test');
    expect(component.data.largeData).toBe(largeObject);
    expect(component.customProp).toBe('custom value');
    expect(component.status.customStatus).toBe('active');
    expect(component.element).toBeDefined();

    component.release();

    // Essential properties that should remain (or be handled by their own lifecycle)
    expect(component._id).toBeDefined(); // _id is usually kept
    expect(component.status).toBeDefined(); // status object itself is kept
    expect(component.status.customStatus).toBe('active'); // properties within status are kept

    // Properties that should be removed by release()
    // Based on current release implementation:
    expect(component.data).toBeUndefined();
    expect(component.customProp).toBeUndefined();
    expect(component.element).toBeUndefined(); // element reference should be cleared
    expect(component.tmplId).toBeUndefined();
    expect(component.wrapperElement).toBeUndefined();
    expect(component.parentComponent).toBeUndefined();

    // Check methods are still there (release doesn't remove functions)
    expect(typeof component.render).toBe('function');
    expect(typeof component.remove).toBe('function');
    expect(typeof component.release).toBe('function');
  });

  it('repeatedly creating and removing components should not leave DOM elements', () => {
    const renderingFunc = compomint.template('mem-dom-cycle', '<span>Item ##=data.id##</span>');
    const components = [];

    for (let i = 0; i < 100; i++) {
      const component = renderingFunc({ id: i });
      document.body.appendChild(component.element);
      components.push(component);
    }

    expect(document.body.children.length).toBe(100);

    components.forEach(comp => {
      const el = comp.element;
      comp.remove();
      expect(el.isConnected).toBe(false); // Element should be disconnected
      comp.release(); // Help GC
    });

    expect(document.body.children.length).toBe(0);
    expect(document.body.innerHTML).toBe('');
  });

  it('removing a component with event listeners should allow element GC (indirect test) (1)', () => {
    const clickHandler = jest.fn();
    const renderingFunc = compomint.template('mem-event', '<button data-co-event="##:data.handler##">Click</button>');
    const component = renderingFunc({ handler: clickHandler });
    document.body.appendChild(component.element);

    const buttonElement = component.element;
    buttonElement.click();
    expect(clickHandler).toHaveBeenCalledTimes(1);

    component.remove();
    expect(buttonElement.isConnected).toBe(false);

    // At this point, if compomint correctly removed listeners (or the element is GC'd),
    // there should be no lingering references preventing GC of the handler or element.
    // We can't directly test GC in Jest, but we ensure disconnection.

    // Try to re-trigger (though element is removed, this is more for conceptual validation)
    // This won't actually call the handler as it's detached.
    buttonElement.click();
    expect(clickHandler).toHaveBeenCalledTimes(1); // Should not have incremented

    component.release();
  });

  it('removing a component with event listeners should allow element GC (indirect test) (2)', () => {
    const clickHandler = jest.fn();
    const renderingFunc = compomint.template('mem-event', '<button data-co-event="##:{click: data.handler}##">Click</button>');
    const component = renderingFunc({ handler: clickHandler });
    document.body.appendChild(component.element);

    const buttonElement = component.element;

    buttonElement.click();
    expect(clickHandler).toHaveBeenCalledTimes(1);

    component.remove();
    expect(buttonElement.isConnected).toBe(false);

    buttonElement.click();
    expect(clickHandler).toHaveBeenCalledTimes(1); // Should not have incremented

    component.release();
  });


  it('tmplCache should not grow with component instances after they are released', () => {
    const initialCacheSize = compomint.tmplCache.size;
    compomint.template('mem-cache-test', '<div>Cache Test</div>');
    expect(compomint.tmplCache.has('mem-cache-test')).toBe(true);
    const templateCacheSize = compomint.tmplCache.size;

    const components = [];
    for (let i = 0; i < 10; i++) {
      const component = compomint.tmpl('mem-cache-test')({});
      components.push(component);
      // Simulate adding to DOM and removing if necessary for other tests
      document.body.appendChild(component.element);
    }

    components.forEach(comp => {
      comp.remove();
      comp.release();
    });

    // The tmplCache stores the compiled template *definition*, not instances.
    // So, its size should remain based on defined templates, not instances.
    expect(compomint.tmplCache.size).toBe(templateCacheSize);
    expect(compomint.tmplCache.has('mem-cache-test')).toBe(true); // Definition still there

    // Clean up the defined template for subsequent tests if needed
    compomint.tmplCache.delete('mem-cache-test');
    expect(compomint.tmplCache.size).toBe(initialCacheSize);
  });

  it('component.remove(true) with spacer should allow placeholder to be GCd after full removal', () => {
    const renderingFunc = compomint.template('mem-spacer', '<div>Spacer Test</div>');
    const component = renderingFunc({});
    document.body.appendChild(component.element);

    component.remove(true); // Remove with spacer
    const spacerElement = component.element; // component.element is now the spacer

    expect(spacerElement.tagName).toBe('TEMPLATE');
    expect(spacerElement.isConnected).toBe(true);
    expect(document.body.contains(spacerElement)).toBe(true);

    // Now fully remove the spacer
    spacerElement.remove(); // This is a standard DOM remove on the spacer
    expect(spacerElement.isConnected).toBe(false);
    expect(document.body.innerHTML).toBe('');

    component.release(); // Release the original component scope
  });
});