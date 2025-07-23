/**
 * @jest-environment node
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";

// We need to setup the SSR environment before importing compomint
import { setupSSREnvironment, Environment } from "../src/ssr";
import { createSSRRenderer } from "../src/ssr-renderer";

// Setup SSR environment before importing compomint
setupSSREnvironment();

import { compomint, tmpl } from "../src/compomint";

describe("Compomint SSR (Server-Side Rendering)", () => {
  beforeAll(() => {
    // Debug environment variables
    console.log("Debug Environment:");
    console.log("typeof window:", typeof window);
    console.log("typeof globalThis:", typeof globalThis);
    console.log("typeof process:", typeof process);
    console.log("process.versions?.node:", (process as any).versions?.node);
    console.log("Environment.isNode():", Environment.isNode());
    console.log("Environment.isServer():", Environment.isServer());
    console.log("Environment.isBrowser():", Environment.isBrowser());

    // Ensure we're in Node.js environment
    expect(Environment.isNode()).toBe(true);
    expect(Environment.isServer()).toBe(true);
    expect(Environment.isBrowser()).toBe(false);
  });

  beforeEach(() => {
    // Clear template cache
    compomint.tmplCache.clear();

    // Reset global tmpl object
    for (const key in tmpl) {
      delete tmpl[key];
    }

    // Reset i18n
    compomint.i18n = {};

    // Enable debug mode to store sourceGenFunc
    compomint.configs.debug = true;
  });

  describe("Environment Detection", () => {
    it("should detect server environment correctly", () => {
      expect(Environment.isServer()).toBe(true);
      expect(Environment.isNode()).toBe(true);
      expect(Environment.isBrowser()).toBe(false);
      expect(Environment.hasDOM()).toBe(true); // Should be true due to polyfill
    });

    it("should have SSR functionality available", () => {
      expect(compomint.ssr).toBeDefined();
      expect(typeof compomint.ssr!.renderToString).toBe("function");
      expect(typeof compomint.ssr!.renderPage).toBe("function");
      expect(typeof compomint.ssr!.createRenderer).toBe("function");
    });
  });

  describe("Basic SSR Rendering", () => {
    it("should render a simple template to HTML string", async () => {
      // Define a simple template
      compomint.addTmpl("ssr-simple", "<div>Hello, ##=data.name##!</div>");

      // Render using SSR
      const html = await compomint.ssr!.renderToString("ssr-simple", {
        name: "World",
      });

      expect(html).toContain("Hello, World!");
      expect(html).toMatch(
        /<div data-co-id="ssr-simple\d+" data-co-tmpl-id="ssr-simple">Hello, World!<\/div>/
      );
    });

    it("should handle templates with styles", async () => {
      compomint.addTmpls(`
        <template id="ssr-with-style">
          <style id="style-ssr-with-style">
            .test { color: red; }
          </style>
          <div class="test">##=data.message##</div>
        </template>
      `);

      const renderer = compomint.ssr!.createRenderer();
      const result = await renderer.renderToString("ssr-with-style", {
        message: "Styled content",
      });

      expect(result.html).toMatch(
        /<div data-co-id="ssr-with-style\d+" data-co-tmpl-id="ssr-with-style" class="test">Styled content<\/div>/
      );
      expect(result.css).toContain(".test { color: red; }");
    });

    it("should handle templates with multiple elements", async () => {
      compomint.addTmpl(
        "ssr-multiple",
        `<div>
          <h1>##=data.title##</h1>
          <p>##=data.description##</p>
        </div>`
      );

      const html = await compomint.ssr!.renderToString("ssr-multiple", {
        title: "Test Title",
        description: "Test Description",
      });

      expect(html).toMatch(
        /<div data-co-id="ssr-multiple\d+" data-co-tmpl-id="ssr-multiple">\s*<h1>Test Title<\/h1>\s*<p>Test Description<\/p>\s*<\/div>/
      );
    });

    it("should handle element insertion (##%##) with compomint.addTmpls", async () => {
      // Define child templates using addTmpls
      compomint.addTmpls(`
        <template id="ssr-child-component">
          <div class="child">##=data.content##</div>
        </template>
        <template id="ssr-list-item">
          <li>##=data.name## - ##=data.value##</li>
        </template>
      `);

      // Define parent template with ##%## element insertion
      compomint.addTmpl(
        "ssr-parent-with-elements",
        `<div class="parent">
          <h1>##=data.title##</h1>
          ##%data.childComponent##
          <ul>
            ##%data.listItems##
          </ul>
        </div>`
      );

      // Create child components
      const childTemplate = compomint.tmpl("ssr-child-component");
      const listTemplate = compomint.tmpl("ssr-list-item");
      
      expect(childTemplate).not.toBeNull();
      expect(listTemplate).not.toBeNull();
      
      const childComponent = childTemplate!({ content: "Child content" });
      const listItems = [
        { name: "Item 1", value: "Value 1" },
        { name: "Item 2", value: "Value 2" }
      ].map(item => listTemplate!(item));

      const html = await compomint.ssr!.renderToString("ssr-parent-with-elements", {
        title: "Parent Title",
        childComponent: childComponent,
        listItems: listItems
      });

      // Verify structure (SSR has limitations with ##%## element insertion)
      expect(html).toMatch(
        /<div data-co-id="ssr-parent-with-elements\d+" data-co-tmpl-id="ssr-parent-with-elements" class="parent">/
      );
      expect(html).toContain("<h1>Parent Title</h1>");
      
      // SSR element insertion shows placeholder comments instead of actual content
      // This demonstrates the current limitation that needs to be addressed
      expect(html).toContain("<!-- SSR: Element insertion not supported -->");
    });
  });

  describe("Complex SSR Scenarios", () => {
    it("should handle conditional rendering", async () => {
      compomint.addTmpl(
        "ssr-conditional",
        `<div>
          ##if (data.showTitle) {##
            <h1>##=data.title##</h1>
          ##}##
          <p>##=data.content##</p>
        </div>`
      );

      // Test with title shown
      const htmlWithTitle = await compomint.ssr!.renderToString(
        "ssr-conditional",
        {
          showTitle: true,
          title: "My Title",
          content: "My Content",
        }
      );

      expect(htmlWithTitle).toMatch(
        /<div data-co-id="ssr-conditional\d+" data-co-tmpl-id="ssr-conditional">\s*<h1>My Title<\/h1>\s*<p>My Content<\/p>\s*<\/div>/
      );

      // Test with title hidden
      const htmlWithoutTitle = await compomint.ssr!.renderToString(
        "ssr-conditional",
        {
          showTitle: false,
          title: "My Title",
          content: "My Content",
        }
      );

      expect(htmlWithoutTitle).toMatch(
        /<div data-co-id="ssr-conditional\d+" data-co-tmpl-id="ssr-conditional">\s*<p>My Content<\/p>\s*<\/div>/
      );
    });

    it("should handle loops in templates", async () => {
      compomint.addTmpl(
        "ssr-loop",
        `<ul>
          ##data.items.forEach(function(item) {##
            <li>##=item.name## - ##=item.price##</li>
          ##});##
        </ul>`
      );

      const html = await compomint.ssr!.renderToString("ssr-loop", {
        items: [
          { name: "Apple", price: "$1.00" },
          { name: "Banana", price: "$0.50" },
          { name: "Orange", price: "$0.75" },
        ],
      });

      expect(html).toMatch(
        /<ul data-co-id="ssr-loop\d+" data-co-tmpl-id="ssr-loop">\s*<li>Apple - \$1.00<\/li>\s*<li>Banana - \$0.50<\/li>\s*<li>Orange - \$0.75<\/li>\s*<\/ul>/
      );
    });

    it("should handle escaped content", async () => {
      compomint.addTmpl(
        "ssr-escape",
        `<div>
          <p>Raw: ##=data.html##</p>
          <p>Escaped: ##-data.html##</p>
        </div>`
      );

      const html = await compomint.ssr!.renderToString("ssr-escape", {
        html: "<script>alert('xss')</script>",
      });

      expect(html).toMatch(
        /<div data-co-id="ssr-escape\d+" data-co-tmpl-id="ssr-escape">\s*<p>Raw: <script>alert\('xss'\)<\/script><\/p>\s*<p>Escaped: &lt;script&gt;alert\(&#x27;xss&#x27;\)&lt;\/script&gt;<\/p>\s*<\/div>/
      );
    });
  });

  describe("Full Page Rendering", () => {
    it("should render a complete HTML page", async () => {
      compomint.addTmpl(
        "ssr-page",
        `<div class="container">
          <h1>##=data.title##</h1>
          <p>##=data.content##</p>
        </div>`
      );

      const pageHtml = await compomint.ssr!.renderPage(
        "ssr-page",
        {
          title: "My Page",
          content: "Welcome to my page!",
        },
        {
          title: "Test Page",
          meta: [{ name: "description", content: "A test page" }],
          lang: "en",
        }
      );

      expect(pageHtml).toContain("<!DOCTYPE html>");
      expect(pageHtml).toContain('<html lang="en">');
      expect(pageHtml).toContain("<title>Test Page</title>");
      expect(pageHtml).toContain(
        '<meta name="description" content="A test page">'
      );
      expect(pageHtml).toContain("<h1>My Page</h1>");
      expect(pageHtml).toContain("<p>Welcome to my page!</p>");
    });

    it("should include CSS and scripts in page", async () => {
      compomint.addTmpls(`
        <template id="ssr-page-with-assets">
          <style id="style-ssr-page-with-assets">
            .header { color: blue; }
          </style>
          <div class="header">##=data.title##</div>
          <script>console.log('Page loaded');</script>
        </template>
      `);

      const pageHtml = await compomint.ssr!.renderPage("ssr-page-with-assets", {
        title: "Page with Assets",
      });

      expect(pageHtml).toContain(".header { color: blue; }");
      expect(pageHtml).toContain("console.log('Page loaded');");
      expect(pageHtml).toContain("Page with Assets");
    });
  });

  describe("Error Handling", () => {
    it("should handle non-existent templates", async () => {
      await expect(
        compomint.ssr!.renderToString("non-existent-template", {})
      ).rejects.toThrow('Template "non-existent-template" not found');
    });

    it("should handle template compilation errors", async () => {
      // This should fail during template compilation
      expect(() => {
        compomint.addTmpl("ssr-error", "##=invalid.syntax.here.##");
      }).toThrow();
    });

    it("should handle runtime errors in templates", async () => {
      compomint.addTmpl("ssr-runtime-error", "##=data.nonexistent.property##");

      await expect(
        compomint.ssr!.renderToString("ssr-runtime-error", {})
      ).rejects.toThrow();
    });
  });

  describe("Performance", () => {
    it("should render multiple templates efficiently", async () => {
      // Create multiple templates
      for (let i = 0; i < 10; i++) {
        compomint.addTmpl(
          `ssr-perf-${i}`,
          `<div>Template ${i}: ##=data.value##</div>`
        );
      }

      const startTime = Date.now();

      const renderer = compomint.ssr!.createRenderer();
      const results = await renderer.renderMultiple(
        Array.from({ length: 10 }, (_, i) => ({
          id: `ssr-perf-${i}`,
          data: { value: `Value ${i}` },
        }))
      );

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      expect(results.html).toContain("Template 0: Value 0");
      expect(results.html).toContain("Template 9: Value 9");
      expect(results.metadata.templateIds).toHaveLength(10);
      expect(renderTime).toBeLessThan(1000); // Should render in less than 1 second
    });
  });

  describe("Internationalization", () => {
    it("should handle i18n in SSR", async () => {
      // Setup i18n
      compomint.addI18n("greeting", {
        en: "Hello",
        es: "Hola",
        fr: "Bonjour",
      });

      compomint.addTmpl(
        "ssr-i18n",
        `<div>##=i18n.greeting('Hello')##, ##=data.name##!</div>`
      );

      // Pass language as option to SSR renderer
      const html = await compomint.ssr!.renderToString(
        "ssr-i18n",
        {
          name: "Mundo",
        },
        {
          lang: "es", // Set language for this rendering
        }
      );

      expect(html).toContain("Hola, Mundo!");
    });
  });
});
