/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

const firstElementChild = function (ele) {
    if (ele.firstElementChild)
        return ele.firstElementChild;
    const children = ele.childNodes;
    for (let i = 0, size = children.length; i < size; i++) {
        if (children[i] instanceof Element) {
            return children[i];
        }
    }
    return null;
};
const childElementCount = function (ele) {
    return (ele.childElementCount ||
        Array.prototype.filter.call(ele.childNodes || [], function (child) {
            return child instanceof Element;
        }).length);
};
const cleanNode = function (node) {
    if (!node.childNodes)
        return;
    for (let n = 0; n < node.childNodes.length; n++) {
        const child = node.childNodes[n];
        if (child.nodeType === 8 || // Comment node
            (child.nodeType === 3 && !/\S/.test(child.nodeValue || '')) // Text node with only whitespace
        ) {
            node.removeChild(child);
            n--; // Adjust index after removal
        }
        else if (child.nodeType === 1) {
            // Element node
            cleanNode(child); // Recurse
        }
    }
};
const getDOMParser = () => {
    if (typeof DOMParser !== 'undefined') {
        return new DOMParser();
    }
    // SSR fallback - create mock DOMParser
    return {
        parseFromString: (str, type) => {
            const mockDoc = {
                body: {
                    childNodes: [],
                    firstChild: null,
                    appendChild: () => { },
                    removeChild: () => { }
                }
            };
            return mockDoc;
        }
    };
};
const stringToElement = function (str) {
    if (typeof str === 'number' || !isNaN(Number(str))) {
        return document.createTextNode(String(str));
    }
    else if (typeof str === 'string') {
        try {
            const domParser = getDOMParser();
            const doc = domParser.parseFromString(str, "text/html");
            const body = doc.body;
            if (body.childNodes.length === 1) {
                return body.firstChild;
            }
            else {
                const fragment = document.createDocumentFragment();
                while (body.firstChild) {
                    fragment.appendChild(body.firstChild);
                }
                return fragment;
            }
        }
        catch (e) {
            return document.createTextNode(str);
        }
    }
    else {
        return document.createTextNode('');
    }
};
const isPlainObject = function (value) {
    return Object.prototype.toString.call(value) === '[object Object]';
};

//
// Default template settings
//
const defaultTemplateEngine = (compomint) => {
    const configs = compomint.configs;
    return {
        rules: {
            style: {
                pattern: /(\<style id=[\s\S]+?\>[\s\S]+?\<\/style\>)/g,
                exec: function (style) {
                    var _a;
                    // Create a temporary element to parse the style tag
                    const dumy = document.createElement("template");
                    dumy.innerHTML = style;
                    const styleNode = (dumy.content || dumy).querySelector("style");
                    if (!styleNode || !styleNode.id)
                        return ""; // Skip if no style node or ID
                    const oldStyleNode = document.getElementById(styleNode.id);
                    if (oldStyleNode)
                        (_a = oldStyleNode.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(oldStyleNode);
                    document.head.appendChild(styleNode);
                    return "";
                },
            },
            commentArea: {
                pattern: /##\*([\s\S]+?)##/g,
                exec: function (commentArea) {
                    // Return an empty string to remove the comment block
                    return ``;
                },
            },
            preEvaluate: {
                pattern: /##!([\s\S]+?)##/g,
                exec: function (preEvaluate, tmplId) {
                    try {
                        // Execute the code in a new function context
                        new Function("compomint", "tmplId", preEvaluate)(compomint, tmplId);
                    }
                    catch (e) {
                        if (configs.throwError) {
                            console.error(`Template preEvaluate error in "${tmplId}", ${e.name}: ${e.message}`);
                            throw e;
                        }
                        else {
                            console.warn(`Template preEvaluate error in "${tmplId}", ${e.name}: ${e.message}`);
                        }
                    }
                    return ``;
                },
            },
            interpolate: {
                pattern: /##=([\s\S]+?)##/g,
                exec: function (interpolate) {
                    // Construct JavaScript code to interpolate the value
                    const interpolateSyntax = `typeof (interpolate)=='function' ? (interpolate)() : (interpolate)`;
                    return `';\n{let __t, interpolate=${interpolate};\n__p+=((__t=(${interpolateSyntax}))==null ? '' : String(__t) );};\n__p+='`; // Ensure string conversion
                },
            },
            escape: {
                pattern: /##-([\s\S]+?)##/g,
                exec: function (escape) {
                    const escapeSyntax = `compomint.tools.escapeHtml.escape(typeof (escape)=='function' ? (escape)() : (escape))`;
                    // Construct JavaScript code to escape HTML characters in the value
                    return `';\n{let __t, escape=${escape};\n__p+=((__t=(${escapeSyntax}))==null ? '' : String(__t) );};\n__p+='`; // Ensure string conversion before escape
                },
            },
            elementProps: {
                pattern: /data-co-props="##:([\s\S]+?)##"/g,
                exec: function (props) {
                    const source = `';\n{const eventId = (__lazyScope.elementPropsArray.length);\n__p+='data-co-props="'+eventId+'"';\n
__lazyScope.elementPropsArray[eventId] = ${props}};\n__p+='`; // Store props in lazy scope
                    return source;
                },
                lazyExec: function (data, lazyScope, component, wrapper) {
                    // Iterate over stored props and apply them to elements
                    lazyScope.elementPropsArray.forEach(function (props, eventId) {
                        if (!props)
                            return;
                        // Find the element with the corresponding data-co-props attribute
                        const $elementTrigger = wrapper.querySelector(`[data-co-props="${eventId}"]`);
                        // Remove the temporary attribute and set the properties
                        if (!$elementTrigger)
                            return;
                        delete $elementTrigger.dataset.coProps;
                        Object.keys(props).forEach(function (key) {
                            $elementTrigger.setAttribute(key, String(props[key])); // Ensure value is string
                        });
                    });
                },
            },
            namedElement: {
                pattern: /data-co-named-element="##:([\s\S]+?)##"/g,
                exec: function (key) {
                    const source = `';\nconst eventId = (__lazyScope.namedElementArray.length);\n__p+='data-co-named-element="'+eventId+'"';\n
__lazyScope.namedElementArray[eventId] = ${key};\n__p+='`; // Store the key in lazy scope
                    return source;
                },
                lazyExec: function (data, lazyScope, component, wrapper) {
                    // Iterate over stored keys and assign elements to the component
                    lazyScope.namedElementArray.forEach(function (key, eventId) {
                        // Find the element with the corresponding data-co-named-element attribute
                        const $elementTrigger = wrapper.querySelector(`[data-co-named-element="${eventId}"]`);
                        // Assign the element to the component using the key
                        if (!$elementTrigger) {
                            if (configs.debug)
                                console.warn(`Named element target not found for ID ${eventId} in template ${component.tmplId}`);
                            return;
                        }
                        delete $elementTrigger.dataset.coNamedElement;
                        component[key] = $elementTrigger;
                    });
                },
            },
            elementRef: {
                pattern: /data-co-element-ref="##:([\s\S]+?)##"/g,
                exec: function (key) {
                    const source = `';\n{const eventId = (__lazyScope.elementRefArray.length);\n__p+='data-co-element-ref="'+eventId+'"';
var ${key} = null;\n__lazyScope.elementRefArray[eventId] = function(target) {${key} = target;}};\n__p+='`; // Store a function to assign the element
                    return source;
                },
                lazyExec: function (data, lazyScope, component, wrapper) {
                    // Iterate over stored functions and call them with the corresponding elements
                    lazyScope.elementRefArray.forEach(function (func, eventId) {
                        // Find the element with the corresponding data-co-element-ref attribute
                        const $elementTrigger = wrapper.querySelector(`[data-co-element-ref="${eventId}"]`);
                        // Call the stored function with the element
                        if (!$elementTrigger) {
                            if (configs.debug)
                                console.warn(`Element ref target not found for ID ${eventId} in template ${component.tmplId}`);
                            return;
                        }
                        delete $elementTrigger.dataset.coElementRef;
                        func.call($elementTrigger, $elementTrigger);
                    });
                },
            },
            elementLoad: {
                pattern: /data-co-load="##:([\s\S]+?)##"/g,
                exec: function (elementLoad) {
                    const elementLoadSplitArray = elementLoad.split("::");
                    // Store the load function and custom data in lazy scope
                    const source = `';\n{const eventId = (__lazyScope.elementLoadArray.length);\n__p+='data-co-load="'+eventId+'"';
__lazyScope.elementLoadArray[eventId] = {loadFunc: ${elementLoadSplitArray[0]}, customData: ${elementLoadSplitArray[1]}};}\n__p+='`; // 'customData' is determined when compiled, so it does not change even if refreshed.
                    return source;
                },
                lazyExec: function (data, lazyScope, component, wrapper) {
                    // Iterate over stored load functions and execute them with the corresponding elements
                    lazyScope.elementLoadArray.forEach(function (elementLoad, eventId) {
                        // Find the element with the corresponding data-co-load attribute
                        const $elementTrigger = wrapper.querySelector(`[data-co-load="${eventId}"]`);
                        if (!$elementTrigger) {
                            if (configs.debug)
                                console.warn(`Element load target not found for ID ${eventId} in template ${component.tmplId}`);
                            return;
                        }
                        // Execute the load function with the element and context
                        delete $elementTrigger.dataset.coLoad;
                        try {
                            if (typeof elementLoad.loadFunc === "function") {
                                const loadFuncParams = [
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
                        }
                        catch (e) {
                            console.error(`Error executing elementLoad function for ID ${eventId} in template ${component.tmplId}:`, e, elementLoad.loadFunc);
                            if (configs.throwError)
                                throw e;
                        }
                    });
                },
            },
            event: {
                pattern: /data-co-event="##:([\s\S]+?)##"/g,
                exec: function (event) {
                    const eventStrArray = event.split(":::");
                    // eventStrArray = ["eventFunc::customData", "eventFunc::customData"]
                    // Store event handlers in lazy scope
                    let source = `';\n{const eventId = (__lazyScope.eventArray.length);\n__p+='data-co-event="'+eventId+'"';\n`;
                    const eventArray = [];
                    for (let i = 0, size = eventStrArray.length; i < size; i++) {
                        const eventSplitArray = eventStrArray[i].split("::");
                        eventArray.push(`{eventFunc: ${eventSplitArray[0]}, $parent: this, customData: ${eventSplitArray[1]}}`);
                    }
                    source += `__lazyScope.eventArray[eventId] = [${eventArray.join(",")}];}\n__p+='`;
                    return source;
                },
                lazyExec: function (data, lazyScope, component, wrapper) {
                    const self = this; // Cast self to TemplateSettings
                    const attacher = self.attacher;
                    if (!attacher)
                        return; // Guard against missing attacher
                    // Iterate over stored event handlers and attach them to elements
                    lazyScope.eventArray.forEach(function (selectedArray, eventId) {
                        // Find the element with the corresponding data-co-event attribute
                        const $elementTrigger = wrapper.querySelector(`[data-co-event="${eventId}"]`);
                        if (!$elementTrigger) {
                            if (configs.debug)
                                console.warn(`Event target not found for ID ${eventId} in template ${component.tmplId}`); // Debugging: Log if target not found
                            return;
                        }
                        delete $elementTrigger.dataset.coEvent;
                        for (let i = 0, size = selectedArray.length; i < size; i++) {
                            const selected = selectedArray[i];
                            if (selected.eventFunc) {
                                if (Array.isArray(selected.eventFunc)) {
                                    selected.eventFunc.forEach(function (func) {
                                        attacher(self, data, lazyScope, component, wrapper, $elementTrigger, func, selected);
                                    });
                                }
                                else {
                                    attacher(self, data, lazyScope, component, wrapper, $elementTrigger, selected.eventFunc, selected);
                                }
                            }
                        }
                    });
                },
                trigger: function (target, eventName) {
                    const customEvent = new Event(eventName, {
                        // Dispatch a custom event on the target element
                        bubbles: true,
                        cancelable: true,
                    });
                    target.dispatchEvent(customEvent);
                },
                attacher: function (self, // Type properly if possible
                data, lazyScope, component, wrapper, $elementTrigger, eventFunc, eventData) {
                    const trigger = self.trigger;
                    const $childTarget = firstElementChild(wrapper);
                    const $targetElement = childElementCount(wrapper) === 1 ? $childTarget : null;
                    // Attach event listeners based on the type of eventFunc
                    if (!eventFunc) {
                        return;
                    }
                    const eventFuncParams = [
                        $elementTrigger,
                        null,
                        {
                            data: data,
                            customData: eventData.customData,
                            element: $elementTrigger,
                            componentElement: $targetElement || ($childTarget === null || $childTarget === void 0 ? void 0 : $childTarget.parentElement),
                            component: component,
                            compomint: compomint,
                        },
                    ];
                    // Basic case: eventFunc is a single function
                    if (typeof eventFunc === "function") {
                        const eventListener = function (event) {
                            event.stopPropagation();
                            eventFuncParams[1] = event;
                            try {
                                eventFunc.call(...eventFuncParams);
                            }
                            catch (e) {
                                console.error(`Error in event handler for template ${component.tmplId}:`, e, eventFunc);
                                if (configs.throwError)
                                    throw e;
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
                    const eventMap = eventFunc;
                    // Handle event map with multiple event types
                    const triggerName = eventMap.triggerName; // Optional key to store trigger functions
                    if (triggerName) {
                        component.trigger = component.trigger || {};
                        component.trigger[triggerName] = {};
                    }
                    Object.keys(eventMap).forEach(function (eventType) {
                        const selectedEventFunc = eventMap[eventType];
                        // Handle special event types like "load", "namedElement", and "triggerName"
                        if (eventType === "load") {
                            eventFuncParams[1] = $elementTrigger;
                            try {
                                selectedEventFunc.call(...eventFuncParams);
                            }
                            catch (e) {
                                console.error(`Error in 'load' event handler for template ${component.tmplId}:`, e, selectedEventFunc);
                                if (configs.throwError)
                                    throw e;
                            }
                            return;
                        }
                        else if (eventType === "namedElement") {
                            component[selectedEventFunc] =
                                $elementTrigger;
                            return;
                        }
                        else if (eventType === "triggerName") {
                            return;
                            // Attach event listeners for other event types
                        }
                        const eventListener = function (event) {
                            event.stopPropagation();
                            eventFuncParams[1] = event;
                            try {
                                selectedEventFunc.call(...eventFuncParams);
                            }
                            catch (e) {
                                console.error(`Error in '${eventType}' event handler for template ${component.tmplId}:`, e, selectedEventFunc);
                                if (configs.throwError)
                                    throw e;
                            }
                        };
                        $elementTrigger.addEventListener(eventType, eventListener);
                        eventData.element = $elementTrigger; // For remove eventListener
                        eventFunc[eventType] = eventListener; // For remove eventListener
                        if (triggerName && trigger) {
                            component.trigger[triggerName][eventType] = function () {
                                trigger($elementTrigger, eventType);
                            };
                        }
                    });
                },
            },
            element: {
                pattern: /##%([\s\S]+?)##/g,
                exec: function (target) {
                    // Store element insertion information in lazy scope
                    const elementSplitArray = target.split("::");
                    const source = `';\n{
const elementId = (__lazyScope.elementArray.length);
__p+='<template data-co-tmpl-element-id="'+elementId+'"></template>';
__lazyScope.elementArray[elementId] = {childTarget: ${elementSplitArray[0]}, nonblocking: ${elementSplitArray[1] || false}};};
__p+='`;
                    return source;
                },
                lazyExec: function (data, lazyScope, component, wrapper) {
                    lazyScope.elementArray.forEach(function (ele, elementId) {
                        // Retrieve element insertion details from lazy scope
                        const childTarget = ele.childTarget;
                        const nonblocking = ele.nonblocking;
                        // Find the placeholder element
                        const $tmplElement = wrapper.querySelector(`template[data-co-tmpl-element-id="${elementId}"]`);
                        // Perform the element insertion
                        if (!$tmplElement) {
                            if (configs.debug)
                                console.warn(`Element insertion placeholder not found for ID ${elementId} in template ${component.tmplId}`);
                            return;
                        }
                        if (!$tmplElement.parentNode) {
                            if (configs.debug)
                                console.warn(`Element insertion placeholder for ID ${elementId} in template ${component.tmplId} has no parent.`);
                            return;
                        }
                        const doFunc = function () {
                            if (!$tmplElement || !$tmplElement.parentNode) {
                                if (configs.debug)
                                    console.warn(`Placeholder for ID ${elementId} removed before insertion in template ${component.tmplId}.`);
                                return;
                            }
                            // Handle different types of childTarget for insertion
                            try {
                                if (childTarget instanceof Array) {
                                    const docFragment = document.createDocumentFragment();
                                    childTarget.forEach(function (child) {
                                        if (!child)
                                            return;
                                        const childElement = child.element || child;
                                        let nodeToAppend = null;
                                        // Convert child to a DOM node if necessary
                                        if (typeof childElement === "string" ||
                                            typeof childElement === "number") {
                                            nodeToAppend = stringToElement(childElement);
                                        }
                                        else if (typeof childElement === "function") {
                                            nodeToAppend = stringToElement(childElement());
                                        }
                                        else if (childElement instanceof Node) {
                                            nodeToAppend = childElement;
                                        }
                                        else {
                                            if (configs.debug)
                                                console.warn(`Invalid item type in element array for ID ${elementId}, template ${component.tmplId}:`, childElement);
                                            return;
                                        }
                                        // Append the node to the document fragment
                                        if (child.beforeAppendTo) {
                                            try {
                                                child.beforeAppendTo();
                                            }
                                            catch (e) {
                                                console.error("Error in beforeAppendTo (array item):", e);
                                            }
                                        }
                                        if (nodeToAppend)
                                            docFragment.appendChild(nodeToAppend);
                                    });
                                    // Replace the placeholder with the document fragment
                                    $tmplElement.parentNode.replaceChild(docFragment, $tmplElement);
                                    // Call afterAppendTo for each child
                                    childTarget.forEach(function (child) {
                                        if (child && child.afterAppendTo) {
                                            setTimeout(() => {
                                                try {
                                                    child.afterAppendTo();
                                                }
                                                catch (e) {
                                                    console.error("Error in afterAppendTo (array item):", e);
                                                }
                                            }, 0);
                                        }
                                    });
                                    // Handle string, number, or function types
                                }
                                else if (typeof childTarget === "string" ||
                                    typeof childTarget === "number") {
                                    $tmplElement.parentNode.replaceChild(stringToElement(childTarget), $tmplElement);
                                    // Handle function type
                                }
                                else if (typeof childTarget === "function") {
                                    $tmplElement.parentNode.replaceChild(stringToElement(childTarget()), $tmplElement);
                                    // Handle Node or ComponentScope types
                                }
                                else if (childTarget &&
                                    (childTarget.element || childTarget) instanceof Node) {
                                    const childScope = childTarget; // Assume it might be a scope
                                    const childElement = childScope.element || childScope;
                                    // Replace the placeholder with the child element
                                    if (childScope.beforeAppendTo) {
                                        try {
                                            childScope.beforeAppendTo();
                                        }
                                        catch (e) {
                                            console.error("Error in beforeAppendTo:", e);
                                        }
                                    }
                                    $tmplElement.parentNode.replaceChild(childElement, $tmplElement);
                                    // Call afterAppendTo if available
                                    if (childScope.afterAppendTo) {
                                        setTimeout(() => {
                                            try {
                                                if (childScope.afterAppendTo)
                                                    childScope.afterAppendTo();
                                            }
                                            catch (e) {
                                                console.error("Error in afterAppendTo:", e);
                                            }
                                        }, 0);
                                    }
                                    // Set parentComponent if it's a component
                                    if (childScope.tmplId) {
                                        childScope.parentComponent = component;
                                    }
                                    // Handle invalid target types
                                }
                                else {
                                    if (configs.debug)
                                        console.warn(`Invalid target for element insertion ID ${elementId}, template ${component.tmplId}:`, childTarget);
                                    $tmplElement.parentNode.removeChild($tmplElement);
                                }
                            }
                            catch (e) {
                                console.error(`Error during element insertion for ID ${elementId}, template ${component.tmplId}:`, e);
                                if (configs.throwError)
                                    throw e;
                                if ($tmplElement && $tmplElement.parentNode) {
                                    try {
                                        $tmplElement.parentNode.removeChild($tmplElement);
                                    }
                                    catch (removeError) {
                                        /* Ignore */
                                    }
                                }
                            } // end try
                        }; // end doFunc
                        nonblocking === undefined || nonblocking === false
                            ? // Execute immediately or with a delay based on nonblocking
                                doFunc()
                            : setTimeout(doFunc, typeof nonblocking === "number" ? nonblocking : 0);
                    }); // end forEach
                },
            },
            lazyEvaluate: {
                pattern: /###([\s\S]+?)##/g,
                exec: function (lazyEvaluate) {
                    const source = `';\n__lazyScope.lazyEvaluateArray.push(function(data) {${lazyEvaluate}});\n__p+='`;
                    // Store the lazy evaluation function in lazy scope
                    return source;
                },
                lazyExec: function (data, lazyScope, component, wrapper) {
                    // Execute stored lazy evaluation functions
                    const $childTarget = firstElementChild(wrapper);
                    const $targetElement = childElementCount(wrapper) === 1 ? $childTarget : null;
                    lazyScope.lazyEvaluateArray.forEach(function (selectedFunc, idx) {
                        // Call the function with the appropriate context
                        try {
                            selectedFunc.call($targetElement || wrapper, data); // Use wrapper if multiple elements
                        }
                        catch (e) {
                            console.error(`Error in lazyEvaluate block ${idx} for template ${component.tmplId}:`, e, selectedFunc);
                            if (configs.throwError)
                                throw e;
                        }
                    });
                    return;
                },
            },
            evaluate: {
                pattern: /##([\s\S]+?)##/g,
                exec: (evaluate) => {
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
    };
};

const applyBuiltInTemplates = (addTmpl) => {
    // co-Ele is a shorthand for co-Element, it will generate a div element with the given props and event
    addTmpl("co-Ele", `<##=data[0]##></##=data[0]##>###compomint.tools.applyElementProps(this, data[1]);##`);
    addTmpl("co-Element", `##
  data.tag = data.tag || 'div';
  ##
  &lt;##=data.tag##
    ##=data.id ? 'id="' + (data.id === true ? component._id : data.id) + '"' : ''##
    data-co-props="##:data.props##"
    data-co-event="##:data.event##"&gt;
    ##if (typeof data.content === "string") {##
    ##=data.content##
    ##} else {##
      ##%data.content##
    ##}##
  &lt;/##=data.tag##&gt;`);
};

/*
 * Copyright (c) 2025-present, Choi Sungho
 * Code released under the MIT license
 */
/**
 * Environment detection utilities
 */
// Store original window state before SSR setup
const _originalWindow = typeof window;
const Environment = {
    // Check if we're in a server environment
    isServer() {
        return (_originalWindow === 'undefined' || globalThis.__SSR_ENVIRONMENT__) &&
            typeof globalThis !== 'undefined' &&
            typeof globalThis.process !== 'undefined' &&
            typeof globalThis.process.versions !== 'undefined' &&
            !!globalThis.process.versions.node;
    },
    // Check if we're in a browser environment  
    isBrowser() {
        return _originalWindow !== 'undefined' &&
            typeof document !== 'undefined' &&
            !globalThis.__SSR_ENVIRONMENT__;
    },
    // Check if DOM APIs are available
    hasDOM() {
        return typeof document !== 'undefined' &&
            typeof document.createElement === 'function';
    },
    // Check if we're in a Node.js environment
    isNode() {
        return typeof globalThis.process !== 'undefined' &&
            typeof globalThis.process.versions !== 'undefined' &&
            !!globalThis.process.versions.node;
    }
};
/**
 * DOM Polyfills for Server-Side Rendering
 */
class SSRDOMPolyfill {
    constructor() {
        this.elements = new Map();
        this.styleCollector = [];
        this.scriptCollector = [];
    }
    static getInstance() {
        if (!SSRDOMPolyfill.instance) {
            SSRDOMPolyfill.instance = new SSRDOMPolyfill();
        }
        return SSRDOMPolyfill.instance;
    }
    /**
     * Create a minimal DOM-like element for SSR
     */
    createElement(tagName) {
        const element = {
            nodeType: 1, // Element nodeType
            tagName: tagName.toUpperCase(),
            id: '',
            className: '',
            textContent: '',
            _innerHTML: '',
            attributes: new Map(),
            children: [],
            parentNode: null,
            style: {},
            dataset: {},
            firstChild: null,
            lastChild: null,
            childElementCount: 0,
            firstElementChild: null,
            content: null, // For template elements
            // Make childNodes iterable
            get childNodes() {
                return this.children;
            },
            setAttribute(name, value) {
                this.attributes.set(name, value);
                if (name === 'id')
                    this.id = value;
                if (name === 'class')
                    this.className = value;
            },
            // Override innerHTML setter to parse HTML
            set innerHTML(html) {
                this._innerHTML = html;
                // Clear existing children
                this.children = [];
                // Parse HTML and create child elements
                if (html) {
                    this.parseAndCreateChildren(html);
                }
            },
            get innerHTML() {
                return this._innerHTML || '';
            },
            parseAndCreateChildren(html) {
                // Simple HTML parsing for template elements - more flexible regex
                const templateRegex = /<template[^>]*?id\s*=\s*["']([^"']+)["'][^>]*?>([\s\S]*?)<\/template>/gi;
                const scriptRegex = /<script[^>]*?type\s*=\s*["']text\/template["'][^>]*?id\s*=\s*["']([^"']+)["'][^>]*?>([\s\S]*?)<\/script>/gi;
                const scriptCompomintRegex = /<script[^>]*?type\s*=\s*["']text\/compomint["'][^>]*?id\s*=\s*["']([^"']+)["'][^>]*?>([\s\S]*?)<\/script>/gi;
                let match;
                // Match template elements
                templateRegex.lastIndex = 0; // Reset regex
                while ((match = templateRegex.exec(html)) !== null) {
                    const templateElement = this.createTemplateElement(match[1], match[2]);
                    this.children.push(templateElement);
                }
                // Match script[type="text/template"] elements
                scriptRegex.lastIndex = 0; // Reset regex
                while ((match = scriptRegex.exec(html)) !== null) {
                    const scriptElement = this.createScriptElement(match[1], match[2], 'text/template');
                    this.children.push(scriptElement);
                }
                // Match script[type="text/compomint"] elements
                scriptCompomintRegex.lastIndex = 0; // Reset regex
                while ((match = scriptCompomintRegex.exec(html)) !== null) {
                    const scriptElement = this.createScriptElement(match[1], match[2], 'text/compomint');
                    this.children.push(scriptElement);
                }
            },
            createTemplateElement(id, content) {
                const polyfill = SSRDOMPolyfill.getInstance();
                const template = polyfill.createElement('template');
                template.id = id;
                template.setAttribute('id', id);
                // Unescape HTML entities for template content
                const unescapedContent = content
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&#x27;/g, "'");
                template._innerHTML = unescapedContent;
                return template;
            },
            createScriptElement(id, content, type) {
                const polyfill = SSRDOMPolyfill.getInstance();
                const script = polyfill.createElement('script');
                script.id = id;
                script.setAttribute('id', id);
                script.setAttribute('type', type);
                script._innerHTML = content;
                return script;
            },
            getAttribute(name) {
                return this.attributes.get(name) || null;
            },
            appendChild(child) {
                this.children.push(child);
                child.parentNode = this;
                this.firstChild = this.children[0] || null;
                this.lastChild = this.children[this.children.length - 1] || null;
                this.childElementCount = this.children.length;
                this.firstElementChild = this.children[0] || null;
                return child;
            },
            removeChild(child) {
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
            querySelector(selector) {
                // Simple implementation for basic selectors
                if (selector.startsWith('#')) {
                    const id = selector.substring(1);
                    return this.findById(id);
                }
                if (selector.startsWith('.')) {
                    const className = selector.substring(1);
                    return this.findByClass(className);
                }
                return this.findByTagName(selector);
            },
            querySelectorAll(selector) {
                const results = [];
                // Handle comma-separated selectors
                const selectors = selector.split(',').map(s => s.trim());
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
            matches(selector) {
                const trimmedSelector = selector.trim();
                if (trimmedSelector.startsWith('#')) {
                    return this.id === trimmedSelector.substring(1);
                }
                if (trimmedSelector.startsWith('.')) {
                    return this.className.includes(trimmedSelector.substring(1));
                }
                // Handle attribute selectors like template[id], script[type="text/template"][id]
                if (trimmedSelector.includes('[') && trimmedSelector.includes(']')) {
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
                            if (attrContent.includes('=')) {
                                // Attribute with value like [type="text/template"]
                                const parts = attrContent.split('=');
                                const attrName = parts[0].trim();
                                const attrValue = parts[1].replace(/['"]/g, '').trim();
                                if (this.getAttribute(attrName) !== attrValue) {
                                    return false;
                                }
                            }
                            else {
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
            findById(id) {
                if (this.id === id)
                    return this;
                for (const child of this.children) {
                    const found = child.findById && child.findById(id);
                    if (found)
                        return found;
                }
                return null;
            },
            findByClass(className) {
                if (this.className.includes(className))
                    return this;
                for (const child of this.children) {
                    const found = child.findByClass && child.findByClass(className);
                    if (found)
                        return found;
                }
                return null;
            },
            findByTagName(tagName) {
                if (this.tagName === tagName.toUpperCase())
                    return this;
                for (const child of this.children) {
                    const found = child.findByTagName && child.findByTagName(tagName);
                    if (found)
                        return found;
                }
                return null;
            },
            // Convert to HTML string
            toHTML() {
                // Special handling for template elements - return their content
                if (this.tagName.toLowerCase() === 'template') {
                    if (this.innerHTML) {
                        return this.innerHTML;
                    }
                    else {
                        // Return children content
                        return this.children.map((child) => typeof child === 'string' ? child : child.toHTML ? child.toHTML() : '').join('');
                    }
                }
                let html = `<${this.tagName.toLowerCase()}`;
                // Add attributes
                for (const [name, value] of this.attributes) {
                    html += ` ${name}="${value}"`;
                }
                // Self-closing tags
                if (['img', 'br', 'hr', 'input', 'meta', 'link'].includes(this.tagName.toLowerCase())) {
                    html += ' />';
                    return html;
                }
                html += '>';
                // Add content
                if (this.textContent) {
                    html += this.textContent;
                }
                else if (this.innerHTML) {
                    html += this.innerHTML;
                }
                else {
                    // Add children
                    for (const child of this.children) {
                        if (typeof child === 'string') {
                            html += child;
                        }
                        else if (child.toHTML) {
                            html += child.toHTML();
                        }
                    }
                }
                html += `</${this.tagName.toLowerCase()}>`;
                return html;
            }
        };
        // Special handling for template elements
        if (tagName.toLowerCase() === 'template') {
            element.content = this.createDocumentFragment();
            // Override innerHTML for template elements to populate content
            element.innerHTML;
            Object.defineProperty(element, 'innerHTML', {
                get: function () {
                    return this._innerHTML || '';
                },
                set: function (html) {
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
                        this.content.lastChild = this.content.children[this.content.children.length - 1] || null;
                        this.content.childElementCount = this.content.children.length;
                        this.content.firstElementChild = this.content.children[0] || null;
                    }
                },
                configurable: true,
                enumerable: true
            });
        }
        return element;
    }
    /**
     * Create a document fragment for SSR
     */
    createDocumentFragment() {
        return {
            nodeType: 11, // DocumentFragment nodeType
            children: [],
            firstChild: null,
            lastChild: null,
            childElementCount: 0,
            firstElementChild: null,
            // Make childNodes iterable
            get childNodes() {
                return this.children;
            },
            appendChild(child) {
                this.children.push(child);
                child.parentNode = this;
                this.firstChild = this.children[0] || null;
                this.lastChild = this.children[this.children.length - 1] || null;
                this.childElementCount = this.children.length;
                this.firstElementChild = this.children[0] || null;
                return child;
            },
            removeChild(child) {
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
            querySelector(selector) {
                for (const child of this.children) {
                    if (child.querySelector) {
                        const result = child.querySelector(selector);
                        if (result)
                            return result;
                    }
                }
                return null;
            },
            querySelectorAll(selector) {
                const results = [];
                // Handle comma-separated selectors
                const selectors = selector.split(',').map(s => s.trim());
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
            toHTML() {
                return this.children.map((child) => typeof child === 'string' ? child : child.toHTML ? child.toHTML() : '').join('');
            }
        };
    }
    /**
     * Create a text node for SSR
     */
    createTextNode(text) {
        return {
            nodeType: 3,
            textContent: text,
            toHTML() {
                return this.textContent;
            }
        };
    }
    /**
     * Create a comment node for SSR
     */
    createComment(text) {
        return {
            nodeType: 8,
            textContent: text,
            toHTML() {
                return `<!-- ${this.textContent} -->`;
            }
        };
    }
    /**
     * Collect styles during SSR
     */
    collectStyle(css) {
        this.styleCollector.push(css);
    }
    /**
     * Collect scripts during SSR
     */
    collectScript(script) {
        this.scriptCollector.push(script);
    }
    /**
     * Get collected styles
     */
    getCollectedStyles() {
        return this.styleCollector.join('\n');
    }
    /**
     * Get collected scripts
     */
    getCollectedScripts() {
        return [...this.scriptCollector];
    }
    /**
     * Reset collectors
     */
    reset() {
        this.styleCollector = [];
        this.scriptCollector = [];
    }
}
/**
 * SSR Document Mock
 */
function createSSRDocument() {
    const polyfill = SSRDOMPolyfill.getInstance();
    return {
        createElement: (tagName) => polyfill.createElement(tagName),
        createDocumentFragment: () => polyfill.createDocumentFragment(),
        createTextNode: (text) => polyfill.createTextNode(text),
        createComment: (text) => polyfill.createComment(text),
        getElementById: (id) => null,
        head: {
            appendChild: (element) => {
                if (element.tagName === 'STYLE') {
                    polyfill.collectStyle(element.textContent || element.innerHTML);
                }
                else if (element.tagName === 'SCRIPT') {
                    polyfill.collectScript(element.textContent || element.innerHTML);
                }
            },
            removeChild: () => { },
            innerHTML: ''
        },
        body: {
            appendChild: () => { },
            removeChild: () => { },
            innerHTML: '',
            contains: () => false
        },
        documentElement: {
            lang: 'en',
            getAttribute: function (name) {
                if (name === 'lang')
                    return this.lang;
                return null;
            },
            setAttribute: function (name, value) {
                if (name === 'lang')
                    this.lang = value;
            }
        }
    };
}
/**
 * SSR Window Mock
 */
function createSSRWindow() {
    return {
        Node: {
            prototype: {}
        },
        Element: {
            prototype: {}
        },
        CharacterData: {
            prototype: {}
        },
        DocumentType: {
            prototype: {}
        },
        XMLHttpRequest: function () {
            throw new Error('XMLHttpRequest is not available in SSR environment');
        }
    };
}
/**
 * SSR Element Mock for global scope
 */
function createSSRElementClass() {
    const SSRElement = class {
        constructor(tagName) {
            this.tagName = '';
            this.innerHTML = '';
            this.textContent = '';
            this.id = '';
            this.className = '';
            this.children = [];
            this.parentNode = null;
            if (tagName)
                this.tagName = tagName.toUpperCase();
        }
    };
    return SSRElement;
}
/**
 * Setup SSR environment
 */
function setupSSREnvironment() {
    if (Environment.isNode()) {
        // Mark as SSR environment
        globalThis.__SSR_ENVIRONMENT__ = true;
        // Setup global DOM polyfills
        const ssrDocument = createSSRDocument();
        const ssrWindow = createSSRWindow();
        globalThis.document = ssrDocument;
        globalThis.window = ssrWindow;
        // Also set on global for Node.js compatibility
        if (typeof globalThis.global !== 'undefined') {
            globalThis.global.document = ssrDocument;
            globalThis.global.window = ssrWindow;
        }
        // Setup global Element, Node classes
        globalThis.Element = createSSRElementClass();
        globalThis.Node = class SSRNode {
        };
        globalThis.CharacterData = class SSRCharacterData {
        };
        globalThis.DocumentType = class SSRDocumentType {
        };
        // Mock XMLHttpRequest to prevent errors
        globalThis.XMLHttpRequest = function () {
            throw new Error('XMLHttpRequest is not available in SSR environment. Use static template rendering instead.');
        };
        return true;
    }
    return false;
}

/*
 * Copyright (c) 2025-present, Choi Sungho
 * Code released under the MIT license
 */
/**
 * Server-Side Rendering Engine for Compomint
 */
class SSRRenderer {
    constructor(compomint, options = {}) {
        this.renderStartTime = 0;
        this.compomint = compomint;
        this.options = Object.assign({ renderToString: true, hydrateOnClient: false, generateIds: true, preserveWhitespace: false, lang: "en" }, options);
        this.polyfill = SSRDOMPolyfill.getInstance();
        // Setup SSR environment if needed
        this.setupEnvironment();
    }
    setupEnvironment() {
        if (Environment.isServer()) {
            setupSSREnvironment();
            // Override compomint's DOM dependencies for SSR
            this.setupSSROverrides();
        }
    }
    setupSSROverrides() {
        // Store original functions
        const originalDocument = globalThis.document;
        // Override document.createElement to use our polyfill
        if (originalDocument) {
            originalDocument.createElement = (tagName) => {
                return this.polyfill.createElement(tagName);
            };
        }
    }
    /**
     * Render a template to HTML string on the server
     */
    renderToString(templateId_1) {
        return __awaiter(this, arguments, void 0, function* (templateId, data = {}, options = {}) {
            this.renderStartTime = Date.now();
            const mergedOptions = Object.assign(Object.assign({}, this.options), options);
            // Reset polyfill collectors
            this.polyfill.reset();
            // Set language for i18n if provided
            if (options.lang) {
                const doc = globalThis.document;
                if (doc && doc.documentElement) {
                    doc.documentElement.lang = options.lang;
                }
            }
            try {
                // Get the template metadata
                const templateMeta = this.compomint.tmplCache.get(templateId);
                if (!templateMeta || !templateMeta.sourceGenFunc) {
                    throw new Error(`Template "${templateId}" not found or missing sourceGenFunc`);
                }
                // Create SSR-specific data with metadata
                const ssrData = Object.assign(Object.assign({}, data), { $ssr: true, $generateIds: mergedOptions.generateIds, $hydrateOnClient: mergedOptions.hydrateOnClient });
                // Call sourceGenFunc directly to get HTML string
                let result;
                try {
                    result = templateMeta.sourceGenFunc.call(null, // no this context needed
                    ssrData, // data
                    {}, // status (empty for SSR)
                    { tmplId: templateId }, // component
                    this.compomint.i18n, // i18n (pass full i18n object, not just template-specific)
                    this.compomint, // compomint
                    this.compomint.tmpl || {}, // tmpl
                    {}, // lazyScope (empty for SSR)
                    false // debugger
                    );
                }
                catch (error) {
                    throw error;
                }
                // Convert result to string
                const html = (typeof result === "string" ? result : String(result)).trim();
                // Parse the rendered HTML to extract and collect styles/scripts
                this.extractStylesAndScripts(html);
                // SSR-specific: Extract styles from original template text since Compomint strips them during compilation
                if (templateMeta.templateText) {
                    this.extractStylesFromTemplateText(templateMeta.templateText);
                }
                // Collect styles and scripts
                const css = this.polyfill.getCollectedStyles();
                const scripts = this.polyfill.getCollectedScripts();
                // Build metadata
                const componentId = this.compomint.tools.genId(templateId);
                const metadata = {
                    templateIds: [templateId],
                    componentIds: [componentId], // Use templateId as component id
                    renderTime: Date.now() - this.renderStartTime,
                };
                // Add hydration attribute
                const finalHtml = html.replace(/^(<[a-z]+)/, `$1 data-co-id="${componentId}" data-co-tmpl-id="${templateId}"`);
                return {
                    html: finalHtml || "",
                    css,
                    scripts,
                    metadata,
                };
            }
            catch (error) {
                throw new Error(`SSR rendering failed for template "${templateId}": ${error}`);
            }
        });
    }
    /**
     * Render multiple templates and combine results
     */
    renderMultiple(templates_1) {
        return __awaiter(this, arguments, void 0, function* (templates, options = {}) {
            this.renderStartTime = Date.now();
            this.polyfill.reset();
            const results = [];
            for (const template of templates) {
                const result = yield this.renderToString(template.id, template.data, options);
                results.push(result);
            }
            // Combine results
            const combinedHTML = results.map((r) => r.html).join("\n");
            const combinedCSS = results
                .map((r) => r.css)
                .filter(Boolean)
                .join("\n");
            const combinedScripts = results.reduce((acc, r) => acc.concat(r.scripts), []);
            const combinedTemplateIds = results.reduce((acc, r) => acc.concat(r.metadata.templateIds), []);
            const combinedComponentIds = results.reduce((acc, r) => acc.concat(r.metadata.componentIds), []);
            return {
                html: combinedHTML,
                css: combinedCSS,
                scripts: combinedScripts,
                metadata: {
                    templateIds: combinedTemplateIds,
                    componentIds: combinedComponentIds,
                    renderTime: Date.now() - this.renderStartTime,
                },
            };
        });
    }
    /**
     * Generate complete HTML page with SSR content
     */
    renderPage(templateId_1) {
        return __awaiter(this, arguments, void 0, function* (templateId, data = {}, pageOptions = {}) {
            const result = yield this.renderToString(templateId, data);
            const { title = "Compomint SSR Page", meta = [], links = [], scripts = [], bodyClass = "", lang = "en", } = pageOptions;
            return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHTML(title)}</title>
  ${meta
                .map((m) => {
                const nameAttr = m.name ? `name="${this.escapeHTML(m.name)}"` : "";
                const propertyAttr = m.property
                    ? `property="${this.escapeHTML(m.property)}"`
                    : "";
                return `<meta ${nameAttr}${propertyAttr} content="${this.escapeHTML(m.content)}">`;
            })
                .join("\n  ")}
  ${links
                .map((link) => {
                const attrs = Object.keys(link)
                    .map((key) => `${key}="${this.escapeHTML(link[key])}"`)
                    .join(" ");
                return `<link ${attrs}>`;
            })
                .join("\n  ")}
  ${result.css ? `<style>\n${result.css}\n</style>` : ""}
</head>
<body${bodyClass ? ` class="${this.escapeHTML(bodyClass)}"` : ""}>
  ${result.html}
  ${scripts
                .map((script) => {
                if (script.src) {
                    const attrs = Object.keys(script)
                        .map((key) => `${key}="${this.escapeHTML(script[key])}"`)
                        .join(" ");
                    return `<script ${attrs}></script>`;
                }
                else if (script.content) {
                    return `<script>${script.content}</script>`;
                }
                return "";
            })
                .join("\n  ")}
  ${result.scripts.map((script) => `<script>${script}</script>`).join("\n  ")}
  ${this.generateHydrationScript(result)}
</body>
</html>`;
        });
    }
    /**
     * Render component in SSR mode
     */
    renderComponentSSR(templateFunction, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Create a mock container for SSR
            const mockContainer = this.polyfill.createDocumentFragment();
            // Render the component with SSR-specific handling
            const component = templateFunction(data, mockContainer);
            // If component has async operations, wait for them
            if (component && typeof component.then === "function") {
                return yield component;
            }
            return component;
        });
    }
    /**
     * Extract HTML from rendered component
     */
    extractHTML(component) {
        if (!component || !component.element) {
            console.warn("Component or component.element is missing");
            return "";
        }
        // If element has toHTML method (our polyfill), use it
        if (typeof component.element.toHTML === "function") {
            return component.element.toHTML();
        }
        // Handle DocumentFragment case
        if (component.element.nodeType === 11) {
            // DocumentFragment
            // For DocumentFragment, we need to extract HTML from children
            const children = component.element.childNodes || [];
            return Array.from(children)
                .map((child) => {
                if (typeof child.toHTML === "function") {
                    return child.toHTML();
                }
                else if (child.innerHTML) {
                    return child.innerHTML;
                }
                else if (child.textContent) {
                    return child.textContent;
                }
                else if (child.nodeType === 3) {
                    // Text node
                    return child.textContent || "";
                }
                return "";
            })
                .join("");
        }
        // Fallback for other cases
        if (component.element.innerHTML) {
            return component.element.innerHTML;
        }
        if (component.element.textContent) {
            return component.element.textContent;
        }
        return "";
    }
    /**
     * Generate hydration script for client-side
     */
    generateHydrationScript(result) {
        if (!this.options.hydrateOnClient) {
            return "";
        }
        const hydrationData = {
            templateIds: result.metadata.templateIds,
            componentIds: result.metadata.componentIds,
            renderTime: result.metadata.renderTime,
        };
        return `
<script>
  // Compomint SSR Hydration Data
  window.__COMPOMINT_SSR__ = ${JSON.stringify(hydrationData)};
  
  // Hydration helper
  window.__COMPOMINT_HYDRATE__ = function(compomint) {
    console.log('Hydrating Compomint SSR components...', window.__COMPOMINT_SSR__);
    // Additional hydration logic can be added here
  };
</script>`;
    }
    /**
     * Escape HTML for safe output
     */
    escapeHTML(text) {
        const escapeMap = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#x27;",
        };
        return text.replace(/[&<>"']/g, (char) => escapeMap[char] || char);
    }
    /**
     * Extract styles and scripts from rendered HTML
     */
    extractStylesAndScripts(html) {
        // Extract styles
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        let styleMatch;
        while ((styleMatch = styleRegex.exec(html)) !== null) {
            const css = styleMatch[1].trim();
            if (css) {
                this.polyfill.collectStyle(css);
            }
        }
        // Extract scripts
        const scriptRegex = /<script[^>]*(?:src\s*=\s*["'][^"']*["'])?[^>]*>([\s\S]*?)<\/script>/gi;
        let scriptMatch;
        while ((scriptMatch = scriptRegex.exec(html)) !== null) {
            const script = scriptMatch[1].trim();
            if (script) {
                this.polyfill.collectScript(script);
            }
        }
    }
    /**
     * Extract styles from original template text (SSR-specific workaround)
     * This is needed because Compomint strips <style> tags during template compilation
     */
    extractStylesFromTemplateText(templateText) {
        // Decode HTML entities first
        const decodedText = templateText
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'");
        // Extract styles from decoded template text
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        let styleMatch;
        while ((styleMatch = styleRegex.exec(decodedText)) !== null) {
            const css = styleMatch[1].trim();
            if (css) {
                this.polyfill.collectStyle(css);
            }
        }
    }
    /**
     * Get renderer statistics
     */
    getStats() {
        return {
            environment: Environment.isServer() ? "server" : "client",
            polyfillActive: Environment.isServer(),
            lastRenderTime: this.renderStartTime
                ? Date.now() - this.renderStartTime
                : 0,
        };
    }
}
/**
 * Create SSR renderer instance
 */
function createSSRRenderer(compomint, options = {}) {
    return new SSRRenderer(compomint, options);
}

//
// SSR template settings (deep clone of default engine without style rule)
//
const defaultTemplateEngineSSR = (compomint) => {
    // Get the default template engine
    const baseEngine = defaultTemplateEngine(compomint);
    // Create a deep clone by manually copying all properties except style rule
    const ssrEngine = {
        rules: {},
        keys: Object.assign({}, baseEngine.keys)
    };
    // Copy all rules except style and element for SSR (DOM manipulation not available)
    Object.keys(baseEngine.rules).forEach((ruleKey) => {
        if (ruleKey !== 'style' && ruleKey !== 'element') {
            ssrEngine.rules[ruleKey] = Object.assign({}, baseEngine.rules[ruleKey]);
        }
    });
    return ssrEngine;
};

/*
 * Copyright (c) 2025-present, Choi Sungho
 * Code released under the MIT license
 */
// Polyfill for Object.assign
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
})([
    typeof Element !== "undefined" ? Element.prototype : {},
    typeof CharacterData !== "undefined" ? CharacterData.prototype : {},
    typeof DocumentType !== "undefined" ? DocumentType.prototype : {},
].filter(Boolean));
// Polyfill for Node.isConnected
(function (supported) {
    if (supported || typeof window === "undefined" || !window.Node)
        return;
    Object.defineProperty(window.Node.prototype, "isConnected", {
        get: function () {
            return document.body.contains(this);
        },
    });
})(typeof window !== "undefined" &&
    window.Node &&
    "isConnected" in window.Node.prototype);
const compomint = {};
const tmpl = {};
const tools = (compomint.tools = compomint.tools || {});
const configs = (compomint.configs = Object.assign({ printExecTime: false, debug: false, throwError: true }, compomint.configs));
const cachedTmpl = (compomint.tmplCache =
    compomint.tmplCache || new Map());
if (!cachedTmpl.has("anonymous")) {
    cachedTmpl.set("anonymous", { elements: new Set() }); // Cast to TemplateMeta
}
const isSupportTemplateTag = typeof document !== "undefined" &&
    "content" in document.createElement("template");
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
};
const escaper = /\>( |\n)+\<|\>( |\n)+|( |\n)+\<|\\|'|\r|\n|\t|\u2028|\u2029/g;
// set default template config
if (Environment.isServer()) {
    compomint.templateEngine = defaultTemplateEngineSSR(compomint);
}
else {
    compomint.templateEngine = defaultTemplateEngine(compomint);
}
const escapeHtml = (function () {
    const escapeMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;", // Use HTML entity for single quote
        "`": "&#x60;", // Use HTML entity for backtick
        //"\n": "&#10;", // Keep newline escaping if needed, otherwise remove
    };
    const unescapeMap = Object.keys(escapeMap).reduce((acc, key) => {
        acc[escapeMap[key]] = key;
        return acc;
    }, {});
    const createEscaper = function (map) {
        const escaper = function (match) {
            return map[match];
        };
        const source = `(?:${Object.keys(map).join("|").replace(/\\/g, "\\\\")})`; // Escape backslashes if any keys have them
        const testRegexp = RegExp(source);
        const replaceRegexp = RegExp(source, "g");
        return function (string) {
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
const matcherFunc = function (templateRules) {
    const patternArray = [];
    const execArray = [];
    const lazyExecMap = {};
    const lazyScopeSeed = {};
    Object.keys(templateRules).forEach(function (key) {
        const templateRule = templateRules[key]; // Type assertion
        if (templateRule &&
            typeof templateRule === "object" &&
            templateRule.pattern instanceof RegExp &&
            typeof templateRule.exec === "function") {
            patternArray.push((templateRule.pattern || noMatch).source);
            execArray.push(templateRule.exec);
        }
        if (templateRule &&
            typeof templateRule === "object" &&
            typeof templateRule.lazyExec === "function") {
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
const escapeFunc = function (match) {
    return escapes[match] || escapes[match.replace(/[ \n]/g, "")] || "";
};
const defaultMatcher = matcherFunc(compomint.templateEngine.rules);
const templateParser = function (tmplId, text, matcher) {
    if (configs.printExecTime)
        console.time(`tmpl: ${tmplId}`);
    let index = 0;
    let source = "";
    text.replace(matcher.pattern, function (...params) {
        const match = params[0];
        const offset = params[params.length - 2];
        source += text.slice(index, offset).replace(escaper, escapeFunc);
        let selectedMatchContent;
        let matchIndex = null;
        params.slice(1, -2).some(function (value, idx) {
            if (value !== undefined) {
                selectedMatchContent = value;
                matchIndex = idx;
                return true;
            }
            return false;
        });
        if (selectedMatchContent !== undefined && matchIndex !== null) {
            try {
                source += matcher.exec[matchIndex].call(matcher.templateRules, selectedMatchContent, tmplId);
            }
            catch (e) {
                console.error(`Error executing template rule index ${matchIndex} for match "${selectedMatchContent}" in template "${tmplId}":`, e);
                if (configs.throwError)
                    throw e;
                source += "";
            }
        }
        else {
            source += match.replace(escaper, escapeFunc);
        }
        index = offset + match.length;
        return match;
    });
    source += text.slice(index).replace(escaper, escapeFunc);
    if (configs.printExecTime)
        console.timeEnd(`tmpl: ${tmplId}`);
    return source;
};
const templateBuilder = (compomint.template =
    function compomint_templateBuilder(tmplId, templateText, customTemplateEngine) {
        let templateEngine = compomint.templateEngine;
        let matcher = defaultMatcher;
        if (customTemplateEngine) {
            templateEngine = {
                rules: Object.assign({}, templateEngine.rules, customTemplateEngine.rules || {}),
                keys: Object.assign({}, templateEngine.keys, customTemplateEngine.keys || {}),
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
        let sourceGenFunc = null;
        try {
            sourceGenFunc = new Function(templateEngine.keys.dataKeyName, templateEngine.keys.statusKeyName, templateEngine.keys.componentKeyName, templateEngine.keys.i18nKeyName, "compomint", "tmpl", "__lazyScope", "__debugger", source);
        }
        catch (e) {
            if (configs.throwError) {
                console.error(`Template compilation error in "${tmplId}", ${e.name}: ${e.message}`);
                try {
                    // Attempt re-run for potential browser debugging
                    new Function(templateEngine.keys.dataKeyName, templateEngine.keys.statusKeyName, templateEngine.keys.componentKeyName, templateEngine.keys.i18nKeyName, "compomint", "tmpl", "__lazyScope", "__debugger", source);
                }
                catch (_a) {
                    /* Ignore re-run error */
                }
                throw e;
            }
            else {
                return () => ({}); // Return a dummy function if not throwing
            }
        }
        const renderingFunc = function compomint_renderingFuncBuilder(...params) {
            let data;
            let wrapperElement;
            let callback;
            let baseComponent;
            let existingElement;
            // Argument parsing logic
            const firstArg = params[0];
            if (firstArg &&
                typeof firstArg === "object" &&
                (firstArg.$wrapperElement ||
                    firstArg.$callback ||
                    firstArg.$baseComponent ||
                    firstArg.$existingElement)) {
                data = Object.assign({}, firstArg); // Clone data object
                wrapperElement = data.$wrapperElement;
                delete data.$wrapperElement;
                callback = data.$callback;
                delete data.$callback;
                baseComponent = data.$baseComponent;
                delete data.$baseComponent;
                existingElement = data.$existingElement;
                delete data.$existingElement;
            }
            else {
                data = firstArg;
                if (typeof params[1] === "function") {
                    wrapperElement = undefined;
                    callback = params[1];
                    baseComponent = params[2];
                }
                else {
                    wrapperElement = params[1];
                    callback = params[2];
                    baseComponent = params[3];
                }
            }
            const dataKeyName = templateEngine.keys.dataKeyName;
            const statusKeyName = templateEngine.keys.statusKeyName;
            const lazyScope = JSON.parse(matcher.lazyScopeSeed);
            const component = Object.assign(baseComponent || {}, {
                tmplId: tmplId,
                element: null, // Initialize element
                status: (baseComponent && baseComponent.status) || {}, // Ensure status exists
                replace: function (newComponent) {
                    const self = this;
                    if (!self.element ||
                        !(self.element instanceof Node) ||
                        !self.element.parentElement) {
                        if (configs.debug)
                            console.warn(`Cannot replace template "${tmplId}": element not in DOM.`);
                        return;
                    }
                    self.element.parentElement.replaceChild(newComponent.element ||
                        newComponent, self.element);
                },
                remove: function (spacer = false) {
                    const self = this;
                    if (self.beforeRemove) {
                        try {
                            self.beforeRemove();
                        }
                        catch (e) {
                            console.error("Error in beforeRemove:", e);
                        }
                    }
                    // Remote event event listener
                    // Iterate through all event handlers stored in lazyScope.eventArray
                    if (lazyScope.eventArray) {
                        lazyScope.eventArray.forEach(function (event) {
                            // For each event entry, iterate through its associated event listeners
                            event.forEach(function (selectedEvent) {
                                if (selectedEvent.element) {
                                    if (typeof selectedEvent.eventFunc === "function") {
                                        selectedEvent.element.removeEventListener("click", selectedEvent.eventFunc); // Remove click event listener
                                    }
                                    else {
                                        Object.keys(selectedEvent.eventFunc).forEach(function (eventType) {
                                            selectedEvent.element.removeEventListener(eventType, selectedEvent.eventFunc[eventType]);
                                        });
                                    }
                                    Object.keys(selectedEvent).forEach((key) => delete selectedEvent[key]);
                                }
                                // Clear the selectedEvent object to release references
                            });
                        });
                    }
                    const parent = self.element instanceof Node ? self.element.parentElement : null;
                    const removedElement = self.element; // Store reference
                    if (parent) {
                        if (spacer) {
                            const dumy = document.createElement("template");
                            parent.replaceChild(dumy, self.element);
                            self.element = dumy; // Update scope's element reference
                        }
                        else {
                            parent.removeChild(self.element);
                        }
                    }
                    else if (configs.debug) {
                        console.warn(`Cannot remove template "${tmplId}": element not in DOM.`);
                    }
                    if (self.afterRemove) {
                        try {
                            self.afterRemove();
                        }
                        catch (e) {
                            console.error("Error in afterRemove:", e);
                        }
                    }
                    return removedElement;
                },
                appendTo: function (parentElement) {
                    const self = this;
                    if (self.beforeAppendTo) {
                        try {
                            self.beforeAppendTo();
                        }
                        catch (e) {
                            console.error("Error in beforeAppendTo:", e);
                        }
                    }
                    if (parentElement && self.element instanceof Node) {
                        parentElement.appendChild(self.element);
                    }
                    else if (configs.debug) {
                        console.warn(`Cannot append template "${tmplId}": parentElement or scope.element is missing or not a Node.`);
                    }
                    if (self.afterAppendTo) {
                        setTimeout(() => {
                            try {
                                self.afterAppendTo();
                            }
                            catch (e) {
                                console.error("Error in afterAppendTo:", e);
                            }
                        }, 0);
                    }
                    return self;
                },
                release: function () {
                    /* Implementation below */
                },
                render: function (newData) {
                    /* Implementation below */ return this;
                },
                refresh: function (reflashData) {
                    /* Implementation below */ return this;
                },
                reflash: function (reflashData) {
                    /* Implementation below */ return this;
                },
            }); // Cast to ComponentScope
            if (!component._id) {
                component._id = tools.genId(tmplId);
            }
            component[dataKeyName] = data;
            if (component[statusKeyName] == undefined) {
                component[statusKeyName] = {};
            }
            const hasParent = wrapperElement instanceof Element;
            const temp = document.createElement("template");
            if (configs.printExecTime)
                console.time(`render: ${tmplId}`);
            let returnTarget = null;
            let renderedHTML = null;
            try {
                renderedHTML = !data
                    ? `<template data-co-empty-template="${tmplId}"></template>`
                    : sourceGenFunc.call(
                    // Use non-null assertion
                    wrapperElement || null, data, component[statusKeyName], component, compomint.i18n[tmplId], compomint, tmpl, lazyScope, configs.debug // Pass debug flag for __debugger
                    );
            }
            catch (e) {
                if (configs.throwError) {
                    console.error(`Runtime error during render of "${tmplId}":`, e.message);
                    console.debug("--- Data ---", data, "------------");
                    try {
                        // Attempt re-run with debugger
                        sourceGenFunc.call(wrapperElement || null, data, component[statusKeyName], component, compomint.i18n[tmplId], lazyScope, true);
                    }
                    catch (_a) {
                        /* Ignore */
                    }
                    throw e;
                }
                else {
                    console.warn(`Render failed for "${tmplId}". Returning scope with comment node.`);
                    component.element = document.createComment(`Render Error: ${tmplId}`);
                    return component;
                }
            }
            if (configs.printExecTime)
                console.timeEnd(`render: ${tmplId}`);
            temp.innerHTML = renderedHTML;
            let docFragment = temp.content || temp;
            if (docFragment.tagName == "TEMPLATE" &&
                !temp.content) {
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
            const shadowStyle = docFragment.querySelector
                ? docFragment.querySelector("style")
                : null;
            if (shadowStyle && docFragment.querySelector) {
                // Check if querySelector exists
                // In SSR environment, collect styles instead of creating shadow DOM
                if (Environment.isServer()) {
                    // Extract and collect all styles for SSR
                    const styles = docFragment.querySelectorAll("style");
                    styles.forEach((style) => {
                        const css = style.textContent || style.innerHTML;
                        if (css &&
                            globalThis.document &&
                            globalThis.document.head) {
                            // Use SSR polyfill to collect styles
                            const polyfill = SSRDOMPolyfill.getInstance();
                            polyfill.collectStyle(css);
                        }
                    });
                    // Don't create shadow DOM in SSR, leave styles in place for extraction
                }
                else {
                    // Browser environment - create shadow DOM as usual
                    const host = document.createElement(tmplId); // Use tmplId as host tag name
                    try {
                        const shadow = host.attachShadow({ mode: "open" });
                        while (docFragment.firstChild) {
                            shadow.appendChild(docFragment.firstChild);
                        }
                        docFragment = host; // Replace fragment with the host element
                    }
                    catch (e) {
                        console.error(`Failed to attach shadow DOM for template "${tmplId}":`, e);
                        // Proceed without shadow DOM if attachShadow fails
                    }
                }
            }
            if (docFragment.firstChild && docFragment.firstChild.nodeType == 8) {
                returnTarget = docFragment.firstChild;
            }
            else if (childElementCount(docFragment) == 1) {
                returnTarget = firstElementChild(docFragment);
                if (hasParent && wrapperElement && returnTarget) {
                    if (component.beforeAppendTo) {
                        try {
                            component.beforeAppendTo();
                        }
                        catch (e) {
                            console.error("Error in beforeAppendTo:", e);
                        }
                    }
                    wrapperElement.appendChild(returnTarget);
                    if (component.afterAppendTo) {
                        setTimeout(() => {
                            try {
                                component.afterAppendTo();
                            }
                            catch (e) {
                                console.error("Error in afterAppendTo:", e);
                            }
                        }, 0);
                    }
                }
            }
            else {
                if (hasParent && wrapperElement) {
                    if (component.beforeAppendTo) {
                        try {
                            component.beforeAppendTo();
                        }
                        catch (e) {
                            console.error("Error in beforeAppendTo:", e);
                        }
                    }
                    wrapperElement.appendChild(docFragment);
                    if (component.afterAppendTo) {
                        setTimeout(() => {
                            try {
                                component.afterAppendTo();
                            }
                            catch (e) {
                                console.error("Error in afterAppendTo:", e);
                            }
                        }, 0);
                    }
                    returnTarget = wrapperElement;
                }
                else {
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
                            returnTarget.dataset[camelCased] =
                                String(value);
                        }
                        else if (prop in returnTarget) {
                            returnTarget[prop] = value;
                        }
                        else {
                            returnTarget.setAttribute(prop, String(value));
                        }
                    }
                    catch (e) {
                        console.error(`Error applying prop "${prop}" to element in template "${tmplId}":`, e);
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
            }
            else {
                component.element = returnTarget; // Assign final element/fragment
            }
            // Execute lazyExec functions after element is attached
            const lazyExec = matcher.lazyExec;
            if (data) {
                matcher.lazyExecKeys.forEach(function (key) {
                    if (lazyScope[key] && lazyScope[key].length > 0) {
                        try {
                            lazyExec[key].call(templateEngine.rules[key.slice(0, -5)], data, lazyScope, component, docFragment); // Cast needed
                        }
                        catch (e) {
                            if (configs.throwError) {
                                console.error(`Error during lazy execution of "${key}" for template "${tmplId}":`, e);
                                throw e;
                            }
                        }
                    }
                });
            }
            if (tools.liveReloadSupport) {
                try {
                    tools.liveReloadSupport(component);
                }
                catch (e) {
                    console.error("Error in liveReloadSupport:", e);
                }
            }
            if (callback) {
                try {
                    callback.call(wrapperElement || null, component);
                }
                catch (e) {
                    console.error(`Error in template callback for "${tmplId}":`, e);
                    if (configs.throwError)
                        throw e;
                }
            }
            // Define Component Methods (Render/Refresh/Release)
            component.release = function () {
                const self = this;
                const props = Object.getOwnPropertyNames(self);
                const keepProps = [statusKeyName, "_id"];
                for (let i = 0; i < props.length; i++) {
                    const prop = props[i];
                    if (typeof self[prop] !== "function" &&
                        !keepProps.includes(prop)) {
                        delete self[prop];
                    }
                }
            };
            component.render = function (newData) {
                const currentComponent = this;
                const targetElement = currentComponent.element;
                const parent = targetElement instanceof Node ? targetElement.parentElement : null;
                const wrapper = currentComponent.wrapperElement;
                const tmplFunc = compomint.tmpl(currentComponent.tmplId);
                if (!tmplFunc) {
                    console.error(`Cannot re-render: Template function for "${currentComponent.tmplId}" not found.`);
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
                    }
                    catch (e) {
                        console.error("Error in beforeRemove during render:", e);
                    }
                }
                let newComponent;
                if (wrapper) {
                    newComponent = tmplFunc(newData, wrapper, undefined, currentComponent); // Reuse scope object
                }
                else if (parent && targetElement instanceof Node) {
                    newComponent = tmplFunc(newData, undefined, undefined, currentComponent); // Reuse scope object
                    if (newComponent.element instanceof Node) {
                        if (newComponent.beforeAppendTo) {
                            try {
                                newComponent.beforeAppendTo();
                            }
                            catch (e) {
                                console.error("Error in beforeAppendTo during render:", e);
                            }
                        }
                        parent.replaceChild(newComponent.element, targetElement);
                        if (newComponent.afterAppendTo) {
                            setTimeout(() => {
                                try {
                                    newComponent.afterAppendTo();
                                }
                                catch (e) {
                                    console.error("Error in afterAppendTo during render:", e);
                                }
                            }, 0);
                        }
                    }
                    else if (configs.debug) {
                        console.warn(`Re-render of "${currentComponent.tmplId}" resulted in no element or target was missing.`);
                    }
                }
                else {
                    // No parent, just create new scope (likely detached)
                    newComponent = tmplFunc(newData, undefined, undefined, currentComponent);
                }
                if (currentComponent.afterRemove) {
                    try {
                        currentComponent.afterRemove();
                    }
                    catch (e) {
                        console.error("Error in afterRemove during render:", e);
                    }
                }
                Object.assign(newComponent, hooks); // Restore hooks
                return newComponent;
            };
            component.refresh = function (reflashData) {
                const currentComponent = this;
                const currentData = currentComponent[dataKeyName];
                if (currentComponent.beforeRefresh) {
                    try {
                        currentComponent.beforeRefresh();
                    }
                    catch (e) {
                        console.error("Error in beforeRefresh:", e);
                    }
                }
                const newData = Object.assign({}, currentData || {}, reflashData);
                const newComponent = currentComponent.render(newData);
                if (currentComponent.afterRefresh) {
                    try {
                        currentComponent.afterRefresh();
                    }
                    catch (e) {
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
            const tmplMeta = configs.debug
                ? {
                    renderingFunc: renderingFunc,
                    sourceGenFunc: sourceGenFunc,
                    source: escapeHtml.escape(`function ${tmplId}_source (${templateEngine.keys.dataKeyName}, ${templateEngine.keys.statusKeyName}, ${templateEngine.keys.componentKeyName}, ${templateEngine.keys.i18nKeyName}, __lazyScope, __debugger) {\n${source}\n}`),
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
                    .map((part, index) => index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))
                    .join("");
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
            if (configs.debug)
                console.log(`Remapped template "${oldKey}" to "${newKey}"`);
        }
        else if (configs.debug) {
            console.warn(`Cannot remap template: Old key "${oldKey}" not found in cache.`);
        }
    });
};
compomint.tmpl = function (tmplId) {
    const tmplMeta = cachedTmpl.get(tmplId);
    return tmplMeta ? tmplMeta.renderingFunc : null;
};
const safeTemplate = function (source) {
    let template;
    if (typeof source !== "undefined" && source instanceof Element) {
        if (source.tagName === "TEMPLATE")
            return source;
        return source; // Assume it's a container element
    }
    else if (typeof source !== "string") {
        if (configs.debug)
            console.warn("safeTemplate received non-string/non-element source:", source);
        source = "";
    }
    template = document.createElement("template");
    if (isSupportTemplateTag) {
        const encodedSource = source.replace(/<(?!template|\/template|body|\/body|html|\/html|head|\/head|style|\/style|script|\/script|link|\/link|meta|\/meta|!--)/gi, "&lt;");
        template.innerHTML = encodedSource;
    }
    else {
        const encodedSource = source
            .replace(/<(?!template|\/template|body|\/body|html|\/html|head|\/head|style|\/style|script|\/script|link|\/link|meta|\/meta|!--)/gi, "&lt;")
            .replace(/<template/g, '<script type="template"')
            .replace(/<\/template>/g, "</script>");
        template.innerHTML = encodedSource;
    }
    return template;
};
const addTmpl = (compomint.addTmpl = function (tmplId, element, templateEngine) {
    let templateText;
    // Check for Element or SSR polyfill objects
    if (typeof element !== "undefined" &&
        element &&
        typeof element === "object") {
        // Try to get template content from SSR polyfill object or real Element
        if ("_innerHTML" in element) {
            templateText = element._innerHTML;
        }
        else if ("innerHTML" in element) {
            templateText = element.innerHTML;
        }
        else {
            templateText = String(element);
        }
    }
    else {
        templateText = String(element);
    }
    templateText = escapeHtml.unescape(templateText.replace(/<!---|--->/gi, ""));
    return templateBuilder(tmplId, templateText, templateEngine);
});
const addTmpls = (compomint.addTmpls = function (source, removeInnerTemplate, templateEngine) {
    if (typeof removeInnerTemplate !== "boolean" && templateEngine == undefined) {
        templateEngine = removeInnerTemplate;
        removeInnerTemplate = false;
    }
    else {
        removeInnerTemplate = !!removeInnerTemplate;
    }
    // Use default template engine if none provided
    if (!templateEngine) {
        templateEngine = compomint.templateEngine;
    }
    const container = safeTemplate(source);
    const content = container.content || container; // Use content if available
    const tmplNodes = content.querySelectorAll('template[id], script[type="text/template"][id], script[type="text/compomint"][id]');
    tmplNodes.forEach((node) => {
        const tmplId = node.id;
        if (!tmplId)
            return;
        if (node.dataset.coLoadScript !== undefined) {
            addTmpl(tmplId, node, templateEngine)({}); // Execute immediately if data-co-load-script
        }
        else {
            addTmpl(tmplId, node, templateEngine);
        }
        if (removeInnerTemplate && node.parentNode) {
            node.parentNode.removeChild(node);
        }
    });
    return container;
});
(compomint.addTmplByUrl =
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
        const mergedOptions = Object.assign({}, defaultOptions, option); // Ensure option is object
        const importDataParser = (obj) => {
            if (typeof obj === "string") {
                return { url: obj, option: mergedOptions };
            }
            else if (obj && typeof obj === "object" && obj.url) {
                return {
                    url: obj.url,
                    option: Object.assign({}, mergedOptions, obj.option),
                };
            }
            else {
                console.error("Invalid import data format in addTmplByUrl:", obj);
                return null;
            }
        };
        const appendElements = (elements) => {
            elements.forEach((element) => {
                var _a;
                if (!element)
                    return;
                if (element.id) {
                    const oldElement = document.getElementById(element.id);
                    if (oldElement)
                        (_a = oldElement.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(oldElement);
                }
                if (element.tagName === "SCRIPT" ||
                    element.tagName === "LINK" ||
                    element.tagName === "STYLE") {
                    document.head.appendChild(element);
                }
                else {
                    document.body.appendChild(element);
                }
            });
        };
        const importFunc = (source, currentOption) => {
            const templateContainer = safeTemplate(source);
            addTmpls(templateContainer, false, currentOption.templateEngine);
            const content = templateContainer.content || templateContainer;
            if (currentOption.loadLink) {
                const links = content.querySelectorAll('link[rel="stylesheet"]');
                appendElements(links);
            }
            if (currentOption.loadStyle) {
                const styles = content.querySelectorAll("style[id]");
                appendElements(styles);
            }
            if (currentOption.loadScript) {
                const scripts = content.querySelectorAll('script:not([type]), script[type="text/javascript"], script[type="module"]');
                const executableScripts = Array.from(scripts)
                    .filter((node) => {
                    let parent = node.parentNode;
                    while (parent) {
                        if (parent.nodeName === "TEMPLATE" ||
                            (parent.nodeName === "SCRIPT" &&
                                parent.type.includes("template")))
                            return false;
                        parent = parent.parentNode;
                    }
                    return true;
                })
                    .map((node) => {
                    const scriptElm = document.createElement("script");
                    node
                        .getAttributeNames()
                        .forEach((name) => scriptElm.setAttribute(name, node.getAttribute(name)));
                    if (node.innerHTML)
                        scriptElm.textContent = node.innerHTML;
                    return scriptElm;
                });
                appendElements(executableScripts);
            }
        };
        const loadResource = (dataItem) => {
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
                    });
                    script.addEventListener("load", () => resolve());
                    script.addEventListener("error", () => {
                        console.error(`Failed to load script: ${src}`);
                        reject(new Error(`Failed to load script: ${src}`));
                    });
                    document.head.appendChild(script);
                }
                else if (src.endsWith(".css")) {
                    const link = genElement("link", {
                        type: "text/css",
                        rel: "stylesheet",
                        href: src,
                    });
                    link.addEventListener("load", () => resolve());
                    link.addEventListener("error", () => {
                        console.error(`Failed to load stylesheet: ${src}`);
                        reject(new Error(`Failed to load stylesheet: ${src}`));
                    });
                    document.head.appendChild(link);
                }
                else {
                    requestFunc(src, null, (source, status) => {
                        if (status === 200 || status === 0) {
                            try {
                                importFunc(source, currentOption); // Use non-null assertion for source
                                resolve(); // Resolve after successful processing
                            }
                            catch (e) {
                                console.error(`Error processing imported HTML from ${src}:`, e);
                                reject(new Error(`Error processing imported HTML from ${src}: ${e}`));
                            }
                        }
                        else {
                            console.error(`Failed to fetch template file: ${src} (Status: ${status})`);
                            reject(new Error(`Failed to fetch template file: ${src} (Status: ${status})`));
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
            }
            else {
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
        }
        else {
            return operationPromise;
        }
    });
const requestFunc = function (url, option, callback) {
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {
            if (xmlhttp.status == 200 || xmlhttp.status === 0) {
                callback(xmlhttp.responseText, xmlhttp.status, xmlhttp);
            }
            else {
                if (xmlhttp.status == 404)
                    console.error(`Error 404: Not Found - ${url}`);
                else if (xmlhttp.status >= 400)
                    console.error(`HTTP Error ${xmlhttp.status} for ${url}`);
                else
                    console.error(`Request failed for ${url}`, xmlhttp.statusText);
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
            if (option.timeout)
                xmlhttp.timeout = option.timeout;
            const headers = option.headers;
            if (headers) {
                Object.keys(headers).forEach((key) => {
                    xmlhttp.setRequestHeader(key, headers[key]);
                });
            }
            xmlhttp.send(option.body || null);
        }
        else {
            xmlhttp.send();
        }
    }
    catch (e) {
        console.error(`Error sending request to ${url}:`, e);
        callback(null, 0, xmlhttp);
    }
};
compomint.i18n = {};
compomint.addI18n = function (fullKey, i18nObj) {
    if (!fullKey ||
        typeof fullKey !== "string" ||
        !i18nObj ||
        typeof i18nObj !== "object") {
        console.error("Invalid arguments for addI18n:", fullKey, i18nObj);
        return;
    }
    const langKeyNames = fullKey.split(".");
    let target = compomint.i18n;
    const keyLength = langKeyNames.length - 1;
    langKeyNames.forEach(function (key, i) {
        if (!key)
            return;
        if (keyLength === i) {
            // Check if any language value is an array
            const hasArrayValues = Object.keys(i18nObj).some((lang) => Array.isArray(i18nObj[lang]));
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
                    array.forEach((item, index) => {
                        if (!target[key][index]) {
                            target[key][index] = {};
                        }
                        if (item instanceof Object && !Array.isArray(item)) {
                            Object.keys(item).forEach((subKey) => {
                                compomint.addI18n(fullKey + "." + index + "." + subKey, item[subKey]);
                            });
                        }
                    });
                });
            }
            else {
                // Handle regular i18n function
                if (!target[key]) {
                    target[key] = function (defaultText) {
                        const lang = document.documentElement.lang || "en";
                        let label = i18nObj[lang];
                        if (label === undefined || label === null) {
                            label = defaultText;
                            if (configs.debug)
                                console.warn(`i18n: Label key ["${fullKey}"] for lang "${lang}" is missing. Using default: "${defaultText}"`);
                        }
                        return label !== undefined && label !== null ? String(label) : "";
                    };
                }
                // Handle nested objects within the language definitions
                Object.keys(i18nObj)
                    .filter((lang) => i18nObj[lang] instanceof Object && !Array.isArray(i18nObj[lang])) // Check for plain objects
                    .forEach((subKey) => {
                    compomint.addI18n(fullKey + "." + subKey, i18nObj[subKey]);
                    // delete i18nObj[subKey]; // Avoid deleting if it's also a language key
                });
            }
        }
        else {
            if (!target[key] || typeof target[key] === "function") {
                target[key] = {};
            }
            target = target[key];
        }
    });
};
compomint.addI18ns = function (i18nObjs) {
    // Cache for target path resolution to avoid repeated splits
    const targetCache = new Map();
    function getTargetPath(fullKey) {
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
    function isTranslationObject(value) {
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
    function processNested(obj, keyPath = "") {
        for (const key in obj) {
            const value = obj[key];
            const fullKey = keyPath ? keyPath + "." + key : key;
            if (Array.isArray(value)) {
                // Handle array at this level - optimized version
                const target = getTargetPath(fullKey);
                const finalKey = fullKey.split(".").pop();
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
            }
            else if (value && typeof value === "object") {
                if (isTranslationObject(value)) {
                    // This is a translation object, use addI18n
                    compomint.addI18n(fullKey, value);
                }
                else {
                    // This is a nested structure, continue processing
                    processNested(value, fullKey);
                }
            }
            else {
                // Primitive value, use addI18n
                compomint.addI18n(fullKey, value);
            }
        }
    }
    processNested(i18nObjs);
};
let elementCount = 0;
tools.genId = function (tmplId) {
    elementCount++;
    return tmplId + elementCount;
};
const applyElementProps = (tools.applyElementProps = function (element, attrs) {
    Object.keys(attrs).forEach(function (key) {
        const value = attrs[key];
        const propName = key === "class" ? "className" : key;
        try {
            if (key === "style" && typeof value === "object" && value !== null) {
                Object.assign(element.style, value); // Assign style object
            }
            else if (key === "dataset" &&
                typeof value === "object" &&
                value !== null) {
                Object.assign(element.dataset, value); // Assign dataset object
            }
            else if (key.startsWith("on") && typeof value === "function") {
                // Directly assign event handlers like onclick, onmouseover
                element[key.toLowerCase()] = value;
            }
            else if (propName in element) {
                element[propName] = value;
            }
            else {
                element.setAttribute(key, String(value));
            }
        }
        catch (e) {
            console.error(`Error setting attribute/property "${key}" on <${element.tagName}>:`, e);
        }
    });
    return element;
});
const genElement = (tools.genElement = function (tagName, attrs = {}, ...children) {
    const element = document.createElement(tagName);
    let actualAttrs = {};
    if (typeof attrs === "string") {
        children.unshift(attrs); // Prepend string as first child
    }
    else if (attrs instanceof Node) {
        children.unshift(attrs); // Prepend Node as first child
    }
    else if (Array.isArray(attrs)) {
        children = attrs.concat(children); // Concatenate arrays
    }
    else {
        actualAttrs = attrs; // It's an attributes object
    }
    // Set attributes/properties
    applyElementProps(element, actualAttrs);
    // Append children
    children.forEach((child) => {
        if (typeof child === "string") {
            element.appendChild(document.createTextNode(child));
        }
        else if (child instanceof Node) {
            element.appendChild(child);
        }
    });
    return element;
});
tools.props = function (...propsObjects) {
    if (!propsObjects || propsObjects.length === 0)
        return "";
    const mergedProps = Object.assign({}, ...propsObjects);
    const propStrArray = [];
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
    renderToString: (templateId_1, ...args_1) => __awaiter(void 0, [templateId_1, ...args_1], void 0, function* (templateId, data = {}, options = {}) {
        const renderer = createSSRRenderer(compomint, options);
        const result = yield renderer.renderToString(templateId, data, options);
        return result.html;
    }),
    renderPage: (templateId_1, ...args_1) => __awaiter(void 0, [templateId_1, ...args_1], void 0, function* (templateId, data = {}, pageOptions = {}) {
        const renderer = createSSRRenderer(compomint);
        return yield renderer.renderPage(templateId, data, pageOptions);
    }),
};
// Setup SSR environment if we're on the server
if (Environment.isServer()) {
    setupSSREnvironment();
}
compomint.hydrate = function () {
    if (Environment.isServer()) {
        console.warn("Hydration cannot be run on the server.");
        return;
    }
    const ssrData = window.__COMPOMINT_SSR__;
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
    componentIds.forEach((componentId) => {
        var _a;
        const element = document.querySelector(`[data-co-id="${componentId}"]`);
        if (!element) {
            if (configs.debug) {
                console.warn(`Element for component ID "${componentId}" not found for hydration.`);
            }
            return;
        }
        const tmplId = element.dataset.coTmplId || componentId.split("_")[0];
        const tmplFunc = compomint.tmpl(tmplId);
        if (tmplFunc) {
            const initialState = initialStates ? initialStates[componentId] : {};
            const data = initialState ? initialState.data : {};
            initialState ? initialState.status : {};
            const component = tmplFunc(Object.assign(Object.assign(Object.assign({}, initialState.data), data), { 
                //$existingElement: element,
                $baseComponent: { status: initialState.status, _id: componentId } }));
            const newElement = component.element;
            newElement.dataset.coId = componentId;
            newElement.dataset.coTmplId = tmplId;
            newElement.__compomint_scope__ = component;
            (_a = element.parentElement) === null || _a === void 0 ? void 0 : _a.replaceChild(newElement, element);
            if (configs.debug) {
                console.log(`Hydrated component "${componentId}" from template "${tmplId}".`);
            }
        }
        else {
            if (configs.debug) {
                console.warn(`Template function for "${tmplId}" not found during hydration.`);
            }
        }
    });
    // Clean up SSR data
    delete window.__COMPOMINT_SSR__;
};
// Add built-in template
applyBuiltInTemplates(addTmpl);

export { compomint, tmpl };
//# sourceMappingURL=compomint.esm.js.map
