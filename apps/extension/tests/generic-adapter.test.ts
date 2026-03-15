// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { GenericAdapter } from "../src/adapters/generic";

describe("GenericAdapter", () => {
  it("extracts visible text from aria-live and product nodes", () => {
    document.body.innerHTML = `
      <div aria-live="polite">Only 3 left, buy now!</div>
      <div class="product-title">Ultra Glow Serum</div>
      <div class="price">$29</div>
    `;

    const adapter = new GenericAdapter();
    const chunks = adapter.extractVisibleText(document);
    const product = adapter.extractProductInfo(document);

    expect(chunks.length).toBeGreaterThan(0);
    expect(product.productName).toContain("Ultra Glow");
  });
});
