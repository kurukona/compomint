const { JSDOM } = require('jsdom');
const { TextEncoder, TextDecoder } = require('util');

const dom = new JSDOM();
global.DOMParser = dom.window.DOMParser;
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
