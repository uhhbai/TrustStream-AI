import { PlatformName } from "@truststream/shared";
import { CAPTION_SELECTORS, GenericAdapter, PRODUCT_SELECTORS } from "./generic";

const TIKTOK_CAPTION_SELECTORS = [
  "[data-e2e='live-subtitle']",
  "[data-e2e*='caption']",
  "[class*='live-subtitle']",
  "[class*='Caption']",
  "[class*='subtitle']"
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

const TIKTOK_UI_NOISE_PATTERNS = [
  /\bjoined\b/i,
  /\bwelcome to tiktok live\b/i,
  /\bcommunity guidelines\b/i,
  /\bmust be 18 or older\b/i,
  /\bgo live\b/i,
  /\brecharge and send gifts\b/i,
  /\bhave fun interacting\b/i,
  /\bfollow host\b/i
];

function isUsefulLine(text: string) {
  if (text.length < 5) return false;
  if (!/\p{L}/u.test(text)) return false;
  if (/^(follow|share|recharge|gift|mute|join|like)$/i.test(text)) return false;
  if (/^[\d\s%$.,:;!?-]+$/.test(text)) return false;
  if (TIKTOK_UI_NOISE_PATTERNS.some((pattern) => pattern.test(text))) return false;
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

    TIKTOK_CAPTION_SELECTORS.forEach((selector) => {
      doc.querySelectorAll(selector).forEach((node) => {
        const text = normalizeText(node.textContent ?? "");
        if (isUsefulLine(text)) chunks.push(text);
      });
    });

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
