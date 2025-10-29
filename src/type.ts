/**
 * @interface CompomintConfigs
 * @description Configuration options for Compomint.
 */
interface CompomintConfigs {
  printExecTime?: boolean;
  debug?: boolean;
  throwError?: boolean;
}

/**
 * @interface TemplateMeta
 * @description Metadata associated with a compiled template.
 */
interface TemplateMeta {
  renderingFunc: RenderingFunction;
  source?: string;
  templateText?: string;
  elements?: Set<any>;
}

/**
 * @interface LazyScope
 * @description Scope for lazy evaluation of template directives.
 */
interface LazyScope {
  [key: string]: any[];
  elementPropsArray: any[];
  namedElementArray: string[];
  elementRefArray: ((target: Element) => void)[];
  elementLoadArray: { loadFunc: Function; customData: any }[];
  eventArray: {
    eventFunc: Function | Record<string, Function>;
    $parent: any;
    customData: any;
    element: Element;
  }[][];
  elementArray: { childTarget: any; nonblocking: boolean | number }[];
  lazyEvaluateArray: ((data: Record<string, any>) => void)[];
}

/**
 * @interface TemplateRule
 * @description A rule for processing a specific template directive.
 */
interface TemplateRule {
  pattern: RegExp;
  exec: (...args: any[]) => string;
  lazyExec?: (
    data: Record<string, any>,
    lazyScope: LazyScope,
    component: ComponentScope,
    wrapper: DocumentFragment | Element
  ) => void;
  attacher?: (
    self: any,
    data: Record<string, any>,
    lazyScope: LazyScope,
    component: ComponentScope,
    wrapper: DocumentFragment | Element,
    elementTrigger: Element,
    eventFunc: Function | Record<string, Function>,
    eventData: Record<string, any>
  ) => void;
  trigger?: (target: Element, eventName: string) => void;
}

/**
 * @interface TemplateEngine
 * @description Defines the structure of a template engine.
 */
interface TemplateEngine {
  rules: Record<string, TemplateRule>;
  keys: {
    dataKeyName: string;
    statusKeyName: string;
    componentKeyName: string;
    i18nKeyName: string;
  };
}

/**
 * @interface ComponentScope
 * @description The scope of a rendered component instance.
 */
interface ComponentScope {
  tmplId: string;
  _id: string;
  element: HTMLElement | TemplateElement;
  wrapperElement?: Element;
  parentComponent?: ComponentScope;
  status: Record<string, any>;
  data: Record<string, any>;
  trigger?: Record<string, Record<string, () => void>>;
  [key: string]: any;

  replace(newComponent: ComponentScope | Element): void;
  remove(spacer?: boolean): Element | TemplateElement | Comment;
  appendTo(parentElement: Element): ComponentScope;
  release(): void;
  render(newData: Record<string, any>): ComponentScope;
  refresh(reflashData: Record<string, any>): ComponentScope;
  reflash(reflashData: Record<string, any>): ComponentScope; // Alias for refresh

  // Optional lifecycle hooks
  beforeRemove?(): void;
  afterRemove?(): void;
  beforeAppendTo?(): void;
  afterAppendTo?(): void;
  beforeRefresh?(): void;
  afterRefresh?(): void;
}

/**
 * @typedef {function} RenderingFunction
 * @description A function that renders a template.
 * @param {any} [data] - The data to render the template with.
 * @param {Element | ((component: ComponentScope) => void)} [wrapperElement] - The element to render the template into, or a callback function.
 * @param {(component: ComponentScope) => void} [callback] - A callback function to execute after rendering.
 * @param {Partial<ComponentScope>} [baseComponent] - A base component to extend.
 * @returns {ComponentScope} The scope of the rendered component.
 */
type RenderingFunction = (
  data?: any,
  wrapperElement?: Element | ((component: ComponentScope) => void),
  callback?: (component: ComponentScope) => void,
  baseComponent?: Partial<ComponentScope>
) => ComponentScope;

/**
 * @interface Tools
 * @description A collection of utility functions.
 */
interface Tools {
  escapeHtml: {
    escape: (str: string) => string;
    unescape: (str: string) => string;
  };
  genId: (tmplId: string) => string;
  genElement: (
    tagName: string,
    attrs?: Record<string, any> | string | Node | (string | Node)[],
    ...children: (string | Node)[]
  ) => Element;
  applyElementProps: (
    element: HTMLElement,
    attrs: Record<string, any>
  ) => Element;
  props: (...propsObjects: Record<string, any>[]) => string;
  liveReloadSupport?: (component: ComponentScope) => void;
}

/**
 * @interface CompomintGlobal
 * @description The global Compomint instance.
 */
interface CompomintGlobal {
  configs: CompomintConfigs;
  tmplCache: Map<string, TemplateMeta>;
  templateEngine: TemplateEngine;
  tools: Tools;
  i18n: Record<string, any>;
  template: (
    tmplId: string,
    templateText: string,
    tmplSettings?: Partial<TemplateEngine>
  ) => RenderingFunction;
  remapTmpl: (json: Record<string, string>) => void;
  tmpl: (tmplId: string) => RenderingFunction | null;
  addTmpl: (
    tmplId: string,
    element: Element | string,
    tmplSettings?: Partial<TemplateEngine>
  ) => RenderingFunction;
  addTmpls: (
    source: Element | string,
    removeInnerTemplate?: boolean | Partial<TemplateEngine>,
    tmplSettings?: Partial<TemplateEngine>
  ) => Element | TemplateElement;
  addTmplByUrl: (
    importData: string | any[] | { url: string; option?: Record<string, any> },
    option?: Record<string, any> | (() => void),
    callback?: Function | (() => void)
  ) => void | Promise<void>;
  addI18n: (fullKey: string, i18nObj: Record<string, any>) => void;
  addI18ns: (i18nObjs: Record<string, any>) => void;
}

/**
 * @interface TemplateElement
 * @description Represents a `<template>` element.
 */
interface TemplateElement extends HTMLTemplateElement {}

export {
  CompomintConfigs,
  TemplateMeta,
  LazyScope,
  TemplateRule,
  TemplateEngine,
  ComponentScope,
  RenderingFunction,
  Tools,
  CompomintGlobal,
  TemplateElement,
};
