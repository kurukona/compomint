import { CompomintGlobal } from "./type";
import { SSROptions, SSRRenderResult } from "./ssr";
/**
 * Server-Side Rendering Engine for Compomint
 */
export declare class SSRRenderer {
    private compomint;
    private options;
    private polyfill;
    private renderStartTime;
    constructor(compomint: CompomintGlobal, options?: SSROptions);
    private setupEnvironment;
    private setupSSROverrides;
    /**
     * Render a template to HTML string on the server
     */
    renderToString(templateId: string, data?: any, options?: Partial<SSROptions>): Promise<SSRRenderResult>;
    /**
     * Render multiple templates and combine results
     */
    renderMultiple(templates: Array<{
        id: string;
        data: any;
    }>, options?: Partial<SSROptions>): Promise<SSRRenderResult>;
    /**
     * Generate complete HTML page with SSR content
     */
    renderPage(templateId: string, data?: any, pageOptions?: {
        title?: string;
        meta?: Array<{
            name?: string;
            property?: string;
            content: string;
        }>;
        links?: Array<{
            rel: string;
            href: string;
            [key: string]: string;
        }>;
        scripts?: Array<{
            src?: string;
            content?: string;
            [key: string]: any;
        }>;
        bodyClass?: string;
        lang?: string;
    }): Promise<string>;
    /**
     * Render component in SSR mode
     */
    private renderComponentSSR;
    /**
     * Extract HTML from rendered component
     */
    private extractHTML;
    /**
     * Generate hydration script for client-side
     */
    private generateHydrationScript;
    /**
     * Escape HTML for safe output
     */
    private escapeHTML;
    /**
     * Extract styles and scripts from rendered HTML and remove them
     */
    private extractStylesAndScripts;
    /**
     * Extract styles from original template text (SSR-specific workaround)
     * This is needed because Compomint strips <style> tags during template compilation
     */
    private extractStylesFromTemplateText;
    /**
     * Get renderer statistics
     */
    getStats(): {
        environment: string;
        polyfillActive: boolean;
        lastRenderTime: number;
    };
}
/**
 * Create SSR renderer instance
 */
export declare function createSSRRenderer(compomint: CompomintGlobal, options?: SSROptions): SSRRenderer;
/**
 * Quick SSR render function
 */
export declare function renderToString(compomint: CompomintGlobal, templateId: string, data?: any, options?: SSROptions): Promise<string>;
