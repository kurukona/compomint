import { CompomintGlobal } from "./type";
import { CompomintRouter, RouterItem, matchRoute, buildPageToRouterMap, getUrlForStateFromMap, parseUrlFromPath } from "./router";
declare const compomint: CompomintGlobal;
declare const tmpl: Record<string, any>;
declare const router: CompomintRouter;
export { compomint, tmpl, router, CompomintRouter, RouterItem, matchRoute, buildPageToRouterMap, getUrlForStateFromMap, parseUrlFromPath };
