/**
 * @function escapeHtml
 * @description A utility for escaping and unescaping HTML entities.
 * @returns {{escape: (str: string) => string, unescape: (str: string) => string}} An object with `escape` and `unescape` functions.
 */
const escapeHtml = (function () {
  const escapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;", // Use HTML entity for single quote
    "`": "&#x60;", // Use HTML entity for backtick
    //"\n": "&#10;", // Keep newline escaping if needed, otherwise remove
  };

  const unescapeMap: Record<string, string> = Object.keys(escapeMap).reduce(
    (acc: Record<string, string>, key: string) => {
      acc[escapeMap[key]] = key;
      return acc;
    },
    {} as Record<string, string>
  );

  const createEscaper = function (
    map: Record<string, string>
  ): (str: string) => string {
    const escaper = function (match: string): string {
      return map[match];
    };
    const source = `(?:${Object.keys(map).join("|").replace(/\\/g, "\\\\")})`; // Escape backslashes if any keys have them
    const testRegexp = RegExp(source);
    const replaceRegexp = RegExp(source, "g");
    return function (string: string | null | undefined): string {
      string = string == null ? "" : `${string}`;
      return testRegexp.test(string)
        ? string.replace(replaceRegexp, escaper)
        : string;
    };
  };

  return {
    escape: createEscaper(escapeMap),
    unescape: createEscaper(unescapeMap),
  };
})();
