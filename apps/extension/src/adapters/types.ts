import { AdapterDiagnostics, PlatformName } from "@truststream/shared";

export interface AdapterProductInfo {
  productName?: string;
  listedPrice?: string;
  sellerLabel?: string;
}

export interface SiteAdapter {
  getPlatformName(): PlatformName;
  detectPage(url: string, doc: Document): boolean;
  extractVisibleText(doc: Document): string[];
  extractProductInfo(doc: Document): AdapterProductInfo;
  observeDomChanges(doc: Document, onChunk: (chunks: string[]) => void): () => void;
  diagnostics(doc: Document): AdapterDiagnostics;
}
