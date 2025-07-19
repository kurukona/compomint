// Define interfaces for better type safety
interface CompomintConfigs {
  printExecTime?: boolean;
  debug?: boolean;
  throwError?: boolean;
}

interface TemplateMeta {
  renderingFunc: RenderingFunction;
  source?: string;
  templateText?: string;
  sourceGenFunc?: Function; // For SSR direct HTML generation
  elements?: Set<any>; // Assuming elements is a Set, adjust type as needed
}

interface LazyScope {
  [key: string]: any[]; // General structure for lazy scope arrays
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

interface TemplateEngine {
  rules: Record<string, TemplateRule>;
  keys: {
    dataKeyName: string;
    statusKeyName: string;
    componentKeyName: string;
    i18nKeyName: string;
  };
}

interface ComponentScope {
  tmplId: string;
  _id: string;
  element: HTMLElement | TemplateElement;
  wrapperElement?: Element;
  parentComponent?: ComponentScope;
  status: Record<string, any>;
  data: Record<string, any>;
  trigger?: Record<string, Record<string, () => void>>;
  [key: string]: any; // Allow arbitrary properties for named elements etc.

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

type RenderingFunction = (
  data?: any,
  wrapperElement?: Element | ((component: ComponentScope) => void),
  callback?: (component: ComponentScope) => void,
  baseComponent?: Partial<ComponentScope>
) => ComponentScope;

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

interface SSROptions {
  renderToString?: boolean;
  hydrateOnClient?: boolean;
  generateIds?: boolean;
  preserveWhitespace?: boolean;
  lang?: string;
}

interface SSRRenderResult {
  html: string;
  css: string;
  scripts: string[];
  metadata: {
    templateIds: string[];
    componentIds: string[];
    renderTime: number;
  };
}

interface SSRPageOptions {
  title?: string;
  meta?: Array<{ name?: string; property?: string; content: string }>;
  links?: Array<{ rel: string; href: string; [key: string]: string }>;
  scripts?: Array<{ src?: string; content?: string; [key: string]: any }>;
  bodyClass?: string;
  lang?: string;
}

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
<<<<<<< HEAD
  hydrate: () => void;
=======
>>>>>>> 1891c2d (feat: Add initial SSR support and documentation)
  ssr?: {
    isSupported(): boolean;
    setupEnvironment(): boolean;
    createRenderer(options?: SSROptions): any;
    renderToString(templateId: string, data?: any, options?: SSROptions): Promise<string>;
    renderPage(templateId: string, data?: any, pageOptions?: SSRPageOptions): Promise<string>;
  };
}

// Ensure TemplateElement is defined for environments like older JSDOM
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
  SSROptions,
  SSRRenderResult,
  SSRPageOptions,
};
