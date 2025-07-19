/*
 * Copyright (c) 2025-present, Choi Sungho
 * Code released under the MIT license
 */

import {
  CompomintGlobal,
  ComponentScope,
  LazyScope,
  RenderingFunction,
  TemplateEngine,
  TemplateMeta,
  TemplateRule,
  Tools,
  TemplateElement,
  CompomintConfigs,
} from "./type";
import { defaultTemplateEngine } from "./default-template-engine";
import { applyBuiltInTemplates } from "./built-in-templates";
import { firstElementChild, childElementCount, cleanNode } from "./utils";
import { Environment, setupSSREnvironment, SSRDOMPolyfill } from "./ssr";
import { SSRRenderer, createSSRRenderer } from "./ssr-renderer";
import { defaultTemplateEngineSSR } from "./default-template-engine-ssr";

// Polyfill for Object.assign
if (typeof Object.assign != "function") {
  Object.defineProperty(Object, "assign", {
    value: function assign(target: any, ...params: any[]) {
      if (target == null) {
        throw new TypeError("Cannot convert undefined or null to object");
      }
      const to = Object(target);
      for (let index = 0, length = params.length; index < length; index++) {
        const nextSource = params[index];
        if (nextSource != null) {
          for (let nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true,
  });
}

// Polyfill for ChildNode.remove
(function (arr: any[]) {
  arr.forEach(function (item) {
    if (!item || item.hasOwnProperty("remove")) {
      return;
    }
    Object.defineProperty(item, "remove", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function remove() {
        if (this.parentNode !== null) {
          this.parentNode.removeChild(this);
        }
      },
    });
  });
})(
  [
    typeof Element !== "undefined" ? Element.prototype : {},
    typeof CharacterData !== "undefined" ? CharacterData.prototype : {},
    typeof DocumentType !== "undefined" ? DocumentType.prototype : {},
  ].filter(Boolean)
);

// Polyfill for Node.isConnected
(function (supported: boolean) {
  if (supported || typeof window === "undefined" || !window.Node) return;
  Object.defineProperty(window.Node.prototype, "isConnected", {
    get: function (): boolean {
      return document.body.contains(this);
    },
  });
})(
  typeof window !== "undefined" &&
  window.Node &&
  "isConnected" in window.Node.prototype
);

const compomint = {} as CompomintGlobal;
const tmpl = {} as Record<string, any>;
const tools = (compomint.tools = compomint.tools || ({} as Tools));
const configs: CompomintConfigs = (compomint.configs = Object.assign(
  { printExecTime: false, debug: false, throwError: true },
  compomint.configs
));
const cachedTmpl = (compomint.tmplCache =
  compomint.tmplCache || new Map<string, TemplateMeta>());
if (!cachedTmpl.has("anonymous")) {
  cachedTmpl.set("anonymous", { elements: new Set() } as TemplateMeta); // Cast to TemplateMeta
}
const isSupportTemplateTag =
  typeof document !== "undefined" &&
  "content" in document.createElement("template");

const noMatch = /(.)^/;
const escapes: Record<string, string> = {
  "'": "\\'",
  "\\": "\\\\",
  "\r": "\\r",
  "\n": "\\n",
  "\t": "\\t",
  "\u2028": "\u2028",
  "\u2029": "\u2029",
  "><": "><",
  "<": "<",
  ">": ">",
};

const escaper = /\>( |\n)+\<|\>( |\n)+|( |\n)+\<|\\|'|\r|\n|\t|\u2028|\u2029/g;

// set default template config
if (Environment.isServer()) {
  compomint.templateEngine = defaultTemplateEngineSSR(compomint);
} else {
  compomint.templateEngine = defaultTemplateEngine(compomint);
}

const escapeHtml = (function () {
  const escapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;", // Use HTML entity for single quote
    "`": "&#x60;", // Use HTML entity for backtick
    //"\n": "&#10;", // Keep newline escaping if needed, otherwise remove
  };

  const unescapeMap: Record<string, string> = Object.keys(escapeMap).reduce(
    (acc: Record<string, string>, key: string) => {
      acc[escapeMap[key]] = key;
      return acc;
    },
    {} as Record<string, string>
  );

  const createEscaper = function (
    map: Record<string, string>
  ): (str: string) => string {
    const escaper = function (match: string): string {
      return map[match];
    };
    const source = `(?:${Object.keys(map).join("|").replace(/\\/g, "\\\\")})`; // Escape backslashes if any keys have them
    const testRegexp = RegExp(source);
    const replaceRegexp = RegExp(source, "g");
    return function (string: string | null | undefined): string {
      string = string == null ? "" : `${string}`;
      return testRegexp.test(string)
        ? string.replace(replaceRegexp, escaper)
        : string;
    };
  };

  return {
    escape: createEscaper(escapeMap),
    unescape: createEscaper(unescapeMap),
  };
})();
tools.escapeHtml = escapeHtml;

const matcherFunc = function (templateRules: Record<string, TemplateRule>): {
  templateRules: Record<string, TemplateRule>;
  pattern: RegExp;
  exec: ((...args: any[]) => string)[];
  lazyExecKeys: string[];
  lazyExec: Record<
    string,
    (
      data: Record<string, any>,
      lazyScope: LazyScope,
      component: ComponentScope,
      wrapper: DocumentFragment | Element
    ) => void
  >;
  lazyScopeSeed: string;
} {
  const patternArray: string[] = [];
  const execArray: ((...args: any[]) => string)[] = [];
  const lazyExecMap: Record<
    string,
    (
      data: Record<string, any>,
      lazyScope: LazyScope,
      component: ComponentScope,
      wrapper: DocumentFragment | Element
    ) => void
  > = {};
  const lazyScopeSeed: Record<string, any[]> = {};

  Object.keys(templateRules).forEach(function (key) {
    const templateRule = templateRules[key] as TemplateRule | any; // Type assertion
    if (
      templateRule &&
      typeof templateRule === "object" &&
      templateRule.pattern instanceof RegExp &&
      typeof templateRule.exec === "function"
    ) {
      patternArray.push((templateRule.pattern || noMatch).source);
      execArray.push(templateRule.exec);
    }
    if (
      templateRule &&
      typeof templateRule === "object" &&
      typeof templateRule.lazyExec === "function"
    ) {
      const arrayKey = `${key}Array`;
      lazyExecMap[arrayKey] = templateRule.lazyExec;
      lazyScopeSeed[arrayKey] = [];
    }
  });
  return {
    templateRules: templateRules,
    pattern: new RegExp(patternArray.join("|"), "g"),
    exec: execArray,
    lazyExecKeys: Object.keys(lazyScopeSeed),
    lazyExec: lazyExecMap,
    lazyScopeSeed: JSON.stringify(lazyScopeSeed),
  };
};

const escapeFunc = function (match: string): string {
  return escapes[match] || escapes[match.replace(/[ \n]/g, "")] || "";
};

const defaultMatcher = matcherFunc(compomint.templateEngine.rules);

const templateParser = function (
  tmplId: string,
  text: string,
  matcher: ReturnType<typeof matcherFunc>
): string {
  if (configs.printExecTime) console.time(`tmpl: ${tmplId}`);

  let index = 0;
  let source = "";

  text.replace(matcher.pattern, function (...params: any[]): string {
    const match: string = params[0];
    const offset: number = params[params.length - 2];

    source += text.slice(index, offset).replace(escaper, escapeFunc);

    let selectedMatchContent: string | undefined;
    let matchIndex: number | null = null;

    params.slice(1, -2).some(function (value: any, idx: number) {
      if (value !== undefined) {
        selectedMatchContent = value;
        matchIndex = idx;
        return true;
      }
      return false;
    });

    if (selectedMatchContent !== undefined && matchIndex !== null) {
      try {
        source += matcher.exec[matchIndex].call(
          matcher.templateRules,
          selectedMatchContent,
          tmplId
        );
      } catch (e: any) {
        console.error(
          `Error executing template rule index ${matchIndex} for match "${selectedMatchContent}" in template "${tmplId}":`,
          e
        );
        if (configs.throwError) throw e;
        source += "";
      }
    } else {
      source += match.replace(escaper, escapeFunc);
    }

    index = offset + match.length;
    return match;
  });

  source += text.slice(index).replace(escaper, escapeFunc);

  if (configs.printExecTime) console.timeEnd(`tmpl: ${tmplId}`);
  return source;
};

const templateBuilder = (compomint.template =
  function compomint_templateBuilder(
    tmplId: string,
    templateText: string,
    customTemplateEngine?: Partial<TemplateEngine>
  ): RenderingFunction {
    let templateEngine = compomint.templateEngine;
    let matcher = defaultMatcher;

    if (customTemplateEngine) {
      templateEngine = {
        rules: Object.assign(
          {},
          templateEngine.rules,
          customTemplateEngine.rules || {}
        ),
        keys: Object.assign(
          {},
          templateEngine.keys,
          customTemplateEngine.keys || {}
        ),
      };
      matcher = matcherFunc(templateEngine.rules);
    }

    const source = `
/* tmplId: ${tmplId} */
//# sourceURL=http://tmpl//${tmplId.split("-").join("//")}.js
// if (__debugger) {
// debugger;
// }
let __p='';
__p+='${templateParser(tmplId, templateText, matcher)}';
return __p;`;

    let sourceGenFunc: Function | null = null;

    try {
      sourceGenFunc = new Function(
        templateEngine.keys.dataKeyName as string,
        templateEngine.keys.statusKeyName as string,
        templateEngine.keys.componentKeyName as string,
        templateEngine.keys.i18nKeyName as string,
        "compomint",
        "tmpl",
        "__lazyScope",
        "__debugger",
        source
      );
    } catch (e: any) {
      if (configs.throwError) {
        console.error(
          `Template compilation error in "${tmplId}", ${e.name}: ${e.message}`
        );
        try {
          // Attempt re-run for potential browser debugging
          new Function(
            templateEngine.keys.dataKeyName as string,
            templateEngine.keys.statusKeyName as string,
            templateEngine.keys.componentKeyName as string,
            templateEngine.keys.i18nKeyName as string,
            "compomint",
            "tmpl",
            "__lazyScope",
            "__debugger",
            source
          );
        } catch {
          /* Ignore re-run error */
        }
        throw e;
      } else {
        return () => ({} as ComponentScope); // Return a dummy function if not throwing
      }
    }

    const renderingFunc: RenderingFunction =
      function compomint_renderingFuncBuilder(...params): ComponentScope {
        let data: Record<string, any>;
        let wrapperElement: Element | undefined;
        let callback: ((component: ComponentScope) => void) | undefined;
        let baseComponent: Partial<ComponentScope> | undefined;
        let existingElement: HTMLElement | undefined;

        // Argument parsing logic
        const firstArg = params[0];
        if (
          firstArg &&
          typeof firstArg === "object" &&
          (firstArg.$wrapperElement ||
            firstArg.$callback ||
            firstArg.$baseComponent ||
            firstArg.$existingElement)
        ) {
          data = { ...firstArg }; // Clone data object
          wrapperElement = data.$wrapperElement;
          delete data.$wrapperElement;
          callback = data.$callback;
          delete data.$callback;
          baseComponent = data.$baseComponent;
          delete data.$baseComponent;
          existingElement = data.$existingElement;
          delete data.$existingElement;
        } else {
          data = firstArg;
          if (typeof params[1] === "function") {
            wrapperElement = undefined;
            callback = params[1] as (component: ComponentScope) => void;
            baseComponent = params[2];
          } else {
            wrapperElement = params[1];
            callback = params[2];
            baseComponent = params[3];
          }
        }

        const dataKeyName = templateEngine.keys.dataKeyName as string;
        const statusKeyName = templateEngine.keys.statusKeyName as string;
        const lazyScope: LazyScope = JSON.parse(matcher.lazyScopeSeed);

        const component: ComponentScope = Object.assign(baseComponent || {}, {
          tmplId: tmplId,
          element: null as any, // Initialize element
          status: (baseComponent && baseComponent.status) || {}, // Ensure status exists
          replace: function (newComponent: ComponentScope | Element): void {
            const self = this as ComponentScope;
            if (
              !self.element ||
              !(self.element instanceof Node) ||
              !self.element.parentElement
            ) {
              if (configs.debug)
                console.warn(
                  `Cannot replace template "${tmplId}": element not in DOM.`
                );
              return;
            }
            self.element.parentElement.replaceChild(
              (newComponent as ComponentScope).element ||
              (newComponent as Element),
              self.element as Node
            );
          },
          remove: function (
            spacer: boolean = false
          ): Element | TemplateElement | Comment | DocumentFragment {
            const self = this as ComponentScope;
            if (self.beforeRemove) {
              try {
                self.beforeRemove();
              } catch (e) {
                console.error("Error in beforeRemove:", e);
              }
            }

            // Remote event event listener
            // Iterate through all event handlers stored in lazyScope.eventArray
            if (lazyScope.eventArray) {
              lazyScope.eventArray.forEach(function (event) {
                // For each event entry, iterate through its associated event listeners
                event.forEach(function (selectedEvent: Record<string, any>) {
                  if (selectedEvent.element) {
                    if (typeof selectedEvent.eventFunc === "function") {
                      selectedEvent.element.removeEventListener(
                        "click",
                        selectedEvent.eventFunc as EventListenerOrEventListenerObject
                      ); // Remove click event listener
                    } else {
                      Object.keys(selectedEvent.eventFunc).forEach(function (
                        eventType
                      ) {
                        selectedEvent.element.removeEventListener(
                          eventType,
                          (
                            selectedEvent.eventFunc as Record<
                              string,
                              EventListenerOrEventListenerObject
                            >
                          )[eventType]
                        );
                      });
                    }
                    Object.keys(selectedEvent).forEach(
                      (key) => delete selectedEvent[key]
                    );
                  }
                  // Clear the selectedEvent object to release references
                });
              });
            }

            const parent =
              self.element instanceof Node ? self.element.parentElement : null;
            const removedElement:
              | Element
              | TemplateElement
              | Comment
              | DocumentFragment = self.element; // Store reference

            if (parent) {
              if (spacer) {
                const dumy = document.createElement("template");
                parent.replaceChild(dumy, self.element as Node);
                self.element = dumy; // Update scope's element reference
              } else {
                parent.removeChild(self.element as Node);
              }
            } else if (configs.debug) {
              console.warn(
                `Cannot remove template "${tmplId}": element not in DOM.`
              );
            }

            if (self.afterRemove) {
              try {
                self.afterRemove();
              } catch (e) {
                console.error("Error in afterRemove:", e);
              }
            }
            return removedElement;
          },
          appendTo: function (parentElement: Element): ComponentScope {
            const self = this as ComponentScope;
            if (self.beforeAppendTo) {
              try {
                self.beforeAppendTo();
              } catch (e) {
                console.error("Error in beforeAppendTo:", e);
              }
            }

            if (parentElement && self.element instanceof Node) {
              parentElement.appendChild(self.element);
            } else if (configs.debug) {
              console.warn(
                `Cannot append template "${tmplId}": parentElement or scope.element is missing or not a Node.`
              );
            }

            if (self.afterAppendTo) {
              setTimeout(() => {
                try {
                  self.afterAppendTo!();
                } catch (e) {
                  console.error("Error in afterAppendTo:", e);
                }
              }, 0);
            }
            return self;
          },
          release: function (): void {
            /* Implementation below */
          },
          render: function (newData: Record<string, any>): ComponentScope {
            /* Implementation below */ return this;
          },
          refresh: function (reflashData: Record<string, any>): ComponentScope {
            /* Implementation below */ return this;
          },
          reflash: function (reflashData: Record<string, any>): ComponentScope {
            /* Implementation below */ return this;
          },
        } as ComponentScope); // Cast to ComponentScope

        if (!component._id) {
          component._id = tools.genId(tmplId);
        }
        component[dataKeyName] = data;
        if (component[statusKeyName] == undefined) {
          component[statusKeyName] = {};
        }

        const hasParent = wrapperElement instanceof Element;
        const temp = document.createElement("template");

        if (configs.printExecTime) console.time(`render: ${tmplId}`);

        let returnTarget: Node | null = null;
        let renderedHTML: string | null = null;
        try {
          renderedHTML = !data
            ? `<template data-co-empty-template="${tmplId}"></template>`
            : sourceGenFunc!.call(
              // Use non-null assertion
              wrapperElement || null,
              data,
              component[statusKeyName],
              component,
              compomint.i18n[tmplId],
              compomint,
              tmpl,
              lazyScope,
              configs.debug // Pass debug flag for __debugger
            );
        } catch (e: any) {
          if (configs.throwError) {
            console.error(
              `Runtime error during render of "${tmplId}":`,
              e.message
            );
            console.debug("--- Data ---", data, "------------");
            try {
              // Attempt re-run with debugger
              sourceGenFunc!.call(
                wrapperElement || null,
                data,
                component[statusKeyName],
                component,
                compomint.i18n[tmplId],
                lazyScope,
                true
              );
            } catch {
              /* Ignore */
            }
            throw e;
          } else {
            console.warn(
              `Render failed for "${tmplId}". Returning scope with comment node.`
            );
            component.element = document.createComment(
              `Render Error: ${tmplId}`
            ) as any;
            return component;
          }
        }
        if (configs.printExecTime) console.timeEnd(`render: ${tmplId}`);

        temp.innerHTML = renderedHTML!;
        let docFragment: DocumentFragment | Element | TemplateElement =
          temp.content || temp;

        if (
          (docFragment as any).tagName == "TEMPLATE" &&
          !(temp as any).content
        ) {
          // Check for IE11 case
          const children = Array.from(docFragment.childNodes);
          docFragment = document.createDocumentFragment();
          children.forEach((child) => docFragment.appendChild(child));
        }

        if (hasParent && wrapperElement) {
          while (wrapperElement.firstChild) {
            wrapperElement.removeChild(wrapperElement.firstChild);
          }
          component.wrapperElement = wrapperElement;
        }

        // Handle shadow DOM creation
        const shadowStyle = (docFragment as any).querySelector
          ? (docFragment as any).querySelector("style")
          : null;
        if (shadowStyle && (docFragment as any).querySelector) {
          // Check if querySelector exists

          // In SSR environment, collect styles instead of creating shadow DOM
          if (Environment.isServer()) {
            // Extract and collect all styles for SSR
            const styles = (docFragment as any).querySelectorAll("style");
            styles.forEach((style: any) => {
              const css = style.textContent || style.innerHTML;
              if (
                css &&
                (globalThis as any).document &&
                (globalThis as any).document.head
              ) {
                // Use SSR polyfill to collect styles
                const polyfill = SSRDOMPolyfill.getInstance();
                polyfill.collectStyle(css);
              }
            });
            // Don't create shadow DOM in SSR, leave styles in place for extraction
          } else {
            // Browser environment - create shadow DOM as usual
            const host = document.createElement(tmplId); // Use tmplId as host tag name
            try {
              const shadow = host.attachShadow({ mode: "open" });
              while (docFragment.firstChild) {
                shadow.appendChild(docFragment.firstChild);
              }
              docFragment = host; // Replace fragment with the host element
            } catch (e) {
              console.error(
                `Failed to attach shadow DOM for template "${tmplId}":`,
                e
              );
              // Proceed without shadow DOM if attachShadow fails
            }
          }
        }

        if (docFragment.firstChild && docFragment.firstChild.nodeType == 8) {
          returnTarget = docFragment.firstChild;
        } else if (childElementCount(docFragment) == 1) {
          returnTarget = firstElementChild(docFragment);
          if (hasParent && wrapperElement && returnTarget) {
            if (component.beforeAppendTo) {
              try {
                component.beforeAppendTo();
              } catch (e) {
                console.error("Error in beforeAppendTo:", e);
              }
            }
            wrapperElement.appendChild(returnTarget);
            if (component.afterAppendTo) {
              setTimeout(() => {
                try {
                  component.afterAppendTo!();
                } catch (e) {
                  console.error("Error in afterAppendTo:", e);
                }
              }, 0);
            }
          }
        } else {
          if (hasParent && wrapperElement) {
            if (component.beforeAppendTo) {
              try {
                component.beforeAppendTo();
              } catch (e) {
                console.error("Error in beforeAppendTo:", e);
              }
            }
            wrapperElement.appendChild(docFragment);
            if (component.afterAppendTo) {
              setTimeout(() => {
                try {
                  component.afterAppendTo!();
                } catch (e) {
                  console.error("Error in afterAppendTo:", e);
                }
              }, 0);
            }
            returnTarget = wrapperElement;
          } else {
            returnTarget = docFragment;
          }
        }

        if (data && data.$props && returnTarget instanceof Element) {
          for (const prop in data.$props) {
            try {
              const value = data.$props[prop];
              if (prop.startsWith("data-")) {
                const camelCased = prop
                  .substring(5)
                  .replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                (returnTarget as HTMLElement).dataset[camelCased] =
                  String(value);
              } else if (prop in returnTarget) {
                (returnTarget as any)[prop] = value;
              } else {
                returnTarget.setAttribute(prop, String(value));
              }
            } catch (e: any) {
              console.error(
                `Error applying prop "${prop}" to element in template "${tmplId}":`,
                e
              );
            }
          }
        }

        if (returnTarget instanceof Node && returnTarget.normalize) {
          returnTarget.normalize();
        }
        if (returnTarget instanceof Node) {
          cleanNode(returnTarget);
        }

        if (existingElement) {
          component.element = existingElement;
        } else {
          component.element = returnTarget as HTMLElement | TemplateElement; // Assign final element/fragment
        }

        // Execute lazyExec functions after element is attached
        const lazyExec = matcher.lazyExec;
        if (data) {
          matcher.lazyExecKeys.forEach(function (key) {
            if (lazyScope[key] && lazyScope[key].length > 0) {
              try {
                lazyExec[key].call(
                  templateEngine.rules[key.slice(0, -5)],
                  data,
                  lazyScope,
                  component,
                  docFragment as DocumentFragment | Element
                ); // Cast needed
              } catch (e: any) {
                if (configs.throwError) {
                  console.error(
                    `Error during lazy execution of "${key}" for template "${tmplId}":`,
                    e
                  );
                  throw e;
                }
              }
            }
          });
        }

        if (tools.liveReloadSupport) {
          try {
            tools.liveReloadSupport(component);
          } catch (e) {
            console.error("Error in liveReloadSupport:", e);
          }
        }

        if (callback) {
          try {
            callback.call(wrapperElement || null, component);
          } catch (e: any) {
            console.error(`Error in template callback for "${tmplId}":`, e);
            if (configs.throwError) throw e;
          }
        }

        // Define Component Methods (Render/Refresh/Release)
        component.release = function (): void {
          const self = this as ComponentScope;
          const props = Object.getOwnPropertyNames(self);
          const keepProps = [statusKeyName, "_id"];
          for (let i = 0; i < props.length; i++) {
            const prop = props[i];
            if (
              typeof (self as any)[prop] !== "function" &&
              !keepProps.includes(prop)
            ) {
              delete (self as any)[prop];
            }
          }
        };

        component.render = function (
          newData: Record<string, any>
        ): ComponentScope {
          const currentComponent = this as ComponentScope;
          const targetElement = currentComponent.element;
          const parent =
            targetElement instanceof Node ? targetElement.parentElement : null;
          const wrapper = currentComponent.wrapperElement;
          const tmplFunc = compomint.tmpl(currentComponent.tmplId);

          if (!tmplFunc) {
            console.error(
              `Cannot re-render: Template function for "${currentComponent.tmplId}" not found.`
            );
            return currentComponent;
          }

          const hooks = {
            beforeAppendTo: currentComponent.beforeAppendTo,
            afterAppendTo: currentComponent.afterAppendTo,
            beforeRemove: currentComponent.beforeRemove,
            afterRemove: currentComponent.afterRemove,
            beforeRefresh: currentComponent.beforeRefresh,
            afterRefresh: currentComponent.afterRefresh,
          };

          if (currentComponent.beforeRemove) {
            try {
              currentComponent.beforeRemove();
            } catch (e) {
              console.error("Error in beforeRemove during render:", e);
            }
          }

          let newComponent: ComponentScope;
          if (wrapper) {
            newComponent = tmplFunc(
              newData,
              wrapper,
              undefined,
              currentComponent
            ); // Reuse scope object
          } else if (parent && targetElement instanceof Node) {
            newComponent = tmplFunc(
              newData,
              undefined,
              undefined,
              currentComponent
            ); // Reuse scope object
            if (newComponent.element instanceof Node) {
              if (newComponent.beforeAppendTo) {
                try {
                  newComponent.beforeAppendTo();
                } catch (e) {
                  console.error("Error in beforeAppendTo during render:", e);
                }
              }
              parent.replaceChild(newComponent.element, targetElement);
              if (newComponent.afterAppendTo) {
                setTimeout(() => {
                  try {
                    newComponent.afterAppendTo!();
                  } catch (e) {
                    console.error("Error in afterAppendTo during render:", e);
                  }
                }, 0);
              }
            } else if (configs.debug) {
              console.warn(
                `Re-render of "${currentComponent.tmplId}" resulted in no element or target was missing.`
              );
            }
          } else {
            // No parent, just create new scope (likely detached)
            newComponent = tmplFunc(
              newData,
              undefined,
              undefined,
              currentComponent
            );
          }

          if (currentComponent.afterRemove) {
            try {
              currentComponent.afterRemove();
            } catch (e) {
              console.error("Error in afterRemove during render:", e);
            }
          }

          Object.assign(newComponent, hooks); // Restore hooks
          return newComponent;
        };

        component.refresh = function (
          reflashData: Record<string, any>
        ): ComponentScope {
          const currentComponent = this as ComponentScope;
          const currentData = currentComponent[dataKeyName];
          if (currentComponent.beforeRefresh) {
            try {
              currentComponent.beforeRefresh();
            } catch (e) {
              console.error("Error in beforeRefresh:", e);
            }
          }
          const newData = Object.assign({}, currentData || {}, reflashData);
          const newComponent = currentComponent.render(newData);
          if (currentComponent.afterRefresh) {
            try {
              currentComponent.afterRefresh();
            } catch (e) {
              console.error("Error in afterRefresh:", e);
            }
          }
          return newComponent;
        };

        component.reflash = component.refresh;

        return component;
      }; // End of renderingFunc definition

    Object.defineProperty(renderingFunc, "name", {
      value: `render_${tmplId}`,
      writable: false,
    });

    if (tmplId) {
      const tmplMeta: TemplateMeta = configs.debug
        ? {
          renderingFunc: renderingFunc,
          sourceGenFunc: sourceGenFunc,
          source: escapeHtml.escape(
            `function ${tmplId}_source (${templateEngine.keys.dataKeyName}, ${templateEngine.keys.statusKeyName}, ${templateEngine.keys.componentKeyName}, ${templateEngine.keys.i18nKeyName}, __lazyScope, __debugger) {\n${source}\n}`
          ),
          templateText: escapeHtml.escape(templateText),
        }
        : {
          renderingFunc: renderingFunc,
          sourceGenFunc: sourceGenFunc,
        };
      cachedTmpl.set(tmplId, tmplMeta);

      const tmplIdNames = tmplId.split("-");
      if (tmplIdNames.length > 1) {
        const group = tmplIdNames[0];
        let groupObj = tmpl[group];
        if (!groupObj) {
          tmpl[group] = groupObj = {};
        }
        const tmplIdSub = tmplIdNames
          .slice(1)
          .map((part, index) =>
            index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
          )
          .join("");
        groupObj[tmplIdSub] = tmplMeta.renderingFunc;
      }
    }
    return renderingFunc;
  }); // End of templateBuilder

compomint.remapTmpl = function (json: Record<string, string>): void {
  Object.keys(json).forEach(function (oldKey: string) {
    const newKey = json[oldKey];
    const meta = cachedTmpl.get(oldKey);
    if (meta) {
      cachedTmpl.set(newKey, meta);
      if (configs.debug)
        console.log(`Remapped template "${oldKey}" to "${newKey}"`);
    } else if (configs.debug) {
      console.warn(
        `Cannot remap template: Old key "${oldKey}" not found in cache.`
      );
    }
  });
};

compomint.tmpl = function (tmplId: string): RenderingFunction | null {
  const tmplMeta = cachedTmpl.get(tmplId);
  return tmplMeta ? tmplMeta.renderingFunc : null;
};

const safeTemplate = function (
  source: Element | string
): Element | TemplateElement {
  let template: TemplateElement;
  if (typeof source !== "undefined" && source instanceof Element) {
    if (source.tagName === "TEMPLATE") return source as TemplateElement;
    return source; // Assume it's a container element
  } else if (typeof source !== "string") {
    if (configs.debug)
      console.warn(
        "safeTemplate received non-string/non-element source:",
        source
      );
    source = "";
  }

  template = document.createElement("template");
  if (isSupportTemplateTag) {
    const encodedSource = source.replace(
      /<(?!template|\/template|body|\/body|html|\/html|head|\/head|style|\/style|script|\/script|link|\/link|meta|\/meta|!--)/gi,
      "&lt;"
    );
    template.innerHTML = encodedSource;
  } else {
    const encodedSource = source
      .replace(
        /<(?!template|\/template|body|\/body|html|\/html|head|\/head|style|\/style|script|\/script|link|\/link|meta|\/meta|!--)/gi,
        "&lt;"
      )
      .replace(/<template/g, '<script type="template"')
      .replace(/<\/template>/g, "</script>");
    template.innerHTML = encodedSource;
  }
  return template;
};

const addTmpl: CompomintGlobal["addTmpl"] = (compomint.addTmpl = function (
  tmplId,
  element,
  templateEngine
) {
  let templateText;

  // Check for Element or SSR polyfill objects
  if (
    typeof element !== "undefined" &&
    element &&
    typeof element === "object"
  ) {
    // Try to get template content from SSR polyfill object or real Element
    if ("_innerHTML" in element) {
      templateText = (element as any)._innerHTML;
    } else if ("innerHTML" in element) {
      templateText = element.innerHTML;
    } else {
      templateText = String(element);
    }
  } else {
    templateText = String(element);
  }
  templateText = escapeHtml.unescape(templateText.replace(/<!---|--->/gi, ""));
  return templateBuilder(tmplId, templateText, templateEngine);
});

const addTmpls: CompomintGlobal["addTmpls"] = (compomint.addTmpls = function (
  source,
  removeInnerTemplate,
  templateEngine
) {
  if (typeof removeInnerTemplate !== "boolean" && templateEngine == undefined) {
    templateEngine = removeInnerTemplate as Partial<TemplateEngine> | undefined;
    removeInnerTemplate = false;
  } else {
    removeInnerTemplate = !!removeInnerTemplate;
  }

  // Use default template engine if none provided
  if (!templateEngine) {
    templateEngine = compomint.templateEngine;
  }

  const container = safeTemplate(source);
  const content = (container as TemplateElement).content || container; // Use content if available
  const tmplNodes = content.querySelectorAll<Element>(
    'template[id], script[type="text/template"][id], script[type="text/compomint"][id]'
  );

  tmplNodes.forEach((node) => {
    const tmplId = node.id;
    if (!tmplId) return;

    if ((node as HTMLElement).dataset.coLoadScript !== undefined) {
      addTmpl(tmplId, node, templateEngine)({}); // Execute immediately if data-co-load-script
    } else {
      addTmpl(tmplId, node, templateEngine);
    }

    if (removeInnerTemplate && node.parentNode) {
      node.parentNode.removeChild(node);
    }
  });
  return container;
});

const addTmplByUrl: CompomintGlobal["addTmplByUrl"] = (compomint.addTmplByUrl =
  function compomint_addTmplByUrl(importData, option, callback) {
    if (!callback && typeof option === "function") {
      callback = option;
      option = {};
    }

    const defaultOptions = {
      loadScript: true,
      loadStyle: true,
      loadLink: true,
      templateEngine: undefined,
    };
    const mergedOptions = Object.assign(
      {},
      defaultOptions,
      option as Record<string, any>
    ); // Ensure option is object

    const importDataParser = (
      obj: string | any
    ): { url: string; option: Record<string, any> } | null => {
      if (typeof obj === "string") {
        return { url: obj, option: mergedOptions };
      } else if (obj && typeof obj === "object" && obj.url) {
        return {
          url: obj.url,
          option: Object.assign({}, mergedOptions, obj.option),
        };
      } else {
        console.error("Invalid import data format in addTmplByUrl:", obj);
        return null;
      }
    };

    const appendElements = (
      elements: NodeListOf<Element> | Element[]
    ): void => {
      elements.forEach((element) => {
        if (!element) return;
        if (element.id) {
          const oldElement = document.getElementById(element.id);
          if (oldElement) oldElement.parentNode?.removeChild(oldElement);
        }
        if (
          element.tagName === "SCRIPT" ||
          element.tagName === "LINK" ||
          element.tagName === "STYLE"
        ) {
          document.head.appendChild(element);
        } else {
          document.body.appendChild(element);
        }
      });
    };

    const importFunc = (
      source: string,
      currentOption: Record<string, any>
    ): void => {
      const templateContainer = safeTemplate(source);
      addTmpls(templateContainer, false, currentOption.templateEngine);
      const content =
        (templateContainer as TemplateElement).content || templateContainer;

      if (currentOption.loadLink) {
        const links = content.querySelectorAll<HTMLLinkElement>(
          'link[rel="stylesheet"]'
        );
        appendElements(links);
      }
      if (currentOption.loadStyle) {
        const styles = content.querySelectorAll<HTMLStyleElement>("style[id]");
        appendElements(styles);
      }
      if (currentOption.loadScript) {
        const scripts = content.querySelectorAll<HTMLScriptElement>(
          'script:not([type]), script[type="text/javascript"], script[type="module"]'
        );
        const executableScripts = Array.from(scripts)
          .filter((node) => {
            let parent = node.parentNode;
            while (parent) {
              if (
                parent.nodeName === "TEMPLATE" ||
                (parent.nodeName === "SCRIPT" &&
                  (parent as HTMLScriptElement).type.includes("template"))
              )
                return false;
              parent = parent.parentNode;
            }
            return true;
          })
          .map((node) => {
            const scriptElm = document.createElement("script");
            node
              .getAttributeNames()
              .forEach((name) =>
                scriptElm.setAttribute(name, node.getAttribute(name)!)
              );
            if (node.innerHTML) scriptElm.textContent = node.innerHTML;
            return scriptElm;
          });
        appendElements(executableScripts);
      }
    };

    const loadResource = (dataItem: string | any): Promise<void> => {
      return new Promise((resolve, reject) => {
        const parsedData = importDataParser(dataItem);
        if (!parsedData) {
          resolve(); // Resolve immediately for invalid data
          return;
        }
        const src = parsedData.url;
        const currentOption = parsedData.option;

        if (src.endsWith(".js")) {
          const script = genElement("script", {
            async: true,
            src: src,
          }) as HTMLScriptElement;
          script.addEventListener("load", () => resolve());
          script.addEventListener("error", () => {
            console.error(`Failed to load script: ${src}`);
            reject(new Error(`Failed to load script: ${src}`));
          });
          document.head.appendChild(script);
        } else if (src.endsWith(".css")) {
          const link = genElement("link", {
            type: "text/css",
            rel: "stylesheet",
            href: src,
          }) as HTMLLinkElement;
          link.addEventListener("load", () => resolve());
          link.addEventListener("error", () => {
            console.error(`Failed to load stylesheet: ${src}`);
            reject(new Error(`Failed to load stylesheet: ${src}`));
          });
          document.head.appendChild(link);
        } else {
          requestFunc(src, null, (source, status) => {
            if (status === 200 || status === 0) {
              try {
                importFunc(source!, currentOption); // Use non-null assertion for source
                resolve(); // Resolve after successful processing
              } catch (e) {
                console.error(`Error processing imported HTML from ${src}:`, e);
                reject(
                  new Error(`Error processing imported HTML from ${src}: ${e}`)
                );
              }
            } else {
              console.error(
                `Failed to fetch template file: ${src} (Status: ${status})`
              );
              reject(
                new Error(
                  `Failed to fetch template file: ${src} (Status: ${status})`
                )
              );
            }
          });
        }
      });
    };

    // Handle null or undefined importData
    if (importData == null) {
      if (callback) {
        callback();
        return;
      } else {
        return Promise.resolve();
      }
    }

    // Create the promise for all operations
    const operationPromise = Array.isArray(importData)
      ? importData.length === 0
        ? Promise.resolve()
        : Promise.all(importData.map(loadResource))
          .then(() => { })
          .catch((err) => {
            console.error("Error loading resources in addTmplByUrl:", err);
            throw err; // Re-throw the error to allow operationPromise to reject
          })
      : loadResource(importData).catch((err) => {
        console.error("Error loading resource in addTmplByUrl:", err);
        throw err; // Re-throw the error to allow operationPromise to reject
      });

    // If callback is provided, use it; otherwise return the promise
    if (callback) {
      operationPromise
        .then(() => callback())
        .catch((err) => {
          // Log error but still call callback for backward compatibility
          console.error("Error in addTmplByUrl callback mode:", err);
          callback();
        });
      return;
    } else {
      return operationPromise;
    }
  });

const requestFunc = function (
  url: string,
  option: RequestInit | null,
  callback: (
    responseText: string | null,
    status: number,
    xhr: XMLHttpRequest
  ) => void
): void {
  const xmlhttp = new XMLHttpRequest();

  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == XMLHttpRequest.DONE) {
      if (xmlhttp.status == 200 || xmlhttp.status === 0) {
        callback(xmlhttp.responseText, xmlhttp.status, xmlhttp);
      } else {
        if (xmlhttp.status == 404)
          console.error(`Error 404: Not Found - ${url}`);
        else if (xmlhttp.status >= 400)
          console.error(`HTTP Error ${xmlhttp.status} for ${url}`);
        else console.error(`Request failed for ${url}`, xmlhttp.statusText);
        callback(null, xmlhttp.status, xmlhttp);
      }
    }
  };

  xmlhttp.onerror = function () {
    console.error(`Network error requesting ${url}`);
    callback(null, 0, xmlhttp);
  };
  xmlhttp.ontimeout = function () {
    console.error(`Request timed out for ${url}`);
    callback(null, 408, xmlhttp);
  };

  try {
    const method = (option && option.method) || "GET";
    xmlhttp.open(method, url, true);

    if (option) {
      if ((option as any).timeout) xmlhttp.timeout = (option as any).timeout;
      const headers = option.headers as Record<string, string>;
      if (headers) {
        Object.keys(headers).forEach((key) => {
          xmlhttp.setRequestHeader(key, headers[key]);
        });
      }
      xmlhttp.send((option.body as any) || null);
    } else {
      xmlhttp.send();
    }
  } catch (e: any) {
    console.error(`Error sending request to ${url}:`, e);
    callback(null, 0, xmlhttp);
  }
};

compomint.i18n = {};

compomint.addI18n = function (
  fullKey: string,
  i18nObj: Record<string, any>
): void {
  if (
    !fullKey ||
    typeof fullKey !== "string" ||
    !i18nObj ||
    typeof i18nObj !== "object"
  ) {
    console.error("Invalid arguments for addI18n:", fullKey, i18nObj);
    return;
  }

  const langKeyNames = fullKey.split(".");
  let target: any = compomint.i18n;
  const keyLength = langKeyNames.length - 1;

  langKeyNames.forEach(function (key: string, i: number) {
    if (!key) return;

    if (keyLength === i) {
      // Check if any language value is an array
      const hasArrayValues = Object.keys(i18nObj).some((lang) =>
        Array.isArray(i18nObj[lang])
      );

      if (hasArrayValues) {
        // Handle arrays - create array structure
        if (!target[key]) {
          target[key] = [];
        }

        // Process each language's array
        Object.keys(i18nObj)
          .filter((lang) => Array.isArray(i18nObj[lang]))
          .forEach((lang) => {
            const array = i18nObj[lang];
            array.forEach((item: any, index: number) => {
              if (!target[key][index]) {
                target[key][index] = {};
              }
              if (item instanceof Object && !Array.isArray(item)) {
                Object.keys(item).forEach((subKey) => {
                  compomint.addI18n(
                    fullKey + "." + index + "." + subKey,
                    item[subKey]
                  );
                });
              }
            });
          });
      } else {
        // Handle regular i18n function
        if (!target[key]) {
          target[key] = function (defaultText?: string): string {
            const lang = document.documentElement.lang || "en";
            let label = i18nObj[lang];
            if (label === undefined || label === null) {
              label = defaultText;
              if (configs.debug)
                console.warn(
                  `i18n: Label key ["${fullKey}"] for lang "${lang}" is missing. Using default: "${defaultText}"`
                );
            }
            return label !== undefined && label !== null ? String(label) : "";
          };
        }
        // Handle nested objects within the language definitions
        Object.keys(i18nObj)
          .filter(
            (lang) =>
              i18nObj[lang] instanceof Object && !Array.isArray(i18nObj[lang])
          ) // Check for plain objects
          .forEach((subKey) => {
            compomint.addI18n(fullKey + "." + subKey, i18nObj[subKey]);
            // delete i18nObj[subKey]; // Avoid deleting if it's also a language key
          });
      }
    } else {
      if (!target[key] || typeof target[key] === "function") {
        target[key] = {};
      }
      target = target[key];
    }
  });
};

compomint.addI18ns = function (i18nObjs: Record<string, any>): void {
  // Cache for target path resolution to avoid repeated splits
  const targetCache = new Map<string, any>();

  function getTargetPath(fullKey: string): any {
    if (targetCache.has(fullKey)) {
      return targetCache.get(fullKey);
    }

    const keyParts = fullKey.split(".");
    let target = compomint.i18n;
    for (let i = 0; i < keyParts.length - 1; i++) {
      if (!target[keyParts[i]]) {
        target[keyParts[i]] = {};
      }
      target = target[keyParts[i]];
    }

    targetCache.set(fullKey, target);
    return target;
  }

  function isTranslationObject(value: any): boolean {
    // Fast check: if it has nested objects, it's not a translation
    for (const key in value) {
      const val = value[key];
      const type = typeof val;
      if (type !== "string" && type !== "number" && type !== "boolean") {
        return false;
      }
    }
    return true;
  }

  function processNested(obj: any, keyPath: string = ""): void {
    for (const key in obj) {
      const value = obj[key];
      const fullKey = keyPath ? keyPath + "." + key : key;

      if (Array.isArray(value)) {
        // Handle array at this level - optimized version
        const target = getTargetPath(fullKey);
        const finalKey = fullKey.split(".").pop()!;

        if (!target[finalKey]) {
          target[finalKey] = [];
        }

        // Process each array item with reduced function calls
        for (let index = 0; index < value.length; index++) {
          const item = value[index];
          if (!target[finalKey][index]) {
            target[finalKey][index] = {};
          }

          if (item && typeof item === "object") {
            // Direct processing without recursive addI18n calls
            for (const itemKey in item) {
              const itemValue = item[itemKey];
              if (itemValue && typeof itemValue === "object") {
                // Create the i18n function directly
                const itemPath = fullKey + "." + index + "." + itemKey;
                compomint.addI18n(itemPath, itemValue);
              }
            }
          }
        }
      } else if (value && typeof value === "object") {
        if (isTranslationObject(value)) {
          // This is a translation object, use addI18n
          compomint.addI18n(fullKey, value);
        } else {
          // This is a nested structure, continue processing
          processNested(value, fullKey);
        }
      } else {
        // Primitive value, use addI18n
        compomint.addI18n(fullKey, value);
      }
    }
  }

  processNested(i18nObjs);
};

let elementCount = 0;
tools.genId = function (tmplId: string): string {
  elementCount++;
  return tmplId + elementCount;
};

const applyElementProps = (tools.applyElementProps = function (
  element: HTMLElement,
  attrs: Record<string, any>
): Element {
  Object.keys(attrs).forEach(function (key) {
    const value = attrs[key];
    const propName = key === "class" ? "className" : key;

    try {
      if (key === "style" && typeof value === "object" && value !== null) {
        Object.assign(element.style, value); // Assign style object
      } else if (
        key === "dataset" &&
        typeof value === "object" &&
        value !== null
      ) {
        Object.assign((element as HTMLElement).dataset, value); // Assign dataset object
      } else if (key.startsWith("on") && typeof value === "function") {
        // Directly assign event handlers like onclick, onmouseover
        (element as any)[key.toLowerCase()] = value;
      } else if (propName in element) {
        (element as any)[propName] = value;
      } else {
        element.setAttribute(key, String(value));
      }
    } catch (e: any) {
      console.error(
        `Error setting attribute/property "${key}" on <${element.tagName}>:`,
        e
      );
    }
  });
  return element;
});

const genElement = (tools.genElement = function (
  tagName: string,
  attrs: Record<string, any> | string | Node | (string | Node)[] = {},
  ...children: (string | Node)[]
): Element {
  const element = document.createElement(tagName);
  let actualAttrs: Record<string, any> = {};

  if (typeof attrs === "string") {
    children.unshift(attrs); // Prepend string as first child
  } else if (attrs instanceof Node) {
    children.unshift(attrs); // Prepend Node as first child
  } else if (Array.isArray(attrs)) {
    children = attrs.concat(children); // Concatenate arrays
  } else {
    actualAttrs = attrs; // It's an attributes object
  }

  // Set attributes/properties
  applyElementProps(element, actualAttrs);

  // Append children
  children.forEach((child) => {
    if (typeof child === "string") {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });
  return element;
});

tools.props = function (...propsObjects: Record<string, any>[]): string {
  if (!propsObjects || propsObjects.length === 0) return "";
  const mergedProps = Object.assign({}, ...propsObjects);
  const propStrArray: string[] = [];
  Object.keys(mergedProps).forEach(function (key) {
    const value = mergedProps[key];
    if (value || value === 0) {
      const escapedValue = String(value).replace(/"/g, "&quot;");
      propStrArray.push(`${key}="${escapedValue}"`);
    }
  });
  return propStrArray.join(" ");
};

// Add SSR functionality
compomint.ssr = {
  isSupported: Environment.isServer,
  setupEnvironment: setupSSREnvironment,
  createRenderer: (options = {}) => createSSRRenderer(compomint, options),
  renderToString: async (templateId: string, data: any = {}, options = {}) => {
    const renderer = createSSRRenderer(compomint, options);
    const result = await renderer.renderToString(templateId, data, options);
    return result.html;
  },
  renderPage: async (templateId: string, data: any = {}, pageOptions = {}) => {
    const renderer = createSSRRenderer(compomint);
    return await renderer.renderPage(templateId, data, pageOptions);
  },
};

// Setup SSR environment if we're on the server
if (Environment.isServer()) {
  setupSSREnvironment();
}

<<<<<<< HEAD
compomint.hydrate = function (): void {
  if (Environment.isServer()) {
    console.warn("Hydration cannot be run on the server.");
    return;
  }

  const ssrData = (window as any).__COMPOMINT_SSR__;
  if (!ssrData) {
    if (configs.debug) {
      console.log("No SSR data found for hydration.");
    }
    return;
  }

  if (configs.debug) {
    console.log("Starting Compomint hydration...", ssrData);
  }

  const { componentIds, initialStates } = ssrData;

  componentIds.forEach((componentId: string) => {
    const element = document.querySelector(
      `[data-co-id="${componentId}"]`
    ) as HTMLElement;
    if (!element) {
      if (configs.debug) {
        console.warn(
          `Element for component ID "${componentId}" not found for hydration.`
        );
      }
      return;
    }

    const tmplId = element.dataset.coTmplId || componentId.split("_")[0];
    const tmplFunc = compomint.tmpl(tmplId);

    if (tmplFunc) {
      const initialState = initialStates ? initialStates[componentId] : {};
      const data = initialState ? initialState.data : {};
      const status = initialState ? initialState.status : {};

      const component = tmplFunc({
        ...initialState.data,
        ...data,
        //$existingElement: element,
        $baseComponent: { status: initialState.status, _id: componentId },
      });

      const newElement = component.element;
      newElement.dataset.coId = componentId;
      newElement.dataset.coTmplId = tmplId;
      (newElement as any).__compomint_scope__ = component;

      element.parentElement?.replaceChild(newElement, element);

      if (configs.debug) {
        console.log(
          `Hydrated component "${componentId}" from template "${tmplId}".`
        );
      }
    } else {
      if (configs.debug) {
        console.warn(
          `Template function for "${tmplId}" not found during hydration.`
        );
      }
    }
  });

  // Clean up SSR data
  delete (window as any).__COMPOMINT_SSR__;
};

=======
>>>>>>> 1891c2d (feat: Add initial SSR support and documentation)
// Add built-in template
applyBuiltInTemplates(addTmpl);

export { compomint, tmpl };
