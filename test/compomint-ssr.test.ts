import { compomint, tmpl } from "../src/compomint";
import {
  createSSRRenderer,
  renderToString,
  SSRRenderer,
} from "../src/ssr-renderer";
import { SSRDOMPolyfill, setupSSREnvironment } from "../src/ssr";

describe("Compomint SSR", () => {
  beforeAll(() => {
    // Setup SSR environment for all tests in this suite
    setupSSREnvironment();
    const renderer = createSSRRenderer(compomint);
    compomint.ssr = {
      renderToString: renderer.renderToString.bind(renderer),
      renderPage: renderer.renderPage.bind(renderer),
      createRenderer: (options: any) => createSSRRenderer(compomint, options),
    };

    // Define a simple template for testing
    compomint.addTmpl(
      "ssr-simple",
      `
      <div class="ssr-simple">
        <h1>##=data.title##</h1>
        <p>##=data.content##</p>
      </div>
    `
    );

    // Define a template with a loop
    compomint.addTmpl(
      "ssr-loop",
      `
      <ul class="ssr-loop">
        ## for (let item of data.items) { ##
          <li>##=item##</li>
        ## } ##
      </ul>
    `
    );

    // Define a template with conditional rendering
    compomint.addTmpl(
      "ssr-conditional",
      `
      <div class="ssr-conditional">
        ## if (data.showTitle) { ##
          <h1>##=data.title##</h1>
        ## } ##
        <p>##=data.content##</p>
      </div>
    `
    );

    // Define a template with escaping
    compomint.addTmpl(
      "ssr-escape",
      `
      <div class="ssr-escape">
        <p>##-data.htmlContent##</p>
      </div>
    `
    );

    // Define a template for page rendering
    compomint.addTmpl(
      "ssr-page",
      `
      <main>
        <h1>##=data.pageTitle##</h1>
        <p>Welcome to the SSR page.</p>
      </main>
    `
    );
    compomint.addTmpl(
      "ssr-multiple",
      `
      <div class="ssr-multiple">
        ## for (let item of data.items) { ##
          <p>##=item.name##</p>
        ## } ##
      </div>
    `
    );
  });

  // Test SSR API
  it("should have SSR API available on compomint object", () => {
    expect(compomint.ssr).toBeDefined();
    expect(typeof compomint.ssr!.renderToString).toBe("function");
    expect(typeof compomint.ssr!.renderPage).toBe("function");
    expect(typeof compomint.ssr!.createRenderer).toBe("function");
  });

  // Test basic SSR rendering
  it("should render a simple template to a string", async () => {
    const result = await compomint.ssr!.renderToString("ssr-simple", {
      title: "Hello SSR",
      content: "This is a simple test.",
    });

    expect(result.html).toContain("<h1>Hello SSR</h1>");
    expect(result.html).toContain("<p>This is a simple test.</p>");
    expect(result.html).toMatch(/<div class="ssr-simple"[^>]*>/);
  });

  // Test with a custom renderer instance
  it("should work with a custom renderer instance", async () => {
    const renderer = compomint.ssr!.createRenderer({
      lang: "fr",
    });

    const result = await renderer.renderToString("ssr-simple", {
      title: "Bonjour SSR",
      content: "Ceci est un test.",
    });

    expect(result.html).toContain("<h1>Bonjour SSR</h1>");
  });

  // Test rendering multiple templates
  it("should render multiple templates", async () => {
    const result = await compomint.ssr!.renderToString("ssr-multiple", {
      items: [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ],
    });

    expect(result.html).toContain("Item 1");
    expect(result.html).toContain("Item 2");
  });

  // Test conditional rendering
  it("should handle conditional rendering correctly", async () => {
    // Case 1: showTitle is true
    const resultWithTitle = await compomint.ssr!.renderToString(
      "ssr-conditional",
      {
        showTitle: true,
        title: "Conditional Title",
        content: "Content is always here.",
      }
    );
    expect(resultWithTitle.html).toContain("<h1>Conditional Title</h1>");

    // Case 2: showTitle is false
    const resultWithoutTitle = await compomint.ssr!.renderToString(
      "ssr-conditional",
      {
        showTitle: false,
        title: "Conditional Title",
        content: "Content is always here.",
      }
    );
    expect(resultWithoutTitle.html).not.toContain("<h1>Conditional Title</h1>");
  });

  // Test loops
  it("should render loops correctly", async () => {
    const result = await compomint.ssr!.renderToString("ssr-loop", {
      items: ["Apple", "Banana", "Cherry"],
    });

    expect(result.html).toContain("<li>Apple</li>");
    expect(result.html).toContain("<li>Banana</li>");
    expect(result.html).toContain("<li>Cherry</li>");
  });

  // Test HTML escaping
  it("should escape HTML content correctly", async () => {
    const result = await compomint.ssr!.renderToString("ssr-escape", {
      htmlContent: '<script>alert("xss")</script>',
    });

    expect(result.html).toContain(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
    );
    expect(result.html).not.toContain('<script>alert("xss")</script>');
  });

  // Test page rendering
  it("should render a full HTML page", async () => {
    const pageHtml = await compomint.ssr!.renderPage("ssr-page", {
      pageTitle: "My SSR Page",
    });

    expect(pageHtml).toContain("<!DOCTYPE html>");
    expect(pageHtml).toContain("<title>Compomint SSR Page</title>");
    expect(pageHtml).toContain("<h1>My SSR Page</h1>");
  });

  // Test styles and scripts collection
  it("should collect styles and scripts", async () => {
    compomint.addTmpl(
      "ssr-with-assets",
      `
      <style>
        .ssr-assets { color: red; }
      </style>
      <div class="ssr-assets">Assets test</div>
      <script>
        console.log("ssr script");
      </script>
    `
    );

    const result = await compomint.ssr!.renderToString("ssr-with-assets", {});
    expect(result.css).toContain(".ssr-assets { color: red; }");
    expect(result.scripts).toContain('console.log("ssr script");');
  });

  // Error handling
  it("should throw an error for non-existent templates", async () => {
    await expect(
      compomint.ssr!.renderToString("non-existent-template", {})
    ).rejects.toThrow();
  });

  // Test with runtime error in template
  it("should handle runtime errors in templates", async () => {
    compomint.addTmpl(
      "ssr-runtime-error",
      `
      <div>##=data.nonExistent.prop##</div>
    `
    );

    await expect(
      compomint.ssr!.renderToString("ssr-runtime-error", {})
    ).rejects.toThrow();
  });

  // Test hydration script generation
  it("should generate a hydration script", async () => {
    const renderer = compomint.ssr!.createRenderer({
      hydrateOnClient: true,
    });
    const result = await renderer.renderToString("ssr-simple", {});
    const pageHtml = await renderer.renderPage("ssr-simple", {});

    expect(pageHtml).toContain("window.__COMPOMINT_SSR__");
  });

  // Test i18n support in SSR
  it("should support i18n in SSR", async () => {
    compomint.addI18n("ssr-i18n.greeting", {
      en: "Hello",
      fr: "Bonjour",
    });
    compomint.addTmpl(
      "ssr-i18n",
      `
      <p>##=i18n.greeting()##</p>
    `
    );

    const result = await compomint.ssr!.renderToString("ssr-i18n", {});
    expect(result.html).toContain("<p>Hello</p>");

    const renderer = compomint.ssr!.createRenderer({ lang: "fr" });
    const resultFr = await renderer.renderToString("ssr-i18n", {});
    expect(resultFr.html).toContain("<p>Bonjour</p>");
  });
});
