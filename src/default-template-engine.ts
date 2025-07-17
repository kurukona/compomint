import {
  ComponentScope,
  LazyScope,
  TemplateEngine,
  TemplateRule,
  TemplateElement,
  CompomintConfigs,
  CompomintGlobal,
} from "./type";

import {
  firstElementChild,
  childElementCount,
  stringToElement,
  isPlainObject,
} from "./utils";

//
// Default template settings
//
const defaultTemplateEngine = (
  configs: CompomintConfigs,
  compomint: CompomintGlobal
): TemplateEngine => ({
  rules: {
    style: {
      pattern: /(\<style id=[\s\S]+?\>[\s\S]+?\<\/style\>)/g,
      exec: function (style): string {
        // Create a temporary element to parse the style tag
        const dumy = document.createElement("template");
        dumy.innerHTML = style;
        const styleNode = (dumy.content || dumy).querySelector("style");
        if (!styleNode || !styleNode.id) return ""; // Skip if no style node or ID
        const oldStyleNode = document.getElementById(styleNode.id);
        if (oldStyleNode) oldStyleNode.parentNode?.removeChild(oldStyleNode);
        document.head.appendChild(styleNode);
        return "";
      },
    },
    commentArea: {
      pattern: /##\*([\s\S]+?)##/g,
      exec: function (commentArea: string): string {
        // Return an empty string to remove the comment block
        return ``;
      },
    },
    preEvaluate: {
      pattern: /##!([\s\S]+?)##/g,
      exec: function (preEvaluate: string, tmplId: string): string {
        try {
          // Execute the code in a new function context
          new Function("compomint", "tmplId", preEvaluate)(compomint, tmplId);
        } catch (e: any) {
          if (configs.throwError) {
            console.error(
              `Template preEvaluate error in "${tmplId}", ${e.name}: ${e.message}`
            );
            throw e;
          } else {
            console.warn(
              `Template preEvaluate error in "${tmplId}", ${e.name}: ${e.message}`
            );
          }
        }
        return ``;
      },
    },
    interpolate: {
      pattern: /##=([\s\S]+?)##/g,
      exec: function (interpolate: string): string {
        // Construct JavaScript code to interpolate the value
        const interpolateSyntax = `typeof (interpolate)=='function' ? (interpolate)() : (interpolate)`;
        return `';\n(() => {let __t, interpolate=${interpolate};\n__p+=((__t=(${interpolateSyntax}))==null ? '' : String(__t) );})();\n__p+='`; // Ensure string conversion
      },
    },
    escape: {
      pattern: /##-([\s\S]+?)##/g,
      exec: function (escape: string): string {
        const escapeSyntax = `compomint.tools.escapeHtml.escape(typeof (escape)=='function' ? (escape)() : (escape))`;
        // Construct JavaScript code to escape HTML characters in the value
        return `';\n(() => {let __t, escape=${escape};\n__p+=((__t=(${escapeSyntax}))==null ? '' : String(__t) );})();\n__p+='`; // Ensure string conversion before escape
      },
    },
    elementProps: {
      pattern: /data-co-props="##:([\s\S]+?)##"/g,
      exec: function (props: string): string {
        const source = `';\nconst eventId = (__lazyScope.elementPropsArray.length);\n__p+='data-co-props="'+eventId+'"';\n
__lazyScope.elementPropsArray[eventId] = ${props};\n__p+='`; // Store props in lazy scope
        return source;
      },
      lazyExec: function (
        data: Record<string, any>,
        lazyScope: LazyScope,
        component: ComponentScope,
        wrapper: DocumentFragment | Element
      ): void {
        // Iterate over stored props and apply them to elements
        lazyScope.elementPropsArray.forEach(function (
          props: Record<string, any> | null,
          eventId: number
        ) {
          if (!props) return;
          // Find the element with the corresponding data-co-props attribute
          const $elementTrigger = wrapper.querySelector<Element>(
            `[data-co-props="${eventId}"]`
          );
          // Remove the temporary attribute and set the properties
          if (!$elementTrigger) return;
          delete ($elementTrigger as HTMLElement).dataset.coProps;
          Object.keys(props).forEach(function (key: string) {
            $elementTrigger.setAttribute(key, String(props[key])); // Ensure value is string
          });
        });
      },
    },
    namedElement: {
      pattern: /data-co-named-element="##:([\s\S]+?)##"/g,
      exec: function (key: string): string {
        const source = `';\nconst eventId = (__lazyScope.namedElementArray.length);\n__p+='data-co-named-element="'+eventId+'"';\n
__lazyScope.namedElementArray[eventId] = ${key};\n__p+='`; // Store the key in lazy scope
        return source;
      },
      lazyExec: function (
        data: Record<string, any>,
        lazyScope: LazyScope,
        component: ComponentScope,
        wrapper: DocumentFragment | Element
      ): void {
        // Iterate over stored keys and assign elements to the component
        lazyScope.namedElementArray.forEach(function (
          key: string,
          eventId: number
        ) {
          // Find the element with the corresponding data-co-named-element attribute
          const $elementTrigger = wrapper.querySelector<Element>(
            `[data-co-named-element="${eventId}"]`
          );
          // Assign the element to the component using the key
          if (!$elementTrigger) {
            if (configs.debug)
              console.warn(
                `Named element target not found for ID ${eventId} in template ${component.tmplId}`
              );
            return;
          }
          delete ($elementTrigger as HTMLElement).dataset.coNamedElement;
          component[key] = $elementTrigger;
        });
      },
    },
    elementRef: {
      pattern: /data-co-element-ref="##:([\s\S]+?)##"/g,
      exec: function (key: string): string {
        const source = `';\nvar eventId = (__lazyScope.elementRefArray.length);\n__p+='data-co-element-ref="'+eventId+'"';
var ${key} = null;\n__lazyScope.elementRefArray[eventId] = function(target) {${key} = target;};\n__p+='`; // Store a function to assign the element
        return source;
      },
      lazyExec: function (
        data: Record<string, any>,
        lazyScope: LazyScope,
        component: ComponentScope,
        wrapper: DocumentFragment | Element
      ): void {
        // Iterate over stored functions and call them with the corresponding elements
        lazyScope.elementRefArray.forEach(function (
          func: (target: Element) => void,
          eventId: number
        ) {
          // Find the element with the corresponding data-co-element-ref attribute
          const $elementTrigger = wrapper.querySelector<Element>(
            `[data-co-element-ref="${eventId}"]`
          );
          // Call the stored function with the element
          if (!$elementTrigger) {
            if (configs.debug)
              console.warn(
                `Element ref target not found for ID ${eventId} in template ${component.tmplId}`
              );
            return;
          }
          delete ($elementTrigger as HTMLElement).dataset.coElementRef;
          func.call($elementTrigger, $elementTrigger);
        });
      },
    },
    elementLoad: {
      pattern: /data-co-load="##:([\s\S]+?)##"/g,
      exec: function (elementLoad: string): string {
        const elementLoadSplitArray = elementLoad.split("::");
        // Store the load function and custom data in lazy scope
        const source = `';\nconst eventId = (__lazyScope.elementLoadArray.length);\n__p+='data-co-load="'+eventId+'"';
__lazyScope.elementLoadArray[eventId] = {loadFunc: ${elementLoadSplitArray[0]}, customData: ${elementLoadSplitArray[1]}};\n__p+='`; // 'customData' is determined when compiled, so it does not change even if refreshed.
        return source;
      },
      lazyExec: function (
        data: Record<string, any>,
        lazyScope: LazyScope,
        component: ComponentScope,
        wrapper: DocumentFragment | Element
      ): void {
        // Iterate over stored load functions and execute them with the corresponding elements
        lazyScope.elementLoadArray.forEach(function (
          elementLoad: { loadFunc: Function; customData: Record<string, any> },
          eventId: number
        ) {
          // Find the element with the corresponding data-co-load attribute
          const $elementTrigger = wrapper.querySelector<Element>(
            `[data-co-load="${eventId}"]`
          );
          if (!$elementTrigger) {
            if (configs.debug)
              console.warn(
                `Element load target not found for ID ${eventId} in template ${component.tmplId}`
              );
            return;
          }
          // Execute the load function with the element and context
          delete ($elementTrigger as HTMLElement).dataset.coLoad;
          try {
            if (typeof elementLoad.loadFunc === "function") {
              const loadFuncParams: [
                Element,
                Element,
                {
                  data: Record<string, any>;
                  element: Element;
                  customData: Record<string, any>;
                  component: ComponentScope;
                  compomint: CompomintGlobal;
                }
              ] = [
                $elementTrigger,
                $elementTrigger,
                {
                  data: data,
                  element: $elementTrigger,
                  customData: elementLoad.customData,
                  component: component,
                  compomint: compomint,
                },
              ];
              elementLoad.loadFunc.call(...loadFuncParams);
            }
          } catch (e: any) {
            console.error(
              `Error executing elementLoad function for ID ${eventId} in template ${component.tmplId}:`,
              e,
              elementLoad.loadFunc
            );
            if (configs.throwError) throw e;
          }
        });
      },
    },
    event: {
      pattern: /data-co-event="##:([\s\S]+?)##"/g,
      exec: function (event: string): string {
        const eventStrArray = event.split(":::");
        // eventStrArray = ["eventFunc::customData", "eventFunc::customData"]
        // Store event handlers in lazy scope
        let source = `';\n(() => {const eventId = (__lazyScope.eventArray.length);\n__p+='data-co-event="'+eventId+'"';\n`;
        const eventArray: string[] = [];
        for (let i = 0, size = eventStrArray.length; i < size; i++) {
          const eventSplitArray = eventStrArray[i].split("::");
          eventArray.push(
            `{eventFunc: ${eventSplitArray[0]}, $parent: this, customData: ${eventSplitArray[1]}}`
          );
        }
        source += `__lazyScope.eventArray[eventId] = [${eventArray.join(
          ","
        )}];})()\n__p+='`;
        return source;
      },
      lazyExec: function (
        data: Record<string, any>,
        lazyScope: LazyScope,
        component: ComponentScope,
        wrapper: DocumentFragment | Element
      ): void {
        const self = this as TemplateRule; // Cast self to TemplateSettings
        const attacher = self.attacher;
        if (!attacher) return; // Guard against missing attacher

        // Iterate over stored event handlers and attach them to elements
        lazyScope.eventArray.forEach(function (
          selectedArray: {
            eventFunc: Function | Record<string, Function>;
            $parent: any;
            customData: any;
          }[],
          eventId: number
        ) {
          // Find the element with the corresponding data-co-event attribute
          const $elementTrigger = wrapper.querySelector<Element>(
            `[data-co-event="${eventId}"]`
          );
          if (!$elementTrigger) {
            if (configs.debug)
              console.warn(
                `Event target not found for ID ${eventId} in template ${component.tmplId}`
              ); // Debugging: Log if target not found
            return;
          }
          delete ($elementTrigger as HTMLElement).dataset.coEvent;
          for (let i = 0, size = selectedArray.length; i < size; i++) {
            const selected = selectedArray[i];
            if (selected.eventFunc) {
              if (Array.isArray(selected.eventFunc)) {
                selected.eventFunc.forEach(function (func: Function) {
                  attacher(
                    self,
                    data,
                    lazyScope,
                    component,
                    wrapper,
                    $elementTrigger,
                    func,
                    selected
                  );
                });
              } else {
                attacher(
                  self,
                  data,
                  lazyScope,
                  component,
                  wrapper,
                  $elementTrigger,
                  selected.eventFunc,
                  selected
                );
              }
            }
          }
        });
      },
      trigger: function (target: Element, eventName: string): void {
        const customEvent = new Event(eventName, {
          // Dispatch a custom event on the target element
          bubbles: true,
          cancelable: true,
        });
        target.dispatchEvent(customEvent);
      },
      attacher: function (
        self: any, // Type properly if possible
        data: Record<string, any>,
        lazyScope: LazyScope,
        component: ComponentScope,
        wrapper: DocumentFragment | Element,
        $elementTrigger: Element,
        eventFunc: Function | Record<string, Function>,
        eventData: Record<string, any>
      ): void {
        const trigger = self.trigger;
        const $childTarget = firstElementChild(wrapper);
        const $targetElement =
          childElementCount(wrapper) === 1 ? $childTarget : null;

        // Attach event listeners based on the type of eventFunc

        if (!eventFunc) {
          return;
        }

        const eventFuncParams: [
          Element,
          Event | Element | null,
          {
            data: Record<string, any>;
            customData: any;
            element: Element;
            componentElement: Element | null | undefined;
            component: ComponentScope;
            compomint: CompomintGlobal;
          }
        ] = [
          $elementTrigger,
          null,
          {
            data: data,
            customData: eventData.customData,
            element: $elementTrigger,
            componentElement: $targetElement || $childTarget?.parentElement,
            component: component,
            compomint: compomint,
          },
        ];

        // Basic case: eventFunc is a single function
        if (typeof eventFunc === "function") {
          const eventListener = function (event: Event) {
            event.stopPropagation();
            eventFuncParams[1] = event;
            try {
              eventFunc.call(...eventFuncParams);
            } catch (e: any) {
              console.error(
                `Error in event handler for template ${component.tmplId}:`,
                e,
                eventFunc
              );
              if (configs.throwError) throw e;
            }
          };
          // Attach a click event listener for a single function
          $elementTrigger.addEventListener("click", eventListener);
          eventData.element = $elementTrigger; // For remove eventListener
          eventData.eventFunc = eventListener; // For remove eventListener

          return;
        }

        if (!isPlainObject(eventFunc)) {
          return;
        }

        // Advanced case: eventFunc is an object mapping event types to handlers
        const eventMap = eventFunc as Record<string, Function>;
        // Handle event map with multiple event types
        const triggerName = eventMap.triggerName as unknown as
          | string
          | undefined; // Optional key to store trigger functions
        if (triggerName) {
          component.trigger = component.trigger || {};
          component.trigger[triggerName] = {};
        }

        Object.keys(eventMap).forEach(function (eventType: string) {
          const selectedEventFunc = eventMap[eventType];

          // Handle special event types like "load", "namedElement", and "triggerName"
          if (eventType === "load") {
            eventFuncParams[1] = $elementTrigger;
            try {
              selectedEventFunc.call(...eventFuncParams);
            } catch (e: any) {
              console.error(
                `Error in 'load' event handler for template ${component.tmplId}:`,
                e,
                selectedEventFunc
              );
              if (configs.throwError) throw e;
            }
            return;
          } else if (eventType === "namedElement") {
            component[selectedEventFunc as unknown as string] = $elementTrigger;
            return;
          } else if (eventType === "triggerName") {
            return;
            // Attach event listeners for other event types
          }

          const eventListener = function (event: Event) {
            event.stopPropagation();
            eventFuncParams[1] = event;
            try {
              selectedEventFunc.call(...eventFuncParams);
            } catch (e: any) {
              console.error(
                `Error in '${eventType}' event handler for template ${component.tmplId}:`,
                e,
                selectedEventFunc
              );
              if (configs.throwError) throw e;
            }
          };

          $elementTrigger.addEventListener(eventType, eventListener);
          eventData.element = $elementTrigger; // For remove eventListener
          eventFunc[eventType] = eventListener; // For remove eventListener

          if (triggerName && trigger) {
            component.trigger![triggerName][eventType] = function () {
              trigger($elementTrigger, eventType);
            };
          }
        });
      },
    },
    element: {
      pattern: /##%([\s\S]+?)##/g,
      exec: function (target: string): string {
        // Store element insertion information in lazy scope
        const elementSplitArray = target.split("::");
        const source = `';\n(() => {
const elementId = (__lazyScope.elementArray.length);
__p+='<template data-co-tmpl-element-id="'+elementId+'"></template>';
__lazyScope.elementArray[elementId] = {childTarget: ${
          elementSplitArray[0]
        }, nonblocking: ${elementSplitArray[1] || false}};})();
__p+='`;
        return source;
      },
      lazyExec: function (
        data: Record<string, any>,
        lazyScope: LazyScope,
        component: ComponentScope,
        wrapper: DocumentFragment | Element
      ): void {
        const self = this as TemplateRule; // Cast self

        lazyScope.elementArray.forEach(function (
          ele: { childTarget: any; nonblocking: boolean | number },
          elementId: number
        ) {
          // Retrieve element insertion details from lazy scope
          const childTarget = ele.childTarget;
          const nonblocking = ele.nonblocking;
          // Find the placeholder element
          const $tmplElement = wrapper.querySelector<TemplateElement>(
            `template[data-co-tmpl-element-id="${elementId}"]`
          );
          // Perform the element insertion
          if (!$tmplElement) {
            if (configs.debug)
              console.warn(
                `Element insertion placeholder not found for ID ${elementId} in template ${component.tmplId}`
              );
            return;
          }
          if (!$tmplElement.parentNode) {
            if (configs.debug)
              console.warn(
                `Element insertion placeholder for ID ${elementId} in template ${component.tmplId} has no parent.`
              );
            return;
          }

          const doFunc = function () {
            if (!$tmplElement || !$tmplElement.parentNode) {
              if (configs.debug)
                console.warn(
                  `Placeholder for ID ${elementId} removed before insertion in template ${component.tmplId}.`
                );
              return;
            }

            // Handle different types of childTarget for insertion
            try {
              if (childTarget instanceof Array) {
                const docFragment = document.createDocumentFragment();
                childTarget.forEach(function (child: any) {
                  if (!child) return;
                  const childElement = child.element || child;
                  let nodeToAppend: Node | null = null;
                  // Convert child to a DOM node if necessary

                  if (
                    typeof childElement === "string" ||
                    typeof childElement === "number"
                  ) {
                    nodeToAppend = stringToElement(childElement);
                  } else if (typeof childElement === "function") {
                    nodeToAppend = stringToElement(childElement());
                  } else if (childElement instanceof Node) {
                    nodeToAppend = childElement;
                  } else {
                    if (configs.debug)
                      console.warn(
                        `Invalid item type in element array for ID ${elementId}, template ${component.tmplId}:`,
                        childElement
                      );
                    return;
                  }
                  // Append the node to the document fragment
                  if (child.beforeAppendTo) {
                    try {
                      child.beforeAppendTo();
                    } catch (e) {
                      console.error("Error in beforeAppendTo (array item):", e);
                    }
                  }
                  if (nodeToAppend) docFragment.appendChild(nodeToAppend);
                });
                // Replace the placeholder with the document fragment
                $tmplElement.parentNode.replaceChild(docFragment, $tmplElement);

                // Call afterAppendTo for each child
                childTarget.forEach(function (child: any) {
                  if (child && child.afterAppendTo) {
                    setTimeout(() => {
                      try {
                        child.afterAppendTo();
                      } catch (e) {
                        console.error(
                          "Error in afterAppendTo (array item):",
                          e
                        );
                      }
                    }, 0);
                  }
                });
                // Handle string, number, or function types
              } else if (
                typeof childTarget === "string" ||
                typeof childTarget === "number"
              ) {
                $tmplElement.parentNode.replaceChild(
                  stringToElement(childTarget),
                  $tmplElement
                );
                // Handle function type
              } else if (typeof childTarget === "function") {
                $tmplElement.parentNode.replaceChild(
                  stringToElement(childTarget()),
                  $tmplElement
                );
                // Handle Node or ComponentScope types
              } else if (
                childTarget &&
                (childTarget.element || childTarget) instanceof Node
              ) {
                const childScope = childTarget as ComponentScope; // Assume it might be a scope
                const childElement = childScope.element || childScope;

                // Replace the placeholder with the child element
                if (childScope.beforeAppendTo) {
                  try {
                    childScope.beforeAppendTo();
                  } catch (e) {
                    console.error("Error in beforeAppendTo:", e);
                  }
                }
                $tmplElement.parentNode.replaceChild(
                  childElement,
                  $tmplElement
                );
                // Call afterAppendTo if available
                if (childScope.afterAppendTo) {
                  setTimeout(() => {
                    try {
                      if (childScope.afterAppendTo) childScope.afterAppendTo();
                    } catch (e) {
                      console.error("Error in afterAppendTo:", e);
                    }
                  }, 0);
                }
                // Set parentComponent if it's a component
                if (childScope.tmplId) {
                  childScope.parentComponent = component;
                }
                // Handle invalid target types
              } else {
                if (configs.debug)
                  console.warn(
                    `Invalid target for element insertion ID ${elementId}, template ${component.tmplId}:`,
                    childTarget
                  );
                $tmplElement.parentNode.removeChild($tmplElement);
              }
            } catch (e: any) {
              console.error(
                `Error during element insertion for ID ${elementId}, template ${component.tmplId}:`,
                e
              );
              if (configs.throwError) throw e;
              if ($tmplElement && $tmplElement.parentNode) {
                try {
                  $tmplElement.parentNode.removeChild($tmplElement);
                } catch (removeError) {
                  /* Ignore */
                }
              }
            } // end try
          }; // end doFunc

          nonblocking === undefined || nonblocking === false
            ? // Execute immediately or with a delay based on nonblocking
              doFunc()
            : setTimeout(
                doFunc,
                typeof nonblocking === "number" ? nonblocking : 0
              );
        }); // end forEach
      },
    },
    lazyEvaluate: {
      pattern: /###([\s\S]+?)##/g,
      exec: function (lazyEvaluate: string): string {
        const source = `';\n__lazyScope.lazyEvaluateArray.push(function(data) {${lazyEvaluate}});\n__p+='`;
        // Store the lazy evaluation function in lazy scope
        return source;
      },
      lazyExec: function (
        data: Record<string, any>,
        lazyScope: LazyScope,
        component: ComponentScope,
        wrapper: DocumentFragment | Element
      ): void {
        // Execute stored lazy evaluation functions
        const $childTarget = firstElementChild(wrapper);
        const $targetElement =
          childElementCount(wrapper) === 1 ? $childTarget : null;
        lazyScope.lazyEvaluateArray.forEach(function (
          selectedFunc: (data: Record<string, any>) => void,
          idx: number
        ) {
          // Call the function with the appropriate context
          try {
            selectedFunc.call($targetElement || wrapper, data); // Use wrapper if multiple elements
          } catch (e: any) {
            console.error(
              `Error in lazyEvaluate block ${idx} for template ${component.tmplId}:`,
              e,
              selectedFunc
            );
            if (configs.throwError) throw e;
          }
        });
        return;
      },
    },
    evaluate: {
      pattern: /##([\s\S]+?)##/g,
      exec: (evaluate: string): string => {
        // Insert arbitrary JavaScript code into the template function
        return "';\n" + evaluate + "\n__p+='";
      },
    },
    escapeSyntax: {
      pattern: /#\\#([\s\S]+?)#\\#/g,
      exec: function (syntax) {
        return `'+\n'##${syntax}##'+\n'`;
      },
    },
  },
  keys: {
    dataKeyName: "data",
    statusKeyName: "status",
    componentKeyName: "component",
    i18nKeyName: "i18n",
  },
});

export { defaultTemplateEngine };
