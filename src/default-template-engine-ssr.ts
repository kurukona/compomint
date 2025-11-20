import { CompomintConfigs, CompomintGlobal, TemplateEngine } from "./type";
import { defaultTemplateEngine } from "./default-template-engine";

//
// SSR template settings (deep clone of default engine without style rule)
//
const defaultTemplateEngineSSR = (
  compomint: CompomintGlobal
): TemplateEngine => {
  // Get the default template engine
  const baseEngine = defaultTemplateEngine(compomint);

  // Create a deep clone by manually copying all properties except style rule
  const ssrEngine: TemplateEngine = {
    rules: {},
    keys: { ...baseEngine.keys }
  };

  // Copy all rules except style and element for SSR (DOM manipulation not available)
  // We need to ensure 'element' rule comes BEFORE 'evaluate' rule because 'evaluate' matches ##...## greedily
  Object.keys(baseEngine.rules).forEach((ruleKey) => {
    if (ruleKey === 'evaluate') {
      // Add element rule before evaluate
      ssrEngine.rules.element = {
        pattern: /##%([\s\S]+?)##/g,
        exec: function (target: string): string {
          return "';\n__p+='<!-- SSR: Element insertion not supported -->';\n__p+='";
        }
      };
    }

    if (ruleKey !== 'style' && ruleKey !== 'element') {
      ssrEngine.rules[ruleKey] = { ...baseEngine.rules[ruleKey] };
    }
  });

  // If element rule wasn't added (e.g. evaluate missing), add it now
  if (!ssrEngine.rules.element) {
    ssrEngine.rules.element = {
      pattern: /##%([\s\S]+?)##/g,
      exec: function (target: string): string {
        return "';\n__p+='<!-- SSR: Element insertion not supported -->';\n__p+='";
      }
    };
  }

  return ssrEngine;
};

export { defaultTemplateEngineSSR };
