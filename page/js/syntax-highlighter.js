import { compomint, tmpl } from "../../dist/compomint.esm.min.js"

// Simple Syntax Highlighter for Code Examples

document.addEventListener('DOMContentLoaded', function() {
  function highlightSyntax() {
    // Find all code blocks
    const codeBlocks = document.querySelectorAll('pre code');
    
    if (!codeBlocks.length) {
      // If no code blocks found yet, try again later (templates might not be rendered yet)
      setTimeout(highlightSyntax, 100);
      return;
    }
    
    // Process each code block
    codeBlocks.forEach(function(codeBlock) {
      let code = codeBlock.textContent;
      
      // Already processed
      if (codeBlock.innerHTML !== code) return;
      
      // Define regex patterns for different syntax elements
      const patterns = {
        keyword: /\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|new|this|typeof|instanceof|null|undefined|true|false|try|catch|finally|throw|class|extends|import|export|from|as|async|await|yield)\b/g,
        compomintKeyword: /\b(data|status|component|i18n|compomint|tmpl)\b/g,
        string: /((['"])(?:\\.|[^\\])*?\2)|(`(?:\\.|[^\\])*?`)/g,
        comment: /(\/\/.*?$)|(\/\*[\s\S]*?\*\/)/gm,
        function: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
        number: /\b(\d+(?:\.\d+)?)\b/g,
        tag: /(&lt;[^>]*&gt;)/g,
        compomintTemplate: /(##[=%\-!*]?[\s\S]*?##)/g
      };
      
      // Define highlighting colors
      const colors = {
        keyword: 'text-pink-500', // keywords
        compomintKeyword: 'text-purple-400', // Compomint specific keywords
        string: 'text-green-400', // strings
        comment: 'text-gray-500', // comments
        function: 'text-blue-400', // functions
        number: 'text-yellow-500', // numbers
        tag: 'text-cyan-400', // HTML tags
        compomintTemplate: 'text-orange-400' // Compomint template expressions
      };
      
      // Escape HTML
      code = code.replace(/&/g, '&amp;')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;');
      
      // Apply highlighting
      for (const [type, pattern] of Object.entries(patterns)) {
        code = code.replace(pattern, function(match) {
          if (type === 'function') {
            // Only highlight the function name, not the parenthesis
            const functionName = match.slice(0, -1);
            return `<span class="${colors[type]}">${functionName}</span>(`;
          }
          return `<span class="${colors[type]}">${match}</span>`;
        });
      }
      
      // Set the highlighted code
      codeBlock.innerHTML = code;
    });
  }
  
  // Run syntax highlighting
  highlightSyntax();
  
  // Run again after a short delay to catch any dynamically rendered code blocks
  setTimeout(highlightSyntax, 500);
});
