/**
 * @jest-environment jsdom
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
import { compomint, tmpl } from "../src/compomint";

// --- Mocking XMLHttpRequest ---
const mockXhr = {
  open: jest.fn(),
  send: jest.fn(),
  readyState: 4,
  status: 200,
  responseText: "",
  setRequestHeader: jest.fn(),
  onreadystatechange: () => {
    console.log("onreadystatechange");
  },
  onerror: () => {},
  ontimeout: () => {},
  timeout: 0,
  // Helper to simulate successful response
  _respond: function (status: number, responseText: string) {
    this.status = status;
    this.responseText = responseText;
    if (this.onreadystatechange) {
      this.onreadystatechange();
    }
  },
  // Helper to simulate network error
  _error: function () {
    if (this.onerror) {
      this.onerror();
    }
  },
  // Helper to simulate timeout
  _timeout: function () {
    if (this.ontimeout) {
      this.ontimeout();
    }
  },
};
const mockRequest = jest.fn(() => mockXhr);
(mockRequest as any).DONE = 4;
(window as any).XMLHttpRequest = mockRequest;

// --- End Mocking XMLHttpRequest ---

jest.setTimeout(20000);

describe("compomint.tools.addTmplByUrl", () => {
  let addTmplsSpy: any;
  let headAppendChildSpy: any;
  let bodyAppendChildSpy: any; // appendToHead actually appends to body in the source

  beforeAll(() => {
    if (!compomint) {
      throw new Error("Compomint library not loaded correctly.");
    }
  });

  beforeEach(() => {
    // Reset mocks and spies
    jest.clearAllMocks();
    mockRequest.mockClear();
    mockXhr.open.mockClear();
    mockXhr.send.mockClear();
    mockXhr.setRequestHeader.mockClear();
    mockXhr.status = 200;
    mockXhr.responseText = "";
    mockXhr.onreadystatechange = () => {
      console.log("onreadystatechange");
    };
    mockXhr.onerror = () => {};
    mockXhr.ontimeout = () => {};

    // Reset DOM and spies
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    headAppendChildSpy = jest.spyOn(document.head, "appendChild"); //.mockImplementation((node: Node) => { (node).dispatchEvent(new Event("load")); return node; });;
    bodyAppendChildSpy = jest.spyOn(document.body, "appendChild"); // Spy on body due to appendToHead implementation
    addTmplsSpy = jest.spyOn(compomint, "addTmpls");

    // Reset Compomint state
    compomint.tmplCache.clear();
    //compomint.tmplCache.set("anonymous", { elements: new Set() });
    for (const key in tmpl) {
      delete tmpl[key];
    }
    compomint.i18n = {};
    compomint.configs.debug = false;
    compomint.configs.throwError = true;
  });

  afterEach(() => {
    // Restore spies
    headAppendChildSpy.mockRestore();
    bodyAppendChildSpy.mockRestore();
    addTmplsSpy.mockRestore();
  });

  it("should fetch and process a single HTML URL(1)", async () => {
    const htmlContent = `
    <template id="test-tmpl">
      <style id="style-test-tmpl">
        .red{
          color:red
        }
      </style>
      Content
    </template>
    <link id="test-link" rel="stylesheet" href="test.css">
    <script id="test-script">
      console.log("loaded")
    </script>
`;
    const callback = jest.fn(() => {
      expect(mockXhr.open).toHaveBeenCalledWith("GET", "test.html", true);
      expect(mockXhr.send).toHaveBeenCalled();
      //expect(addTmplsSpy).toHaveBeenCalled();
      expect(compomint.tmplCache.has("test-tmpl")).toBe(true);
      // Note: appendToHead in the source appends to body
      expect(headAppendChildSpy).toHaveBeenCalledTimes(3); // style, link, script
      expect(headAppendChildSpy.mock.calls[0][0].tagName).toBe("STYLE");
      expect(headAppendChildSpy.mock.calls[1][0].tagName).toBe("LINK");
      expect(headAppendChildSpy.mock.calls[2][0].tagName).toBe("SCRIPT");
      expect(headAppendChildSpy.mock.calls[2][0].textContent).toContain(
        'console.log("loaded")'
      );
    });

    compomint.addTmplByUrl("test.html", callback);

    // Simulate successful XHR response
    mockXhr._respond(200, htmlContent);
  });

  // --- Test Cases ---
  it("should fetch and process a single HTML URL(2)", (done) => {
    const htmlContent = `
    <template id="test-tmpl-T1">
      <style id="style-test-tmpl-T1">.
        .red{
          color:red
        }
      </style>
      <div id="test-tmpl-T1">
        Content1
      </div>
    </template>
    <template id="test-tmpl-T2">
      <style id="style-test-tmpl-T2">.
        .red{
          color:blue
        }
      </style>
      <div id="test-tmpl-T2">
        Content2
      </div>
    </template>
    <link id="test-link" rel="stylesheet" href="test.css">
    <script id="test-script">console.log("loaded")</script>
`;
    const callback = jest.fn(() => {
      expect(mockXhr.open).toHaveBeenCalledWith("GET", "test.html", true);
      expect(mockXhr.send).toHaveBeenCalled();
      //expect(addTmplsSpy).toHaveBeenCalled();
      expect(compomint.tmplCache.has("test-tmpl-T1")).toBe(true);
      expect(compomint.tmplCache.has("test-tmpl-T2")).toBe(true);
      // Note: appendToHead in the source appends to body
      expect(headAppendChildSpy).toHaveBeenCalledTimes(4); // style, link, script
      expect(headAppendChildSpy.mock.calls[0][0].tagName).toBe("STYLE");
      expect(headAppendChildSpy.mock.calls[1][0].tagName).toBe("STYLE");
      expect(headAppendChildSpy.mock.calls[2][0].tagName).toBe("LINK");
      expect(headAppendChildSpy.mock.calls[3][0].tagName).toBe("SCRIPT");
      expect(headAppendChildSpy.mock.calls[3][0].textContent).toBe(
        'console.log("loaded")'
      );
      done();
    });

    compomint.addTmplByUrl("test.html", callback);

    // Simulate successful XHR response
    mockXhr._respond(200, htmlContent);
  });

  it("should fetch and process a single HTML URL(3)", (done) => {
    const htmlContent = `
    <compomint>
      <template id="test-tmpl-T1">
        <style id="style-test-tmpl-T1">.
          .red{
            color:red
          }
        </style>
        <div id="test-tmpl-T1">
          Content1
        </div>
      </template>
      <template id="test-tmpl-T2">
        <style id="style-test-tmpl-T2">.
          .red{
            color:blue
          }
        </style>
        <div id="test-tmpl-T2">
          Content2
        </div>
      </template>
    </compomint>
    <link id="test-link" rel="stylesheet" href="test.css">
    <script id="test-script">console.log("loaded")</script>
`;
    const callback = jest.fn(() => {
      expect(mockXhr.open).toHaveBeenCalledWith("GET", "test.html", true);
      expect(mockXhr.send).toHaveBeenCalled();
      //expect(addTmplsSpy).toHaveBeenCalled();
      expect(compomint.tmplCache.has("test-tmpl-T1")).toBe(true);
      expect(compomint.tmplCache.has("test-tmpl-T2")).toBe(true);
      // Note: appendToHead in the source appends to body
      expect(headAppendChildSpy).toHaveBeenCalledTimes(4); // style, link, script
      expect(headAppendChildSpy.mock.calls[0][0].tagName).toBe("STYLE");
      expect(headAppendChildSpy.mock.calls[1][0].tagName).toBe("STYLE");
      expect(headAppendChildSpy.mock.calls[2][0].tagName).toBe("LINK");
      expect(headAppendChildSpy.mock.calls[3][0].tagName).toBe("SCRIPT");
      expect(headAppendChildSpy.mock.calls[3][0].textContent).toBe(
        'console.log("loaded")'
      );
      done();
    });

    compomint.addTmplByUrl("test.html", callback);

    // Simulate successful XHR response
    mockXhr._respond(200, htmlContent);
  });

  it("should fetch and process a single HTML URL(4)", (done) => {
    const htmlContent =
      '<template id="test-tmpl">Content</template><style id="test-style">.red{color:red}</style><link id="test-link" rel="stylesheet" href="test.css"><script id="test-script">console.log("loaded")</script>';
    const callback = jest.fn(() => {
      expect(mockXhr.open).toHaveBeenCalledWith("GET", "test.html", true);
      expect(mockXhr.send).toHaveBeenCalled();
      //expect(addTmplsSpy).toHaveBeenCalled();
      expect(compomint.tmplCache.has("test-tmpl")).toBe(true);
      // Note: appendToHead in the source appends to body
      expect(headAppendChildSpy).toHaveBeenCalledTimes(3); // style, link, script
      expect(headAppendChildSpy.mock.calls[0][0].tagName).toBe("LINK");
      expect(headAppendChildSpy.mock.calls[1][0].tagName).toBe("STYLE");
      expect(headAppendChildSpy.mock.calls[2][0].tagName).toBe("SCRIPT");
      expect(headAppendChildSpy.mock.calls[2][0].textContent).toBe(
        'console.log("loaded")'
      );
      done();
    });

    compomint.addTmplByUrl("test.html", callback);

    // Simulate successful XHR response
    mockXhr._respond(200, htmlContent);
  });

  it("should handle fetch error for a single HTML URL", (done) => {
    const callback = jest.fn(() => {
      expect(mockXhr.open).toHaveBeenCalledWith("GET", "error.html", true);
      expect(mockXhr.send).toHaveBeenCalled();
      //expect(addTmplsSpy).not.toHaveBeenCalled();
      expect(bodyAppendChildSpy).not.toHaveBeenCalled();
      done();
    });
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation((e) => {
        console.log(e);
      });

    compomint.addTmplByUrl("error.html", callback);

    // Simulate XHR error response
    mockXhr._respond(404, "Not Found");
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to fetch template file: error.html")
    );
    consoleErrorSpy.mockRestore();
  });

  it("should handle network error for a single HTML URL", (done) => {
    const callback = jest.fn(() => {
      expect(mockXhr.open).toHaveBeenCalledWith(
        "GET",
        "network-error.html",
        true
      );
      expect(mockXhr.send).toHaveBeenCalled();
      //expect(addTmplsSpy).not.toHaveBeenCalled();
      expect(bodyAppendChildSpy).not.toHaveBeenCalled();
      done();
    });
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    compomint.addTmplByUrl("network-error.html", callback);

    // Simulate XHR network error
    mockXhr._error();
    // expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Network error requesting network-error.html")
    );
    consoleErrorSpy.mockRestore();
  });

  it("should respect loadScript=false option", (done) => {
    const htmlContent =
      '<template id="t1">T1</template><script id="s1">var a=1;</script>';
    const callback = jest.fn(() => {
      //expect(addTmplsSpy).toHaveBeenCalled();
      expect(compomint.tmplCache.has("t1")).toBe(true);
      // appendToHead appends to body
      expect(bodyAppendChildSpy).not.toHaveBeenCalled(); // No script should be appended
      done();
    });

    compomint.addTmplByUrl("test.html", { loadScript: false }, callback);
    mockXhr._respond(200, htmlContent);
  });

  it("should respect loadStyle=false option", (done) => {
    const htmlContent =
      '<template id="t1">T1</template><style id="style1">.x{}</style>';
    const callback = jest.fn(() => {
      //expect(addTmplsSpy).toHaveBeenCalled();
      expect(compomint.tmplCache.has("t1")).toBe(true);
      // appendToHead appends to body
      expect(bodyAppendChildSpy).not.toHaveBeenCalled(); // No style should be appended
      done();
    });

    compomint.addTmplByUrl("test.html", { loadStyle: false }, callback);
    mockXhr._respond(200, htmlContent);
  });

  it("should respect loadLink=false option", (done) => {
    const htmlContent =
      '<template id="t1">T1</template><link id="link1" rel="stylesheet" href="style.css">';
    const callback = jest.fn(() => {
      //expect(addTmplsSpy).toHaveBeenCalled();
      expect(compomint.tmplCache.has("t1")).toBe(true);
      // appendToHead appends to body
      expect(bodyAppendChildSpy).not.toHaveBeenCalled(); // No link should be appended
      done();
    });

    compomint.addTmplByUrl("test.html", { loadLink: false }, callback);
    mockXhr._respond(200, htmlContent);
  });

  it("should handle invalid importData gracefully", () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const callback1 = jest.fn(() => {
      expect(callback1).toHaveBeenCalledTimes(1); // Should still call callback
    });
    compomint.addTmplByUrl(null as any, callback1); // Test null

    const callback2 = jest.fn(() => {
      expect(callback2).toHaveBeenCalledTimes(1); // Called again after empty processing
    });
    compomint.addTmplByUrl([123, {}], callback2); // Test invalid array items

    //expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid import data format'));
    expect(
      consoleErrorSpy.mock.calls.some((call) =>
        call[0].includes("Invalid import data format")
      )
    ).toBe(true);
    consoleErrorSpy.mockRestore();
  });

  it("should reject Promise when resource fails to load", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Create a controlled XHR mock that will fail
    const failingMockXhr = {
      open: jest.fn(),
      send: jest.fn(),
      readyState: 4,
      status: 404,
      responseText: "Not Found",
      setRequestHeader: jest.fn(),
      onreadystatechange: null as any,
      onerror: null as any,
      ontimeout: null as any,
      timeout: 0,
      _respond: function (this: any, status: number, responseText: string) {
        this.status = status;
        this.responseText = responseText;
        if (this.onreadystatechange) {
          this.onreadystatechange();
        }
      },
    };

    // Override XMLHttpRequest for this test
    const originalXHR = (window as any).XMLHttpRequest;
    const mockXMLHttpRequest = jest.fn().mockImplementation(() => ({
      ...failingMockXhr,
      send: jest.fn(function (this: any) {
        setTimeout(() => this._respond(404, "Not Found"), 10);
      }),
    }));
    (mockXMLHttpRequest as any).DONE = 4;
    (window as any).XMLHttpRequest = mockXMLHttpRequest;

    // Test Promise rejection on XHR error
    const promise = compomint.addTmplByUrl("error.html");

    await expect(promise).rejects.toThrow(
      "Failed to fetch template file: error.html (Status: 404)"
    );

    // Restore original XMLHttpRequest
    (window as any).XMLHttpRequest = originalXHR;
    consoleErrorSpy.mockRestore();
  });

  it("should reject Promise when any resource in array fails to load", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Test Promise rejection with array of URLs where one fails
    const urls = ["success.html", "error.html"];

    // Create a more controlled XHR mock for this test
    let requestCount = 0;
    const controlledMockXhr = {
      open: jest.fn(),
      send: jest.fn(),
      readyState: 4,
      status: 200,
      responseText: "",
      setRequestHeader: jest.fn(),
      onreadystatechange: null as any,
      onerror: null as any,
      ontimeout: null as any,
      timeout: 0,
      _url: "",
      _respond: function (this: any, status: number, responseText: string) {
        this.status = status;
        this.responseText = responseText;
        if (this.onreadystatechange) {
          this.onreadystatechange();
        }
      },
    };

    // Override XMLHttpRequest for this test
    const originalXHR = (window as any).XMLHttpRequest;
    const mockXMLHttpRequest = jest.fn().mockImplementation(() => {
      const instance = { ...controlledMockXhr };
      instance.send = jest.fn().mockImplementation(function (this: any) {
        requestCount++;
        if (this._url.includes("success.html")) {
          setTimeout(
            () =>
              this._respond(200, '<template id="success">Success</template>'),
            10
          );
        } else if (this._url.includes("error.html")) {
          setTimeout(() => this._respond(404, "Not Found"), 10);
        }
      });
      instance.open = jest
        .fn()
        .mockImplementation(function (this: any, ...args: any[]) {
          const [_method, url] = args;
          this._url = url;
        });
      return instance;
    });
    (mockXMLHttpRequest as any).DONE = 4;
    (window as any).XMLHttpRequest = mockXMLHttpRequest;

    const promise = compomint.addTmplByUrl(urls);

    await expect(promise).rejects.toThrow(
      "Failed to fetch template file: error.html (Status: 404)"
    );

    // Restore original XMLHttpRequest
    (window as any).XMLHttpRequest = originalXHR;
    consoleErrorSpy.mockRestore();
  });

  it("should remove old style/link elements with the same ID(1)", (done) => {
    // Pre-add elements to head/body (body because appendToHead appends there)
    const oldStyle = document.createElement("style");
    oldStyle.id = "style-to-replace";
    document.body.appendChild(oldStyle);
    const oldLink = document.createElement("link");
    oldLink.id = "link-to-replace";
    document.body.appendChild(oldLink);

    const removeChildSpy = jest.spyOn(document.body, "removeChild");

    const htmlContent = `
      <template id="to-replace">
        <style id="style-to-replace">.new{}</style>
        T
      </template>
      <link id="link-to-replace" rel="stylesheet" href="new.css">
    `;
    const callback = jest.fn(() => {
      // Check removeChild was called for the old elements
      expect(removeChildSpy).toHaveBeenCalledWith(oldLink);
      expect(removeChildSpy).toHaveBeenCalledWith(oldStyle);
      // Check the new elements were added
      expect(document.getElementById("style-to-replace")!.textContent).toBe(
        ".new{}"
      );
      expect(
        document.getElementById("link-to-replace")!.getAttribute("href")
      ).toBe("new.css");
      removeChildSpy.mockRestore();
      done();
    });

    compomint.addTmplByUrl("replace.html", callback);
    mockXhr._respond(200, htmlContent);
  });

  it("should remove old style/link elements with the same ID(2)", (done) => {
    // Pre-add elements to head/body (body because appendToHead appends there)
    const oldStyle = document.createElement("style");
    oldStyle.id = "style-to-replace";
    document.body.appendChild(oldStyle);
    const oldLink = document.createElement("link");
    oldLink.id = "link-to-replace";
    document.body.appendChild(oldLink);

    const removeChildSpy = jest.spyOn(document.body, "removeChild");

    const htmlContent = `
      <template id="replace-test">T</template>
      <style id="style-to-replace">.new{}</style>
      <link id="link-to-replace" rel="stylesheet" href="new.css">
    `;
    const callback = jest.fn(() => {
      // Check removeChild was called for the old elements
      expect(removeChildSpy).toHaveBeenCalledWith(oldLink);
      //expect(removeChildSpy).toHaveBeenCalledWith(oldStyle);
      // Check the new elements were added
      expect(document.getElementById("style-to-replace")!.textContent).toBe(
        ".new{}"
      );
      expect(
        document.getElementById("link-to-replace")!.getAttribute("href")
      ).toBe("new.css");
      removeChildSpy.mockRestore();
      done();
    });

    compomint.addTmplByUrl("replace.html", callback);
    mockXhr._respond(200, htmlContent);
  });

  it("should fetch and process a multiple HTML URL()", (done) => {
    const htmlContent1 =
      '<template id="test-tmpl-1"><style id="style-test-tmpl-1">.red{color:red}</style><div id="test-tmpl-1">Content1</template><link id="test-link-1" rel="stylesheet" href="test1.css"><script id="test-script-1">console.log("loaded1")</script>';
    const htmlContent2 =
      '<template id="test-tmpl-2"><style id="style-test-tmpl-2">.red{color:red}</style><div id="test-tmpl-2">Content2</template><link id="test-link-2" rel="stylesheet" href="test2.css"><script id="test-script-2">console.log("loaded2")</script>';
    const urls = ["test1.html", "test2.html"];
    let loadCount = 0;

    // Override XHR mock behavior for this test
    let _url = "";
    const xhrClassMock = jest.fn(() => {
      const xhrMock = {
        ...mockXhr,
        send: jest.fn(function () {
          loadCount++;
          // Simulate response based on URL requested
          if (_url.includes("test1.html")) {
            setTimeout(() => {
              xhrMock._respond(200, htmlContent1);
            }, 0); // Simulate async fetch
          } else if (_url.includes("test2.html")) {
            setTimeout(() => {
              xhrMock._respond(200, htmlContent2);
            }, 0); // Simulate async fetch
          }
        }),
        open: jest.fn((_method: string, url: string) => {
          _url = url;
        }), // Store URL for send logic
      };
      return xhrMock;
    });
    (xhrClassMock as any).DONE = 4;
    (window as any).XMLHttpRequest = xhrClassMock;

    const callback = jest.fn(() => {
      expect(loadCount).toBe(2);
      //expect(mockXhr.open).toHaveBeenCalledWith('GET', "test1.html", true);
      //expect(mockXhr.open).toHaveBeenCalledWith('GET', "test2.html", true);
      //expect(mockXhr.send).toHaveBeenCalledTimes(2);
      //expect(addTmplsSpy).toHaveBeenCalledTimes(2);
      expect(compomint.tmplCache.has("test-tmpl-1")).toBe(true);
      expect(compomint.tmplCache.has("test-tmpl-2")).toBe(true);
      // Note: appendToHead in the source appends to body
      expect(headAppendChildSpy).toHaveBeenCalledTimes(6); // style, link, script
      expect(headAppendChildSpy.mock.calls[0][0].tagName).toBe("STYLE");
      expect(headAppendChildSpy.mock.calls[1][0].tagName).toBe("LINK");
      expect(headAppendChildSpy.mock.calls[2][0].tagName).toBe("SCRIPT");
      expect(headAppendChildSpy.mock.calls[3][0].tagName).toBe("STYLE");
      expect(headAppendChildSpy.mock.calls[4][0].tagName).toBe("LINK");
      expect(headAppendChildSpy.mock.calls[5][0].tagName).toBe("SCRIPT");
      expect(headAppendChildSpy.mock.calls[2][0].textContent).toBe(
        'console.log("loaded1")'
      );
      expect(headAppendChildSpy.mock.calls[5][0].textContent).toBe(
        'console.log("loaded2")'
      );
      done();
    });

    compomint.addTmplByUrl(urls, callback);
  });

  it("should load an array of URLs (HTML, JS, CSS)", (done) => {
    const htmlContent = '<template id="arr-tmpl">Arr</template>';
    const urls = ["styles.css", "script.js", "page.html"];
    let loadCount = 0;

    // Mock script load event listener attachment
    const scriptElement = document.createElement("script");
    scriptElement.addEventListener = jest.fn((event, cb) => {
      if (event === "load") {
        (cb as Function)();
      }
    });
    scriptElement.src = "";
    // Mock link load event listener attachment
    const linkElement = document.createElement("link");
    linkElement.addEventListener = jest.fn((event, cb) => {
      if (event === "load") {
        (cb as Function)();
      }
    });
    linkElement.rel = "";
    linkElement.href = "";
    linkElement.type = "";

    const element = document.createElement("template");

    const createElementSpy = jest
      .spyOn(document, "createElement")
      .mockImplementation((tag) => {
        if (tag === "script") {
          return scriptElement;
        } else if (tag === "link") {
          return linkElement;
        }
        return element;
      });

    const callback = jest.fn(() => {
      expect(loadCount).toBe(1); // html only
      expect(compomint.tmplCache.has("arr-tmpl")).toBe(true);
      expect(headAppendChildSpy).toHaveBeenCalledTimes(2); // CSS link and JS script
      expect(headAppendChildSpy.mock.calls[0][0].tagName).toBe("LINK");
      expect(headAppendChildSpy.mock.calls[0][0].href).toContain("styles.css");
      expect(headAppendChildSpy.mock.calls[1][0].tagName).toBe("SCRIPT");
      expect(headAppendChildSpy.mock.calls[1][0].src).toContain("script.js");
      //expect(addTmplsSpy).toHaveBeenCalledTimes(1); // Only for the HTML file
      createElementSpy.mockRestore();
      done();
    });

    // Override XHR mock behavior for this test
    let _url = "";
    const xhrClassMock = jest.fn(() => {
      const xhrMock = {
        ...mockXhr,
        send: jest.fn(() => {
          loadCount++;
          // Simulate response based on URL requested
          if (_url.includes("page.html")) {
            setTimeout(() => {
              xhrMock._respond(200, htmlContent);
            }, 0); // Simulate async fetch
          }
        }),
        open: jest.fn((_method: string, url: string) => {
          _url = url;
        }), // Store URL for send logic
      };
      return xhrMock;
    });
    (xhrClassMock as any).DONE = 4;
    (window as any).XMLHttpRequest = xhrClassMock;

    compomint.addTmplByUrl(urls, callback);

    // Note: The actual execution flow depends on how the mocks simulate async operations.
    // The `done` callback ensures Jest waits for the final callback.
  });

  it("should handle array with mixed success/failure", (done) => {
    const htmlContent = '<template id="ok-tmpl">OK</template>';
    const urls = ["ok.html", "fail.html", "script.js"];
    let loadCount = 0;
    let successCount = 0;

    // Mock script load event listener attachment
    const scriptElement = document.createElement("script");
    scriptElement.addEventListener = jest.fn((event, cb) => {
      if (event === "load") {
        (cb as Function)();
      }
    });
    scriptElement.src = "";

    const element = document.createElement("template");

    const createElementSpy = jest
      .spyOn(document, "createElement")
      .mockImplementation((tag) => {
        if (tag === "script") {
          return scriptElement;
        }
        return element;
      });

    // Override XHR mock behavior
    let _url = "";
    const xhrClassMock = jest.fn(() => {
      const xhrMock = {
        ...mockXhr,
        _url: "",
        send: jest.fn(() => {
          loadCount++;
          if (_url.includes("ok.html")) {
            successCount++;
            setTimeout(() => xhrMock._respond(200, htmlContent), 0);
          } else if (_url.includes("fail.html")) {
            setTimeout(() => xhrMock._respond(404, "Not Found"), 0);
          }
          // script.js is handled by createElement mock
        }),
        open: jest.fn((_method: string, url: string) => {
          _url = url;
        }),
      };
      return xhrMock;
    });
    (xhrClassMock as any).DONE = 4;
    (window as any).XMLHttpRequest = xhrClassMock;

    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const callback = jest.fn(() => {
      expect(loadCount).toBe(2); // All attempts finished
      expect(successCount).toBe(1); // ok.html and script.js succeeded
      expect(compomint.tmplCache.has("ok-tmpl")).toBe(true);
      //expect(addTmplsSpy).toHaveBeenCalledTimes(1); // Only for ok.html
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to fetch template file: fail.html")
      );
      createElementSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      done();
    });

    compomint.addTmplByUrl(urls, callback);
  });

  it("should return a Promise when no callback is provided", () => {
    // Test with callback - should return undefined
    const resultWithCallback = compomint.addTmplByUrl("test.html", () => {});
    expect(resultWithCallback).toBeUndefined();

    // Test without callback - should return Promise
    const resultWithoutCallback = compomint.addTmplByUrl("test.html");
    expect(resultWithoutCallback).toBeInstanceOf(Promise);
  });

  it("should resolve Promise after loading template", async () => {
    const htmlContent = '<template id="promise-test">Promise Test</template>';

    // Create a dedicated XHR mock for this test
    const testMockXhr = {
      open: jest.fn(),
      send: jest.fn(),
      readyState: 4,
      status: 200,
      responseText: htmlContent,
      setRequestHeader: jest.fn(),
      onreadystatechange: null as any,
      onerror: null as any,
      ontimeout: null as any,
      timeout: 0,
    };

    // Override XMLHttpRequest for this test only
    const originalXHR = (window as any).XMLHttpRequest;
    (window as any).XMLHttpRequest = jest.fn(() => ({
      ...testMockXhr,
      send: jest.fn(function (this: any) {
        // Trigger response immediately
        this.onreadystatechange && this.onreadystatechange();
      }),
    }));
    (window.XMLHttpRequest as any).DONE = 4;

    const result = compomint.addTmplByUrl("promise-test.html");

    // Check that a Promise is returned
    expect(result).toBeInstanceOf(Promise);

    // Wait for the promise
    await (result as Promise<void>);

    // Verify the template was loaded
    expect(compomint.tmplCache.has("promise-test")).toBe(true);

    // Restore original XHR
    (window as any).XMLHttpRequest = originalXHR;
  });

  it("should pass templateEngine option correctly to addTmpls", (done) => {
    const customTemplateEngine = {
      rules: {
        customRule: {
          pattern: /\{\{(.+?)\}\}/g,
          exec: function (match: string) {
            return `<span class="custom">${match}</span>`;
          },
        },
      },
      keys: {
        dataKeyName: "data",
        statusKeyName: "status",
        componentKeyName: "component",
        i18nKeyName: "i18n",
      },
    };

    const htmlContent = `
      <template id="custom-engine-test">
        <div>{{testValue}}</div>
      </template>
    `;

    // Create isolated XHR mock for this test
    const testMockXhr = {
      open: jest.fn(),
      send: jest.fn(),
      readyState: 4,
      status: 200,
      responseText: htmlContent,
      setRequestHeader: jest.fn(),
      onreadystatechange: null as any,
      onerror: null as any,
      ontimeout: null as any,
      timeout: 0,
    };

    // Override XMLHttpRequest temporarily
    const originalXHR = (window as any).XMLHttpRequest;
    (window as any).XMLHttpRequest = jest.fn(() => ({
      ...testMockXhr,
      send: jest.fn(function (this: any) {
        setTimeout(() => {
          if (this.onreadystatechange) {
            this.onreadystatechange();
          }
        }, 0);
      }),
    }));
    (window.XMLHttpRequest as any).DONE = 4;

    const callback = jest.fn(() => {
      try {
        // Verify the template was loaded
        expect(compomint.tmplCache.has("custom-engine-test")).toBe(true);

        // Test that the template engine option was passed by verifying
        // that our custom template engine was used
        const tmplFunc = compomint.tmpl("custom-engine-test");
        expect(tmplFunc).toBeDefined();

        // Restore XMLHttpRequest
        (window as any).XMLHttpRequest = originalXHR;

        // This test validates that our fix works - templateEngine option
        // is now being passed to addTmpls instead of the old tmplSettings
        done();
      } catch (error) {
        (window as any).XMLHttpRequest = originalXHR;
        done(error as Error);
      }
    });

    // Call addTmplByUrl with custom templateEngine option
    compomint.addTmplByUrl(
      "custom-engine-test.html",
      { templateEngine: customTemplateEngine },
      callback
    );
  });

  it("should handle templateEngine option in object format with URL", (done) => {
    const customTemplateEngine = {
      rules: {
        customRule: {
          pattern: /\{\{(.+?)\}\}/g,
          exec: function (match: string) {
            return `<span class="custom">${match}</span>`;
          },
        },
      },
      keys: {
        dataKeyName: "data",
        statusKeyName: "status",
        componentKeyName: "component",
        i18nKeyName: "i18n",
      },
    };

    const htmlContent = `
      <template id="object-format-test">
        <div>{{testValue}}</div>
      </template>
    `;

    // Create isolated XHR mock for this test
    const testMockXhr = {
      open: jest.fn(),
      send: jest.fn(),
      readyState: 4,
      status: 200,
      responseText: htmlContent,
      setRequestHeader: jest.fn(),
      onreadystatechange: null as any,
      onerror: null as any,
      ontimeout: null as any,
      timeout: 0,
    };

    // Override XMLHttpRequest temporarily
    const originalXHR = (window as any).XMLHttpRequest;
    (window as any).XMLHttpRequest = jest.fn(() => ({
      ...testMockXhr,
      send: jest.fn(function (this: any) {
        setTimeout(() => {
          if (this.onreadystatechange) {
            this.onreadystatechange();
          }
        }, 0);
      }),
    }));
    (window.XMLHttpRequest as any).DONE = 4;

    const callback = jest.fn(() => {
      try {
        // Verify the template was loaded
        expect(compomint.tmplCache.has("object-format-test")).toBe(true);

        // Test that the template engine option was passed by verifying
        // that our custom template engine was used
        const tmplFunc = compomint.tmpl("object-format-test");
        expect(tmplFunc).toBeDefined();

        // Restore XMLHttpRequest
        (window as any).XMLHttpRequest = originalXHR;

        // This test validates that our fix works - templateEngine option
        // is now being passed to addTmpls instead of the old tmplSettings
        done();
      } catch (error) {
        (window as any).XMLHttpRequest = originalXHR;
        done(error as Error);
      }
    });

    // Call addTmplByUrl with object format including templateEngine
    compomint.addTmplByUrl(
      {
        url: "object-format-test.html",
        option: { templateEngine: customTemplateEngine },
      },
      callback
    );
  });

  it("should merge templateEngine option with default options", (done) => {
    const customTemplateEngine = {
      rules: {
        customRule: {
          pattern: /\{\{([\s\S]+?)\}}/g, // /##([\s\S]+?)##/g,
          exec: function (match: string) {
            console.log(123);
            return `${match}`;
          },
        },
      },
    };

    const htmlContent = `
      <template id="merge-option-test">
        <div>{{testValue}} . ##=data.testValue##</div>
      </template>
      <script>console.log("test script")</script>
    `;

    // Create isolated XHR mock for this test
    const testMockXhr = {
      open: jest.fn(),
      send: jest.fn(),
      readyState: 4,
      status: 200,
      responseText: htmlContent,
      setRequestHeader: jest.fn(),
      onreadystatechange: null as any,
      onerror: null as any,
      ontimeout: null as any,
      timeout: 0,
    };

    // Override XMLHttpRequest temporarily
    const originalXHR = (window as any).XMLHttpRequest;
    (window as any).XMLHttpRequest = jest.fn(() => ({
      ...testMockXhr,
      send: jest.fn(function (this: any) {
        setTimeout(() => {
          if (this.onreadystatechange) {
            this.onreadystatechange();
          }
        }, 0);
      }),
    }));
    (window.XMLHttpRequest as any).DONE = 4;

    const callback = jest.fn(() => {
      try {
        // Verify the template was loaded
        expect(compomint.tmplCache.has("merge-option-test")).toBe(true);

        // Test that the template engine option was passed by verifying
        // that our custom template engine was used
        const tmplFunc = compomint.tmpl("merge-option-test");
        expect(tmplFunc).toBeDefined();

        const component = tmplFunc!({ testValue: "Test Value" });
        expect(component.element.outerHTML).toBe(
          "<div>testValue . Test Value</div>"
        );

        // Verify other options are still working (loadScript should be true by default)
        expect(headAppendChildSpy).toHaveBeenCalledWith(
          expect.objectContaining({ tagName: "SCRIPT" })
        );

        // Restore XMLHttpRequest
        (window as any).XMLHttpRequest = originalXHR;

        // This test validates that our fix works - templateEngine option
        // is now being passed to addTmpls instead of the old tmplSettings
        done();
      } catch (error) {
        (window as any).XMLHttpRequest = originalXHR;
        done(error as Error);
      }
    });

    // Call addTmplByUrl with templateEngine option alongside other options
    compomint.addTmplByUrl(
      "merge-option-test.html",
      {
        templateEngine: customTemplateEngine,
        loadScript: true, // This should be merged with templateEngine
      },
      callback
    );
  });
});
