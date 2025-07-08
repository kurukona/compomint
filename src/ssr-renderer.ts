/*
 * Copyright (c) 2025-present, Choi Sungho
 * Code released under the MIT license
 */

import { ComponentScope, CompomintGlobal, TemplateEngine } from "./type";
import { 
  SSROptions, 
  SSRRenderResult, 
  Environment, 
  SSRDOMPolyfill, 
  setupSSREnvironment 
} from "./ssr";

/**
 * Server-Side Rendering Engine for Compomint
 */
export class SSRRenderer {
  private compomint: CompomintGlobal;
  private options: Required<SSROptions>;
  private polyfill: SSRDOMPolyfill;
  private renderStartTime: number = 0;

  constructor(compomint: CompomintGlobal, options: SSROptions = {}) {
    this.compomint = compomint;
    this.options = {
      renderToString: true,
      hydrateOnClient: false,
      generateIds: true,
      preserveWhitespace: false,
      lang: 'en',
      ...options
    };
    this.polyfill = SSRDOMPolyfill.getInstance();
    
    // Setup SSR environment if needed
    this.setupEnvironment();
  }

  private setupEnvironment(): void {
    if (Environment.isServer()) {
      setupSSREnvironment();
      
      // Override compomint's DOM dependencies for SSR
      this.setupSSROverrides();
    }
  }

  private setupSSROverrides(): void {
    // Store original functions
    const originalDocument = (globalThis as any).document;
    
    // Override document.createElement to use our polyfill
    if (originalDocument) {
      const originalCreateElement = originalDocument.createElement;
      originalDocument.createElement = (tagName: string) => {
        return this.polyfill.createElement(tagName);
      };
    }
  }

  /**
   * Render a template to HTML string on the server
   */
  async renderToString(
    templateId: string, 
    data: any = {}, 
    options: Partial<SSROptions> = {}
  ): Promise<SSRRenderResult> {
    this.renderStartTime = Date.now();
    const mergedOptions = { ...this.options, ...options };
    
    // Reset polyfill collectors
    this.polyfill.reset();
    
    // Set language for i18n if provided
    if (options.lang) {
      const doc = (globalThis as any).document;
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
      const ssrData = {
        ...data,
        $ssr: true,
        $generateIds: mergedOptions.generateIds,
        $hydrateOnClient: mergedOptions.hydrateOnClient
      };

      // Get template engine keys
      const templateEngine = this.compomint.templateEngine;

      // Call sourceGenFunc directly to get HTML string
      let result;
      try {
        result = templateMeta.sourceGenFunc.call(
          null, // no this context needed
          ssrData, // data
          {}, // status (empty for SSR)
          { tmplId: templateId }, // component
          this.compomint.i18n, // i18n (pass full i18n object, not just template-specific)
          this.compomint, // compomint
          this.compomint.tmpl || {}, // tmpl
          {}, // lazyScope (empty for SSR)
          false // debugger
        );
      } catch (error) {
        throw error;
      }

      // Convert result to string
      const html = typeof result === 'string' ? result : String(result);
      
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
      const metadata = {
        templateIds: [templateId],
        componentIds: [templateId], // Use templateId as component id
        renderTime: Date.now() - this.renderStartTime
      };

      return {
        html: html || '',
        css,
        scripts,
        metadata
      };
      
    } catch (error) {
      throw new Error(`SSR rendering failed for template "${templateId}": ${error}`);
    }
  }

  /**
   * Render multiple templates and combine results
   */
  async renderMultiple(
    templates: Array<{ id: string; data: any }>,
    options: Partial<SSROptions> = {}
  ): Promise<SSRRenderResult> {
    this.renderStartTime = Date.now();
    this.polyfill.reset();
    
    const results: SSRRenderResult[] = [];
    
    for (const template of templates) {
      const result = await this.renderToString(template.id, template.data, options);
      results.push(result);
    }
    
    // Combine results
    const combinedHTML = results.map(r => r.html).join('\n');
    const combinedCSS = results.map(r => r.css).filter(Boolean).join('\n');
    const combinedScripts = results.reduce((acc, r) => acc.concat(r.scripts), [] as string[]);
    const combinedTemplateIds = results.reduce((acc, r) => acc.concat(r.metadata.templateIds), [] as string[]);
    const combinedComponentIds = results.reduce((acc, r) => acc.concat(r.metadata.componentIds), [] as string[]);
    
    return {
      html: combinedHTML,
      css: combinedCSS,
      scripts: combinedScripts,
      metadata: {
        templateIds: combinedTemplateIds,
        componentIds: combinedComponentIds,
        renderTime: Date.now() - this.renderStartTime
      }
    };
  }

  /**
   * Generate complete HTML page with SSR content
   */
  async renderPage(
    templateId: string,
    data: any = {},
    pageOptions: {
      title?: string;
      meta?: Array<{ name?: string; property?: string; content: string }>;
      links?: Array<{ rel: string; href: string; [key: string]: string }>;
      scripts?: Array<{ src?: string; content?: string; [key: string]: any }>;
      bodyClass?: string;
      lang?: string;
    } = {}
  ): Promise<string> {
    const result = await this.renderToString(templateId, data);
    
    const {
      title = 'Compomint SSR Page',
      meta = [],
      links = [],
      scripts = [],
      bodyClass = '',
      lang = 'en'
    } = pageOptions;

    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHTML(title)}</title>
  ${meta.map(m => {
    const nameAttr = m.name ? `name="${this.escapeHTML(m.name)}"` : '';
    const propertyAttr = m.property ? `property="${this.escapeHTML(m.property)}"` : '';
    return `<meta ${nameAttr}${propertyAttr} content="${this.escapeHTML(m.content)}">`;
  }).join('\n  ')}
  ${links.map(link => {
    const attrs = Object.keys(link)
      .map((key) => `${key}="${this.escapeHTML((link as any)[key])}"`)
      .join(' ');
    return `<link ${attrs}>`;
  }).join('\n  ')}
  ${result.css ? `<style>\n${result.css}\n</style>` : ''}
</head>
<body${bodyClass ? ` class="${this.escapeHTML(bodyClass)}"` : ''}>
  ${result.html}
  ${scripts.map(script => {
    if (script.src) {
      const attrs = Object.keys(script)
        .map((key) => `${key}="${this.escapeHTML((script as any)[key])}"`)
        .join(' ');
      return `<script ${attrs}></script>`;
    } else if (script.content) {
      return `<script>${script.content}</script>`;
    }
    return '';
  }).join('\n  ')}
  ${result.scripts.map(script => `<script>${script}</script>`).join('\n  ')}
  ${this.generateHydrationScript(result)}
</body>
</html>`;
  }

  /**
   * Render component in SSR mode
   */
  private async renderComponentSSR(
    templateFunction: Function,
    data: any
  ): Promise<ComponentScope> {
    // Create a mock container for SSR
    const mockContainer = this.polyfill.createDocumentFragment();
    
    // Render the component with SSR-specific handling
    const component = templateFunction(data, mockContainer) as ComponentScope;
    
    // If component has async operations, wait for them
    if (component && typeof component.then === 'function') {
      return await component;
    }
    
    return component;
  }

  /**
   * Extract HTML from rendered component
   */
  private extractHTML(component: ComponentScope): string {
    if (!component || !component.element) {
      console.warn('Component or component.element is missing');
      return '';
    }

    // If element has toHTML method (our polyfill), use it
    if (typeof (component.element as any).toHTML === 'function') {
      return (component.element as any).toHTML();
    }

    // Handle DocumentFragment case
    if ((component.element as any).nodeType === 11) { // DocumentFragment
      // For DocumentFragment, we need to extract HTML from children
      const children = (component.element as any).childNodes || [];
      return Array.from(children).map((child: any) => {
        if (typeof child.toHTML === 'function') {
          return child.toHTML();
        } else if (child.innerHTML) {
          return child.innerHTML;
        } else if (child.textContent) {
          return child.textContent;
        } else if (child.nodeType === 3) { // Text node
          return child.textContent || '';
        }
        return '';
      }).join('');
    }

    // Fallback for other cases
    if (component.element.innerHTML) {
      return component.element.innerHTML;
    }

    if (component.element.textContent) {
      return component.element.textContent;
    }

    return '';
  }

  /**
   * Generate hydration script for client-side
   */
  private generateHydrationScript(result: SSRRenderResult): string {
    if (!this.options.hydrateOnClient) {
      return '';
    }

    const hydrationData = {
      templateIds: result.metadata.templateIds,
      componentIds: result.metadata.componentIds,
      renderTime: result.metadata.renderTime
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
  private escapeHTML(text: string): string {
    const escapeMap: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    };
    
    return text.replace(/[&<>"']/g, char => escapeMap[char] || char);
  }

  /**
   * Extract styles and scripts from rendered HTML
   */
  private extractStylesAndScripts(html: string): void {
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
  private extractStylesFromTemplateText(templateText: string): void {
    // Decode HTML entities first
    const decodedText = templateText
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
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
  getStats(): {
    environment: string;
    polyfillActive: boolean;
    lastRenderTime: number;
  } {
    return {
      environment: Environment.isServer() ? 'server' : 'client',
      polyfillActive: Environment.isServer(),
      lastRenderTime: this.renderStartTime ? Date.now() - this.renderStartTime : 0
    };
  }
}

/**
 * Create SSR renderer instance
 */
export function createSSRRenderer(
  compomint: CompomintGlobal, 
  options: SSROptions = {}
): SSRRenderer {
  return new SSRRenderer(compomint, options);
}

/**
 * Quick SSR render function
 */
export async function renderToString(
  compomint: CompomintGlobal,
  templateId: string,
  data: any = {},
  options: SSROptions = {}
): Promise<string> {
  const renderer = createSSRRenderer(compomint, options);
  const result = await renderer.renderToString(templateId, data, options);
  return result.html;
}