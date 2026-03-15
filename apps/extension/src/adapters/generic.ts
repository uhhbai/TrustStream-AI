import { AdapterDiagnostics, PlatformName } from "@truststream/shared";
import { SiteAdapter } from "./types";

export const CAPTION_SELECTORS = [
  "[aria-live='polite']",
  "[aria-live='assertive']",
  "[data-e2e*='caption']",
  "[data-e2e*='subtitle']",
  "[class*='caption']",
  "[class*='subtitle']",
  "[class*='comment']",
  "[class*='live'] [class*='text']"
];

export const PRODUCT_SELECTORS = ["[class*='product']", "[class*='price']", "[class*='seller']"];

function normalizeText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function looksLikeActionableTranscript(text: string) {
  if (text.length < 6) return false;
  if (/^[\d\s%$.,:;!?-]+$/.test(text)) return false;
  if (/^(follow|recharge|mute|send|gift|share|comment|like|join|more)$/i.test(text)) return false;
  if (/^(new chrome available|for you|live|recharge)$/i.test(text)) return false;
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
    const productText = extractVisibleTextBySelectors(doc, PRODUCT_SELECTORS);
    const merged = Array.from(new Set([...captionText, ...productText])).filter(looksLikeActionableTranscript);

    if (merged.length > 0) return merged.slice(0, 20);

    const fallback = doc.body?.innerText
      ?.split("\n")
      .map((row) => normalizeText(row))
      .filter((row) => row.length > 8 && looksLikeActionableTranscript(row))
      .slice(0, 20);
    return fallback ?? [];
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
        const fromMutations: string[] = [];
        records.forEach((record) => {
          if (record.type === "characterData") {
            const text = normalizeText(record.target.textContent ?? "");
            if (looksLikeActionableTranscript(text)) fromMutations.push(text);
          }
          if (record.type === "childList") {
            record.addedNodes.forEach((node) => {
              if (node.nodeType === Node.TEXT_NODE) {
                const text = normalizeText(node.textContent ?? "");
                if (looksLikeActionableTranscript(text)) fromMutations.push(text);
                return;
              }
              if (node instanceof HTMLElement) {
                const nodeText = normalizeText(node.innerText || node.textContent || "");
                if (looksLikeActionableTranscript(nodeText)) fromMutations.push(nodeText);
                node.querySelectorAll("*").forEach((child) => {
                  const childText = normalizeText(
                    (child as HTMLElement).innerText || child.textContent || ""
                  );
                  if (looksLikeActionableTranscript(childText)) fromMutations.push(childText);
                });
              }
            });
          }
        });

        const text = this.extractVisibleText(doc);
        const merged = Array.from(new Set([...fromMutations, ...text])).slice(0, 30);
        if (merged.length > 0) onChunk(merged);
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
