/**
 * SSR Environment Detection and Configuration
 */
export interface SSROptions {
    renderToString?: boolean;
    hydrateOnClient?: boolean;
    generateIds?: boolean;
    preserveWhitespace?: boolean;
    lang?: string;
}
export interface SSRRenderResult {
    html: string;
    css: string;
    scripts: string[];
    metadata: {
        templateIds: string[];
        componentIds: string[];
        renderTime: number;
    };
}
export declare const Environment: {
    isServer(): boolean;
    isBrowser(): boolean;
    hasDOM(): boolean;
    isNode(): boolean;
};
/**
 * DOM Polyfills for Server-Side Rendering
 */
export declare class SSRDOMPolyfill {
    private static instance;
    private elements;
    private styleCollector;
    private scriptCollector;
    static getInstance(): SSRDOMPolyfill;
    /**
     * Create a minimal DOM-like element for SSR
     */
    createElement(tagName: string): any;
    /**
     * Create a document fragment for SSR
     */
    createDocumentFragment(): any;
    /**
     * Create a text node for SSR
     */
    createTextNode(text: string): any;
    /**
     * Create a comment node for SSR
     */
    createComment(text: string): any;
    /**
     * Collect styles during SSR
     */
    collectStyle(css: string): void;
    /**
     * Collect scripts during SSR
     */
    collectScript(script: string): void;
    /**
     * Get collected styles
     */
    getCollectedStyles(): string;
    /**
     * Get collected scripts
     */
    getCollectedScripts(): string[];
    /**
     * Reset collectors
     */
    reset(): void;
}
/**
 * SSR Document Mock
 */
export declare function createSSRDocument(): {
    createElement: (tagName: string) => any;
    createDocumentFragment: () => any;
    createTextNode: (text: string) => any;
    createComment: (text: string) => any;
    getElementById: (id: string) => null;
    head: {
        appendChild: (element: any) => void;
        removeChild: () => void;
        innerHTML: string;
    };
    body: {
        appendChild: () => void;
        removeChild: () => void;
        innerHTML: string;
        contains: () => boolean;
    };
    documentElement: {
        lang: string;
        getAttribute: (name: string) => string | null;
        setAttribute: (name: string, value: string) => void;
    };
};
/**
 * SSR Window Mock
 */
export declare function createSSRWindow(): {
    Node: {
        prototype: {};
    };
    Element: {
        prototype: {};
    };
    CharacterData: {
        prototype: {};
    };
    DocumentType: {
        prototype: {};
    };
    XMLHttpRequest: () => never;
};
/**
 * SSR Element Mock for global scope
 */
export declare function createSSRElementClass(): {
    new (tagName?: string): {
        tagName: string;
        innerHTML: string;
        textContent: string;
        id: string;
        className: string;
        children: any[];
        parentNode: any;
    };
};
/**
 * Setup SSR environment
 */
export declare function setupSSREnvironment(): boolean;
