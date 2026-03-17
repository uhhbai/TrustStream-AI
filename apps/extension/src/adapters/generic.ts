import { AdapterDiagnostics, PlatformName } from "@truststream/shared";
import { SiteAdapter } from "./types";

export const CAPTION_SELECTORS = [
  "[aria-live='polite']",
  "[aria-live='assertive']",
  "[data-e2e*='caption']",
  "[data-e2e*='subtitle']",
  "[class*='caption']",
  "[class*='subtitle']",
  "[class*='live'] [class*='text']"
];

export const PRODUCT_SELECTORS = ["[class*='product']", "[class*='price']", "[class*='seller']"];

function normalizeText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

const SYSTEM_NOISE_PATTERNS = [
  /\bjoined\b/i,
  /\bwelcome to tiktok live\b/i,
  /\bcommunity guidelines\b/i,
  /\bmust be 18 or older\b/i,
  /\bgo live\b/i,
  /\brecharge and send gifts\b/i,
  /\bhave fun interacting\b/i,
  /\bviewer(s)?\b.*\bgifts\b/i,
  /\bcreator(s)?\b.*\blive\b/i
];

function looksLikeActionableTranscript(text: string) {
  if (text.length < 6) return false;
  if (/^[\d\s%$.,:;!?-]+$/.test(text)) return false;
  if (/^(follow|recharge|mute|send|gift|share|comment|like|join|more)$/i.test(text)) return false;
  if (/^(new chrome available|for you|live|recharge)$/i.test(text)) return false;
  if (SYSTEM_NOISE_PATTERNS.some((pattern) => pattern.test(text))) return false;
  return true;
}

function extractVisibleTextBySelectors(doc: Document, selectors: string[]) {
  const chunks: string[] = [];
  selectors.forEach((selector) => {
    doc.querySelectorAll(selector).forEach((node) => {
      const text = normalizeText(node.textContent ?? "");
      if (looksLikeActionableTranscript(text)) chunks.push(text);
    });
  });
  return Array.from(new Set(chunks));
}

export class GenericAdapter implements SiteAdapter {
  getPlatformName(): PlatformName {
    return "generic";
  }

  detectPage(_url: string, _doc: Document): boolean {
    return true;
  }

  extractVisibleText(doc: Document): string[] {
    const captionText = extractVisibleTextBySelectors(doc, CAPTION_SELECTORS);
    return captionText.slice(0, 20);
  }

  extractProductInfo(doc: Document) {
    const title =
      doc.querySelector("h1")?.textContent?.trim() ??
      doc.querySelector("[class*='product']")?.textContent?.trim();
    const listedPrice = doc.querySelector("[class*='price']")?.textContent?.trim();
    const sellerLabel = doc.querySelector("[class*='seller']")?.textContent?.trim();

    return {
      productName: title,
      listedPrice,
      sellerLabel
    };
  }

  observeDomChanges(doc: Document, onChunk: (chunks: string[]) => void) {
    let timer: number | undefined;
    const observer = new MutationObserver((records) => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const text = this.extractVisibleText(doc);
        if (text.length > 0) onChunk(text.slice(0, 30));
      }, 700);
    });

    observer.observe(doc.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      observer.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }

  diagnostics(doc: Document): AdapterDiagnostics {
    const count = this.extractVisibleText(doc).length;
    return {
      platform: "generic",
      captionSelectorsChecked: CAPTION_SELECTORS,
      extractionMode: count > 0 ? "dom" : "limited_visibility",
      lastExtractionCount: count
    };
  }
}
