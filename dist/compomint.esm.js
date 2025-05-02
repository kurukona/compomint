function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _arrayWithoutHoles(r) {
  if (Array.isArray(r)) return _arrayLikeToArray(r);
}
function _iterableToArray(r) {
  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _toConsumableArray(r) {
  return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}

/*
 * Copyright (c) 2025-present, Choi Sungho
 * Code released under the MIT license
 */

(function () {

  // Polyfill
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
  if (typeof Object.assign != "function") {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, "assign", {
      value: function assign(target) {
        // .length of function is 2
        // 'use strict';
        if (target == null) {
          // TypeError if undefined or null
          throw new TypeError("Cannot convert undefined or null to object");
        }
        var to = Object(target);
        for (var index = 0, length = arguments.length <= 1 ? 0 : arguments.length - 1; index < length; index++) {
          var nextSource = index + 1 < 1 || arguments.length <= index + 1 ? undefined : arguments[index + 1];
          if (nextSource != null) {
            // Skip over if undefined or null
            for (var nextKey in nextSource) {
              if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }
        return to;
      },
      writable: true,
      configurable: true
    });
  }

  // from:https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/remove()/remove().md

  (function (arr) {
    arr.forEach(function (item) {
      if (!item) return;
      if (item.hasOwnProperty("remove")) {
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
        }
      });
    });
  })([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

  // https://stackoverflow.com/questions/37588326/reliabilty-of-isconnected-field-in-dom-node
  (function (supported) {
    if (supported) return;
    Object.defineProperty(window.Node.prototype, "isConnected", {
      get: function get() {
        return document.body.contains(this);
      }
    });
  })("isConnected" in window.Node.prototype);
  var root = this;
  var Compomint = root.compomint = root.compomint || {};
  var tmplTool = Compomint.tmplTool = Compomint.tmplTool || {};
  var showTime = tmplTool.showTime || false;
  var debug = tmplTool.debug != undefined ? tmplTool.debug : false;
  tmplTool.requestCacheControl || true;
  var throwError = tmplTool.throwError != undefined ? tmplTool.throwError : true;
  var cachedTmpl = Compomint.tmplCache = Compomint.tmplCache || new Map();
  if (!cachedTmpl.has("anonymous")) {
    cachedTmpl.set("anonymous", {
      elements: new Set()
    });
  }
  var isSupportTemplateTag = "content" in document.createElement("template");
  root.tmpl = {};

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;
  var escapes = {
    "'": "\\'",
    "\\": "\\\\",
    "\r": "\\r",
    "\n": "\\n",
    "\t": "\\t",
    "\u2028": "\u2028",
    "\u2029": "\u2029",
    "><": "><",
    "<": "<",
    ">": ">"
    //'#': '#'
  };
  var escaper = /\>( |\n)+\<|\>( |\n)+|( |\n)+\<|\\|'|\r|\n|\t|\u2028|\u2029/g;
  var firstElementChild = function firstElementChild(ele) {
    if (ele.firstElementChild) return ele.firstElementChild;
    var children = ele.childNodes;
    for (var i = 0, size = children.length; i < size; i++) {
      if (children[i] instanceof Element) {
        return children[i];
      }
    }
    return null;
  };
  var childElementCount = function childElementCount(ele) {
    return ele.childElementCount || Array.prototype.filter.call(ele.childNodes, function (child) {
      return child instanceof Element;
    }).length;
  };
  var _cleanNode = function cleanNode(node) {
    for (var n = 0; n < node.childNodes.length; n++) {
      var child = node.childNodes[n];
      if (child.nodeType === 8 || child.nodeType === 3 && !/\S/.test(child.nodeValue)) {
        node.removeChild(child);
        n--;
      } else if (child.nodeType === 1) {
        _cleanNode(child);
      }
    }
  };
  Compomint.templateSettings = {
    firstElementChild: firstElementChild,
    childElementCount: childElementCount,
    style: {
      pattern: /(\<style id=[\s\S]+?\>[\s\S]+?\<\/style\>)/g,
      exec: function exec(style) {
        var dumy = document.createElement("template");
        dumy.innerHTML = style;
        var styleNode = (dumy.content || dumy).querySelector("style");
        var oldStyleNode = document.getElementById(styleNode.id);
        if (oldStyleNode) oldStyleNode.parentNode.removeChild(oldStyleNode);
        document.head.appendChild(styleNode);
        return "";
      }
    },
    commentArea: {
      pattern: /#\\#([\s\S]+?)#\\#/g,
      exec: function exec(commentArea) {
        return "'+\n'##".concat(commentArea, "##'+\n'");
      }
    },
    preEvaluate: {
      pattern: /##!([\s\S]+?)##/g,
      exec: function exec(preEvaluate, tmplId) {
        new Function("tmplId", preEvaluate)(tmplId);
        return "";
      }
    },
    interpolate: {
      //pattern: /(?:##=|\$\{)([\s\S]+?)(?:##|\})/g, // ##=##, ${}
      pattern: /##=([\s\S]+?)##/g,
      // ##=##, ${}
      exec: function exec(interpolate) {
        var interpolateSyntax = "typeof (interpolate)=='function' ? (interpolate)() : (interpolate)";
        return "';(() => {let interpolate=".concat(interpolate, ";\n__p+=((__t=(").concat(interpolateSyntax, "))==null?'':__t);})()\n__p+='");
      }
    },
    namedElement: {
      pattern: /data-co-named-element="##:([\s\S]+?)##"/g,
      exec: function exec(key) {
        var source = "';\nvar eventId = (__lazyScope.namedElementArray.length);\n__p+='data-co-named-element=\"'+eventId+'\"';\n\n__lazyScope.namedElementArray[eventId] = ".concat(key, ";\n__p+='");
        return source;
      },
      lazyExec: function lazyExec(data, lazyScope, tmplScope, wrapper) {
        lazyScope.namedElementArray.forEach(function (key, eventId) {
          var $elementTrigger = wrapper.querySelector('[data-co-named-element="' + eventId + '"]');
          if (!$elementTrigger) return;
          delete $elementTrigger.dataset.coNamedElement;
          tmplScope[key] = $elementTrigger;
        });
      }
    },
    elementRef: {
      pattern: /data-co-element-ref="##:([\s\S]+?)##"/g,
      exec: function exec(key) {
        var source = "';\nvar eventId = (__lazyScope.elementRefArray.length);\n__p+='data-co-element-ref=\"'+eventId+'\"';\nvar ".concat(key, " = null;\n__lazyScope.elementRefArray[eventId] = function(target) {").concat(key, " = target;};\n__p+='");
        return source;
      },
      lazyExec: function lazyExec(data, lazyScope, tmplScope, wrapper) {
        lazyScope.elementRefArray.forEach(function (func, eventId) {
          var $elementTrigger = wrapper.querySelector('[data-co-element-ref="' + eventId + '"]');
          if (!$elementTrigger) return;
          delete $elementTrigger.dataset.coVar;
          func.call($elementTrigger, $elementTrigger);
        });
      }
    },
    elementLoad: {
      pattern: /data-co-load="##:([\s\S]+?)##"/g,
      exec: function exec(elementLoad) {
        var elementLoadSplitArray = elementLoad.split("::");
        var source = "';\nlet eventId = (__lazyScope.elementLoadArray.length);\n__p+='data-co-load=\"'+eventId+'\"';\n__lazyScope.elementLoadArray[eventId] = {loadFunc: ".concat(elementLoadSplitArray[0], ", customData: ").concat(elementLoadSplitArray[1], "};\n__p+='");
        return source;
      },
      lazyExec: function lazyExec(data, lazyScope, tmplScope, wrapper) {
        lazyScope.elementLoadArray.forEach(function (elementLoad, eventId) {
          var $elementTrigger = wrapper.querySelector('[data-co-load="' + eventId + '"]');
          if (!$elementTrigger) return;
          delete $elementTrigger.dataset.coLoad;
          var parentElement = $elementTrigger.parentElement;
          elementLoad.loadFunc.call($elementTrigger, $elementTrigger, {
            "data": data,
            "element": $elementTrigger,
            "customData": elementLoad.customData,
            "parentElement": parentElement,
            "component": tmplScope
          });
        });
      }
    },
    event: {
      pattern: /data-co-event="##:([\s\S]+?)##"/g,
      exec: function exec(event) {
        var eventStrArray = event.split(":::");
        var source = "';\n(() => {let eventId = (__lazyScope.eventArray.length);\n__p+='data-co-event=\"'+eventId+'\"';\n";
        var eventArray = new Array();
        for (var i = 0, size = eventStrArray.length; i < size; i++) {
          var eventSplitArray = eventStrArray[i].split("::");
          eventArray.push("{eventFunc: ".concat(eventSplitArray[0], ", $parent: this, customData: ").concat(eventSplitArray[1], "}"));
        }
        source += "__lazyScope.eventArray[eventId] = [".concat(eventArray.join(","), "];})()\n__p+='");
        return source;
      },
      lazyExec: function lazyExec(data, lazyScope, tmplScope, wrapper) {
        var self = this;
        var attacher = self.event.attacher;
        lazyScope.eventArray.forEach(function (selectedArray, eventId) {
          var $elementTrigger = wrapper.querySelector("[data-co-event=\"".concat(eventId, "\"]"));
          if (!$elementTrigger) return;
          delete $elementTrigger.dataset.coEvent;
          var _loop = function _loop() {
            var selected = selectedArray[i];
            if (selectedArray[i].eventFunc) {
              if (selected.eventFunc instanceof Array) {
                selected.eventFunc.forEach(function (func) {
                  attacher(self, data, lazyScope, tmplScope, wrapper, $elementTrigger, func, selected);
                });
              } else {
                attacher(self, data, lazyScope, tmplScope, wrapper, $elementTrigger, selected.eventFunc, selected);
              }
            }
          };
          for (var i = 0, size = selectedArray.length; i < size; i++) {
            _loop();
          }
        });
      },
      trigger: function trigger(target, eventName) {
        var customEvent = new Event(eventName, {
          bubbles: true,
          cancelable: true
        });
        target.dispatchEvent(customEvent);
      },
      attacher: function attacher(self, data, lazyScope, tmplScope, wrapper, $elementTrigger, eventFunc, eventData) {
        var trigger = self.event.trigger;
        var $childTarget = self.firstElementChild(wrapper);
        var $targetElement = self.childElementCount(wrapper) == 1 ? $childTarget : null;
        if (!eventFunc) {
          return;
        }
        var eventFuncParams = [$elementTrigger, null, {
          "data": data,
          "customData": eventData.customData,
          "element": $elementTrigger,
          "componentElement": $targetElement || $childTarget.parentElement,
          "component": tmplScope
        }];
        if (eventFunc instanceof Function) {
          $elementTrigger.addEventListener("click", function (event) {
            event.stopPropagation();
            eventFuncParams[1] = event;
            eventFunc.call.apply(eventFunc, eventFuncParams);
          });
          return;
        }
        var triggerKey = eventFunc.triggerKey;
        if (triggerKey) {
          tmplScope.trigger = tmplScope.trigger || {};
          tmplScope.trigger[triggerKey] = {};
        }
        Object.keys(eventFunc).forEach(function (eventType) {
          if (eventType == "load") {
            var _eventFunc$eventType;
            eventFuncParams[1] = $elementTrigger;
            (_eventFunc$eventType = eventFunc[eventType]).call.apply(_eventFunc$eventType, eventFuncParams);
            return;
          } else if (eventType == "ref") {
            tmplScope[eventFunc[eventType]] = $elementTrigger;
            return;
          } else if (eventType == "triggerKey") {
            return;
          }
          $elementTrigger.addEventListener(eventType, function (event) {
            var _eventFunc$eventType2;
            event.stopPropagation();
            eventFuncParams[1] = event;
            (_eventFunc$eventType2 = eventFunc[eventType]).call.apply(_eventFunc$eventType2, eventFuncParams);
          });
          if (triggerKey) {
            tmplScope.trigger[triggerKey][eventType] = function () {
              trigger($elementTrigger, eventType);
            };
          }
        });
      }
    },
    element: {
      pattern: /##%([\s\S]+?)##/g,
      exec: function exec(target) {
        var elementSplitArray = target.split("::");
        var source = "';\n(() => {let elementId = (__lazyScope.elementArray.length);\n__p+='<template data-co-tmpl-element-id=\"'+elementId+'\"></template>';\n__lazyScope.elementArray[elementId] = {target: ".concat(elementSplitArray[0], ", nonblocking: ").concat(elementSplitArray[1] || false, "};})()\n__p+='");
        return source;
      },
      lazyExec: function lazyExec(data, lazyScope, tmplScope, wrapper) {
        var self = this;
        lazyScope.elementArray.forEach(function (ele, elementId) {
          var childTarget = ele.target;
          var nonblocking = ele.nonblocking;
          var $tmplElement = wrapper.querySelector("template[data-co-tmpl-element-id=\"".concat(elementId, "\"]"));
          if (childTarget instanceof Array) {
            var docFragment = document.createDocumentFragment();
            childTarget.forEach(function (child) {
              if (!child) return;
              var childElement = child.element || child;
              if (typeof childElement === "string") {
                docFragment.appendChild(self.element.stringToElement(childElement));
              } else if (typeof childElement === "number") {
                docFragment.appendChild(self.element.stringToElement(childElement));
              } else if (typeof childElement === "function") {
                docFragment.appendChild(self.element.stringToElement(childElement()));
              } else {
                docFragment.appendChild(childElement);
              }
              if (child.beforeAppendTo) {
                child.parent = child.parentNode;
                child.parentScope = tmplScope;
                if (child.beforeAppendTo) child.beforeAppendTo();
              }
            });
            $tmplElement.parentNode.replaceChild(docFragment, $tmplElement);
            childTarget.forEach(function (child) {
              if (child && child.afterAppendTo) setTimeout(function () {
                child.afterAppendTo();
              });
            });
          } else if (typeof childTarget === "string") {
            $tmplElement.parentNode.replaceChild(self.element.stringToElement(childTarget), $tmplElement);
          } else if (typeof childTarget === "number") {
            $tmplElement.parentNode.replaceChild(self.element.stringToElement(childTarget), $tmplElement);
          } else if (typeof childTarget === "function") {
            $tmplElement.parentNode.replaceChild(self.element.stringToElement(childTarget()), $tmplElement);
          } else if ((childTarget && (childTarget.element || childTarget)) instanceof Element) {
            var doFunc = function doFunc() {
              var childElement = childTarget.element || childTarget;
              var parentNode = $tmplElement.parentNode;
              var node1 = null;
              if (childElement instanceof DocumentFragment) {
                node1 = childElement.firstChild;
              }
              if (childTarget.beforeAppendTo) childTarget.beforeAppendTo();
              parentNode.replaceChild(childElement, $tmplElement);
              if (childTarget.afterAppendTo) setTimeout(function () {
                childTarget.afterAppendTo();
              });
              if (childTarget.tmplId) {
                if (node1) {
                  childTarget["this"] = node1.parentNode;
                }
                childTarget.parentScope = tmplScope;
              }
            };
            nonblocking == undefined || nonblocking === false ? doFunc() : setTimeout(doFunc, nonblocking);
          } else {
            $tmplElement.parentNode.removeChild($tmplElement);
          }
        });
      },
      stringToElement: function stringToElement(str) {
        if (!isNaN(str)) {
          return document.createTextNode(str);
        } else if (str && str.startsWith("<>")) {
          var temp = document.createElement("template");
          temp.innerHTML = str.replace("<>", "");
          return temp.content;
        } else {
          return document.createTextNode(str);
        }
      }
    },
    lazyEvaluate: {
      pattern: /###([\s\S]+?)##/g,
      exec: function exec(lazyEvaluate) {
        var source = "';\n__lazyScope.lazyEvaluateArray.push(function(data) {".concat(lazyEvaluate, "});\n__p+='");
        return source;
      },
      lazyExec: function lazyExec(data, lazyScope, tmplScope, wrapper) {
        var $childTarget = this.firstElementChild(wrapper);
        var $targetElement = this.childElementCount(wrapper) == 1 ? $childTarget : null;
        lazyScope.lazyEvaluateArray.forEach(function (selectedFunc, idx) {
          selectedFunc.call($targetElement || $childTarget.parentElement, data);
        });
        return;
      }
    },
    escape: {
      pattern: /##-([\s\S]+?)##/g,
      exec: function exec(escape) {
        return "'+\n((__t=(".concat(escape, "))==null?'':compomint.tmplTool.escapeHtml.escape(__t))+\n'");
      }
    },
    evaluate: {
      pattern: /##([\s\S]+?)##/g,
      exec: function exec(evaluate) {
        return "';\n" + evaluate + "\n__p+='";
      }
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
    i18nKeyName: "i18n"
  };
  var escapeHtml = function () {
    var escapeMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "`": "&#x60;",
      "\n": "&#10;"
    };
    var unescapeMap = function () {
      var unescapeMap = {};
      Object.keys(escapeMap).forEach(function (ele) {
        unescapeMap[escapeMap[ele]] = ele;
      });
      return unescapeMap;
    }();

    // from underscore.js
    var createEscaper = function createEscaper(map) {
      var escaper = function escaper(match) {
        return map[match];
      };
      var source = "(?:".concat(Object.keys(map).join("|"), ")");
      var testRegexp = RegExp(source);
      var replaceRegexp = RegExp(source, "g");
      return function (string) {
        string = string == null ? "" : "".concat(string);
        return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
      };
    };
    return {
      escape: createEscaper(escapeMap),
      unescape: createEscaper(unescapeMap)
    };
  }();
  tmplTool.escapeHtml = escapeHtml;
  var matcherFunc = function matcherFunc(settings) {
    var patternArray = new Array();
    var execArray = new Array();
    var lazyExecArray = {};
    var lazyScope = {};
    var setting = null;
    Object.keys(settings).forEach(function (key) {
      setting = settings[key];
      if (setting.pattern) {
        patternArray.push((setting.pattern || noMatch).source);
        execArray.push(setting.exec);
      }
      if (setting.lazyExec) {
        lazyExecArray["".concat(key, "Array")] = setting.lazyExec;
        lazyScope["".concat(key, "Array")] = new Array();
      }
    });
    return {
      settings: settings,
      pattern: new RegExp(patternArray.join("|"), "g"),
      exec: execArray,
      lazyExecKeys: Object.keys(lazyScope),
      lazyExec: lazyExecArray,
      lazyScopeSeed: JSON.stringify(lazyScope)
    };
  };
  var escapeFunc = function escapeFunc(match) {
    return escapes[match] || escapes[match.replace(/[ \n]/g, "")] || "";
  };
  var defaultMatcher = matcherFunc(Compomint.templateSettings);
  var templateParser = function templateParser(tmplId, text, matcher) {
    if (showTime) console.time("tmpl: ".concat(tmplId));
    var index = 0;
    var source = "";
    text.replace(matcher.pattern, function () {
      for (var _len = arguments.length, params = new Array(_len), _key = 0; _key < _len; _key++) {
        params[_key] = arguments[_key];
      }
      //let match = arguments[0];
      //let offset = arguments[arguments.length-2];
      var match = params[0];
      var offset = params[params.length - 2];
      source += text.slice(index, offset).replace(escaper, escapeFunc);
      var selected,
        i = null;
      //Array.prototype.slice.call(arguments, 1, -2).some(function(value, idx, arr) {
      params.slice(1, -2).some(function (value, idx, arr) {
        if (!!value) {
          selected = value;
          i = idx;
          return true;
        }
        return false;
      });
      if (!selected) return match;
      source += matcher.exec[i].call(matcher.settings, selected, tmplId);
      index = offset + match.length;
      return match;
    });
    if (showTime) console.timeEnd("tmpl: ".concat(tmplId));
    return source + text.slice(index).replace(escaper, escapeFunc);
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  var templateBuilder = Compomint.template = function compomint_templateBuilder(tmplId, templateText, tmplSettings) {
    var settings = Compomint.templateSettings;
    var matcher = defaultMatcher;
    if (tmplSettings) {
      settings = Object.assign({}, Compomint.templateSettings, tmplSettings);
      matcher = matcherFunc(settings);
    }
    var source = "/* tmplId: ".concat(tmplId, " */\n//# sourceURL=http://tmpl//").concat(tmplId.split("-").join("//"), ".js\nlet __t,__p='';\n__p+='").concat(templateParser(tmplId, templateText, matcher), "';\nreturn __p;");
    try {
      renderFunc = new Function(settings.dataKeyName, settings.statusKeyName, settings.componentKeyName, settings.i18nKeyName, "__lazyScope", source);
    } catch (e) {
      var debugErrorLine = function debugErrorLine(source, e) {
        console.log(tmplId, e.lineNumber, e.columnNumber);
        new Function(settings.dataKeyName, settings.statusKeyName, settings.componentKeyName, settings.i18nKeyName, "__lazyScope", source);
      };
      if (throwError) {
        debugErrorLine(source, e);
        throw e;
      } else {
        return;
      }
    }
    var tmpl = function compomint_tmpl(data, wrapperElement, callback, tmplScope) {
      if (wrapperElement instanceof Function) {
        callback = wrapperElement;
        wrapperElement = undefined;
      }
      var dataKeyName = settings.dataKeyName;
      var statusKeyName = settings.statusKeyName;
      var lazyScope = JSON.parse(matcher.lazyScopeSeed);
      tmplScope = Object.assign(tmplScope || {}, {
        tmplId: tmplId,
        //_id: tmplTool.genId(tmplId),
        //[statusKeyName]: {},
        replace: function replace(scope) {
          tmplScope.element.parentElement.replaceChild(scope.element || scope, tmplScope.element);
        },
        remove: function remove(spacer) {
          if (tmplScope.beforeRemove) tmplScope.beforeRemove();
          if (tmplScope.element.parentElement) {
            if (spacer) {
              var dumy = document.createElement("template");
              tmplScope.element.parentElement.replaceChild(dumy, tmplScope.element);
              tmplScope.element = dumy;
            } else {
              tmplScope.element.parentElement.removeChild(tmplScope.element);
            }
          }
          if (tmplScope.afterRemove) tmplScope.afterRemove();
          return tmplScope.element;
        },
        appendTo: function appendTo(parentElement) {
          if (tmplScope.beforeAppendTo) tmplScope.beforeAppendTo();
          if (parentElement) parentElement.appendChild(tmplScope.element);
          if (tmplScope.afterAppendTo) tmplScope.afterAppendTo();
          return tmplScope;
        }
      });
      if (!tmplScope._id) {
        tmplScope._id = tmplTool.genId(tmplId);
      }
      tmplScope[dataKeyName] = data;
      if (tmplScope[statusKeyName] == undefined) tmplScope[statusKeyName] = {};
      var hasParent = wrapperElement ? true : false;
      var temp = document.createElement("template");
      var returnTarget = null;
      if (showTime) console.time("render: ".concat(tmplId));
      var html = null;
      try {
        html = !data ? "<template></template>" : renderFunc.call(wrapperElement, data, tmplScope[statusKeyName], tmplScope, Compomint.i18n[tmplId], lazyScope);
      } catch (e) {
        var _debugErrorLine = function _debugErrorLine(source) {
          console.log("Error: ".concat(tmplId));
          renderFunc.call(wrapperElement, data, tmplScope[statusKeyName], tmplScope, Compomint.i18n[tmplId], lazyScope);
        };
        if (throwError) {
          _debugErrorLine(source, e);
          throw e;
        } else {
          return;
        }
      }
      if (showTime) console.timeEnd("render: ".concat(tmplId));
      temp.innerHTML = html;
      var docFragment = temp.content || temp;
      if (docFragment.tagName == "TEMPLATE") {
        // for IE11
        var children = docFragment.children;
        docFragment = document.createDocumentFragment();
        Array.prototype.forEach.call(children, function (child) {
          docFragment.appendChild(child);
        });
      }
      var lazyExec = matcher.lazyExec;
      if (data) matcher.lazyExecKeys.forEach(function (key) {
        if (lazyScope[key].length == 0) return;
        lazyExec[key].call(settings, data, lazyScope, tmplScope, docFragment);
      });
      if (hasParent) {
        while (wrapperElement.firstElementChild) {
          wrapperElement.removeChild(wrapperElement.firstElementChild);
        }
        tmplScope.wrapperElement = wrapperElement;
      }
      if (docFragment.firstChild && docFragment.firstChild.nodeType == 8) {
        returnTarget = docFragment.firstChild;
      } else if (childElementCount(docFragment) == 1) {
        returnTarget = firstElementChild(docFragment);
        if (hasParent) {
          if (tmplScope.beforeAppendTo) tmplScope.beforeAppendTo();
          wrapperElement.appendChild(returnTarget);
          if (tmplScope.afterAppendTo) tmplScope.afterAppendTo();
        }
      } else {
        if (hasParent) {
          if (tmplScope.beforeAppendTo) tmplScope.beforeAppendTo();
          wrapperElement.appendChild(docFragment);
          if (tmplScope.afterAppendTo) tmplScope.afterAppendTo();
          returnTarget = wrapperElement;
        } else {
          returnTarget = docFragment;
        }
      }
      if (data && data.$props) {
        for (var prop in data.$props) {
          returnTarget[prop] = data.$props[prop];
        }
      }
      returnTarget.normalize();
      _cleanNode(returnTarget);
      tmplScope.element = returnTarget;
      if (tmplTool.liveReloadSupport) tmplTool.liveReloadSupport(tmplScope);

      // style to shadow
      var style = returnTarget.querySelector ? returnTarget.querySelector("style[scoped], style[shadow]") : null;
      if (style && returnTarget.createShadowRoot) {
        var shadow = returnTarget.createShadowRoot();
        document.head.appendChild(style);
        var styles = "";
        var sheet = style.sheet;
        for (var i = 0, size = sheet.cssRules.length; i < size; i++) {
          styles += "::content ".concat(sheet.cssRules[i].cssText.replace("::content", ""));
        }
        style.innerHTML = styles;
        shadow.appendChild(style);
        var content = document.createElement("content");
        content.setAttribute("select", "*");
        shadow.appendChild(content);
      }
      if (callback) {
        callback.call(wrapperElement, tmplScope);
      }
      tmplScope.release = function () {
        var props = Object.getOwnPropertyNames(tmplScope);
        props.splice(props.indexOf(statusKeyName), 1);
        for (var _i = 0; _i < props.length; _i++) {
          delete tmplScope[props[_i]];
        }
      };
      tmplScope.render = function (fdata) {
        var tmplScope = this.tmplScope || this;
        var target = tmplScope.element;
        var tmpl = compomint.tmpl(tmplScope.tmplId);
        var beforeRemove = tmplScope.beforeRemove;
        var afterRemove = tmplScope.afterRemove;
        tmplScope.element = void 0;
        tmplScope.data = void 0;
        tmplScope.render = void 0;
        tmplScope.beforeRemove = void 0;
        tmplScope.afterRemove = void 0;
        if (tmplScope.wrapperElement) {
          var _wrapperElement = tmplScope.wrapperElement;
          if (beforeRemove) beforeRemove();
          tmplScope.release();
          tmplScope = tmpl(fdata, _wrapperElement, null, tmplScope);
          if (afterRemove) afterRemove();
          return tmplScope;
        } else {
          tmplScope.release();
          tmplScope = tmpl(fdata, null, null, tmplScope);
          if (target.parentElement) {
            var newElement = tmplScope.element;
            if (beforeRemove) beforeRemove();
            if (tmplScope.beforeAppendTo) tmplScope.beforeAppendTo();
            target.parentElement.replaceChild(newElement, target);
            while (target.firstChild) {
              target.removeChild(target.firstChild);
            }
            target = void 0;
            if (tmplScope.afterAppendTo) tmplScope.afterAppendTo();
            if (afterRemove) afterRemove();
          }
          return tmplScope;
        }
      };
      tmplScope.refresh = function (fdata) {
        var tmplScope = this.tmplScope || this;
        tmplScope.element;
        var data = tmplScope.data;
        if (tmplScope.beforeRefresh) tmplScope.beforeRefresh();
        var scope = tmplScope.render(Object.assign(data || {}, fdata));
        if (tmplScope.afterRefresh) tmplScope.afterRefresh();
        return scope;
      };
      tmplScope.reflash = tmplScope.refresh;
      return tmplScope;
    };
    Object.defineProperty(tmpl, "name", {
      value: tmplId,
      writable: false
    });
    //tmpl.source = 'function ' + tmplId + '_source (' + (settings.variable || 'data') + '){\n' + source + '}';
    var tmpl_source = "function ".concat(tmplId, "_source (").concat(settings.variable || "data", "){\n").concat(source, "}");
    if (tmplId) {
      var tmplMeta = {
        tmpl: tmpl,
        source: escapeHtml.escape(tmpl_source),
        templateText: escapeHtml.escape(templateText)
      };
      cachedTmpl.set(tmplId, tmplMeta);
      var tmplIdNames = tmplId.split("-");
      if (tmplIdNames.length > 1) {
        var group = tmplIdNames[0];
        var groupObj = root.tmpl[group];
        if (!groupObj) {
          root.tmpl[group] = groupObj = {};
        }
        var tmplIdSub = tmplIdNames.slice(1).join("").replace(/-([a-z])/g, function (g) {
          return g[1].toUpperCase();
        });
        groupObj[tmplIdSub] = tmplMeta.tmpl;
      }
    }
    return tmpl;
  };
  Compomint.remapTmpl = function (json) {
    Object.keys(json).forEach(function (key) {
      cachedTmpl.set(json[key], cachedTmpl.get(key));
    });
  };
  Compomint.tmpl = function (tmplId) {
    var tmplFunc = cachedTmpl.get(tmplId);
    return tmplFunc ? tmplFunc.tmpl : null;
  };
  var safeTemplate = function safeTemplate(source) {
    var template;
    if (source.querySelectorAll) {
      return source;
    } else if (isSupportTemplateTag) {
      template = document.createElement("template");
      //template.innerHTML = source.replace(/(?<=<template[^]*?)<(?=[^]*?<\/template>)/g, '&lt;');
      template.innerHTML = source.replace(/<(?!template|\/template|body|\/body|html|\/html|head|\/head|script|\/script|link|\/link|meta|\/meta|!--)/gi, "&lt;");
      /*
      template.innerHTML = source.replace(/<template([\s\S]*?)<\/template>/gi, (match, p1)=>{
        return `<template${p1.replace(/</g, '&lt;')}</template>`;
      });
      */
    } else {
      template = document.createElement("template");
      template.innerHTML = source.replace(/<(?!template|\/template|body|\/body|html|\/html|head|\/head|script|\/script|link|\/link|meta|\/meta|!--)/gi, "&lt;").replace(/<template/g, '<script type="template"').replace(/<\/template>/g, "</script>");
    }
    return template;
  };
  var addTmpl = tmplTool.addTmpl = function (tmplId, element, tmplSettings) {
    var templateText = element instanceof Element ? element.innerHTML : element;
    templateText = escapeHtml.unescape(templateText.replace(/<!---|--->/gi, ""));
    return templateBuilder(tmplId, templateText, tmplSettings);
  };
  var addTmpls = tmplTool.addTmpls = function (source, removeInnerTemplate, tmplSettings) {
    if (typeof removeInnerTemplate !== "boolean" && tmplSettings == undefined) tmplSettings = removeInnerTemplate;
    var template = safeTemplate(source);
    var tmplNodes = (template.content || template).querySelectorAll('template,script[type="template"]');
    var node = null;
    for (var i = 0, size = tmplNodes.length; i < size; i++) {
      node = tmplNodes.item(i);
      node.dataset.coLoadScript ? addTmpl(node.id, node, tmplSettings)({}) : addTmpl(node.id, node, tmplSettings);
      if (removeInnerTemplate) node.parentNode.removeChild(node);
    }
    return template;
  };
  tmplTool.addTmplByUrl = function compomint_addTmplByUrl(importData, option, callback) {
    if (!callback && typeof option === "function") {
      callback = option;
      option = {};
    }
    option = Object.assign({
      loadScript: true,
      loadStyle: true,
      loadLink: true
    }, option);
    var importDataParser = function importDataParser(obj) {
      if (typeof obj === "string") {
        return {
          url: obj,
          option: option
        };
      } else {
        obj.option = Object.assign({}, option, obj.option);
        return obj;
      }
    };
    var appendToHead = function appendToHead(elements) {
      if (elements && elements.length > 0) {
        Array.prototype.forEach.call(elements, function (element) {
          if (element.id) {
            var oldElement = document.getElementById(element.id);
            if (oldElement) oldElement.parentNode.removeChild(oldElement);
          }
          document.body.appendChild(element);
        });
      }
    };
    var importFunc = function importFunc(source, option) {
      var template = safeTemplate(source);
      addTmpls(template, option.tmplSettings);
      var content = template.content || template;
      if (option.loadLink) {
        var links = content.querySelectorAll("link");
        appendToHead(links);
      }
      if (option.loadStyle) {
        var styles = content.querySelectorAll("style[id]");
        appendToHead(styles);
      }
      if (option.loadScript) {
        var scripts = content.querySelectorAll('script[id]:not([type="template"])');
        scripts = Array.prototype.filter.call(scripts, function (node) {
          return node.innerHTML;
        }).map(function (node) {
          var scriptText = node.innerHTML;
          var scriptElm = document.createElement("script");
          var inlineCode = document.createTextNode(scriptText);
          scriptElm.appendChild(inlineCode);
          return scriptElm;
        });
        appendToHead(scripts);
      }
    };
    if (Array.isArray(importData)) {
      var arraySize = importData.length;
      importData.forEach(function (data) {
        data = importDataParser(data);
        var src = data.url;
        if (src.indexOf(".js") > -1) {
          var script = tag("script", {
            async: true,
            src: src
          });
          script.addEventListener("load", function (event) {
            arraySize--;
            if (arraySize == 0 && callback) callback();
          });
          document.head.appendChild(script);
          if (arraySize == 0 && callback) callback();
        } else if (src.indexOf(".css") > -1) {
          var link = tag("link", {
            type: "text/css",
            rel: "stylesheet",
            href: src
          });
          document.head.appendChild(link);
          arraySize--;
          if (arraySize == 0 && callback) callback();
        } else {
          requestFunc(data.url, null, function (source) {
            importFunc(source, data.option);
            arraySize--;
            if (arraySize == 0 && callback) callback();
          });
        }
      });
    } else {
      importData = importDataParser(importData);
      requestFunc(importData, null, function (source) {
        importFunc(source, importData.option);
        if (callback) callback();
      });
    }
  };
  var requestFunc = function requestFunc(url, option, callback) {
    var xmlhttp = new XMLHttpRequest();
    /*
    let stroage = localStorage || sessionStorage;
    if (requestCacheControl && stroage) {
      let cacheStatus = JSON.stringify(stroage['compomint.requestCacheStatus'] || '{}');
      let urlCacheStatus = cacheStatus[url];
      if (urlCacheStatus) {
        let lastModified = urlCacheStatus['Last-Modified'];
        let eTag = urlCacheStatus['ETag'];
       }
    }
    */
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == XMLHttpRequest.DONE) {
        if (xmlhttp.status == 200 || xmlhttp.status === 0) {
          callback(xmlhttp.responseText, xmlhttp.status, xmlhttp);
        } else if (xmlhttp.status == 400) {
          alert("There was an error 400");
        } else {
          console.log("!200", xmlhttp.status, url, option);
        }
      }
    };
    if (option) {
      xmlhttp.open(option.method || "GET", url, true);
      if (option.timeout) xmlhttp.timeout = option.timeout;
      if (option.headers) Object.keys(option.headers).forEach(function (key) {
        xmlhttp.setRequestHeader(key, option.headers[key]);
      });
      xmlhttp.send(option.body);
    } else {
      xmlhttp.open("GET", url, true);
      xmlhttp.send();
    }
  };
  Compomint.i18n = {};
  tmplTool.i18n = function (i18nObj, defaultText) {
    var label = i18nObj[document.documentElement.lang] || defaultText;
    if (!label) {
      if (debug) console.log("Label not exist! (lang: ".concat(document.documentElement.lang, ")"));
    }
    return label;
  };
  tmplTool.addI18n = function (fullKey, i18nObj) {
    var langKeyNames = fullKey.split(".");
    var target = Compomint.i18n;
    var keyLength = langKeyNames.length - 1;
    langKeyNames.forEach(function (key, i) {
      if (keyLength === i) {
        if (!target[key]) {
          target[key] = function (defaultText) {
            var label = i18nObj[document.documentElement.lang] || defaultText;
            if (!label) {
              if (debug) console.log("Label key [" + fullKey + "] is empty!");
            }
            return label;
          };
        }
        Object.keys(i18nObj).filter(function (lang) {
          return i18nObj[lang] instanceof Object;
        }).forEach(function (subKey) {
          tmplTool.addI18n(fullKey + "." + subKey, i18nObj[subKey]);
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
  tmplTool.addI18ns = function (i18nObjs) {
    Object.keys(i18nObjs || {}).forEach(function (key) {
      tmplTool.addI18n(key, i18nObjs[key]);
    });
  };
  var elementCount = 0;
  tmplTool.genId = function (tmplId) {
    elementCount++;
    return tmplId + elementCount;
  };
  var tag = tmplTool.tag = function (tagName, attrs) {
    attrs = attrs || [];
    var element = document.createElement(tagName);
    Object.keys(attrs).forEach(function (key) {
      //element.setAttribute(key, attrs[key]);
      element[key] = attrs[key];
    });
    return element;
  };
  tmplTool.props = function () {
    for (var _len2 = arguments.length, props = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      props[_key2] = arguments[_key2];
    }
    if (!props) return;
    props = Object.assign.apply(Object, _toConsumableArray(props));
    var propStrArray = [];
    Object.keys(props).forEach(function (key) {
      if (props[key]) propStrArray.push(key + '="' + props[key] + '"');
    });
    return propStrArray.join(" ");
  };
  addTmpl("co-Tag", "##%compomint.tmplTool.tag(data[0], data[1])##");
  addTmpl("co-Div", "&lt;div ##=data.id ? 'id=\"' + (data.data === true ? tmplScope._id : data.id) + '\"' : ''## ##=data.class ? 'class=\"' + data.class + '\"' : '' ## ##=data.style ? 'style=\"' + data.style + '\"' : '' ## data-co-event=\"##:data.event##\"&gt;\n      ##if (typeof data.content === \"string\") {##\n      ##=data.content##\n      ##} else {##\n        ##%data.content##\n      ##}##");
  addTmpl("co-Input", "&lt;input name=\"##=data.name##\" type=\"##=data.type##\" value=\"##=data.value##\" ##=data.class ? 'class=\"' + data.class + '\"' : '' ## ##=data.style ? 'style=\"' + data.style + '\"' : '' ## data-co-event=\"##:data.event##\"/&gt;");
  addTmpl("co-Select", "&lt;select name=\"##=data.name##\" value=\"##=data.value##\" ##=data.class ? 'class=\"' + data.class + '\"' : '' ## ##=data.style ? 'style=\"' + data.style + '\"' : '' ## data-co-event=\"##:data.event##\"&gt;\n      &lt;option class=\"empty\" value=\"\"&gt;##=data.placeholder##&lt;/option&gt;\n      ##%data.options.map(function(option) { '&lt;option value=\"' + option.value + '\"' + (data.value == option.value ? 'selected=\"\"' : '') + '&gt;' + option.label + '&lt;/option&gt;'})##\n      &lt;select/&gt;");
  addTmpl("co-Template-Viewer", "<style id=\"style-ct-Base\">\n            .ct-Base h1 {\n              font-size: 24px;\n              font-weight: bold;\n            }\n            .ct-Base h2 {\n              font-size: large;\n              font-weight: bold;\n            }\n            .ct-Base .header {\n              padding: 20px;\n              padding-bottom: 0px;\n              margin-top: 10px;\n            }\n            .ct-Base .menu {\n              margin: 10px;\n              margin-top: 50px;\n              border: 1px solid #cccccc;\n            }\n            .ct-Base .menu li {\n              padding: 10px 14px;\n            }\n            .ct-Base .templateArea {\n              margin: 10px;\n              margin-top: 50px;\n              padding: 10px;\n              border: 1px solid #cccccc\n            }\n            .ct-Base .componentView {\n              margin: 10px;\n            }\n            .ct-Base button {\n              padding: 4px 10px;\n              margin: 4px;\n              border-radius: 0.5rem;\n              border: 1px solid #cccccc;\n            }\n            .ct-Base .hide {\n              display: none;\n            }\n            .ct-Base .templateText :not(pre)>code[class*=language-],\n            .ct-Base .templateText pre[class*=language-] {\n              background: #66990015;\n            }\n            .ct-Base .source :not(pre)>code[class*=language-],\n            .ct-Base .source  pre[class*=language-] {\n              background: #0077aa15;\n            }\n          </style>\n          ##\n          let components = data.components;\n          ##\n          <div class=\"ct-Base\">\n            <div class=\"header\">\n              <h1>##=data.label##</h1>\n              <span>##=data.description##</span>\n            </div>\n            <div style=\"display: flex; gap: 8px;\">\n              <ul class=\"menu\" style=\"\">\n                ##Object.keys(components).forEach(key => {##\n                  <li class=\"\"><a href=\"##='#'+key##\">##=key##</a></li>\n                ##})##\n              </ul>\n              <div class=\"content\">\n                ##Object.keys(components).forEach(key => {\n                  let componentScopes = components[key];\n                  let templateMeta = compomint.tmplCache.get(key);\n                ##\n                <div class=\"templateArea\" id=\"##=key##\" style=\"##=location.hash == '' || location.hash == ('#' + key) ? '' : 'display: none'##;\">\n                  <h2><a href=\"##='#'+key##\">##=key##</a></h2>\n                  ##if (templateMeta) {##\n                  <div style=\"display: flex; gap: 8px;\">\n                    <button data-co-event=\"##:() => templateText.classList.toggle('hide')##\">Template source</button>\n                    <button data-co-event=\"##:() => source.classList.toggle('hide')##\">Compiled source</button>\n                  </div>\n                  <hr>\n                  <div class=\"templateText hide\" data-co-element-ref=\"##:templateText##\">\n                    <h2>Template source</h2>\n                    <pre><code class=\"language-javascript\">##=templateMeta.templateText##</code></pre>\n                  </div>\n                  <hr>\n                  <div class=\"source hide\" data-co-element-ref=\"##:source##\">\n                    <h2>Compiled source</h2>\n                    <pre><code class=\"language-javascript\">##=templateMeta.source##</code></pre>\n                  </div>\n                  ##}##\n\n                  ##componentScopes.forEach(scope => {##\n                  <hr>\n                  <div class=\"componentView\">\n                    <pre><code class=\"language-javascript\">##%scope##</code></pre>\n                    ##%new Function('return '+scope+';')()##\n                  </div>\n                  <hr>\n                  ##})##\n                </div>\n                ##})##\n              </div>\n            </div>\n          </div>\n          ###\n          setTimeout(() => {\n            const anchor = document.getElementById(location.hash.replace('#', ''));\n            if (anchor) {\n              window.scrollTo({\n                top: anchor.getBoundingClientRect().top + window.scrollY,\n              })\n            }\n          });\n          window.onhashchange = () => location.reload();\n          ##");
  return {
    compomint: root.compomint,
    tmpl: root.tmpl
  };
}).call(window);
//# sourceMappingURL=compomint.esm.js.map
