/*
 * Copyright (c) 2025-present, Choi Sungho
 * Code released under the MIT license
 */

(function () {
  "use strict";

  // Polyfill for Object.assign
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
  if (typeof Object.assign != "function") {
    Object.defineProperty(Object, "assign", {
      value: function assign(target, ...params) {
        if (target == null) {
          throw new TypeError("Cannot convert undefined or null to object");
        }
        let to = Object(target);
        for (let index = 0, length = params.length; index < length; index++) {
          let nextSource = params[index];
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

  let root = this;
  let Compomint = (root.compomint = root.compomint || {});
  let tools = (Compomint.tools = Compomint.tools || {});
  let config = (Compomint.config = Object.assign({ printExecTime: false, debug: false, throwError: true }, Compomint.config));

  //let requestCacheControl = tools.requestCacheControl || true;
  let cachedTmpl = (Compomint.tmplCache = Compomint.tmplCache || new Map());
  if (!cachedTmpl.has("anonymous")) {
    cachedTmpl.set("anonymous", { elements: new Set() });
  }
  let isSupportTemplateTag = "content" in document.createElement("template");

  root.tmpl = {};

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  let noMatch = /(.)^/;
  let escapes = {
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

  let escaper = /\>( |\n)+\<|\>( |\n)+|( |\n)+\<|\\|'|\r|\n|\t|\u2028|\u2029/g;

  let firstElementChild = function (ele) {
    if (ele.firstElementChild) return ele.firstElementChild;
    let children = ele.childNodes;
    for (let i = 0, size = children.length; i < size; i++) {
      if (children[i] instanceof Element) {
        return children[i];
      }
    }
    return null;
  };

  let childNodeCount = function (ele) {
    return (
      ele.childElementCount ||
      Array.prototype.filter.call(ele.childNodes, function (child) {
        return child instanceof Node;
      }).length
    );
  };
  let childElementCount = function (ele) {
    return (
      ele.childElementCount ||
      Array.prototype.filter.call(ele.childNodes, function (child) {
        return child instanceof Element;
      }).length
    );
  };
  let cleanNode = function (node) {
    for (let n = 0; n < node.childNodes.length; n++) {
      let child = node.childNodes[n];
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

  Compomint.templateSettings = {
    firstElementChild: firstElementChild,
    childElementCount: childElementCount,
    style: {
      pattern: /(\<style id=[\s\S]+?\>[\s\S]+?\<\/style\>)/g,
      exec: function (style) {
        // Extracts <style> tags with IDs, removes any existing style with the same ID, and appends the new one to <head>.
        let dumy = document.createElement("template");
        dumy.innerHTML = style;
        let styleNode = (dumy.content || dumy).querySelector("style");
        let oldStyleNode = document.getElementById(styleNode.id);
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
          if (config.throwError) {
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
        let interpolateSyntax = `typeof (interpolate)=='function' ? (interpolate)() : (interpolate)`;
        return (`';\n(() => {let __t, interpolate=${interpolate};\n__p+=((__t=(${interpolateSyntax}))==null ? '' : __t );})();\n__p+='`);
      },
    },
    elementProps: {
      pattern: /data-co-props="##:([\s\S]+?)##"/g,
      exec: function (props) {
        let source = `';\nvar eventId = (__lazyScope.elementPropsArray.length);\n__p+='data-co-props=\"'+eventId+'\"';\n
__lazyScope.elementPropsArray[eventId] = ${props};\n__p+='`;
        return source;
      },
      lazyExec: function (data, lazyScope, component, wrapper) {
        lazyScope.elementPropsArray.forEach(function (props, eventId) {
          if (!props) return;
          let $elementTrigger = wrapper.querySelector(
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
        let source = `';\nvar eventId = (__lazyScope.namedElementArray.length);\n__p+='data-co-named-element=\"'+eventId+'\"';\n
__lazyScope.namedElementArray[eventId] = ${key};\n__p+='`;
        return source;
      },
      lazyExec: function (data, lazyScope, component, wrapper) {
        // After rendering, finds elements with the temporary attribute, removes it, and assigns the element to the specified key on the template scope.
        lazyScope.namedElementArray.forEach(function (key, eventId) {
          let $elementTrigger = wrapper.querySelector(
            '[data-co-named-element="' + eventId + '"]'
          );
          if (!$elementTrigger) {
            if (config.debug) console.warn(`Named element target not found for ID ${eventId} in template ${component.tmplId}`);
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
        var source = `';\nvar eventId = (__lazyScope.elementRefArray.length);\n__p+='data-co-element-ref=\"'+eventId+'\"';
var ${key} = null;\n__lazyScope.elementRefArray[eventId] = function(target) {${key} = target;};\n__p+='`;
        return source;
      },
      lazyExec: function (data, lazyScope, component, wrapper) {
        // After rendering, finds elements with the temporary attribute, removes it, and calls the stored function to assign the element to the variable.
        lazyScope.elementRefArray.forEach(function (func, eventId) {
          let $elementTrigger = wrapper.querySelector(
            '[data-co-element-ref="' + eventId + '"]'
          );
          if (!$elementTrigger) {
            if (config.debug) console.warn(`Element ref target not found for ID ${eventId} in template ${component.tmplId}`);
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
        let elementLoadSplitArray = elementLoad.split("::");
        let source = `';\nlet eventId = (__lazyScope.elementLoadArray.length);\n__p+='data-co-load=\"'+eventId+'\"';
__lazyScope.elementLoadArray[eventId] = {loadFunc: ${elementLoadSplitArray[0]}, customData: ${elementLoadSplitArray[1]}};\n__p+='`;
        return source;
      },
      lazyExec: function (data, lazyScope, component, wrapper) {
        // After rendering, finds elements with the temporary attribute, removes it, and executes the load function.
        lazyScope.elementLoadArray.forEach(function (elementLoad, eventId) {
          let $elementTrigger = wrapper.querySelector(
            '[data-co-load="' + eventId + '"]'
          );
          if (!$elementTrigger) {
            if (config.debug) console.warn(`Element load target not found for ID ${eventId} in template ${component.tmplId}`);
            return;
          }
          delete $elementTrigger.dataset.coLoad;
          let parentElement = $elementTrigger.parentElement;
          try {
            elementLoad.loadFunc.call(
              $elementTrigger, // this context
              $elementTrigger, // first argument
              { // second argument (options object)
                "data": data,
                "element": $elementTrigger,
                "customData": elementLoad.customData,
                "component": component,
              },
            );
          } catch (e) {
            console.error(`Error executing elementLoad function for ID ${eventId} in template ${component.tmplId}:`, e, elementLoad.loadFunc);
            if (config.throwError) throw e;
          }
        });
      },
    },
    event: {
      pattern: /data-co-event="##:([\s\S]+?)##"/g, // Matches data-co-event="##:handler::customData:::handler2::customData2##"
      exec: function (event) {
        // Generates code to store event handler configurations (function, custom data) in a lazy scope array.
        let eventStrArray = event.split(":::"); // Split multiple handlers
        let source = `';\n(() => {let eventId = (__lazyScope.eventArray.length);\n__p+='data-co-event=\"'+eventId+'\"';\n`;
        let eventArray = [];
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
        let self = this;
        let attacher = self.event.attacher;
        lazyScope.eventArray.forEach(function (selectedArray, eventId) {
          let $elementTrigger = wrapper.querySelector(
            `[data-co-event="${eventId}"]`
          );
          if (!$elementTrigger) {
            if (config.debug) console.warn(`Event target not found for ID ${eventId} in template ${component.tmplId}`);
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
        let customEvent = new Event(eventName, {
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
        let trigger = self.event.trigger;
        let $childTarget = self.firstElementChild(wrapper);
        let $targetElement =
          self.childElementCount(wrapper) == 1 ? $childTarget : null; // Reference to the single root element, if it exists

        if (!eventFunc) {
          return;
        }

        // Prepare parameters for the event handler function
        let eventFuncParams = [
          $elementTrigger, // 1. element: The element the listener is attached to
          null,            // 2. event: The DOM event object (filled in later)
          {                // 3. context: An object with useful references
            "data": data,
            "customData": eventData.customData,
            "element": $elementTrigger,
            "componentElement": $targetElement || $childTarget?.parentElement, // The component's root element or its parent
            "component": component,
          },
        ];

        if (typeof eventFunc === 'function') {
          $elementTrigger.addEventListener("click", function (event) {
            event.stopPropagation(); // Prevent event from bubbling up
            eventFuncParams[1] = event; // Add the event object
            try {
              eventFunc.call(...eventFuncParams); // Execute the handler
            } catch (e) {
              console.error(`Error in event handler for template ${component.tmplId}:`, e, eventFunc);
              if (config.throwError) throw e;
            }
          });
          return;
        }

        // Advanced case: eventFunc is an object mapping event types to handlers
        let triggerName = eventFunc.triggerName; // Optional key to store trigger functions
        if (triggerName) {
          component.trigger = component.trigger || {};
          component.trigger[triggerName] = {}; // Namespace for trigger functions
        }

        Object.keys(eventFunc).forEach(function (eventType) {
          if (eventType == "load") {
            // Special 'load' event type, executed immediately
            eventFuncParams[1] = $elementTrigger; // 'event' is the element itself for load
            try {
              eventFunc[eventType].call(...eventFuncParams);
            } catch (e) {
              console.error(`Error in 'load' event handler for template ${component.tmplId}:`, e, eventFunc[eventType]);
              if (config.throwError) throw e;
            }
            return;
          } else if (eventType == "namedElement") {
            // Special 'ref' key to assign the element to a property on the template scope
            component[eventFunc[eventType]] = $elementTrigger;
            return;
          } else if (eventType == "triggerName") {
            // Skip the triggerName property itself
            return;
          }

          // Attach standard DOM event listener
          $elementTrigger.addEventListener(eventType, function (event) {
            event.stopPropagation();
            eventFuncParams[1] = event;
            try {
              eventFunc[eventType].call(...eventFuncParams);
            } catch (e) {
              console.error(`Error in '${eventType}' event handler for template ${component.tmplId}:`, e, eventFunc[eventType]);
              if (config.throwError) throw e;
            }
          });

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
        let elementSplitArray = target.split("::");
        let source = `';\n(() => {
let elementId = (__lazyScope.elementArray.length);
__p+='<template data-co-tmpl-element-id=\"'+elementId+'\"></template>';
__lazyScope.elementArray[elementId] = {childTarget: ${elementSplitArray[0]}, nonblocking: ${(elementSplitArray[1] || false)}};})();
__p+='`;
        return source;
      },
      lazyExec: function (data, lazyScope, component, wrapper) {
        // After rendering, finds the placeholder <template> tags and replaces them with the actual content (component, element, string, etc.).
        let self = this;
        lazyScope.elementArray.forEach(function (ele, elementId) {
          let childTarget = ele.childTarget;
          let nonblocking = ele.nonblocking; // Delay insertion using setTimeout if true or a number (ms)
          let $tmplElement = wrapper.querySelector(
            `template[data-co-tmpl-element-id="${elementId}"]`
          );

          if (!$tmplElement) {
            if (config.debug) console.warn(`Element insertion placeholder not found for ID ${elementId} in template ${component.tmplId}`);
            return;
          }
          if (!$tmplElement.parentNode) {
            if (config.debug) console.warn(`Element insertion placeholder for ID ${elementId} in template ${component.tmplId} has no parent.`);
            return; // Already removed or invalid state
          }

          // Function to perform the actual replacement
          let doFunc = function () {
            if (!$tmplElement || !$tmplElement.parentNode) {
              if (config.debug) console.warn(`Placeholder for ID ${elementId} removed before insertion in template ${component.tmplId}.`);
              return; // Check again in case it was removed during delay
            }

            try {
              if (childTarget instanceof Array) {
                // Handle array of items to insert
                let docFragment = document.createDocumentFragment();
                childTarget.forEach(function (child) {
                  if (!child) return;
                  let childElement = child.element || child; // Support scope objects or direct elements/strings
                  let nodeToAppend = null;

                  if (typeof childElement === "string" || typeof childElement === "number") {
                    nodeToAppend = self.element.stringToElement(childElement);
                  } else if (typeof childElement === "function") {
                    nodeToAppend = self.element.stringToElement(childElement());
                  } else if (childElement instanceof Node) {
                    nodeToAppend = childElement;
                  } else {
                    if (config.debug) console.warn(`Invalid item type in element array for ID ${elementId}, template ${component.tmplId}:`, childElement);
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
                  self.element.stringToElement(childTarget),
                  $tmplElement
                );
              } else if (typeof childTarget === "function") {
                // Handle function returning string/number/element
                $tmplElement.parentNode.replaceChild(
                  self.element.stringToElement(childTarget()),
                  $tmplElement
                );
              } else if (childTarget && (childTarget.element || childTarget) instanceof Node) {
                // Handle component scope object or direct Node insertion
                let childScope = childTarget; // Assume it might be a scope
                let childElement = childScope.element || childScope; // Get the actual element

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
                if (config.debug) console.warn(`Invalid target for element insertion ID ${elementId}, template ${component.tmplId}:`, childTarget);
                $tmplElement.parentNode.removeChild($tmplElement);
              }
            } catch (e) {
              console.error(`Error during element insertion for ID ${elementId}, template ${component.tmplId}:`, e);
              if (config.throwError) throw e;
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
      domParser: new DOMParser(),
      stringToElement: function (str) {
        if (typeof str === 'number' || !isNaN(str)) { // Check if it's a number or a numeric string
          return document.createTextNode(String(str));
        } else if (typeof str === 'string') {
          try {
            // Handle string is Html
            const body = this.domParser.parseFromString(str, "text/html").body;
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
      },
    },
    lazyEvaluate: {
      pattern: /###([\s\S]+?)##/g, // Matches ### lazyEvaluate blocks ##
      exec: function (lazyEvaluate) {
        // Generates code to push a function containing the lazy code onto a lazy scope array.
        let source = `';\n__lazyScope.lazyEvaluateArray.push(function(data) {${lazyEvaluate}});\n__p+='`;
        return source;
      },
      lazyExec: function (data, lazyScope, component, wrapper) {
        // After rendering, executes all the stored lazy functions.
        let $childTarget = this.firstElementChild(wrapper);
        let $targetElement =
          this.childElementCount(wrapper) == 1 ? $childTarget : null; // Component's root element if single, otherwise null
        lazyScope.lazyEvaluateArray.forEach(function (selectedFunc, idx) {
          try {
            // Call the function with the component's root element (or its parent if multiple roots) as 'this' context
            selectedFunc.call($targetElement || $childTarget.parentElement, data); // Pass component data as argument
          } catch (e) {
            console.error(`Error in lazyEvaluate block ${idx} for template ${component.tmplId}:`, e, selectedFunc);
            if (config.throwError) throw e;
          }
        });
        return;
      },
    },
    escape: {
      pattern: /##-([\s\S]+?)##/g, // Matches ##- escape blocks ##
      exec: function (escape) {
        // Generates code to evaluate the expression and append the HTML-escaped result to the output string.

        return (`';\n(() => {let __t;__p+=((__t=(${escape}))==null ? '' : compomint.tools.escapeHtml.escape(__t)); })();\n__p+='`);
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
    dataKeyName: "data",
    statusKeyName: "status",
    componentKeyName: "component",
    i18nKeyName: "i18n",
  };

  let escapeHtml = (function () {
    let escapeMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "`": "&#x60;",
      "\n": "&#10;",
    };

    // Create the inverse map for unescaping
    let unescapeMap = Object.fromEntries(Object.entries(escapeMap).map(([key, value]) => [value, key]));

    // Factory function from underscore.js to create efficient escaper/unescaper functions
    let createEscaper = function (map) {
      let escaper = function (match) {
        return map[match];
      };
      // Build regex source string like '(?:&|<|>|")'
      let source = `(?:${Object.keys(map).join("|").replace(/\\/g, '\\\\')})`; // Escape backslashes if any keys have them
      // let source = `(?:${Object.keys(map).join("|")})`; // Escape backslashes if any keys have them
      let testRegexp = RegExp(source);
      let replaceRegexp = RegExp(source, "g");
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

  let matcherFunc = function (settings) {
    let patternArray = [];
    let execArray = [];
    let lazyExecMap = {}; // Renamed from lazyExecArray for clarity
    let lazyScopeSeed = {}; // Renamed from lazyScope for clarity
    let setting = null;

    Object.keys(settings).forEach(function (key) {
      setting = settings[key];
      // Collect patterns and corresponding exec functions
      if (setting && typeof setting === 'object' && setting.pattern instanceof RegExp && typeof setting.exec === 'function') {
        patternArray.push((setting.pattern || noMatch).source);
        execArray.push(setting.exec);
      }
      // Collect lazy execution functions and initialize seed for lazy scope
      if (setting && typeof setting === 'object' && typeof setting.lazyExec === 'function') {
        const arrayKey = `${key}Array`;
        lazyExecMap[arrayKey] = setting.lazyExec;
        lazyScopeSeed[arrayKey] = []; // Initialize as empty array
      }
    });
    return {
      settings: settings,
      pattern: new RegExp(patternArray.join("|"), "g"),
      exec: execArray,
      lazyExecKeys: Object.keys(lazyScopeSeed),
      lazyExec: lazyExecMap,
      lazyScopeSeed: JSON.stringify(lazyScopeSeed),
    };
  };

  let escapeFunc = function (match) {
    // Prioritize direct match, then match ignoring space/newline (for ><), else empty string
    return escapes[match] || escapes[match.replace(/[ \n]/g, "")] || "";
  };

  let defaultMatcher = matcherFunc(Compomint.templateSettings);

  let templateParser = function (tmplId, text, matcher) {
    if (config.printExecTime) console.time(`tmpl: ${tmplId}`);

    let index = 0;
    let source = "";

    // Use replace to iterate through matches of the combined pattern
    text.replace(matcher.pattern, function (...params) {
      let match = params[0]; // The full matched string
      let offset = params[params.length - 2]; // The index of the match in the original string

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
          source += matcher.exec[matchIndex].call(matcher.settings, selectedMatchContent, tmplId);
        } catch (e) {
          console.error(`Error executing template rule index ${matchIndex} for match "${selectedMatchContent}" in template "${tmplId}":`, e);
          if (config.throwError) throw e;
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

    if (config.printExecTime) console.timeEnd(`tmpl: ${tmplId}`);
    return source;
  };


  let templateBuilder = (Compomint.template = function compomint_templateBuilder(
    tmplId,
    templateText,
    tmplSettings
  ) {
    // JavaScript micro-templating, similar to John Resig's implementation.
    let settings = Compomint.templateSettings;
    let matcher = defaultMatcher;

    // Use custom settings if provided
    if (tmplSettings) {
      settings = Object.assign({}, Compomint.templateSettings, tmplSettings);
      matcher = matcherFunc(settings); // Create a matcher specific to these settings
    }
    // 1. Parse the template text into JavaScript source code
    let source = `
/* tmplId: ${tmplId} */
//# sourceURL=http://tmpl//${tmplId.split("-").join("//")}.js
if (__debugger) {
  debugger;
}
let __p='';
__p+='${templateParser(tmplId, templateText, matcher)}';
return __p;`;

    let sourceGenFunc = null; // Will hold the compiled function

    // 2. Compile the generated JavaScript source into a function
    try {
      sourceGenFunc = new Function(
        settings.dataKeyName,      // e.g., "data"
        settings.statusKeyName,    // e.g., "status"
        settings.componentKeyName, // e.g., "component"
        settings.i18nKeyName,      // e.g., "i18n"
        "__lazyScope",             // Internal object for lazy execution data
        "__debugger",              // Internal object for debugging
        source                     // The generated JS code
      );
    } catch (e) {
      if (config.throwError) {
        console.error(`Template compilation error in "${tmplId}", ${e.name}: ${e.message}`);
        // Re-run compilation in a way that might provide more detailed browser errors
        new Function(
          settings.dataKeyName,
          settings.statusKeyName,
          settings.componentKeyName,
          settings.i18nKeyName,
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

      let dataKeyName = settings.dataKeyName;
      let statusKeyName = settings.statusKeyName;
      let lazyScope = JSON.parse(matcher.lazyScopeSeed);

      // 3. Prepare the Component Scope object
      let component = Object.assign(baseComponent || {}, {
        tmplId: tmplId,
        // Define methods available on the component
        replace: function (newComponent) {
          if (!component.element || !component.element.parentElement) {
            if (config.debug) console.warn(`Cannot replace template "${tmplId}": element not in DOM.`);
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
          let parent = component.element?.parentElement;
          if (parent) {
            if (spacer) {
              // Replace with an empty template tag as a placeholder
              let dumy = document.createElement("template");
              parent.replaceChild(dumy, component.element);
              component.element = dumy; // Update scope's element reference
            } else {
              parent.removeChild(component.element);
              // Note: component.element still holds the removed element reference
            }
          } else if (config.debug) {
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
          } else if (config.debug) {
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
      let hasParent = wrapperElement instanceof Element; // Check if rendering into a container
      let temp = document.createElement("template"); // Use template tag for parsing
      let returnTarget = null; // Will hold the final element/fragment

      if (config.printExecTime) console.time(`render: ${tmplId}`);

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
            Compomint.i18n[tmplId], // Pass i18n object
            lazyScope // Pass internal lazy scope
          );
      } catch (e) {
        if (config.throwError) {
          console.error(`Runtime error during render of "${tmplId}":`, e.message);
          console.log("--- Data ---");
          console.log(data);
          console.log("------------");
          // Attempt to re-run with debugger potentially attached
          try {
            sourceGenFunc.call(
              wrapperElement || null, data, component[statusKeyName], component,
              component[settings.i18nKeyName], lazyScope,
              config.debug // __debugger: true
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
      if (config.printExecTime) console.timeEnd(`render: ${tmplId}`);

      // 5. Parse the generated HTML into a DOM fragment
      temp.innerHTML = renderedHTML;
      let docFragment = temp.content || temp; // Use template.content if available

      // Handle IE11 case where content might be directly on the template element
      if (docFragment.tagName == "TEMPLATE" && !temp.content) {
        let children = Array.from(docFragment.childNodes); // Create array copy
        docFragment = document.createDocumentFragment();
        children.forEach(function (child) {
          docFragment.appendChild(child); // Move children to the fragment
        });
      }

      // 6. Execute Lazy Functions (attaching events, refs, etc.)
      let lazyExec = matcher.lazyExec;
      if (data) { // Only run lazy exec if data was provided (avoids errors on empty render)
        matcher.lazyExecKeys.forEach(function (key) {
          if (lazyScope[key] && lazyScope[key].length > 0) { // Check if the array exists and has items
            try {
              lazyExec[key].call(settings, data, lazyScope, component, docFragment);
            } catch (e) {
              if (config.throwError) {
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
          if (config.throwError) throw e;
        }
      }

      // 10. Define Component Methods (Render/Refresh/Release) - Placed here so they are part of the returned component

      /** Releases internal references held by the component object. */
      component.release = function () {
        let props = Object.getOwnPropertyNames(component);
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
        let currentComponent = this.component || this;
        let targetElement = currentComponent.element;
        let parent = targetElement?.parentElement;
        let wrapper = currentComponent.wrapperElement;
        let tmplFunc = Compomint.tmpl(currentComponent.tmplId); // Get the render function again

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
          } else if (config.debug) {
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
        let currentComponent = this.component || this; // `this` refers to the component object
        let currentData = currentComponent[dataKeyName];
        if (currentComponent.beforeRefresh) { try { currentComponent.beforeRefresh(); } catch (e) { console.error("Error in beforeRefresh:", e); } }
        // Merge new data with existing data
        let newData = Object.assign({}, currentData || {}, reflashData);
        // Call render with the merged data
        let newComponent = currentComponent.render(newData);
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
    let tmpl_source = `function ${tmplId}_source (${(settings.variable || "data")}){\n${source}}`;

    if (tmplId) {
      let tmplMeta = {
        renderingFunc: renderingFunc,
        source: escapeHtml.escape(tmpl_source),
        templateText: escapeHtml.escape(templateText),
      };
      cachedTmpl.set(tmplId, tmplMeta);

      // Add to global tmpl namespace (e.g., tmpl.ui.Button)
      let tmplIdNames = tmplId.split("-");
      if (tmplIdNames.length > 1) {
        let group = tmplIdNames[0];
        let groupObj = root.tmpl[group];
        if (!groupObj) {
          root.tmpl[group] = groupObj = {};
        }
        // Convert sub-parts to camelCase (e.g., "my-component-name-grouped" -> "my-componentNameGrouped", )
        let tmplIdSub = tmplIdNames
          .slice(1)
          .map((part, index) => index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))
          .join('');
        groupObj[tmplIdSub] = tmplMeta.renderingFunc;
      }
    }
    return renderingFunc;
  }); // End of templateBuilder

  Compomint.remapTmpl = function (json) {
    Object.keys(json).forEach(function (oldKey) {
      const newKey = json[oldKey];
      const meta = cachedTmpl.get(oldKey);
      if (meta) {
        cachedTmpl.set(newKey, meta);
        // Optionally update the global tmpl namespace as well?
        // This could be complex if the group/sub names change.
        if (config.debug) console.log(`Remapped template "${oldKey}" to "${newKey}"`);
      } else if (config.debug) {
        console.warn(`Cannot remap template: Old key "${oldKey}" not found in cache.`);
      }
    });
  };

  Compomint.tmpl = function (tmplId) {
    let tmplMeta = cachedTmpl.get(tmplId);
    return tmplMeta ? tmplMeta.renderingFunc : null;
  };

  let safeTemplate = function (source) {
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
      if (config.debug) console.warn("safeTemplate received non-string/non-element source:", source);
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

  let addTmpl = (Compomint.addTmpl = function (tmplId, element, tmplSettings) {
    let templateText = element instanceof Element ? element.innerHTML : String(element); // Ensure string
    // Unescape HTML entities and remove comment markers before compilation
    templateText = escapeHtml.unescape(
      templateText.replace(/<!---|--->/gi, "") // Remove custom comment markers if used
    );
    return templateBuilder(tmplId, templateText, tmplSettings);
  });

  let addTmpls = (Compomint.addTmpls = function (
    source,
    removeInnerTemplate,
    tmplSettings
  ) {
    // Handle argument shifting: (source, tmplSettings)
    if (typeof removeInnerTemplate !== "boolean" && tmplSettings == undefined) {
      tmplSettings = removeInnerTemplate;
      removeInnerTemplate = false; // Default removeInnerTemplate to false
    } else {
      removeInnerTemplate = !!removeInnerTemplate; // Ensure boolean
    }

    let container = safeTemplate(source); // Get a container (template or original element)
    let content = container.content || container; // Get content fragment or the element itself
    let tmplNodes = content.querySelectorAll(
      //'template,script[type="template"]'
      'template[id], script[type="text/template"][id], script[type="text/compomint"][id]' // Look for templates/scripts with IDs
    );

    let node = null;
    for (let i = 0, size = tmplNodes.length; i < size; i++) {
      node = tmplNodes.item(i);
      const tmplId = node.id;
      if (!tmplId) continue; // Skip if no ID

      node.dataset.coLoadScript
        ? addTmpl(node.id, node, tmplSettings)({})
        : addTmpl(node.id, node, tmplSettings);
      //addTmpl(tmplId, node, tmplSettings);
      // Remove the original <template> or <script> tag if requested
      if (removeInnerTemplate && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    }
    return container; // Return the container (might have been modified)
  });

  let addTmplByUrl = (Compomint.addTmplByUrl = function compomint_addTmplByUrl(
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
      tmplSettings: undefined // No custom template settings by default
    };
    option = Object.assign({}, defaultOptions, option); // Merge user options with defaults

    let importDataParser = function (obj) {
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

    let appendElements = function (elements) {
      if (elements && elements.length > 0) {
        Array.prototype.forEach.call(elements, function (element) {
          if (!element) return;
          // Remove existing element with same ID
          if (element.id) {
            let oldElement = document.getElementById(element.id);
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

    let importFunc = function (source, currentOption) {
      let templateContainer = safeTemplate(source); // Parse the source safely
      // Add templates defined within the fetched HTML
      addTmpls(templateContainer, false, currentOption.tmplSettings); // Don't remove templates from the fragment yet

      let content = templateContainer.content || templateContainer;

      // Load <link> tags if enabled
      if (currentOption.loadLink) {
        let links = content.querySelectorAll('link[rel="stylesheet"]'); // Only stylesheets for now
        appendElements(links);
      }
      // Load <style> tags with IDs if enabled
      if (currentOption.loadStyle) {
        let styles = content.querySelectorAll("style[id]");
        appendElements(styles);
      }
      // Load <script> tags (not templates) if enabled
      if (currentOption.loadScript) {
        let scripts = content.querySelectorAll(
          'script:not([type]), script[type="text/javascript"], script[type="module"]' // Select standard script types
        );
        // Filter out scripts inside template tags and create executable script elements
        let executableScripts = Array.prototype.filter
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
            let scriptElm = document.createElement("script");
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
        let parsedData = importDataParser(dataItem);
        if (!parsedData) { // Skip invalid entries
          remaining--;
          if (remaining === 0 && callback) callback();
          return;
        }
        let src = parsedData.url;
        let currentOption = parsedData.option;

        // Check file type for direct script/style loading
        if (src.indexOf(".js") > -1) {
          let script = genElement("script", { async: true, src: src }); // Use helper 'genElement' function
          script.addEventListener("load", function () {
            remaining--;
            if (remaining === 0 && callback) callback();
          });
          script.addEventListener("error", function () {
            console.error(`Failed to load script: ${src}`);
            remaining--;
            if (remaining === 0 && callback) callback();
          });
          document.head.appendChild(script);
        } else if (src.indexOf(".css") > -1) {
          let link = genElement("link", {
            type: "text/css",
            rel: "stylesheet",
            href: src,
          });
          link.addEventListener("load", function () { // CSS load event might not be reliable everywhere
            remaining--;
            if (remaining === 0 && callback) callback();
          });
          link.addEventListener("error", function () {
            console.error(`Failed to load stylesheet: ${src}`);
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
                console.error(`Error processing imported HTML from ${src}:`, e);
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
      let parsedData = importDataParser(importData);
      if (!parsedData) {
        if (callback) callback(); // Call callback even if input is invalid
        return;
      }
      let src = parsedData.url;
      let currentOption = parsedData.option;

      if (src.endsWith(".js")) {
        let script = tag("script", { async: true, src: src });
        script.addEventListener("load", callback);
        script.addEventListener("error", () => { console.error(`Failed to load script: ${src}`); if (callback) callback(); });
        document.head.appendChild(script);
      } else if (src.endsWith(".css")) {
        let link = tag("link", { type: "text/css", rel: "stylesheet", href: src });
        link.addEventListener("load", callback); // May not fire reliably
        link.addEventListener("error", () => { console.error(`Failed to load stylesheet: ${src}`); if (callback) callback(); });
        document.head.appendChild(link);
        // setTimeout(callback, 50); // Call callback early for CSS
      } else {
        requestFunc(src, null, function (source, status) {
          if (status === 200 || status === 0) {
            try {
              importFunc(source, currentOption);
            } catch (e) {
              console.error(`Error processing imported HTML from ${src}:`, e);
            }
          } else {
            console.error(`Failed to fetch template file: ${src} (Status: ${status})`);
          }
          if (callback) callback();
        });
      }
    }
  });

  let requestFunc = function (url, option, callback) {
    let xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == XMLHttpRequest.DONE) {
        // Status 0 is for local files (file://)
        if (xmlhttp.status == 200 || xmlhttp.status === 0) {
          callback(xmlhttp.responseText, xmlhttp.status, xmlhttp);
        } else {
          // Call callback even on error, but maybe pass an error indicator?
          // For now, just log error and call callback (as original did implicitly for non-200/0)
          if (xmlhttp.status == 404) {
            console.error(`Error 404: Not Found - ${url}`);
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
      console.error(`Network error requesting ${url}`);
      callback(null, 0, xmlhttp); // Status 0 can indicate network error
    };
    xmlhttp.ontimeout = function () {
      console.error(`Request timed out for ${url}`);
      callback(null, 408, xmlhttp); // 408 Request Timeout
    };

    try {
      let method = (option && option.method) || "GET";
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
      console.error(`Error sending request to ${url}:`, e);
      callback(null, 0, xmlhttp); // Indicate error
    }
  };

  Compomint.i18n = {};

  Compomint.addI18n = function (fullKey, i18nObj) {
    if (!fullKey || typeof fullKey !== 'string' || !i18nObj || typeof i18nObj !== 'object') {
      console.error("Invalid arguments for addI18n:", fullKey, i18nObj);
      return;
    }

    let langKeyNames = fullKey.split(".");
    let target = Compomint.i18n;
    let keyLength = langKeyNames.length - 1;

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
              if (config.debug) console.warn(`i18n: Label key ["${fullKey}"] for lang "${lang}" is missing. Using default: "${defaultText}"`);
            }
            return label !== undefined && label !== null ? String(label) : ''; // Ensure string return
          };
        }
        Object.keys(i18nObj)
          .filter((lang) => i18nObj[lang] instanceof Object)
          .forEach((subKey) => {
            Compomint.addI18n(fullKey + "." + subKey, i18nObj[subKey]);
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

  Compomint.addI18ns = function (i18nObjs) {
    Object.keys(i18nObjs || {}).forEach(function (key) {
      Compomint.addI18n(key, i18nObjs[key]);
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
          console.error(`Error setting attribute/property "${key}" on <${tagName}>:`, e);
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
    let propStrArray = [];
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
  return { compomint: root.compomint, tmpl: root.tmpl };
}).call(this); // Use 'this' which refers to the global object (window in browsers)