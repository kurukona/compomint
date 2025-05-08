declare const firstElementChild: (ele: Element | DocumentFragment) => Element | null;
declare const childNodeCount: (ele: Element | DocumentFragment) => number;
declare const childElementCount: (ele: Element | DocumentFragment) => number;
declare const cleanNode: (node: Node) => void;
declare const stringToElement: (str: string | number) => Node;
export { firstElementChild, childNodeCount, childElementCount, cleanNode, stringToElement, };
