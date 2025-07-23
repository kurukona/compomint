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
  Object.keys(baseEngine.rules).forEach((ruleKey) => {
    if (ruleKey !== 'style' && ruleKey !== 'element') {
      ssrEngine.rules[ruleKey] = { ...baseEngine.rules[ruleKey] };
    }
  });

  return ssrEngine;
};

export { defaultTemplateEngineSSR };
