/*
 * Copyright (c) 2025-present, Choi Sungho
 * Code released under the MIT license
 */


"use strict";

// Polyfill for Object.assign
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
if (typeof Object.assign != "function") {
  Object.defineProperty(Object, "assign", {
    value: function assign(target, ...params) {
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
// from:https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/remove()/remove().md
(function (arr) {
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
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

// Polyfill for Node.isConnected
// https://stackoverflow.com/questions/37588326/reliabilty-of-isconnected-field-in-dom-node
(function (supported) {
  if (supported) return;
  Object.defineProperty(window.Node.prototype, "isConnected", {
    get: function () {
      // Check if the node is contained within the document's body
      return document.body.contains(this);
    },
  });
})("isConnected" in window.Node.prototype);

const compomint = {};
const tmpl = {};
const tools = (compomint.tools = compomint.tools || {});
const configs = (compomint.configs = Object.assign({ printExecTime: false, debug: false, throwError: true }, compomint.configs));
const domParser = new DOMParser();

//let requestCacheControl = tools.requestCacheControl || true;
let cachedTmpl = (compomint.tmplCache = compomint.tmplCache || new Map());
if (!cachedTmpl.has("anonymous")) {
  cachedTmpl.set("anonymous", { elements: new Set() });
}
const isSupportTemplateTag = "content" in document.createElement("template");



// When customizing `templateEngines`, if you don't want to define an
// interpolation, evaluation or escaping regex, we need one that is
// guaranteed not to match.
const noMatch = /(.)^/;
const escapes = {
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
  //'#': '#'
};

const escaper = /\>( |\n)+\<|\>( |\n)+|( |\n)+\<|\\|'|\r|\n|\t|\u2028|\u2029/g;

const firstElementChild = function (ele) {
  if (ele.firstElementChild) return ele.firstElementChild;
  const children = ele.childNodes;
  for (let i = 0, size = children.length; i < size; i++) {
    if (children[i] instanceof Element) {
      return children[i];
    }
  }
  return null;
};
const childNodeCount = function (ele) {
  return (
    ele.childElementCount ||
    Array.prototype.filter.call(ele.childNodes, function (child) {
      return child instanceof Node;
    }).length
  );
};
const childElementCount = function (ele) {
  return (
    ele.childElementCount ||
    Array.prototype.filter.call(ele.childNodes, function (child) {
      return child instanceof Element;
    }).length
  );
};
const stringToElement = function (str) {
  if (typeof str === 'number' || !isNaN(str)) { // Check if it's a number or a numeric string
    return document.createTextNode(String(str));
  } else if (typeof str === 'string') {
    try {
      // Handle string is Html
      const body = domParser.parseFromString(str, "text/html").body;
      if (body.childNodes === 1) {
        return body.firstChild;
      } else {
        const fragment = document.createDocumentFragment();
        while (body.firstChild) {
          fragment.appendChild(body.firstChild);
        }
        return fragment;
      }
    } catch (e) {
      // Treat other strings as text
      return document.createTextNode(str);
    }
  } else if (typeof str === 'string') {

    return document.createTextNode(str);
  } else {
    // Handle null/undefined or other types gracefully
    return document.createTextNode('');
  }
};
const isPlainObject = function (value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}
const cleanNode = function (node) {
  for (let n = 0; n < node.childNodes.length; n++) {
    const child = node.childNodes[n];
    if (
      child.nodeType === 8 || // Comment node
      (child.nodeType === 3 && !/\S/.test(child.nodeValue)) // Text node with only whitespace
    ) {
      node.removeChild(child);
      n--; // Adjust index after removal
    } else if (child.nodeType === 1) {
      // Element node
      cleanNode(child); // Recurse
    }
  }
};

compomint.templateEngine = {
  rules: {
    style: {
      pattern: /(\<style id=[\s\S]+?\>[\s\S]+?\<\/style\>)/g,
      exec: function (style) {
        // Extracts <style> tags with IDs, removes any existing style with the same ID, and appends the new one to <head>.
        const dumy = document.createElement("template");
        dumy.innerHTML = style;
        const styleNode = (dumy.content || dumy).querySelector("style");
        const oldStyleNode = document.getElementById(styleNode.id);
        if (oldStyleNode) oldStyleNode.parentNode.removeChild(oldStyleNode);
        document.head.appendChild(styleNode);
        return ""; // Remove the style tag from the template output
      },
    },
    commentArea: {
      pattern: /##\*([\s\S]+?)##/g, // Matches ##* comment blocks ##
      exec: function (commentArea) {
        return ``;
      },
    },
    preEvaluate: {
      pattern: /##!([\s\S]+?)##/g, // Matches ##! preEvaluate blocks ##
      exec: function (preEvaluate, tmplId) {
        // Executes the code immediately during template compilation (once per template definition).
        try {
          new Function("tmplId", preEvaluate)(tmplId);
        } catch (e) {
          if (configs.throwError) {
            console.error(`Template preEvaluate error in "${tmplId}", ${e.name}: ${e.message}`);
            throw e;
          } else {
            console.warn(`Template preEvaluate error in "${tmplId}", ${e.name}: ${e.message}`);
          }
        }
        return ``; // Remove from template output
      },
    },
    interpolate: {
      pattern: /##=([\s\S]+?)##/g, // Matches ##= interpolate blocks ##
      exec: function (interpolate) {
        // Generates code to evaluate the expression and append the result (or the function call result) to the output string (__p).
        const interpolateSyntax = `typeof (interpolate)=='function' ? (interpolate)() : (interpolate)`;
        return (`';\n(() => {let __t, interpolate=${interpolate};\n__p+=((__t=(${interpolateSyntax}))==null ? '' : __t );})();\n__p+='`);
      },
    },
    escape: {
      pattern: /##-([\s\S]+?)##/g, // Matches ##- escape blocks ##
      exec: function (escape) {
        // Generates code to evaluate the expression and append the HTML-escaped result to the output string.
        const escapeSyntax = `compomint.tools.escapeHtml.escape(typeof (escape)=='function' ? (escape)() : (escape))`;
        return (`';\n(() => {let __t, escape=${escape};\n__p+=((__t=(${escapeSyntax}))==null ? '' : __t );})();\n__p+='`);
      },
    },
    elementProps: {
      pattern: /data-co-props="##:([\s\S]+?)##"/g,
      exec: function (props) {
        const source = `';\nvar eventId = (__lazyScope.elementPropsArray.length);\n__p+='data-co-props=\"'+eventId+'\"';\n
__lazyScope.elementPropsArray[eventId] = ${props};\n__p+='`;
        return source;
      },
      lazyExec: function (data, lazyScope, component, wrapper) {
        lazyScope.elementPropsArray.forEach(function (props, eventId) {
          if (!props) return;
          const $elementTrigger = wrapper.querySelector(
            '[data-co-props="' + eventId + '"]'
          );
          if (!$elementTrigger) return;
          delete $elementTrigger.dataset.coProps;
          Object.keys(props).forEach(function (key) {
            $elementTrigger.setAttribute(key, props[key]);
          });
        });
      }
    },
    namedElement: {
      pattern: /data-co-named-element="##:([\s\S]+?)##"/g, // Matches data-co-named-element="##:key##"
      exec: function (key) {
        // Generates code to store the key in a lazy scope array and add a temporary attribute to the element.
        const source = `';\nvar eventId = (__lazyScope.namedElementArray.length);\n__p+='data-co-named-element=\"'+eventId+'\"';\n
__lazyScope.namedElementArray[eventId] = ${key};\n__p+='`;
        return source;
      },
      lazyExec: function (data, lazyScope, component, wrapper) {
        // After rendering, finds elements with the temporary attribute, removes it, and assigns the element to the specified key on the template scope.
        lazyScope.namedElementArray.forEach(function (key, eventId) {
          const $elementTrigger = wrapper.querySelector(
            '[data-co-named-element="' + eventId + '"]'
          );
          if (!$elementTrigger) {
            if (configs.debug) console.warn(`Named element target not found for ID ${eventId} in template ${component.tmplId}`);
            return;
          }
          delete $elementTrigger.dataset.coNamedElement;
          component[key] = $elementTrigger;
        });
      },
    },
    elementRef: {
      pattern: /data-co-element-ref="##:([\s\S]+?)##"/g, // Matches data-co-element-ref="##:variableName##"
      exec: function (key) {
        // Generates code to store a function in a lazy scope array. This function will assign the target element to the specified variable name within the template's execution context.
        const source = `';\nvar eventId = (__lazyScope.elementRefArray.length);\n__p+='data-co-element-ref=\"'+eventId+'\"';
var ${key} = null;\n__lazyScope.elementRefArray[eventId] = function(target) {${key} = target;};\n__p+='`;
        return source;
      },
      lazyExec: function (data, lazyScope, component, wrapper) {
        // After rendering, finds elements with the temporary attribute, removes it, and calls the stored function to assign the element to the variable.
        lazyScope.elementRefArray.forEach(function (func, eventId) {
          const $elementTrigger = wrapper.querySelector(
            '[data-co-element-ref="' + eventId + '"]'
          );
          if (!$elementTrigger) {
            if (configs.debug) console.warn(`Element ref target not found for ID ${eventId} in template ${component.tmplId}`);
            return;
          }
          delete $elementTrigger.dataset.coElementRef; // Should likely be coElementRef
          func.call($elementTrigger, $elementTrigger); // Assign element to the variable
        });
      },
    },
    elementLoad: {
      pattern: /data-co-load="##:([\s\S]+?)##"/g, // Matches data-co-load="##:loadFunc::customData##"
      exec: function (elementLoad) {
        // Generates code to store the load function and custom data in a lazy scope array.
        const elementLoadSplitArray = elementLoad.split("::");
        const source = `';\nlet eventId = (__lazyScope.elementLoadArray.length);\n__p+='data-co-load=\"'+eventId+'\"';
__lazyScope.elementLoadArray[eventId] = {loadFunc: ${elementLoadSplitArray[0]}, customData: ${elementLoadSplitArray[1]}};\n__p+='`;
        return source;
      },
      lazyExec: function (data, lazyScope, component, wrapper) {
        // After rendering, finds elements with the temporary attribute, removes it, and executes the load function.
        lazyScope.elementLoadArray.forEach(function (elementLoad, eventId) {
          const $elementTrigger = wrapper.querySelector(
            '[data-co-load="' + eventId + '"]'
          );
          if (!$elementTrigger) {
            if (configs.debug) console.warn(`Element load target not found for ID ${eventId} in template ${component.tmplId}`);
            return;
          }
          delete $elementTrigger.dataset.coLoad;
          const parentElement = $elementTrigger.parentElement;
          try {
            if (typeof elementLoad.loadFunc === 'function') {
              elementLoad.loadFunc.call(
                $elementTrigger, // this context
                $elementTrigger, // first argument
                { // second argument (options object)
                  "data": data,
                  "element": $elementTrigger,
                  "customData": elementLoad.customData,
                  "component": component,
                  "compomint": compomint,
                },
              );
            }
          } catch (e) {
            console.error(`Error executing elementLoad function for ID ${eventId} in template ${component.tmplId}:`, e, elementLoad.loadFunc);
            if (configs.throwError) throw e;
          }
        });
      },
    },
    event: {
      pattern: /data-co-event="##:([\s\S]+?)##"/g, // Matches data-co-event="##:handler::customData:::handler2::customData2##"
      exec: function (event) {
        // Generates code to store event handler configurations (function, custom data) in a lazy scope array.
        const eventStrArray = event.split(":::"); // Split multiple handlers
        let source = `';\n(() => {let eventId = (__lazyScope.eventArray.length);\n__p+='data-co-event=\"'+eventId+'\"';\n`;
        const eventArray = [];
        for (let i = 0, size = eventStrArray.length; i < size; i++) {
          let eventSplitArray = eventStrArray[i].split("::"); // Split handler and custom data
          eventArray.push(
            `{eventFunc: ${eventSplitArray[0]}, $parent: this, customData: ${eventSplitArray[1]}}`
          );
        }
        source += `__lazyScope.eventArray[eventId] = [${eventArray.join(",")}];})()\n__p+='`;
        return source;
      },
      lazyExec: function (data, lazyScope, component, wrapper) {
        // After rendering, finds elements with the temporary attribute, removes it, and attaches event listeners using the 'attacher' function.
        const self = this;
        const attacher = self.attacher;
        lazyScope.eventArray.forEach(function (selectedArray, eventId) {
          const $elementTrigger = wrapper.querySelector(
            `[data-co-event="${eventId}"]`
          );
          if (!$elementTrigger) {
            if (configs.debug) console.warn(`Event target not found for ID ${eventId} in template ${component.tmplId}`);
            return;
          }
          delete $elementTrigger.dataset.coEvent;
          for (let i = 0, size = selectedArray.length; i < size; i++) {
            let selected = selectedArray[i];
            if (selected.eventFunc) {
              if (selected.eventFunc instanceof Array) {
                // Handle array of functions (though seems unused/unlikely based on attacher logic)
                selected.eventFunc.forEach(function (func) {
                  attacher(
                    self, data, lazyScope, component, wrapper, $elementTrigger,
                    func,
                    selected
                  );
                });
              } else {
                // Handle single function or event map object
                attacher(
                  self, data, lazyScope, component, wrapper, $elementTrigger,
                  selected.eventFunc,
                  selected
                );
              }
            }
          }
        });
      },
      trigger: function (target, eventName) {
        const customEvent = new Event(eventName, {
          bubbles: true, // Allow event bubbling
          cancelable: true // Allow event to be cancelled
        });
        target.dispatchEvent(customEvent);
      },
      attacher: function (
        self,
        data,
        lazyScope,
        component,
        wrapper,
        $elementTrigger,
        eventFunc,
        eventData
      ) {
        const trigger = self.trigger;
        const $childTarget = firstElementChild(wrapper);
        const $targetElement = childElementCount(wrapper) == 1 ? $childTarget : null; // Reference to the single root element, if it exists

        if (!eventFunc) {
          return;
        }

        // Prepare parameters for the event handler function
        const eventFuncParams = [
          $elementTrigger, // 1. element: The element the listener is attached to
          null,            // 2. event: The DOM event object (filled in later)
          {                // 3. context: An object with useful references
            "data": data,
            "customData": eventData.customData,
            "element": $elementTrigger,
            "componentElement": $targetElement || $childTarget?.parentElement, // The component's root element or its parent
            "component": component,
            "compomint": compomint,
          },
        ];


        // Basic case: eventFunc is a single function
        if (typeof eventFunc === 'function') {
          const eventListener = function (event) {
            event.stopPropagation(); // Prevent event from bubbling up
            eventFuncParams[1] = event; // Add the event object
            try {
              eventFunc.call(...eventFuncParams); // Execute the handler
            } catch (e) {
              console.error(`Error in event handler for template ${component.tmplId}:`, e, eventFunc);
              if (configs.throwError) throw e;
            }
          };
          $elementTrigger.addEventListener("click", eventListener);
          eventData.element = $elementTrigger; // For remove eventListener
          eventData.eventFunc = eventListener; // For remove eventListener

          return;
        }

        if (!isPlainObject(eventFunc)) {
          return;
        }

        // Advanced case: eventFunc is an object mapping event types to handlers
        const eventMap = eventFunc;
        const triggerName = eventMap.triggerName; // Optional key to store trigger functions
        if (triggerName) {
          component.trigger = component.trigger || {};
          component.trigger[triggerName] = {}; // Namespace for trigger functions
        }

        Object.keys(eventMap).forEach(function (eventType) {
          const selectedEventFunc = eventMap[eventType];

          if (eventType == "load") {
            // Special 'load' event type, executed immediately
            eventFuncParams[1] = $elementTrigger; // 'event' is the element itself for load
            try {
              selectedEventFunc.call(...eventFuncParams);
            } catch (e) {
              console.error(`Error in 'load' event handler for template ${component.tmplId}:`, e, selectedEventFunc);
              if (configs.throwError) throw e;
            }
            return;
          } else if (eventType == "namedElement") {
            // Special 'ref' key to assign the element to a property on the template scope
            component[selectedEventFunc] = $elementTrigger;
            return;
          } else if (eventType == "triggerName") {
            // Skip the triggerName property itself
            return;
          }

          const eventListener = function (event) {
            event.stopPropagation();
            eventFuncParams[1] = event;
            try {
              selectedEventFunc.call(...eventFuncParams);
            } catch (e) {
              console.error(`Error in '${eventType}' event handler for template ${component.tmplId}:`, e, selectedEventFunc);
              if (configs.throwError) throw e;
            }
          };

          // Attach standard DOM event listener
          $elementTrigger.addEventListener(eventType, eventListener);
          eventData.element = $elementTrigger; // For remove eventListener
          eventFunc[eventType] = eventListener; // For remove eventListener

          // If a triggerName is defined, store a function to manually trigger this specific event
          if (triggerName) {
            component.trigger[triggerName][eventType] = function () {
              trigger($elementTrigger, eventType);
            };
          }
        });
      },
    },
    element: {
      pattern: /##%([\s\S]+?)##/g, // Matches ##% target::nonblocking ##
      exec: function (target) {
        // Generates code to store the target (component, element, string, array) and non-blocking flag in a lazy scope array.
        const elementSplitArray = target.split("::");
        const source = `';\n(() => {
let elementId = (__lazyScope.elementArray.length);
__p+='<template data-co-tmpl-element-id=\"'+elementId+'\"></template>';
__lazyScope.elementArray[elementId] = {childTarget: ${elementSplitArray[0]}, nonblocking: ${(elementSplitArray[1] || false)}};})();
__p+='`;
        return source;
      },
      lazyExec: function (data, lazyScope, component, wrapper) {
        // After rendering, finds the placeholder <template> tags and replaces them with the actual content (component, element, string, etc.).
        const self = this;
        lazyScope.elementArray.forEach(function (ele, elementId) {
          const childTarget = ele.childTarget;
          const nonblocking = ele.nonblocking; // Delay insertion using setTimeout if true or a number (ms)
          const $tmplElement = wrapper.querySelector(
            `template[data-co-tmpl-element-id="${elementId}"]`
          );

          if (!$tmplElement) {
            if (configs.debug) console.warn(`Element insertion placeholder not found for ID ${elementId} in template ${component.tmplId}`);
            return;
          }
          if (!$tmplElement.parentNode) {
            if (configs.debug) console.warn(`Element insertion placeholder for ID ${elementId} in template ${component.tmplId} has no parent.`);
            return; // Already removed or invalid state
          }

          // Function to perform the actual replacement
          const doFunc = function () {
            if (!$tmplElement || !$tmplElement.parentNode) {
              if (configs.debug) console.warn(`Placeholder for ID ${elementId} removed before insertion in template ${component.tmplId}.`);
              return; // Check again in case it was removed during delay
            }

            try {
              if (childTarget instanceof Array) {
                // Handle array of items to insert
                const docFragment = document.createDocumentFragment();
                childTarget.forEach(function (child) {
                  if (!child) return;
                  const childElement = child.element || child; // Support scope objects or direct elements/strings
                  let nodeToAppend = null;

                  if (typeof childElement === "string" || typeof childElement === "number") {
                    nodeToAppend = stringToElement(childElement);
                  } else if (typeof childElement === "function") {
                    nodeToAppend = stringToElement(childElement());
                  } else if (childElement instanceof Node) {
                    nodeToAppend = childElement;
                  } else {
                    if (configs.debug) console.warn(`Invalid item type in element array for ID ${elementId}, template ${component.tmplId}:`, childElement);
                    return; // Skip invalid items
                  }

                  if (child.beforeAppendTo) child.beforeAppendTo(); // Call lifecycle hook if available on the scope object
                  docFragment.appendChild(nodeToAppend);
                });

                $tmplElement.parentNode.replaceChild(docFragment, $tmplElement);

                // Call afterAppendTo hooks after all elements in the array are inserted
                childTarget.forEach(function (child) {
                  if (child && child.afterAppendTo) {
                    // Use setTimeout to ensure it runs after the current execution context
                    setTimeout(() => {
                      try { child.afterAppendTo(); } catch (e) { console.error("Error in afterAppendTo:", e); }
                    }, 0);
                  }
                });

              } else if (typeof childTarget === "string" || typeof childTarget === "number") {
                // Handle simple string or number insertion
                $tmplElement.parentNode.replaceChild(
                  stringToElement(childTarget),
                  $tmplElement
                );
              } else if (typeof childTarget === "function") {
                // Handle function returning string/number/element
                $tmplElement.parentNode.replaceChild(
                  stringToElement(childTarget()),
                  $tmplElement
                );
              } else if (childTarget && (childTarget.element || childTarget) instanceof Node) {
                // Handle component scope object or direct Node insertion
                const childScope = childTarget; // Assume it might be a scope
                const childElement = childScope.element || childScope; // Get the actual element

                if (childScope.beforeAppendTo) childScope.beforeAppendTo();
                $tmplElement.parentNode.replaceChild(childElement, $tmplElement);
                if (childScope.afterAppendTo) {
                  setTimeout(() => {
                    try { childScope.afterAppendTo(); } catch (e) { console.error("Error in afterAppendTo:", e); }
                  }, 0);
                }
                // Link parent scope if inserting another component
                if (childScope.tmplId) {
                  childScope.parentComponent = component;
                }

              } else {
                // Invalid target, remove the placeholder
                if (configs.debug) console.warn(`Invalid target for element insertion ID ${elementId}, template ${component.tmplId}:`, childTarget);
                $tmplElement.parentNode.removeChild($tmplElement);
              }
            } catch (e) {
              console.error(`Error during element insertion for ID ${elementId}, template ${component.tmplId}:`, e);
              if (configs.throwError) throw e;
              // Attempt to remove placeholder on error to avoid leaving it in the DOM
              if ($tmplElement && $tmplElement.parentNode) {
                try { $tmplElement.parentNode.removeChild($tmplElement); } catch (removeError) { /* Ignore */ }
              }
            }
          }; // end doFunc

          // Execute insertion immediately or with a delay
          (nonblocking == undefined || nonblocking === false)
            ? doFunc()
            : setTimeout(doFunc, typeof nonblocking === 'number' ? nonblocking : 0); // Use 0ms delay if nonblocking is just 'true'

        }); // end forEach
      },
    },
    lazyEvaluate: {
      pattern: /###([\s\S]+?)##/g, // Matches ### lazyEvaluate blocks ##
      exec: function (lazyEvaluate) {
        // Generates code to push a function containing the lazy code onto a lazy scope array.
        const source = `';\n__lazyScope.lazyEvaluateArray.push(function(data) {${lazyEvaluate}});\n__p+='`;
        return source;
      },
      lazyExec: function (data, lazyScope, component, wrapper) {
        // After rendering, executes all the stored lazy functions.
        const $childTarget = firstElementChild(wrapper);
        const $targetElement = childElementCount(wrapper) == 1 ? $childTarget : null; // Component's root element if single, otherwise null
        lazyScope.lazyEvaluateArray.forEach(function (selectedFunc, idx) {
          try {
            // Call the function with the component's root element (or its parent if multiple roots) as 'this' context
            selectedFunc.call($targetElement || $childTarget.parentElement, data); // Pass component data as argument
          } catch (e) {
            console.error(`Error in lazyEvaluate block ${idx} for template ${component.tmplId}:`, e, selectedFunc);
            if (configs.throwError) throw e;
          }
        });
        return;
      },
    },
    evaluate: {
      pattern: /##([\s\S]+?)##/g, // Matches ## evaluate blocks ## (general purpose JS execution)
      exec: (evaluate) => {
        // Generates code to simply include the JavaScript block in the compiled function.
        return "';\n" + evaluate + "\n__p+='";
      },
    },
    /*
    normal  : {
      pattern: /([\s\S]+?)/g,
      exec: function(normal) {
        //console.log(normal);
        return normal.replace(escaper, escapeFunc);
      }
    },
    */
  },
  keys: {
    dataKeyName: "data",
    statusKeyName: "status",
    componentKeyName: "component",
    i18nKeyName: "i18n",
  }
};

let escapeHtml = (function () {
  const escapeMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "`": "&#x60;",
    "\n": "&#10;",
  };

  // Create the inverse map for unescaping
  const unescapeMap = Object.fromEntries(Object.entries(escapeMap).map(([key, value]) => [value, key]));

  // Factory function from underscore.js to create efficient escaper/unescaper functions
  const createEscaper = function (map) {
    const escaper = function (match) {
      return map[match];
    };
    // Build regex source string like '(?:&|<|>|")'
    const source = `(?:${Object.keys(map).join("|").replace(/\\/g, '\\\\')})`; // Escape backslashes if any keys have them
    const testRegexp = RegExp(source);
    const replaceRegexp = RegExp(source, "g");
    return function (string) {
      string = string == null ? "" : `${string}`; // Ensure string type
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

let matcherFunc = function (templateRules) {
  const patternArray = [];
  const execArray = [];
  const lazyExecMap = {}; // Renamed from lazyExecArray for clarity
  const lazyScopeSeed = {}; // Renamed from lazyScope for clarity
  let templateRule = null;

  Object.keys(templateRules).forEach(function (key) {
    templateRule = templateRules[key];
    // Collect patterns and corresponding exec functions
    if (templateRule && typeof templateRule === 'object' && templateRule.pattern instanceof RegExp && typeof templateRule.exec === 'function') {
      patternArray.push((templateRule.pattern || noMatch).source);
      execArray.push(templateRule.exec);
    }
    // Collect lazy execution functions and initialize seed for lazy scope
    if (templateRule && typeof templateRule === 'object' && typeof templateRule.lazyExec === 'function') {
      const arrayKey = `${key}Array`;
      lazyExecMap[arrayKey] = templateRule.lazyExec;
      lazyScopeSeed[arrayKey] = []; // Initialize as empty array
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

const escapeFunc = function (match) {
  // Prioritize direct match, then match ignoring space/newline (for ><), else empty string
  return escapes[match] || escapes[match.replace(/[ \n]/g, "")] || "";
};

const defaultMatcher = matcherFunc(compomint.templateEngine.rules);

const templateParser = function (tmplId, text, matcher) {
  if (configs.printExecTime) console.time(`tmpl: ${tmplId}`);

  let index = 0;
  let source = "";

  // Use replace to iterate through matches of the combined pattern
  text.replace(matcher.pattern, function (...params) {
    const match = params[0]; // The full matched string
    const offset = params[params.length - 2]; // The index of the match in the original string

    // Append the text segment before the match, escaping necessary characters
    source += text.slice(index, offset).replace(escaper, escapeFunc);

    let selectedMatchContent, // The content captured by one of the pattern groups
      matchIndex = null; // The index of the pattern group that matched

    // Find which capturing group actually matched
    params.slice(1, -2).some(function (value, idx) {
      if (value !== undefined) { // Check for undefined, as empty string is a valid capture
        selectedMatchContent = value;
        matchIndex = idx;
        return true; // Stop searching
      }
      return false;
    });

    // If a specific group matched, call its corresponding exec function
    if (selectedMatchContent !== undefined && matchIndex !== null) {
      try {
        source += matcher.exec[matchIndex].call(matcher.templateRules, selectedMatchContent, tmplId);
      } catch (e) {
        console.error(`Error executing template rule index ${matchIndex} for match "${selectedMatchContent}" in template "${tmplId}":`, e);
        if (configs.throwError) throw e;
        source += ''; // Append nothing on error if not throwing
      }
    } else {
      // This case should ideally not happen if the regex is well-formed,
      // but handle it by just appending the matched text literally (escaped).
      source += match.replace(escaper, escapeFunc);
    }


    // Update the index to the end of the current match
    index = offset + match.length;

    return match; // Return value for replace is not used here
  });

  // Append any remaining text after the last match
  source += text.slice(index).replace(escaper, escapeFunc);

  if (configs.printExecTime) console.timeEnd(`tmpl: ${tmplId}`);
  return source;
};


let templateBuilder = (compomint.template = function compomint_templateBuilder(
  tmplId,
  templateText,
  customTemplateEngine
) {
  // JavaScript micro-templating, similar to John Resig's implementation.
  const templateEngine = compomint.templateEngine;
  const matcher = defaultMatcher;

  // Use custom config if provided
  if (customTemplateEngine) {
    templateEngine = Object.assign({}, compomint.templateEngine, customTemplateEngine);
    matcher = matcherFunc(templateEngine.rules); // Create a matcher specific to these config
  }
  // 1. Parse the template text into JavaScript source code
  const source = `
/* tmplId: ${tmplId} */
//# sourceURL=http://tmpl//${tmplId.split("-").join("//")}.js
// if (__debugger) {
// debugger;
// }
let __p='';
__p+='${templateParser(tmplId, templateText, matcher)}';
return __p;`;

  let sourceGenFunc = null; // Will hold the compiled function

  // 2. Compile the generated JavaScript source into a function
  try {
    sourceGenFunc = new Function(
      templateEngine.keys.dataKeyName,      // e.g., "data"
      templateEngine.keys.statusKeyName,    // e.g., "status"
      templateEngine.keys.componentKeyName, // e.g., "component"
      templateEngine.keys.i18nKeyName,      // e.g., "i18n"
      "compomint",
      "tmpl",
      "__lazyScope",             // Internal object for lazy execution data
      "__debugger",              // Internal object for debugging
      source                     // The generated JS code
    );
  } catch (e) {
    if (configs.throwError) {
      console.error(`Template compilation error in "${tmplId}", ${e.name}: ${e.message}`);
      // Re-run compilation in a way that might provide more detailed browser errors
      new Function(
        templateEngine.keys.dataKeyName,
        templateEngine.keys.statusKeyName,
        templateEngine.keys.componentKeyName,
        templateEngine.keys.i18nKeyName,
        "compomint",
        "tmpl",
        "__lazyScope",
        "__debugger",
        source
      );
      //console.log("--- Generated Source ---");
      //console.log(source);
      //console.log("------------------------");
      //throw e;
    } else {
      return;
    }
  }

  let renderingFunc = function compomint_renderingFuncBuilder(...params) {
    let [data, wrapperElement, callback, baseComponent] = params;
    if (data && (data.$wrapperElement || data.$callback || data.$baseComponent)) {
      // Handle argument object: ({$wrapperElement, $callback, $baseComponent})
      if (data.$wrapperElement) {
        wrapperElement = data.$wrapperElement;
        delete data.$wrapperElement;
      }
      if (data.$callback) {
        callback = data.$callback;
        delete data.$callback;
      }
      if (data.$baseComponent) {
        baseComponent = data.$baseComponent;
        delete data.$baseComponent;
      }
    } else {
      if (typeof wrapperElement === "function") {
        // Handle argument shifting: (data, callback)
        callback = wrapperElement;
        wrapperElement = undefined;
      }
    }

    const dataKeyName = templateEngine.keys.dataKeyName;
    const statusKeyName = templateEngine.keys.statusKeyName;
    const lazyScope = JSON.parse(matcher.lazyScopeSeed);

    // 3. Prepare the Component Scope object
    const component = Object.assign(baseComponent || {}, {
      tmplId: tmplId,
      // Define methods available on the component
      replace: function (newComponent) {
        if (!component.element || !component.element.parentElement) {
          if (configs.debug) console.warn(`Cannot replace template "${tmplId}": element not in DOM.`);
          return;
        }
        component.element.parentElement.replaceChild(
          // Allow replacing with another component or a raw element
          newComponent.element || newComponent, // new 
          component.element // oldC
        );
      },
      remove: function (spacer = false) {
        if (component.beforeRemove) {
          try { component.beforeRemove(); } catch (e) { console.error("Error in beforeRemove:", e); }
        }

        // Remote event event listener 
        if (lazyScope.eventArray) {
          lazyScope.eventArray.forEach(function (event) {
            event.forEach(function (selectedEvent) {
              if (selectedEvent.element) {
                if (typeof selectedEvent.eventFunc === 'function') {
                  selectedEvent.element.removeEventListener('click', selectedEvent.eventFunc);
                } else {
                  Object.keys(selectedEvent.eventFunc).forEach(function (eventType) {
                    selectedEvent.element.removeEventListener(eventType, selectedEvent.eventFunc[eventType]);
                  });
                }
                Object.keys(selectedEvent).forEach(key => delete selectedEvent[key]);
              }
            });
          });
        }

        const parent = component.element?.parentElement;
        if (parent) {
          if (spacer) {
            // Replace with an empty template tag as a placeholder
            const dumy = document.createElement("template");
            parent.replaceChild(dumy, component.element);
            component.element = dumy; // Update scope's element reference
          } else {
            parent.removeChild(component.element);
            // Note: component.element still holds the removed element reference
          }
        } else if (configs.debug) {
          console.warn(`Cannot remove template "${tmplId}": element not in DOM.`);
        }
        if (component.afterRemove) {
          try { component.afterRemove(); } catch (e) { console.error("Error in afterRemove:", e); }
        }
        return component.element; // Return the (potentially removed) element
      },
      appendTo: function (parentElement) {
        if (component.beforeAppendTo) {
          try { component.beforeAppendTo(); } catch (e) { console.error("Error in beforeAppendTo:", e); }
        }
        if (parentElement && component.element) {
          parentElement.appendChild(component.element);
        } else if (configs.debug) {
          console.warn(`Cannot append template "${tmplId}": parentElement or scope.element is missing.`);
        }
        if (component.afterAppendTo) {
          // Use setTimeout to ensure it runs after the current execution context
          setTimeout(() => {
            try { component.afterAppendTo(); } catch (e) { console.error("Error in afterAppendTo:", e); }
          }, 0);
        }
        return component;
      },
    });

    // Initialize unique ID and data/status objects if not reusing scope
    if (!component._id) {
      component._id = tools.genId(tmplId);
    }
    component[dataKeyName] = data;
    if (component[statusKeyName] == undefined) {
      component[statusKeyName] = {}; // Initialize status object
    }
    const hasParent = wrapperElement instanceof Element; // Check if rendering into a container
    const temp = document.createElement("template"); // Use template tag for parsing

    if (configs.printExecTime) console.time(`render: ${tmplId}`);

    let returnTarget = null; // Will hold the final element/fragment

    // 4. Execute the compiled render function to get HTML string
    let renderedHTML = null;
    try {
      renderedHTML = !data // Handle null/undefined data gracefully
        ? `<template data-co-empty-template="${tmplId}"></template>` // Render empty placeholder if no data
        : sourceGenFunc.call(
          wrapperElement || null, // `this` context inside renderFunc
          data,
          component[statusKeyName],
          component, // Pass scope as 'component' (or custom name)
          compomint.i18n[tmplId], // Pass i18n object
          compomint,
          tmpl,
          lazyScope, // Pass internal lazy scope
          false
        );
    } catch (e) {
      if (configs.throwError) {
        console.error(`Runtime error during render of "${tmplId}":`, e.message);
        console.log("--- Data ---");
        console.log(data);
        console.log("------------");
        // Attempt to re-run with debugger potentially attached
        try {
          sourceGenFunc.call(
            wrapperElement || null, data, component[statusKeyName], component,
            component[templateEngine.keys.i18nKeyName], compomint, tmpl, lazyScope,
            configs.debug // __debugger: true
          );
        } catch (debugE) { /* Ignore */ }

        throw e;
      } else {
        console.warn(`Render failed for "${tmplId}". Returning scope with no element.`);
        // Return a minimal scope object even on error
        component.element = document.createComment(`Render Error: ${tmplId}`);
        return component;
      }
    }
    if (configs.printExecTime) console.timeEnd(`render: ${tmplId}`);

    // 5. Parse the generated HTML into a DOM fragment
    temp.innerHTML = renderedHTML;
    let docFragment = temp.content || temp; // Use template.content if available

    // Handle IE11 case where content might be directly on the template element
    if (docFragment.tagName == "TEMPLATE" && !temp.content) {
      const children = Array.from(docFragment.childNodes); // Create array copy
      docFragment = document.createDocumentFragment();
      children.forEach(function (child) {
        docFragment.appendChild(child); // Move children to the fragment
      });
    }

    // 6. Execute Lazy Functions (attaching events, refs, etc.)
    const lazyExec = matcher.lazyExec;
    if (data) { // Only run lazy exec if data was provided (avoids errors on empty render)
      matcher.lazyExecKeys.forEach(function (key) {
        if (lazyScope[key] && lazyScope[key].length > 0) { // Check if the array exists and has items
          try {
            lazyExec[key].call(templateEngine.rules[key.slice(0, -5)], data, lazyScope, component, docFragment);
          } catch (e) {
            if (configs.throwError) {
              console.error(`Error during lazy execution of "${key}" for template "${tmplId}":`, e);
              throw e;
            }
          }
        }
      });
    }

    // 7. Determine the final element/fragment and handle container rendering
    if (hasParent) {
      // Clear the container element before appending
      while (wrapperElement.firstChild) {
        wrapperElement.removeChild(wrapperElement.firstChild);
      }
      component.wrapperElement = wrapperElement; // Store reference to container
    }

    // style to shadow
    const shadowStyle = docFragment.querySelector ? docFragment.querySelector("style") : null;
    if (shadowStyle && docFragment.querySelector) {
      const host = document.createElement(tmplId);
      const shadow = host.attachShadow({ mode: "open" });
      while (docFragment.firstChild) {
        shadow.appendChild(docFragment.firstChild);
      }
      docFragment = host;
    }

    // Determine the primary element/node to return/attach
    if (docFragment.firstChild && docFragment.firstChild.nodeType == 8) {
      // If the first node is a comment, return it (less common case)
      returnTarget = docFragment.firstChild;
    } else if (childElementCount(docFragment) == 1) {
      // If there's exactly one root element, use that
      returnTarget = firstElementChild(docFragment);
      if (hasParent) {
        // Append the single element to the container
        if (component.beforeAppendTo) { try { component.beforeAppendTo(); } catch (e) { console.error("Error in beforeAppendTo:", e); } }
        wrapperElement.appendChild(returnTarget);
        if (component.afterAppendTo) { setTimeout(() => { try { component.afterAppendTo(); } catch (e) { console.error("Error in afterAppendTo:", e); } }, 0); }
      }
    } else {
      // Multiple root nodes or only text nodes - use the fragment
      if (hasParent) {
        // Append the whole fragment to the container
        if (component.beforeAppendTo) { try { component.beforeAppendTo(); } catch (e) { console.error("Error in beforeAppendTo:", e); } }
        wrapperElement.appendChild(docFragment); // Appends all nodes in the fragment
        if (component.afterAppendTo) { setTimeout(() => { try { component.afterAppendTo(); } catch (e) { console.error("Error in afterAppendTo:", e); } }, 0); }
        returnTarget = wrapperElement; // Conventionally return the container when rendering into it? Or should it be the fragment? Let's stick to container for now.
      } else {
        // Not rendering into a container, return the fragment itself
        returnTarget = docFragment;
      }
    }

    // Apply $props directly onto the main element if it's a single element
    if (data && data.$props && returnTarget instanceof Element) {
      for (let prop in data.$props) {
        try {
          if (prop.indexOf('data-') === 0) {
            const camelCased = prop.substring(5).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            returnTarget.dataset[camelCased] = data.$props[prop];
          } else {
            returnTarget[prop] = data.$props[prop];
          }
        } catch (e) {
          console.error(`Error applying prop "${prop}" to element in template "${tmplId}":`, e);
        }
      }
    }

    // 8. Finalize and Clean Up
    if (returnTarget.normalize) {
      returnTarget.normalize(); // Merge adjacent text nodes
    }
    if (returnTarget instanceof Node) { // Check if it's a Node before cleaning
      cleanNode(returnTarget); // Remove empty text/comment nodes
    }
    component.element = returnTarget; // Assign the final element/fragment to the scope

    // Optional: Support for live reloading (if defined elsewhere)
    if (tools.liveReloadSupport) {
      try { tools.liveReloadSupport(component); } catch (e) { console.error("Error in liveReloadSupport:", e); }
    }

    // 9. Execute Callback
    if (callback) {
      try {
        callback.call(wrapperElement || null, component); // Call with container as `this` if provided
      } catch (e) {
        console.error(`Error in template callback for "${tmplId}":`, e);
        if (configs.throwError) throw e;
      }
    }

    // 10. Define Component Methods (Render/Refresh/Release) - Placed here so they are part of the returned component

    /** Releases internal references held by the component object. */
    component.release = function () {
      const props = Object.getOwnPropertyNames(component);
      // Keep essential properties, remove others
      const keepProps = [statusKeyName, '_id']; //, 'tmplId', 'element', 'wrapperElement', 'parentScope'];
      for (let i = 0; i < props.length; i++) {
        const prop = props[i];
        // Avoid deleting methods or essential properties
        if (typeof component[prop] !== 'function' && !keepProps.includes(prop)) {
          //console.log('deleting', prop);
          delete component[prop];
        }
      }
      // Explicitly nullify potentially large objects if needed, e.g.:
      // component.data = null;
      // component.element = null; // Or handle DOM removal elsewhere
    };

    /** Re-renders the component with completely new data. */
    component.render = function (newData) {
      const currentComponent = this.component || this;
      const targetElement = currentComponent.element;
      const parent = targetElement?.parentElement;
      const wrapper = currentComponent.wrapperElement;
      const tmplFunc = compomint.tmpl(currentComponent.tmplId); // Get the render function again

      if (!tmplFunc) {
        console.error(`Cannot re-render: Template function for "${currentComponent.tmplId}" not found.`);
        return currentComponent; // Return current scope on error
      }

      // Preserve lifecycle hooks if they exist
      const hooks = {
        beforeAppendTo: currentComponent.beforeAppendTo,
        afterAppendTo: currentComponent.afterAppendTo,
        beforeRemove: currentComponent.beforeRemove,
        afterRemove: currentComponent.afterRemove,
        beforeRefresh: currentComponent.beforeRefresh,
        afterRefresh: currentComponent.afterRefresh
      };

      // Call beforeRemove hook
      if (currentComponent.beforeRemove) { try { currentComponent.beforeRemove(); } catch (e) { console.error("Error in beforeRemove during render:", e); } }

      let newComponent;
      if (wrapper) {
        // Render directly into the wrapper
        // Release old scope *before* creating new one to potentially reuse status
        // currentComponent.release(); // Let's reuse the scope object instead
        newComponent = tmplFunc(newData, wrapper, null, currentComponent); // Reuse scope object
      } else if (parent) {
        // Render fragment and replace in parent
        // currentComponent.release(); // Reuse scope object
        newComponent = tmplFunc(newData, null, null, currentComponent); // Reuse scope object
        if (newComponent.element && targetElement) {
          // Call beforeAppendTo hook for the new element
          if (newComponent.beforeAppendTo) { try { newComponent.beforeAppendTo(); } catch (e) { console.error("Error in beforeAppendTo during render:", e); } }
          parent.replaceChild(newComponent.element, targetElement);
          // Call afterAppendTo hook for the new element
          if (newComponent.afterAppendTo) { setTimeout(() => { try { newComponent.afterAppendTo(); } catch (e) { console.error("Error in afterAppendTo during render:", e); } }, 0); }
        } else if (configs.debug) {
          console.warn(`Re-render of "${currentComponent.tmplId}" resulted in no element or target was missing.`);
        }
      } else {
        currentComponent.release();
        newComponent = tmplFunc(newData, null, null, currentComponent);
        return newComponent;
      }

      // Call afterRemove hook for the old element/scope state
      if (currentComponent.afterRemove) { try { currentComponent.afterRemove(); } catch (e) { console.error("Error in afterRemove during render:", e); } }

      // Restore hooks onto the potentially new scope object reference (though we reuse it now)
      Object.assign(newComponent, hooks);

      return newComponent;
    };

    /** Re-renders the component, merging new data with existing data. */
    component.refresh = function (reflashData) {
      const currentComponent = this.component || this; // `this` refers to the component object
      const currentData = currentComponent[dataKeyName];
      if (currentComponent.beforeRefresh) { try { currentComponent.beforeRefresh(); } catch (e) { console.error("Error in beforeRefresh:", e); } }
      // Merge new data with existing data
      const newData = Object.assign({}, currentData || {}, reflashData);
      // Call render with the merged data
      const newComponent = currentComponent.render(newData);
      if (currentComponent.afterRefresh) { try { currentComponent.afterRefresh(); } catch (e) { console.error("Error in afterRefresh:", e); } }
      return newComponent;
    };

    component.reflash = component.refresh;
    // 11. Return the final scope object
    return component;
  }; // End of tmpl function definition

  // Set the 'name' property of the render function for debugging
  Object.defineProperty(renderingFunc, "name", { value: `render_${tmplId}`, writable: false });

  // Store metadata in the cache
  if (tmplId) {
    const tmplMeta = configs.debug ? {
      renderingFunc: renderingFunc,
      source: escapeHtml.escape(`function ${tmplId}_source (${templateEngine.keys.dataKeyName}, ${templateEngine.keys.statusKeyName}, ${templateEngine.keys.componentKeyName}, ${templateEngine.keys.i18nKeyName}, __lazyScope, __debugger) {\n${source}\n}`),
      templateText: escapeHtml.escape(templateText),
    } : {
      renderingFunc: renderingFunc
    }
    cachedTmpl.set(tmplId, tmplMeta);

    // Add to global tmpl namespace (e.g., tmpl.ui.Button)
    const tmplIdNames = tmplId.split("-");
    if (tmplIdNames.length > 1) {
      const group = tmplIdNames[0];
      let groupObj = tmpl[group];
      if (!groupObj) {
        tmpl[group] = groupObj = {};
      }
      // Convert sub-parts to camelCase (e.g., "my-component-name-grouped" -> "my-componentNameGrouped", )
      const tmplIdSub = tmplIdNames
        .slice(1)
        .map((part, index) => index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
      groupObj[tmplIdSub] = tmplMeta.renderingFunc;
    }
  }
  return renderingFunc;
}); // End of templateBuilder

compomint.remapTmpl = function (json) {
  Object.keys(json).forEach(function (oldKey) {
    const newKey = json[oldKey];
    const meta = cachedTmpl.get(oldKey);
    if (meta) {
      cachedTmpl.set(newKey, meta);
      // Optionally update the global tmpl namespace as well?
      // This could be complex if the group/sub names change.
      if (configs.debug) console.log(`Remapped template "${oldKey}" to "${newKey}"`);
    } else if (configs.debug) {
      console.warn(`Cannot remap template: Old key "${oldKey}" not found in cache.`);
    }
  });
};

compomint.tmpl = function (tmplId) {
  const tmplMeta = cachedTmpl.get(tmplId);
  return tmplMeta ? tmplMeta.renderingFunc : null;
};

const safeTemplate = function (source) {
  // Safely creates a <template> element from a source string or element, handling potential HTML injection in older browsers.
  let template;
  if (source instanceof Element) { // Check if source is already a DOM element
    // If it's already an element (like document.body), clone it to avoid modifying the original
    // However, the primary use case seems to be parsing strings or template tags within an element.
    // If source *is* the container (e.g., document.body), we probably don't want to clone it here.
    // Let's assume addTmpls handles querying within the source element directly.
    // If source is a template element itself, just return it.
    if (source.tagName === 'TEMPLATE') return source;
    // If it's another element, we'll query inside it later. Return as is.
    return source;
  } else if (typeof source !== 'string') {
    if (configs.debug) console.warn("safeTemplate received non-string/non-element source:", source);
    source = ''; // Default to empty string if invalid input
  }

  // Create a template element for parsing
  template = document.createElement("template");
  if (isSupportTemplateTag) {
    const encodedSource = source.replace(
      /<(?!template|\/template|body|\/body|html|\/html|head|\/head|style|\/style|script|\/script|link|\/link|meta|\/meta|!--)/gi,
      "&lt;"
    );

    template.innerHTML = encodedSource;
  } else {
    // Older browsers (IE): Simulate template using a script tag and escape potentially harmful '<'
    const encodedSource = source
      .replace(
        /<(?!template|\/template|body|\/body|html|\/html|head|\/head|style|\/style|script|\/script|link|\/link|meta|\/meta|!--)/gi,
        "&lt;"
      )
      .replace(/<template/g, '<script type="template"')
      .replace(/<\/template>/g, "</script>");
    template.innerHTML = encodedSource
  }
  return template;
};

const addTmpl = (compomint.addTmpl = function (tmplId, element, templateEngine) {
  let templateText = element instanceof Element ? element.innerHTML : String(element); // Ensure string
  // Unescape HTML entities and remove comment markers before compilation
  templateText = escapeHtml.unescape(
    templateText.replace(/<!---|--->/gi, "") // Remove custom comment markers if used
  );
  return templateBuilder(tmplId, templateText, templateEngine);
});

const addTmpls = (compomint.addTmpls = function (
  source,
  removeInnerTemplate,
  templateEngine
) {
  // Handle argument shifting: (source, templateEngine)
  if (typeof removeInnerTemplate !== "boolean" && templateEngine == undefined) {
    templateEngine = removeInnerTemplate;
    removeInnerTemplate = false; // Default removeInnerTemplate to false
  } else {
    removeInnerTemplate = !!removeInnerTemplate; // Ensure boolean
  }

  const container = safeTemplate(source); // Get a container (template or original element)
  const content = container.content || container; // Get content fragment or the element itself
  const tmplNodes = content.querySelectorAll(
    //'template,script[type="template"]'
    'template[id], script[type="text/template"][id], script[type="text/compomint"][id]' // Look for templates/scripts with IDs
  );

  let node = null;
  for (let i = 0, size = tmplNodes.length; i < size; i++) {
    node = tmplNodes.item(i);
    const tmplId = node.id;
    if (!tmplId) continue; // Skip if no ID

    node.dataset.coLoadScript
      ? addTmpl(node.id, node, templateEngine)({})
      : addTmpl(node.id, node, templateEngine);
    //addTmpl(tmplId, node, templateEngine);
    // Remove the original <template> or <script> tag if requested
    if (removeInnerTemplate && node.parentNode) {
      node.parentNode.removeChild(node);
    }
  }
  return container; // Return the container (might have been modified)
});

const addTmplByUrl = (compomint.addTmplByUrl = function compomint_addTmplByUrl(
  importData,
  option,
  callback
) {
  // Handle argument shifting: (importData, callback)
  if (!callback && typeof option === "function") {
    callback = option;
    option = {};
  }

  // Default options for loading external resources
  const defaultOptions = {
    loadScript: true,
    loadStyle: true,
    loadLink: true,
    templateEngine: undefined // No custom template config by default
  };
  option = Object.assign({}, defaultOptions, option); // Merge user options with defaults

  const importDataParser = function (obj) {
    if (typeof obj === "string") {
      return { url: obj, option: option }; // Use default options if only URL string is given
    } else if (obj && typeof obj === 'object' && obj.url) {
      // Merge item-specific options with the default options
      obj.option = Object.assign({}, option, obj.option);
      return obj;
    } else {
      console.error("Invalid import data format in addTmplByUrl:", obj);
      return null; // Indicate invalid data
    }
  };

  const appendElements = function (elements) {
    if (elements && elements.length > 0) {
      Array.prototype.forEach.call(elements, function (element) {
        if (!element) return;
        // Remove existing element with same ID
        if (element.id) {
          const oldElement = document.getElementById(element.id);
          if (oldElement) oldElement.parentNode.removeChild(oldElement);
        }
        // Append to head or body appropriately
        if (element.tagName === 'SCRIPT' || element.tagName === 'LINK' || element.tagName === 'STYLE') {
          document.head.appendChild(element); // Scripts, Links, Styles go in head
        } else {
          document.body.appendChild(element); // Other elements (less common for this func) go in body
        }
      });
    }
  };

  const importFunc = function (source, currentOption) {
    const templateContainer = safeTemplate(source); // Parse the source safely
    // Add templates defined within the fetched HTML
    addTmpls(templateContainer, false, currentOption.templateEngine); // Don't remove templates from the fragment yet

    const content = templateContainer.content || templateContainer;

    // Load <link> tags if enabled
    if (currentOption.loadLink) {
      const links = content.querySelectorAll('link[rel="stylesheet"]'); // Only stylesheets for now
      appendElements(links);
    }
    // Load <style> tags with IDs if enabled
    if (currentOption.loadStyle) {
      const styles = content.querySelectorAll("style[id]");
      appendElements(styles);
    }
    // Load <script> tags (not templates) if enabled
    if (currentOption.loadScript) {
      const scripts = content.querySelectorAll(
        'script:not([type]), script[type="text/javascript"], script[type="module"]' // Select standard script types
      );
      // Filter out scripts inside template tags and create executable script elements
      const executableScripts = Array.prototype.filter
        .call(scripts, function (node) {
          // Ensure it's not inside a <template> or <script type="text/template">
          let parent = node.parentNode;
          while (parent) {
            if (parent.tagName === 'TEMPLATE' || (parent.tagName === 'SCRIPT' && parent.type.includes('template'))) return false;
            parent = parent.parentNode;
          }
          return true; // Keep if not inside a template definition
        })
        .map(function (node) {
          // Create a new script element to ensure execution
          const scriptElm = document.createElement("script");
          // Copy attributes (like src, type, async, defer, id)
          for (let i = 0; i < node.attributes.length; i++) {
            scriptElm.setAttribute(node.attributes[i].name, node.attributes[i].value);
          }
          // Copy inline content
          if (node.innerHTML) {
            scriptElm.textContent = node.innerHTML;
          }
          return scriptElm;
        });
      appendElements(executableScripts);
    }
  };

  // Handle single URL/object or array
  if (Array.isArray(importData)) {
    let remaining = importData.length;
    if (remaining === 0 && callback) {
      callback(); // Call callback immediately if array is empty
      return;
    }
    importData.forEach(function (dataItem) {
      const parsedData = importDataParser(dataItem);
      if (!parsedData) { // Skip invalid entries
        remaining--;
        if (remaining === 0 && callback) callback();
        return;
      }
      const src = parsedData.url;
      const currentOption = parsedData.option;

      // Check file type for direct script/style loading
      if (src.indexOf(".js") > -1) {
        const script = genElement("script", { async: true, src: src }); // Use helper 'genElement' function
        script.addEventListener("load", function () {
          remaining--;
          if (remaining === 0 && callback) callback();
        });
        script.addEventListener("error", function () {
          console.error(`Failed to load script: ${src} `);
          remaining--;
          if (remaining === 0 && callback) callback();
        });
        document.head.appendChild(script);
      } else if (src.indexOf(".css") > -1) {
        const link = genElement("link", {
          type: "text/css",
          rel: "stylesheet",
          href: src,
        });
        link.addEventListener("load", function () { // CSS load event might not be reliable everywhere
          remaining--;
          if (remaining === 0 && callback) callback();
        });
        link.addEventListener("error", function () {
          console.error(`Failed to load stylesheet: ${src} `);
          remaining--;
          if (remaining === 0 && callback) callback();
        });
        document.head.appendChild(link);
        // Call callback slightly early for CSS as load event isn't guaranteed
        // setTimeout(() => {
        //    if (remaining > 0) { // Check if already called back
        //       remaining--;
        //       if (remaining === 0 && callback) callback();
        //    }
        // }, 50); // Adjust timeout as needed
      } else {
        // Assume HTML content, fetch and process
        requestFunc(src, null, function (source, status) {
          if (status === 200 || status === 0) { // Check for success or local file access
            try {
              importFunc(source, currentOption);
            } catch (e) {
              console.error(`Error processing imported HTML from ${src}: `, e);
              throw e;
            }
          } else {
            console.error(`Failed to fetch template file: ${src} (Status: ${status})`);
          }
          remaining--;
          if (remaining === 0 && callback) callback();
        });
      }
    });
  } else {
    // Handle single import item
    const parsedData = importDataParser(importData);
    if (!parsedData) {
      if (callback) callback(); // Call callback even if input is invalid
      return;
    }
    const src = parsedData.url;
    const currentOption = parsedData.option;

    if (src.endsWith(".js")) {
      const script = tag("script", { async: true, src: src });
      script.addEventListener("load", callback);
      script.addEventListener("error", () => { console.error(`Failed to load script: ${src} `); if (callback) callback(); });
      document.head.appendChild(script);
    } else if (src.endsWith(".css")) {
      const link = tag("link", { type: "text/css", rel: "stylesheet", href: src });
      link.addEventListener("load", callback); // May not fire reliably
      link.addEventListener("error", () => { console.error(`Failed to load stylesheet: ${src} `); if (callback) callback(); });
      document.head.appendChild(link);
      // setTimeout(callback, 50); // Call callback early for CSS
    } else {
      requestFunc(src, null, function (source, status) {
        if (status === 200 || status === 0) {
          try {
            importFunc(source, currentOption);
          } catch (e) {
            console.error(`Error processing imported HTML from ${src}: `, e);
          }
        } else {
          console.error(`Failed to fetch template file: ${src} (Status: ${status})`);
        }
        if (callback) callback();
      });
    }
  }
});

const requestFunc = function (url, option, callback) {
  const xmlhttp = new XMLHttpRequest();

  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == XMLHttpRequest.DONE) {
      // Status 0 is for local files (file://)
      if (xmlhttp.status == 200 || xmlhttp.status === 0) {
        callback(xmlhttp.responseText, xmlhttp.status, xmlhttp);
      } else {
        // Call callback even on error, but maybe pass an error indicator?
        // For now, just log error and call callback (as original did implicitly for non-200/0)
        if (xmlhttp.status == 404) {
          console.error(`Error 404: Not Found - ${url} `);
        } else if (xmlhttp.status >= 400) {
          console.error(`HTTP Error ${xmlhttp.status} for ${url}`);
        } else {
          // Network errors, timeouts etc. might not have a status or status 0
          console.error(`Request failed for ${url}`, xmlhttp.statusText);
        }
        // Call callback regardless, indicating failure via status code?
        // The original code only called back on 200/0. Let's stick to that.
        // However, addTmplByUrl needs the callback to decrement the counter.
        // Let's modify the callback signature or how addTmplByUrl handles it.
        // For now, let's call callback but the caller should check status.
        callback(null, xmlhttp.status, xmlhttp); // Pass null responseText on error
      }
    }
  };

  xmlhttp.onerror = function () {
    // Handle network errors
    console.error(`Network error requesting ${url} `);
    callback(null, 0, xmlhttp); // Status 0 can indicate network error
  };
  xmlhttp.ontimeout = function () {
    console.error(`Request timed out for ${url}`);
    callback(null, 408, xmlhttp); // 408 Request Timeout
  };

  try {
    const method = (option && option.method) || "GET";
    xmlhttp.open(method, url, true); // true for asynchronous

    if (option) {
      if (option.timeout) xmlhttp.timeout = option.timeout;
      if (option.headers) {
        Object.keys(option.headers).forEach(function (key) {
          xmlhttp.setRequestHeader(key, option.headers[key]);
        });
      }
      xmlhttp.send(option.body || null);
    } else {
      xmlhttp.send();
    }
  } catch (e) {
    console.error(`Error sending request to ${url}: `, e);
    callback(null, 0, xmlhttp); // Indicate error
  }
};

compomint.i18n = {};

compomint.addI18n = function (fullKey, i18nObj) {
  if (!fullKey || typeof fullKey !== 'string' || !i18nObj || typeof i18nObj !== 'object') {
    console.error("Invalid arguments for addI18n:", fullKey, i18nObj);
    return;
  }

  const langKeyNames = fullKey.split(".");
  const keyLength = langKeyNames.length - 1;
  let target = compomint.i18n;

  langKeyNames.forEach(function (key, i) {
    if (!key) return; // Skip empty keys resulting from ".."

    if (keyLength === i) {
      // Last key: Assign the retrieval function
      if (!target[key]) {
        target[key] = function (defaultText) {
          const lang = document.documentElement.lang || 'en';
          let label = i18nObj[lang];
          if (label === undefined || label === null) {
            label = defaultText; // Use provided default
            if (configs.debug) console.warn(`i18n: Label key["${fullKey}"] for lang "${lang}" is missing.Using default: "${defaultText}"`);
          }
          return label !== undefined && label !== null ? String(label) : ''; // Ensure string return
        };
      }
      Object.keys(i18nObj)
        .filter((lang) => i18nObj[lang] instanceof Object)
        .forEach((subKey) => {
          compomint.addI18n(fullKey + "." + subKey, i18nObj[subKey]);
          delete i18nObj[subKey];
          return;
        });
    } else {
      if (!target[key]) {
        target[key] = {};
      }
      target = target[key];
    }
  });
};

compomint.addI18ns = function (i18nObjs) {
  Object.keys(i18nObjs || {}).forEach(function (key) {
    compomint.addI18n(key, i18nObjs[key]);
  });
};

let elementCount = 0;
tools.genId = function (tmplId) {
  elementCount++;
  return tmplId + elementCount;
};

const genElement = (tools.genElement = function (tagName, attrs = {}, ...children) {
  const element = document.createElement(tagName);

  if (typeof attrs === 'string') {
    element.appendChild(document.createTextNode(attrs));
  } else if (attrs instanceof Node) {
    element.appendChild(attrs);
  } else if (Array.isArray(attrs)) {
    children = attrs.concat(children);
  } else {
    // Set attributes
    Object.keys(attrs).forEach(function (key) {
      const value = attrs[key];
      // Set attributes directly as properties where possible (e.g., className, id, src)
      // Handle 'class' specifically -> 'className'
      const propName = key === 'class' ? 'className' : key;
      try {
        if (typeof value === 'object') {
          Object.assign(element[key], value);
        } else if (propName in element) {
          // Check if the property exists and is writable, or if it's a data-* attribute
          element[propName] = value;
        } else {
          // Fallback to setAttribute for other cases (like 'for', 'colspan', custom attributes)
          element.setAttribute(key, value);
        }
      } catch (e) {
        console.error(`Error setting attribute / property "${key}" on < ${tagName}>: `, e);
      }
    });
  }

  // Iterate through the children array and append child nodes
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });
  return element;
});

tools.props = function (...propsObjects) {
  if (!propsObjects || propsObjects.length === 0) return "";
  // Merge all passed objects into one
  const mergedProps = Object.assign({}, ...propsObjects);
  const propStrArray = [];
  Object.keys(mergedProps).forEach(function (key) {
    const value = mergedProps[key];
    // Include attribute only if value is truthy (or explicitly 0)
    if (value || value === 0) {
      // Escape double quotes within the attribute value
      const escapedValue = String(value).replace(/"/g, '&quot;');
      propStrArray.push(`${key}="${escapedValue}"`);
    }
  });
  return propStrArray.join(" ");
};

addTmpl("co-Ele", `##%compomint.tools.genElement(data[0], data[1])##`);
addTmpl(
  "co-Element",
  `##
  data.tag = data.tag || 'div';
  ##
  &lt;##=data.tag##
    ##=data.id ? 'id=\"' + (data.id === true ? component._id : data.id) + '\"' : ''##
    data-co-props=\"##:data.props##\"
    data-co-event=\"##:data.event##\"&gt;
    ##if (typeof data.content === "string") {##
    ##=data.content##
    ##} else {##
      ##%data.content##
    ##}##
  &lt;/##=data.tag##&gt;`
);
// Return the main namespaces
export { compomint, tmpl };
