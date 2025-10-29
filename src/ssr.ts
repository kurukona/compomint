/*
 * Copyright (c) 2025-present, Choi Sungho
 * Code released under the MIT license
 */

import { CompomintGlobal, ComponentScope, TemplateEngine } from "./type";

/**
 * @interface SSROptions
 * @description Options for server-side rendering.
 */
export interface SSROptions {
  renderToString?: boolean;
  hydrateOnClient?: boolean;
  generateIds?: boolean;
  preserveWhitespace?: boolean;
  lang?: string;
}

/**
 * @interface SSRRenderResult
 * @description The result of a server-side render.
 */
export interface SSRRenderResult {
  html: string;
  css: string;
  scripts: string[];
  metadata: {
    templateIds: string[];
    componentIds: string[];
    renderTime: number;
  };
}

/**
 * @constant {object} Environment
 * @description Environment detection utilities.
 */
// Store original window state before SSR setup
const _originalWindow = typeof window;

export const Environment = {
  /**
   * @function isServer
   * @description Check if we're in a server environment.
   * @returns {boolean} True if in a server environment.
   */
  isServer(): boolean {
    return (
      (_originalWindow === "undefined" ||
        (globalThis as any).__SSR_ENVIRONMENT__) &&
      typeof globalThis !== "undefined" &&
      typeof (globalThis as any).process !== "undefined" &&
      typeof ((globalThis as any).process as any).versions !== "undefined" &&
      !!((globalThis as any).process as any).versions.node
    );
  },

  /**
   * @function isBrowser
   * @description Check if we're in a browser environment.
   * @returns {boolean} True if in a browser environment.
   */
  isBrowser(): boolean {
    return (
      _originalWindow !== "undefined" &&
      typeof document !== "undefined" &&
      !(globalThis as any).__SSR_ENVIRONMENT__
    );
  },

  /**
   * @function hasDOM
   * @description Check if DOM APIs are available.
   * @returns {boolean} True if DOM APIs are available.
   */
  hasDOM(): boolean {
    return (
      typeof document !== "undefined" &&
      typeof document.createElement === "function"
    );
  },

  /**
   * @function isNode
   * @description Check if we're in a Node.js environment.
   * @returns {boolean} True if in a Node.js environment.
   */
  isNode(): boolean {
    return (
      typeof (globalThis as any).process !== "undefined" &&
      typeof ((globalThis as any).process as any).versions !== "undefined" &&
      !!((globalThis as any).process as any).versions.node
    );
  },
};

/**
 * @class SSRDOMPolyfill
 * @description Provides DOM polyfills for server-side rendering.
 */
export class SSRDOMPolyfill {
  private static instance: SSRDOMPolyfill;
  private elements: Map<string, any> = new Map();
  private styleCollector: string[] = [];
  private scriptCollector: string[] = [];

  static getInstance(): SSRDOMPolyfill {
    if (!SSRDOMPolyfill.instance) {
      SSRDOMPolyfill.instance = new SSRDOMPolyfill();
    }
    return SSRDOMPolyfill.instance;
  }

  /**
   * Create a minimal DOM-like element for SSR.
   * @param {string} tagName - The tag name of the element to create.
   * @returns {any} A polyfilled DOM element.
   */
  createElement(tagName: string): any {
    const element = {
      nodeType: 1, // Element nodeType
      tagName: tagName.toUpperCase(),
      id: "",
      className: "",
      textContent: "",
      _innerHTML: "",
      attributes: new Map<string, string>(),
      children: [] as any[],
      parentNode: null as any,
      style: {} as any,
      dataset: {} as any,
      firstChild: null as any,
      lastChild: null as any,
      childElementCount: 0,
      firstElementChild: null as any,
      content: null as any, // For template elements

      // Make childNodes iterable
      get childNodes() {
        return this.children;
      },

      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
        if (name === "id") this.id = value;
        if (name === "class") this.className = value;
      },

      // Override innerHTML setter to parse HTML
      set innerHTML(html: string) {
        this._innerHTML = html;
        // Clear existing children
        this.children = [];

        // Parse HTML and create child elements
        if (html) {
          this.parseAndCreateChildren(html);
        }
      },

      get innerHTML(): string {
        return this._innerHTML || "";
      },

      parseAndCreateChildren(html: string) {
        // Simple HTML parsing for template elements - more flexible regex
        const templateRegex =
          /<template[^>]*?id\s*=\s*["']([^"']+)["'][^>]*?>([\s\S]*?)<\/template>/gi;
        const scriptRegex =
          /<script[^>]*?type\s*=\s*["']text\/template["'][^>]*?id\s*=\s*["']([^"']+)["'][^>]*?>([\s\S]*?)<\/script>/gi;
        const scriptCompomintRegex =
          /<script[^>]*?type\s*=\s*["']text\/compomint["'][^>]*?id\s*=\s*["']([^"']+)["'][^>]*?>([\s\S]*?)<\/script>/gi;

        let match;

        // Match template elements
        templateRegex.lastIndex = 0; // Reset regex
        while ((match = templateRegex.exec(html)) !== null) {
          const templateElement = this.createTemplateElement(
            match[1],
            match[2]
          );
          this.children.push(templateElement);
        }

        // Match script[type="text/template"] elements
        scriptRegex.lastIndex = 0; // Reset regex
        while ((match = scriptRegex.exec(html)) !== null) {
          const scriptElement = this.createScriptElement(
            match[1],
            match[2],
            "text/template"
          );
          this.children.push(scriptElement);
        }

        // Match script[type="text/compomint"] elements
        scriptCompomintRegex.lastIndex = 0; // Reset regex
        while ((match = scriptCompomintRegex.exec(html)) !== null) {
          const scriptElement = this.createScriptElement(
            match[1],
            match[2],
            "text/compomint"
          );
          this.children.push(scriptElement);
        }
      },

      createTemplateElement(id: string, content: string) {
        const polyfill = SSRDOMPolyfill.getInstance();
        const template = polyfill.createElement("template");
        template.id = id;
        template.setAttribute("id", id);

        // Unescape HTML entities for template content
        const unescapedContent = content
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'");

        template._innerHTML = unescapedContent;
        return template;
      },

      createScriptElement(id: string, content: string, type: string) {
        const polyfill = SSRDOMPolyfill.getInstance();
        const script = polyfill.createElement("script");
        script.id = id;
        script.setAttribute("id", id);
        script.setAttribute("type", type);
        script._innerHTML = content;
        return script;
      },

      getAttribute(name: string): string | null {
        return this.attributes.get(name) || null;
      },

      appendChild(child: any) {
        this.children.push(child);
        child.parentNode = this;
        this.firstChild = this.children[0] || null;
        this.lastChild = this.children[this.children.length - 1] || null;
        this.childElementCount = this.children.length;
        this.firstElementChild = this.children[0] || null;
        return child;
      },

      removeChild(child: any) {
        const index = this.children.indexOf(child);
        if (index > -1) {
          this.children.splice(index, 1);
          child.parentNode = null;
          this.firstChild = this.children[0] || null;
          this.lastChild = this.children[this.children.length - 1] || null;
          this.childElementCount = this.children.length;
          this.firstElementChild = this.children[0] || null;
        }
        return child;
      },

      normalize() {
        // Mock normalize function
      },

      querySelector(selector: string): any {
        // Simple implementation for basic selectors
        if (selector.startsWith("#")) {
          const id = selector.substring(1);
          return this.findById(id);
        }
        if (selector.startsWith(".")) {
          const className = selector.substring(1);
          return this.findByClass(className);
        }
        return this.findByTagName(selector);
      },

      querySelectorAll(selector: string): any[] {
        const results: any[] = [];

        // Handle comma-separated selectors
        const selectors = selector.split(",").map((s) => s.trim());

        for (const sel of selectors) {
          // Check self first
          if (this.matches && this.matches(sel)) {
            if (!results.includes(this)) {
              results.push(this);
            }
          }

          // Search children recursively
          for (const child of this.children) {
            if (child.querySelectorAll) {
              const childResults = child.querySelectorAll(sel);
              for (const result of childResults) {
                if (!results.includes(result)) {
                  results.push(result);
                }
              }
            }
          }
        }

        return results;
      },

      matches(selector: string): boolean {
        const trimmedSelector = selector.trim();

        if (trimmedSelector.startsWith("#")) {
          return this.id === trimmedSelector.substring(1);
        }
        if (trimmedSelector.startsWith(".")) {
          return this.className.includes(trimmedSelector.substring(1));
        }

        // Handle attribute selectors like template[id], script[type="text/template"][id]
        if (trimmedSelector.includes("[") && trimmedSelector.includes("]")) {
          // Extract tag name if present
          const tagMatch = trimmedSelector.match(/^(\w+)(?:\[|$)/);
          if (tagMatch) {
            const expectedTag = tagMatch[1].toLowerCase();
            if (this.tagName.toLowerCase() !== expectedTag) {
              return false;
            }
          }

          // Extract all attribute selectors
          const attrMatches = trimmedSelector.match(/\[([^\]]+)\]/g);
          if (attrMatches) {
            for (const attrMatch of attrMatches) {
              // Parse individual attribute selector
              const attrContent = attrMatch.slice(1, -1); // Remove [ and ]

              if (attrContent.includes("=")) {
                // Attribute with value like [type="text/template"]
                const parts = attrContent.split("=");
                const attrName = parts[0].trim();
                const attrValue = parts[1].replace(/['"]/g, "").trim();

                if (this.getAttribute(attrName) !== attrValue) {
                  return false;
                }
              } else {
                // Attribute without value like [id]
                const attrName = attrContent.trim();
                const hasAttr = this.getAttribute(attrName) !== null;
                if (!hasAttr) {
                  return false;
                }
              }
            }
          }

          return true;
        }

        // Simple tag selector
        return this.tagName.toLowerCase() === trimmedSelector.toLowerCase();
      },

      findById(id: string): any {
        if (this.id === id) return this;
        for (const child of this.children) {
          const found = child.findById && child.findById(id);
          if (found) return found;
        }
        return null;
      },

      findByClass(className: string): any {
        if (this.className.includes(className)) return this;
        for (const child of this.children) {
          const found = child.findByClass && child.findByClass(className);
          if (found) return found;
        }
        return null;
      },

      findByTagName(tagName: string): any {
        if (this.tagName === tagName.toUpperCase()) return this;
        for (const child of this.children) {
          const found = child.findByTagName && child.findByTagName(tagName);
          if (found) return found;
        }
        return null;
      },

      // Convert to HTML string
      toHTML(): string {
        // Special handling for template elements - return their content
        if (this.tagName.toLowerCase() === "template") {
          if (this.innerHTML) {
            return this.innerHTML;
          } else {
            // Return children content
            return this.children
              .map((child: any) =>
                typeof child === "string"
                  ? child
                  : child.toHTML
                  ? child.toHTML()
                  : ""
              )
              .join("");
          }
        }

        let html = `<${this.tagName.toLowerCase()}`;

        // Add attributes
        for (const [name, value] of this.attributes) {
          html += ` ${name}="${value}"`;
        }

        // Self-closing tags
        if (
          ["img", "br", "hr", "input", "meta", "link"].includes(
            this.tagName.toLowerCase()
          )
        ) {
          html += " />";
          return html;
        }

        html += ">";

        // Add content
        if (this.textContent) {
          html += this.textContent;
        } else if (this.innerHTML) {
          html += this.innerHTML;
        } else {
          // Add children
          for (const child of this.children) {
            if (typeof child === "string") {
              html += child;
            } else if (child.toHTML) {
              html += child.toHTML();
            }
          }
        }

        html += `</${this.tagName.toLowerCase()}>`;
        return html;
      },
    };

    // Special handling for template elements
    if (tagName.toLowerCase() === "template") {
      element.content = this.createDocumentFragment();

      // Override innerHTML for template elements to populate content
      const originalSetInnerHTML = element.innerHTML;
      Object.defineProperty(element, "innerHTML", {
        get: function () {
          return this._innerHTML || "";
        },
        set: function (html: string) {
          this._innerHTML = html;
          // Clear existing content
          this.content.children = [];

          // Parse and add to content
          if (html) {
            this.parseAndCreateChildren(html);
            // Copy parsed children to content
            for (const child of this.children) {
              this.content.children.push(child);
              child.parentNode = this.content;
            }
            // Update content fragment properties
            this.content.firstChild = this.content.children[0] || null;
            this.content.lastChild =
              this.content.children[this.content.children.length - 1] || null;
            this.content.childElementCount = this.content.children.length;
            this.content.firstElementChild = this.content.children[0] || null;
          }
        },
        configurable: true,
        enumerable: true,
      });
    }

    return element;
  }

  /**
   * Create a document fragment for SSR.
   * @returns {any} A polyfilled document fragment.
   */
  createDocumentFragment(): any {
    return {
      nodeType: 11, // DocumentFragment nodeType
      children: [] as any[],
      firstChild: null as any,
      lastChild: null as any,
      childElementCount: 0,
      firstElementChild: null as any,

      // Make childNodes iterable
      get childNodes() {
        return this.children;
      },

      appendChild(child: any) {
        this.children.push(child);
        child.parentNode = this;
        this.firstChild = this.children[0] || null;
        this.lastChild = this.children[this.children.length - 1] || null;
        this.childElementCount = this.children.length;
        this.firstElementChild = this.children[0] || null;
        return child;
      },

      removeChild(child: any) {
        const index = this.children.indexOf(child);
        if (index > -1) {
          this.children.splice(index, 1);
          child.parentNode = null;
          this.firstChild = this.children[0] || null;
          this.lastChild = this.children[this.children.length - 1] || null;
          this.childElementCount = this.children.length;
          this.firstElementChild = this.children[0] || null;
        }
        return child;
      },

      normalize() {
        // Mock normalize function
      },

      querySelector(selector: string): any {
        for (const child of this.children) {
          if (child.querySelector) {
            const result = child.querySelector(selector);
            if (result) return result;
          }
        }
        return null;
      },

      querySelectorAll(selector: string): any[] {
        const results: any[] = [];

        // Handle comma-separated selectors
        const selectors = selector.split(",").map((s) => s.trim());

        for (const sel of selectors) {
          // Search children
          for (const child of this.children) {
            if (child.querySelectorAll) {
              const childResults = child.querySelectorAll(sel);
              for (const result of childResults) {
                if (!results.includes(result)) {
                  results.push(result);
                }
              }
            }
          }
        }

        return results;
      },

      toHTML(): string {
        return this.children
          .map((child: any) =>
            typeof child === "string" ? child : child.toHTML ? child.toHTML() : ""
          )
          .join("");
      },
    };
  }

  /**
   * Create a text node for SSR.
   * @param {string} text - The text content.
   * @returns {any} A polyfilled text node.
   */
  createTextNode(text: string): any {
    return {
      nodeType: 3,
      textContent: text,
      toHTML(): string {
        return this.textContent;
      },
    };
  }

  /**
   * Create a comment node for SSR.
   * @param {string} text - The comment text.
   * @returns {any} A polyfilled comment node.
   */
  createComment(text: string): any {
    return {
      nodeType: 8,
      textContent: text,
      toHTML(): string {
        return `<!-- ${this.textContent} -->`;
      },
    };
  }

  /**
   * Collect styles during SSR.
   * @param {string} css - The CSS to collect.
   */
  collectStyle(css: string): void {
    this.styleCollector.push(css);
  }

  /**
   * Collect scripts during SSR.
   * @param {string} script - The script to collect.
   */
  collectScript(script: string): void {
    this.scriptCollector.push(script);
  }

  /**
   * Get collected styles.
   * @returns {string} The collected CSS.
   */
  getCollectedStyles(): string {
    return this.styleCollector.join("\n");
  }

  /**
   * Get collected scripts.
   * @returns {string[]} The collected scripts.
   */
  getCollectedScripts(): string[] {
    return [...this.scriptCollector];
  }

  /**
   * Reset the style and script collectors.
   */
  reset(): void {
    this.styleCollector = [];
    this.scriptCollector = [];
  }
}

/**
 * Creates a mock document object for SSR.
 * @returns {object} A mock document object.
 */
export function createSSRDocument() {
  const polyfill = SSRDOMPolyfill.getInstance();

  return {
    createElement: (tagName: string) => polyfill.createElement(tagName),
    createDocumentFragment: () => polyfill.createDocumentFragment(),
    createTextNode: (text: string) => polyfill.createTextNode(text),
    createComment: (text: string) => polyfill.createComment(text),

    getElementById: (id: string) => null,

    head: {
      appendChild: (element: any) => {
        if (element.tagName === "STYLE") {
          polyfill.collectStyle(element.textContent || element.innerHTML);
        } else if (element.tagName === "SCRIPT") {
          polyfill.collectScript(element.textContent || element.innerHTML);
        }
      },
      removeChild: () => {},
      innerHTML: "",
    },

    body: {
      appendChild: () => {},
      removeChild: () => {},
      innerHTML: "",
      contains: () => false,
    },

    documentElement: {
      lang: "en",
      getAttribute: function (name: string) {
        if (name === "lang") return this.lang;
        return null;
      },
      setAttribute: function (name: string, value: string) {
        if (name === "lang") this.lang = value;
      },
    },
  };
}

/**
 * Creates a mock window object for SSR.
 * @returns {object} A mock window object.
 */
export function createSSRWindow() {
  return {
    Node: {
      prototype: {},
    },
    Element: {
      prototype: {},
    },
    CharacterData: {
      prototype: {},
    },
    DocumentType: {
      prototype: {},
    },
    XMLHttpRequest: function () {
      throw new Error("XMLHttpRequest is not available in SSR environment");
    },
  };
}

/**
 * Creates a mock Element class for the global scope in SSR.
 * @returns {any} A mock Element class.
 */
export function createSSRElementClass() {
  const SSRElement = class {
    tagName: string = "";
    innerHTML: string = "";
    textContent: string = "";
    id: string = "";
    className: string = "";
    children: any[] = [];
    parentNode: any = null;

    constructor(tagName?: string) {
      if (tagName) this.tagName = tagName.toUpperCase();
    }
  };

  return SSRElement;
}

/**
 * Sets up the SSR environment by polyfilling global DOM objects.
 * @returns {boolean} True if the SSR environment was set up, false otherwise.
 */
export function setupSSREnvironment() {
  if (Environment.isNode()) {
    // Mark as SSR environment
    (globalThis as any).__SSR_ENVIRONMENT__ = true;

    // Setup global DOM polyfills
    const ssrDocument = createSSRDocument();
    const ssrWindow = createSSRWindow();

    (globalThis as any).document = ssrDocument;
    (globalThis as any).window = ssrWindow;

    // Also set on global for Node.js compatibility
    if (typeof (globalThis as any).global !== "undefined") {
      ((globalThis as any).global as any).document = ssrDocument;
      ((globalThis as any).global as any).window = ssrWindow;
    }

    // Setup global Element, Node classes
    (globalThis as any).Element = createSSRElementClass();
    (globalThis as any).Node = class SSRNode {};
    (globalThis as any).CharacterData = class SSRCharacterData {};
    (globalThis as any).DocumentType = class SSRDocumentType {};

    // Mock XMLHttpRequest to prevent errors
    (globalThis as any).XMLHttpRequest = function () {
      throw new Error(
        "XMLHttpRequest is not available in SSR environment. Use static template rendering instead."
      );
    };

    return true;
  }
  return false;
}
