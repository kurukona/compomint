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
export declare namespace CompomintRouter {
    type RouterItem = import('./router').RouterItem;
    type MatchResult = import('./router').RouteMatchResult;
    type Definition = import('./router').RouteDefinition;
    type Options = import('./router').RouterOptions;
}
export declare class CompomintRouter {
    static matchRoute: typeof matchRoute;
    static buildPageToRouterMap: typeof buildPageToRouterMap;
    static getUrlForStateFromMap: typeof getUrlForStateFromMap;
    static parseUrlFromPath: typeof parseUrlFromPath;
    private mode;
    private routes;
    private currentPath;
    private onRouteMatch?;
    private onNotFound?;
    private beforeEachHook?;
    private afterEachHook?;
    private listenerBound;
    constructor(options?: RouterOptions);
    registerRoutes(routes: Record<string, RouteDefinition | any>): void;
    start(): void;
    stop(): void;
    private handlePopState;
    getCurrentPath(): string;
    resolveCurrentLocation(): RouteMatchResult | null;
    match(urlPath: string): RouteMatchResult | null;
    navigate(path: string, options?: {
        replace?: boolean;
        state?: any;
    }): void;
    private matchAndDispatch;
}
export declare function matchRoute(parts: string[], routers: any, queryParams?: URLSearchParams, pathParams?: Record<string, string>): RouterItem;
export declare function buildPageToRouterMap(routers: any, map?: Record<string, any>): Record<string, any>;
export declare function getUrlForStateFromMap(pageToRouterMap: Record<string, any>, page: string, params?: Record<string, any>, routePrefix?: string): string;
export declare function parseUrlFromPath(pathname: string, search: string, routerApp: any, prefixToRemove?: string): RouterItem;
