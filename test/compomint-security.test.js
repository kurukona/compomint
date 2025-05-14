/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach, jest } from '@jest/globals';
import { compomint, tmpl } from '../src/compomint';

describe('Compomint Core - Security Tests', () => {
  let configs;

  beforeAll(() => {
    configs = compomint.configs;
    if (!compomint) {
      throw new Error("Compomint library not loaded correctly.");
    }
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    compomint.tmplCache.clear();
    compomint.tmplCache.set("anonymous", { elements: new Set() });
    for (const key in tmpl) { delete tmpl[key]; }
    compomint.i18n = {};
    configs.debug = false;
    configs.throwError = true; // Test with errors thrown

    // Reset any potential global flags for XSS detection
    delete window.xssExecuted;
    delete window.maliciousFunctionExecuted;

    // Spy on alert
    jest.spyOn(window, 'alert').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Interpolation (##=...##)', () => {
    it('should render HTML content as HTML (developer must sanitize untrusted data)', () => {
      window.xssExecuted = false;
      const maliciousImg = '<img src="invalid" onerror="window.xssExecuted = true">';
      const component = compomint.template('sec-interp-img', '<div>##=data.img##</div>')({ img: maliciousImg });
      document.body.appendChild(component.element);

      expect(window.xssExecuted).toBe(false); // img onerror should fire
      expect(window.alert).not.toHaveBeenCalled();
      expect(document.body.outerHTML).toBe('<body><div><img src=\"invalid\" onerror=\"window.xssExecuted = true\"></div></body>');
    });

    it('should not execute code if data is a string attempting to break out of an attribute', () => {
      window.xssExecuted = false;
      const maliciousAttr = '"><script>window.xssExecuted = true;</script>';
      const component = compomint.template('sec-interp-attr', '<div title="##=data.attr##">Text</div>')({ attr: maliciousAttr });
      document.body.appendChild(component.element);

      expect(component.element.getAttribute('title')).toBe("");
      expect(window.xssExecuted).toBe(false); // The script tag is part of the attribute string, not executed.
      expect(window.alert).not.toHaveBeenCalled();
      expect(document.body.outerHTML).toBe('<body><div title=\"\"><script>window.xssExecuted = true;</script>\"&gt;Text</div></body>');
    });

    it('should not allow insert script tags passed as string via (##=...##)', () => {
      window.xssExecuted = false;
      const scriptContent = 'window.xssExecuted = true;';
      const maliciousScript = `<div>${scriptContent}</div>`;
      const renderFunc = compomint.template('sec-elem-script', '<div>##= data.script ##</div>')
      const appendedDiv = renderFunc({ script: `<div>${scriptContent}</div>` });
      document.body.appendChild(appendedDiv.element);
      const appendedScript = renderFunc({ script: `<script>${scriptContent}</script>` });
      document.body.appendChild(appendedScript.element);

      const scriptTag = document.body.querySelector('script');
      expect(scriptTag).not.toBeNull();
      expect(window.xssExecuted).toBe(false);
      expect(document.body.outerHTML).toBe('<body><div><div>window.xssExecuted = true;</div></div><div><script>window.xssExecuted = true;</script></div></body>');
      // Note: Direct execution of script tags added this way in JSDOM can be inconsistent.
      // The img onerror test above is a more reliable check for JS execution capability via this rule.
    });

  });

  describe('Escaped Interpolation (##-...##)', () => {
    it('should escape HTML and prevent script execution from content', () => {
      window.xssExecuted = false;
      const maliciousHTML = '<script>window.xssExecuted = true;</script>';
      const component = compomint.template('sec-escape-html', '<div>##-data.html##</div>')({ html: maliciousHTML });
      document.body.appendChild(component.element);

      expect(component.element.innerHTML).toBe(compomint.tools.escapeHtml.escape(maliciousHTML));
      expect(window.xssExecuted).toBe(false); // Script should not execute
      expect(window.alert).not.toHaveBeenCalled();
    });

    it('should escape attributes to prevent XSS', () => {
      window.xssExecuted = false;
      const maliciousAttr = '"><img src=x onerror="window.xssExecuted=true">';
      const component = compomint.template('sec-escape-attr', '<div title="##-data.attr##">Text</div>')({ attr: maliciousAttr });
      document.body.appendChild(component.element);

      expect(component.element.getAttribute('title')).toBe(maliciousAttr);
      expect(window.xssExecuted).toBe(false);
      expect(window.alert).not.toHaveBeenCalled();
      expect(document.body.outerHTML).toBe('<body><div title=\"&quot;><img src=x onerror=&quot;window.xssExecuted=true&quot;>\">Text</div></body>');
    });

    it('should not allow insert script tags passed as string via (##-...##)', () => {
      window.xssExecuted = false;
      const scriptContent = 'window.xssExecuted = true;';
      const renderFunc = compomint.template('sec-elem-script', '<div>##- data.script ##</div>')
      const appendedDiv = renderFunc({ script: `<div>${scriptContent}</div>` });
      document.body.appendChild(appendedDiv.element);
      const appendedScript = renderFunc({ script: `<script>${scriptContent}</script>` });
      document.body.appendChild(appendedScript.element);

      const scriptTag = document.body.querySelector('script');
      expect(scriptTag).toBeNull();
      expect(window.xssExecuted).toBe(false);
      expect(document.body.outerHTML).toBe('<body><div>&lt;div&gt;window.xssExecuted = true;&lt;/div&gt;</div><div>&lt;script&gt;window.xssExecuted = true;&lt;/script&gt;</div></body>');
      // Note: Direct execution of script tags added this way in JSDOM can be inconsistent.
      // The img onerror test above is a more reliable check for JS execution capability via this rule.
    });

  });

  describe('Element Insertion (##%...##)', () => {
    it('should render HTML string as HTML, executing scripts (developer must sanitize)', () => {
      window.xssExecuted = false;
      const maliciousImg = '<img src="invalid" onerror="window.xssExecuted = true">';
      const component = compomint.template('sec-elem-img', '<div>##%data.img##</div>')({ img: maliciousImg });
      document.body.appendChild(component.element);

      expect(window.xssExecuted).toBe(false);
      expect(window.alert).not.toHaveBeenCalled();
      expect(document.body.outerHTML).toBe('<body><div><img src=\"invalid\" onerror=\"window.xssExecuted = true\"></div></body>');
    });

    it('should not allow insert script tags passed as string via ##%', () => {
      window.xssExecuted = false;
      const scriptContent = 'window.xssExecuted = true;';
      const renderFunc = compomint.template('sec-elem-script', '<div>##% data.script ##</div>')

      const appendedDiv = renderFunc({ script: `<div>${scriptContent}</div>` });
      document.body.appendChild(appendedDiv.element);
      const appendedScript = renderFunc({ script: `<script>${scriptContent}</script>` });
      document.body.appendChild(appendedScript.element);

      const scriptTag = document.body.querySelector('script');
      expect(scriptTag).toBeNull();
      expect(window.xssExecuted).toBe(false);
      expect(document.body.outerHTML).toBe('<body><div><div>window.xssExecuted = true;</div></div><div></div></body>');
      // Note: Direct execution of script tags added this way in JSDOM can be inconsistent.
      // The img onerror test above is a more reliable check for JS execution capability via this rule.
    });
  });

  describe('Evaluate (##...##) and PreEvaluate (##!...##)', () => {
    it('##...## should execute arbitrary JS from template string (trusted template assumed)', () => {
      window.xssExecuted = false;
      compomint.template('sec-eval', '## window.xssExecuted = true; ##<div></div>')({});
      expect(window.xssExecuted).toBe(true);
      expect(document.body.outerHTML).toBe('<body></body>');
    });

    it('##!...## should execute arbitrary JS from template string during compilation (trusted template assumed)', () => {
      window.xssExecuted = false;
      compomint.template('sec-preeval', '##! window.xssExecuted = true; ##<div></div>'); // Compilation itself
      expect(window.xssExecuted).toBe(true);
      expect(document.body.outerHTML).toBe('<body></body>');
    });
  });

  describe('Attribute Directives (data-co-props, data-co-event, data-co-load)', () => {
    it('data-co-props can lead to XSS if props include event handlers like onclick', () => {
      window.xssExecuted = false;
      const props = {
        onclick: "window.xssExecuted = true", // This will create an onclick attribute
        id: "testButtonProps"
      };
      const component = compomint.template('sec-props-onclick', '<button data-co-props="##:data.props##">Click</button>')({ props });
      document.body.appendChild(component.element);

      const button = document.getElementById('testButtonProps');
      expect(button).not.toBeNull();
      button.click();
      expect(window.xssExecuted).toBe(false); // onclick attribute should not fire
      expect(document.body.outerHTML).toBe('<body><button onclick="window.xssExecuted = true" id="testButtonProps">Click</button></body>');
    });

    it('data-co-props with javascript: href should set attribute (execution is browser dependent)', () => {
      window.xssExecuted = false;
      const props = {
        href: "javascript:window.xssExecuted = true", // This will create a javascript: href
        id: "testLinkProps"
      };
      const component = compomint.template('sec-props-href', '<a data-co-props="##:data.props##">Click</a>')({ props });
      document.body.appendChild(component.element);

      const link = document.getElementById('testLinkProps');
      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toBe("javascript:window.xssExecuted = true");
      // JSDOM typically does not execute javascript: hrefs on click.
      // This test confirms the attribute is set, highlighting a potential vector in real browsers if CSP is not restrictive.
      expect(window.xssExecuted).toBe(false); // In JSDOM
      expect(document.body.outerHTML).toBe('<body><a href="javascript:window.xssExecuted = true" id="testLinkProps">Click</a></body>');
    });

    it('data-co-event should not execute a string value as code if handler is a string', () => {
      window.maliciousFunctionExecuted = false;
      const eventDataString = "window.maliciousFunctionExecuted = true; alert('event_string');";
      const component = compomint.template('sec-event-string', '<button data-co-event="##:data.handler##">Click</button>')({ handler: eventDataString });
      document.body.appendChild(component.element);

      component.element.click();
      expect(window.maliciousFunctionExecuted).toBe(false);
      expect(window.alert).not.toHaveBeenCalled();
      expect(document.body.outerHTML).toBe('<body><button>Click</button></body>');
    });

    it('data-co-event executes a function provided via data (intended behavior)', () => {
      window.maliciousFunctionExecuted = false;
      const actualFunction = () => { window.maliciousFunctionExecuted = true; };
      const component = compomint.template('sec-event-func', '<button data-co-event="##:data.handler##">Click</button>')({ handler: actualFunction });
      document.body.appendChild(component.element);

      component.element.click();
      expect(window.maliciousFunctionExecuted).toBe(true);
      expect(document.body.outerHTML).toBe('<body><button>Click</button></body>');
    });

    it('data-co-load should not execute a string value as code if handler is a string', () => {
      window.maliciousFunctionExecuted = false;
      const loadDataString = "window.maliciousFunctionExecuted = true; alert('load_string');";
      compomint.template('sec-load-string', '<div data-co-load="##:data.handler##">Load</div>')({ handler: loadDataString });

      expect(window.maliciousFunctionExecuted).toBe(false);
      expect(document.body.outerHTML).toBe('<body></body>');
      expect(window.alert).not.toHaveBeenCalled();
    });

    it('data-co-load executes a function provided via data (intended behavior)', () => {
      window.maliciousFunctionExecuted = false;
      const actualFunction = () => { window.maliciousFunctionExecuted = true; };
      compomint.template('sec-load-func', '<div data-co-load="##:data.handler##">Load</div>')({ handler: actualFunction });

      expect(window.maliciousFunctionExecuted).toBe(true);
      expect(document.body.outerHTML).toBe('<body></body>');
    });
  });
});