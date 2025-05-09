// 1. Template Syntax Tests
function runTemplateTests(compomint) {
  CompomintTest.describe('Template Syntax Tests', function () {
    // Basic text template test
    CompomintTest.it('should render basic text template', function () {
      // Create test template
      compomint.addTmpl('test-basic', 'Hello, World!');
      const tmpl = compomint.tmpl('test-basic');
      const result = tmpl({});

      CompomintTest.assertTrue(result.element instanceof Node, 'Rendered result should be a node');
      CompomintTest.assertEquals(result.element.textContent, 'Hello, World!', 'Template content should be correctly rendered');
    });

    // Data binding test (##=data##)
    CompomintTest.it('should support data binding', function () {
      compomint.addTmpl('test-binding', 'Hello, ##=data.name##!');
      const tmpl = compomint.tmpl('test-binding');
      const result = tmpl({ name: 'Compomint' });

      CompomintTest.assertEquals(result.element.textContent, 'Hello, Compomint!', 'Data should be correctly bound');
    });

    // Conditional test (##if...##)
    CompomintTest.it('should support conditionals', function () {
      compomint.addTmpl('test-conditional', '##if(data.show){##Visible##}else{##Hidden##}##');
      const tmpl = compomint.tmpl('test-conditional');

      const visibleResult = tmpl({ show: true });
      CompomintTest.assertEquals(visibleResult.element.textContent, 'Visible', 'Should show correct content when condition is true');

      const hiddenResult = tmpl({ show: false });
      CompomintTest.assertEquals(hiddenResult.element.textContent, 'Hidden', 'Should show correct content when condition is false');
    });

    // Loop test
    CompomintTest.it('should support loops', function () {
      compomint.addTmpl('test-loop', '##for(let i=0; i<data.items.length; i++){##Item: ##=data.items[i]####if(i < data.items.length-1){##, ##}####}##');
      const tmpl = compomint.tmpl('test-loop');
      const result = tmpl({ items: ['A', 'B', 'C'] });

      CompomintTest.assertEquals(result.element.textContent, 'Item: A, Item: B, Item: C', 'Loop should work correctly');
    });

    // Element insertion test (##%)
    CompomintTest.it('should support element insertion', function () {
      const element = document.createElement('span');
      element.textContent = 'Injected Element';

      // Fixing the template by wrapping in a div
      compomint.addTmpl('test-element-insertion', '<div>Before ##%data.element## After</div>');
      const tmpl = compomint.tmpl('test-element-insertion');
      const result = tmpl({ element: element });

      CompomintTest.assertTrue(result.element.contains(element), 'Inserted element should be included in the result');
      CompomintTest.assertContains(result.element.textContent, 'Before Injected Element After', 'Content of the inserted element should be included');
    });

    // Escape test (##-)
    CompomintTest.it('should support HTML escaping', function () {
      compomint.addTmpl('test-escape', '##-data.html##');
      const tmpl = compomint.tmpl('test-escape');
      const result = tmpl({ html: '<div>Test</div>' });

      CompomintTest.assertEquals(result.element.textContent, '<div>Test</div>', 'HTML should be escaped');
      CompomintTest.assertTrue(!result.element.querySelector('div'), 'HTML should not be rendered');
    });

    // Evaluation test (###)
    CompomintTest.it('should support lazy evaluation', function () {
      compomint.addTmpl('test-lazy-eval', '<div>###data.counter++##</div>');
      const data = { counter: 0 };
      const tmpl = compomint.tmpl('test-lazy-eval');
      const result = tmpl(data);

      CompomintTest.assertEquals(data.counter, 1, 'Lazy evaluation should be executed');
    });
  });
}
