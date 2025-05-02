// 2. HTML Element Tests
function runHtmlElementTests() {
  CompomintTest.describe('HTML Element Tests', function () {
    // Basic element creation test
    CompomintTest.it('should create HTML elements', function () {
      compomint.addTmpl('test-html-element', '<div id="test-div" class="test-class">Test Content</div>');
      const tmpl = compomint.tmpl('test-html-element');
      const result = tmpl({});

      CompomintTest.assertElement(result.element, 'div', 'Correct tag should be created');
      CompomintTest.assertHasAttribute(result.element, 'id', 'test-div', 'Correct id should be set');
      CompomintTest.assertHasAttribute(result.element, 'class', 'test-class', 'Correct class should be set');
      CompomintTest.assertEquals(result.element.textContent, 'Test Content', 'Correct content should be set');
    });

    // Nested elements test
    CompomintTest.it('should create nested HTML elements', function () {
      compomint.addTmpl('test-nested-element', '<div><span>Child 1</span><p>Child 2</p></div>');
      const tmpl = compomint.tmpl('test-nested-element');
      const result = tmpl({});

      CompomintTest.assertElement(result.element, 'div', 'Correct parent tag should be created');
      CompomintTest.assertEquals(result.element.children.length, 2, 'Correct number of child elements should be present');
      CompomintTest.assertElement(result.element.children[0], 'span', 'First child element should be correctly created');
      CompomintTest.assertElement(result.element.children[1], 'p', 'Second child element should be correctly created');
    });

    // Data-bound attributes test
    CompomintTest.it('should support data-bound attributes', function () {
      compomint.addTmpl('test-attr-binding', '<div id="##=data.id##" class="##=data.className##">##=data.content##</div>');
      const tmpl = compomint.tmpl('test-attr-binding');
      const result = tmpl({ id: 'dynamic-id', className: 'dynamic-class', content: 'Dynamic Content' });

      CompomintTest.assertElement(result.element, 'div', 'Correct tag should be created');
      CompomintTest.assertHasAttribute(result.element, 'id', 'dynamic-id', 'Data-bound id should be set');
      CompomintTest.assertHasAttribute(result.element, 'class', 'dynamic-class', 'Data-bound class should be set');
      CompomintTest.assertEquals(result.element.textContent, 'Dynamic Content', 'Data-bound content should be set');
    });

    // Event binding test
    CompomintTest.it('should support event binding', function () {
      let clicked = false;

      compomint.addTmpl('test-event-binding', '<button data-co-event="##:{click: function() { data.clicked = true; }}##">Click me</button>');
      const tmpl = compomint.tmpl('test-event-binding');
      const result = tmpl({ clicked: false });

      CompomintTest.assertElement(result.element, 'button', 'Correct button element should be created');

      // Trigger event
      result.element.click();

      CompomintTest.assertTrue(result.data.clicked, 'Event handler should be called');
    });

    // named-element test
    CompomintTest.it('should support element references via named-element', function () {
      compomint.addTmpl('test-named-element', '<div data-co-named-element="##:\'targetElement\'##">Target</div>');
      const tmpl = compomint.tmpl('test-named-element');
      const result = tmpl({});

      CompomintTest.assertTrue(result.targetElement instanceof Element, 'Should be able to access element through scope');
      CompomintTest.assertElement(result.targetElement, 'div', 'Referenced element should have correct tag');
      CompomintTest.assertEquals(result.targetElement.textContent, 'Target', 'Referenced element content should be correctly set');
    });

    // data-co-element-ref test
    CompomintTest.it('should reference elements using data-co-element-ref', function () {
      compomint.addTmpl('test-bridge-element-ref', `
        ##component.changeText = function(text) { myElement.textContent = text; }##
        <div data-co-element-ref="##:myElement##">Variable Element</div>`);
      const tmpl = compomint.tmpl('test-bridge-element-ref');
      const result = tmpl({});

      CompomintTest.assertEquals(result.element.textContent, 'Variable Element', 'Referenced element content should be correctly set');

      // Test updating element through function call
      result.changeText('Updated Content');
      CompomintTest.assertEquals(result.element.textContent, 'Updated Content', 'Should be able to update element through data-co-element-ref');
    });

    // Template rendering and update test
    CompomintTest.it('should be able to update templates', function () {
      compomint.addTmpl('test-update', '<div>##=data.counter##</div>');
      const tmpl = compomint.tmpl('test-update');
      const result = tmpl({ counter: 1 });

      CompomintTest.assertEquals(result.element.textContent, '1', 'Initial rendering should be correct');

      // Update template data
      result.render({ counter: 2 });

      CompomintTest.assertEquals(result.element.textContent, '2', 'Template data should be updated');
    });
    /*
        // Template rendering and update test
        CompomintTest.it('should be able to update templates', function () {
          compomint.addTmpl('test-error', '<div>##=data.throw.error##</div>');
          const tmpl = compomint.tmpl('test-error');
          let result = null;
          try {
            result = tmpl({ counter: 1 });
          } catch (e) {
            CompomintTest.assertEquals(result.element.textContent, '2', 'Template data should be updated');
          }
        });
    */
  });
}
