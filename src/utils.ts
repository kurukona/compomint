/**
 * @function firstElementChild
 * @description Returns the first element child of a node.
 * @param {Element | DocumentFragment} ele - The element to get the first element child from.
 * @returns {Element | null} The first element child, or null if there is none.
 */
const firstElementChild = function (ele: Element | DocumentFragment): Element | null {
  if (ele.firstElementChild) return ele.firstElementChild;
  const children = ele.childNodes;
  for (let i = 0, size = children.length; i < size; i++) {
    if (children[i] instanceof Element) {
      return children[i] as Element;
    }
  }
  return null;
};

/**
 * @function childNodeCount
 * @description Returns the number of child nodes of a node.
 * @param {Element | DocumentFragment} ele - The element to count the child nodes of.
 * @returns {number} The number of child nodes.
 */
const childNodeCount = function (ele: Element | DocumentFragment): number {
  return (
    ele.childElementCount ||
    Array.prototype.filter.call(ele.childNodes, function (child: Node) {
      return child instanceof Node;
    }).length
  );
};

/**
 * @function childElementCount
 * @description Returns the number of child elements of a node.
 * @param {Element | DocumentFragment} ele - The element to count the child elements of.
 * @returns {number} The number of child elements.
 */
const childElementCount = function (ele: Element | DocumentFragment): number {
  return (
    ele.childElementCount ||
    Array.prototype.filter.call(ele.childNodes, function (child: Node) {
      return child instanceof Element;
    }).length
  );
};

/**
 * @function cleanNode
 * @description Removes comment nodes and empty text nodes from a node.
 * @param {Node} node - The node to clean.
 * @returns {void}
 */
const cleanNode = function (node: Node): void {
  for (let n = 0; n < node.childNodes.length; n++) {
    const child = node.childNodes[n];
    if (
      child.nodeType === 8 || // Comment node
      (child.nodeType === 3 && !/\S/.test(child.nodeValue || '')) // Text node with only whitespace
    ) {
      node.removeChild(child);
      n--; // Adjust index after removal
    } else if (child.nodeType === 1) {
      // Element node
      cleanNode(child); // Recurse
    }
  }
};

const domParser = new DOMParser();
/**
 * @function stringToElement
 * @description Converts a string to a DOM node.
 * @param {string | number} str - The string to convert.
 * @returns {Node} The resulting DOM node.
 */
const stringToElement = function (str: string | number): Node {
  if (typeof str === 'number' || !isNaN(Number(str))) {
    return document.createTextNode(String(str));
  } else if (typeof str === 'string') {
    try {
      const doc = domParser.parseFromString(str, "text/html");
      const body = doc.body;
      if (body.childNodes.length === 1) {
        return body.firstChild!;
      } else {
        const fragment = document.createDocumentFragment();
        while (body.firstChild) {
          fragment.appendChild(body.firstChild);
        }
        return fragment;
      }
    } catch (e) {
      return document.createTextNode(str);
    }
  } else {
    return document.createTextNode('');
  }
};

/**
 * @function isPlainObject
 * @description Checks if a value is a plain object.
 * @param {unknown} value - The value to check.
 * @returns {boolean} True if the value is a plain object, false otherwise.
 */
const isPlainObject = function (value: unknown) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export {
  firstElementChild,
  childNodeCount,
  childElementCount,
  cleanNode,
  stringToElement,
  isPlainObject,
};
