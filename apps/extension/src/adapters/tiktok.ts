import { PlatformName } from "@truststream/shared";
import { CAPTION_SELECTORS, GenericAdapter, PRODUCT_SELECTORS } from "./generic";

const TIKTOK_CAPTION_SELECTORS = [
  "[data-e2e='live-subtitle']",
  "[data-e2e*='caption']",
  "[class*='live-subtitle']",
  "[class*='Caption']",
  "[class*='subtitle']",
  "[class*='DivCommentItemContainer'] p",
  "[class*='live-comment']"
];

const TIKTOK_PRODUCT_SELECTORS = [
  "[class*='product']",
  "[class*='Product']",
  "[class*='price']",
  "[class*='Price']",
  "[class*='shop']",
  "[class*='seller']"
];

function normalizeText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function isUsefulLine(text: string) {
  if (text.length < 5) return false;
  if (!/[a-zA-Z]/.test(text)) return false;
  if (/^(follow|share|recharge|gift|mute|join|like)$/i.test(text)) return false;
  if (/^[\d\s%$.,:;!?-]+$/.test(text)) return false;
  return true;
}

export class TikTokAdapter extends GenericAdapter {
  getPlatformName(): PlatformName {
    return "tiktok";
  }

  detectPage(url: string, _doc: Document): boolean {
    return url.includes("tiktok.com");
  }

  extractVisibleText(doc: Document): string[] {
    const chunks: string[] = [];

    [...TIKTOK_CAPTION_SELECTORS, ...TIKTOK_PRODUCT_SELECTORS].forEach((selector) => {
      doc.querySelectorAll(selector).forEach((node) => {
        const text = normalizeText(node.textContent ?? "");
        if (isUsefulLine(text)) chunks.push(text);
      });
    });

    const pinned = Array.from(
      doc.querySelectorAll("[class*='comment'], [data-e2e*='comment']")
    )
      .map((el) => normalizeText(el.textContent ?? ""))
      .filter(isUsefulLine);
    chunks.push(...pinned);

    const unique = Array.from(new Set(chunks));
    if (unique.length > 0) return unique.slice(0, 30);
    return super.extractVisibleText(doc);
  }

  diagnostics(doc: Document) {
    const count = this.extractVisibleText(doc).length;
    return {
      platform: "tiktok" as const,
      captionSelectorsChecked: [...TIKTOK_CAPTION_SELECTORS, ...CAPTION_SELECTORS, ...PRODUCT_SELECTORS],
      extractionMode: count > 0 ? "dom" : "limited_visibility",
      lastExtractionCount: count
    };
  }
}
