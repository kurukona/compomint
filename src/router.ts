/*
 * Copyright (c) 2025-present, Choi Sungho
 * Code released under the MIT license
 */

export interface RouterItem {
  page: string;
  params: Record<string, any>;
  pageComponent?: (params?: Record<string, any>) => any;
  url?: string | ((params?: any) => string);
  [key: string]: any;
}

export interface RouteMatchResult {
  path: string;
  routePattern: string;
  params: Record<string, string>;
  queryParams: Record<string, string>;
  handler?: (params: Record<string, string>, queryParams: Record<string, string>, extraData?: any) => any;
  meta?: Record<string, any>;
  rawRoute?: any;
}

export interface RouteDefinition {
  path?: string;
  url?: string | ((params?: any) => string);
  page?: string;
  render?: (match: RouteMatchResult) => any;
  handler?: (params: Record<string, string>, queryParams: Record<string, string>, extraData?: any) => any;
  meta?: Record<string, any>;
  [key: string]: any;
}

export interface RouterOptions {
  mode?: 'history' | 'hash';
  routes?: Record<string, RouteDefinition | any>;
  onRouteMatch?: (match: RouteMatchResult) => void;
  onNotFound?: (path: string) => void;
  beforeEach?: (to: string, from: string, next: (cancel?: boolean) => void) => void;
  afterEach?: (to: string, from: string) => void;
}

export namespace CompomintRouter {
  export type RouterItem = import('./router').RouterItem;
  export type MatchResult = import('./router').RouteMatchResult;
  export type Definition = import('./router').RouteDefinition;
  export type Options = import('./router').RouterOptions;
}

export class CompomintRouter {
  public static matchRoute = matchRoute;
  public static buildPageToRouterMap = buildPageToRouterMap;
  public static getUrlForStateFromMap = getUrlForStateFromMap;
  public static parseUrlFromPath = parseUrlFromPath;

  private mode: 'history' | 'hash';
  private routes: Record<string, RouteDefinition> = {};
  private currentPath: string = '';
  private onRouteMatch?: (match: RouteMatchResult) => void;
  private onNotFound?: (path: string) => void;
  private beforeEachHook?: (to: string, from: string, next: (cancel?: boolean) => void) => void;
  private afterEachHook?: (to: string, from: string) => void;
  private listenerBound = false;

  constructor(options: RouterOptions = {}) {
    this.mode = options.mode || 'history';
    this.onRouteMatch = options.onRouteMatch;
    this.onNotFound = options.onNotFound;
    this.beforeEachHook = options.beforeEach;
    this.afterEachHook = options.afterEach;

    if (options.routes) {
      this.registerRoutes(options.routes);
    }
  }

  public registerRoutes(routes: Record<string, RouteDefinition | any>): void {
    const flattenRoutes = (routeMap: Record<string, any>, prefix = '') => {
      for (const key of Object.keys(routeMap)) {
        const item = routeMap[key];
        if (!item || typeof item !== 'object') continue;

        let pattern = key.startsWith('/') ? key : (prefix ? `${prefix}/${key}` : `/${key}`);
        pattern = pattern.replace(/\/+/g, '/');
        if (pattern.length > 1 && pattern.endsWith('/')) {
          pattern = pattern.slice(0, -1);
        }

        if (item.render || item.handler || item.pageComponent || item.page) {
          this.routes[pattern] = { ...item, path: pattern };
        }

        // Recursively inspect nested route objects
        const childKeys = Object.keys(item).filter(
          k => k !== 'render' && k !== 'handler' && k !== 'meta' && k !== 'params' && typeof item[k] === 'object'
        );
        if (childKeys.length > 0) {
          flattenRoutes(item, pattern);
        }
      }
    };

    flattenRoutes(routes);
  }

  public start(): void {
    if (typeof window === 'undefined') return;

    if (!this.listenerBound) {
      if (this.mode === 'history') {
        window.addEventListener('popstate', this.handlePopState);
      } else {
        window.addEventListener('hashchange', this.handlePopState);
      }
      this.listenerBound = true;
    }

    this.resolveCurrentLocation();
  }

  public stop(): void {
    if (typeof window === 'undefined' || !this.listenerBound) return;
    if (this.mode === 'history') {
      window.removeEventListener('popstate', this.handlePopState);
    } else {
      window.removeEventListener('hashchange', this.handlePopState);
    }
    this.listenerBound = false;
  }

  private handlePopState = (): void => {
    this.resolveCurrentLocation();
  };

  public getCurrentPath(): string {
    if (typeof window === 'undefined') return '/';

    if (this.mode === 'hash') {
      return window.location.hash.slice(1) || '/';
    }
    return window.location.pathname + window.location.search;
  }

  public resolveCurrentLocation(): RouteMatchResult | null {
    const fullPath = this.getCurrentPath();
    return this.matchAndDispatch(fullPath);
  }

  public match(urlPath: string): RouteMatchResult | null {
    const [pathOnly, searchOnly] = urlPath.split('?');
    const cleanPath = (pathOnly || '/').replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    const queryParams: Record<string, string> = {};

    if (searchOnly) {
      const searchParams = new URLSearchParams(searchOnly);
      searchParams.forEach((val, key) => {
        queryParams[key] = val;
      });
    }

    const pathParts = cleanPath.split('/').filter(Boolean);

    for (const routePattern of Object.keys(this.routes)) {
      const patternParts = routePattern.split('/').filter(Boolean);
      if (patternParts.length !== pathParts.length) continue;

      const params: Record<string, string> = {};
      let isMatch = true;

      for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) {
          const paramName = patternParts[i].slice(1);
          params[paramName] = decodeURIComponent(pathParts[i]);
        } else if (patternParts[i] !== pathParts[i]) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        const routeDef = this.routes[routePattern];
        return {
          path: cleanPath,
          routePattern,
          params,
          queryParams,
          handler: (routeDef.handler || routeDef.render) as any,
          meta: routeDef.meta,
          rawRoute: routeDef,
        };
      }
    }

    // Catch-all wildcards or root match fallback if routePattern === '/' and path === '/'
    if (cleanPath === '/' && this.routes['/']) {
      const routeDef = this.routes['/'];
      return {
        path: '/',
        routePattern: '/',
        params: {},
        queryParams,
        handler: (routeDef.handler || routeDef.render) as any,
        meta: routeDef.meta,
        rawRoute: routeDef,
      };
    }

    return null;
  }

  public navigate(path: string, options: { replace?: boolean; state?: any } = {}): void {
    if (typeof window === 'undefined') return;

    const fromPath = this.currentPath;
    const executeNavigation = (cancel?: boolean) => {
      if (cancel) return;

      if (this.mode === 'history') {
        if (options.replace) {
          window.history.replaceState(options.state || {}, '', path);
        } else {
          window.history.pushState(options.state || {}, '', path);
        }
      } else {
        const targetHash = '#' + (path.startsWith('/') ? path : '/' + path);
        if (options.replace) {
          const href = window.location.href.replace(/(#.*)?$/, targetHash);
          window.location.replace(href);
        } else {
          window.location.hash = targetHash;
        }
      }

      const match = this.matchAndDispatch(path, fromPath);
    };

    if (this.beforeEachHook) {
      this.beforeEachHook(path, fromPath, executeNavigation);
    } else {
      executeNavigation(false);
    }
  }

  private matchAndDispatch(fullPath: string, fromPath: string = this.currentPath): RouteMatchResult | null {
    const match = this.match(fullPath);
    this.currentPath = fullPath;

    if (match) {
      if (match.handler) {
        match.handler(match.params, match.queryParams, match);
      }
      if (this.onRouteMatch) {
        this.onRouteMatch(match);
      }
      if (this.afterEachHook) {
        this.afterEachHook(fullPath, fromPath);
      }
      return match;
    } else {
      if (this.onNotFound) {
        this.onNotFound(fullPath);
      }
      return null;
    }
  }
}

export function matchRoute(
  parts: string[],
  routers: any,
  queryParams?: URLSearchParams,
  pathParams: Record<string, string> = {}
): RouterItem {
  if (!parts || parts.length === 0 || (parts.length === 1 && parts[0] === '')) {
    const finalRouter = routers['/'] ? routers['/'] : routers;
    return {
      ...finalRouter,
      params: { ...finalRouter.params, ...pathParams }
    };
  }

  const currentPart = parts[0];
  let nextRouters = routers[currentPart];

  if (!nextRouters && currentPart !== undefined && currentPart !== '') {
    const keys = Object.keys(routers).filter(k => k !== '/' && k !== 'page' && k !== 'params' && k !== 'url' && k !== 'pageComponent');
    const dynamicKey = keys.find(k => k.startsWith(':'));
    if (dynamicKey) {
      nextRouters = routers[dynamicKey];
      const paramName = dynamicKey.slice(1);
      pathParams[paramName] = currentPart;
    }
  }

  if (nextRouters) {
    return matchRoute(parts.slice(1), nextRouters, queryParams, pathParams);
  }

  if (routers.queryParamsParser) {
    const result = routers.queryParamsParser(routers.params, queryParams, routers);
    return {
      ...result,
      params: { ...result.params, ...pathParams }
    };
  }

  const finalRouter = routers['/'] ? routers['/'] : routers;
  return {
    ...finalRouter,
    params: { ...finalRouter.params, ...pathParams }
  };
}

export function buildPageToRouterMap(routers: any, map: Record<string, any> = {}): Record<string, any> {
  if (!routers || typeof routers !== 'object') return map;

  if (routers.page) {
    map[routers.page] = routers;
  }

  for (const key of Object.keys(routers)) {
    if (key !== 'pageComponent' && key !== 'params' && typeof routers[key] === 'object' && routers[key] !== null) {
      buildPageToRouterMap(routers[key], map);
    }
  }

  return map;
}

export function getUrlForStateFromMap(
  pageToRouterMap: Record<string, any>,
  page: string,
  params?: Record<string, any>,
  routePrefix: string = ''
): string {
  const routeObj = pageToRouterMap[page];
  let rawUrl = '/';
  if (routeObj) {
    if (typeof routeObj.url === 'function') {
      rawUrl = routeObj.url(params);
    } else if (typeof routeObj.url === 'string') {
      rawUrl = routeObj.url;
    }
  }
  return `${routePrefix}${rawUrl}`;
}

export function parseUrlFromPath(
  pathname: string,
  search: string,
  routerApp: any,
  prefixToRemove?: string
): RouterItem {
  let path = pathname;
  if (prefixToRemove && path.startsWith(`${prefixToRemove}/`)) {
    path = path.slice(prefixToRemove.length + 1);
  } else if (prefixToRemove && path === prefixToRemove) {
    path = '';
  } else if (path.startsWith('/')) {
    path = path.slice(1);
  }
  const queryParams = new URLSearchParams(search);
  const parts = path.split('/');
  return matchRoute(parts, routerApp, queryParams);
}
