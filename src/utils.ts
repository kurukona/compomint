
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

const childNodeCount = function (ele: Element | DocumentFragment): number {
  return (
    ele.childElementCount ||
    Array.prototype.filter.call(ele.childNodes, function (child: Node) {
      return child instanceof Node;
    }).length
  );
};

const childElementCount = function (ele: Element | DocumentFragment): number {
  return (
    ele.childElementCount ||
    Array.prototype.filter.call(ele.childNodes, function (child: Node) {
      return child instanceof Element;
    }).length
  );
};

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
