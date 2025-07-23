/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { compomint, tmpl } from "../src/compomint";

// This is a mock of what a build script would generate from the SSR process.
const MOCKED_SSR_OUTPUT = {
  html: `<div data-co-id="hydrated-component-1" data-co-tmpl-id="hydration-test"><button>Click Me</button></div>`,
  metadata: {
    componentIds: ["hydrated-component-1"],
    initialStates: {
      "hydrated-component-1": {
        data: {},
        status: { count: 5 },
      },
    },
  },
};

describe("Compomint Hydration", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    compomint.tmplCache.clear();
    for (const key in tmpl) {
      delete tmpl[key];
    }
    compomint.i18n = {};
    compomint.configs.debug = true;
    // Reset window object for clean test
    if ((window as any).__COMPOMINT_SSR__) {
      delete (window as any).__COMPOMINT_SSR__;
    }
  });

  it("should hydrate a component and attach events", () => {
    const handleClick = jest.fn(() => {
      console.log("Button clicked!");
    });

    // 1. Define the component template on the client-side
    compomint.addTmpl(
      "hydration-test",
      `<div><button data-co-event="##:data.click##">Click Me</button></div>`
    );

    // 2. Setup the DOM and SSR data as if it came from the server
    document.body.innerHTML = MOCKED_SSR_OUTPUT.html;
    (window as any).__COMPOMINT_SSR__ = MOCKED_SSR_OUTPUT.metadata;
    (window as any).__COMPOMINT_SSR__.initialStates[
      "hydrated-component-1"
    ].data.click = handleClick;

    // 3. Run hydration
    compomint.hydrate();

    // 4. Verify the component is interactive
    const button = document.querySelector("button") as HTMLElement;
    expect(button).not.toBeNull();

    button.click();

    const div = document.querySelector(
      '[data-co-id="hydrated-component-1"]'
    ) as HTMLElement;
    const component = (div as any).__compomint_scope__;
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(component).toBeDefined();
    expect(component.tmplId).toBe("hydration-test");
    expect(component.status.count).toBe(5);
  });
});
