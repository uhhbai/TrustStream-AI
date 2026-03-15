import { PlatformName } from "@truststream/shared";
import { GenericAdapter } from "./generic";

export class ShopeeAdapter extends GenericAdapter {
  getPlatformName(): PlatformName {
    return "shopee";
  }

  detectPage(url: string, _doc: Document): boolean {
    return url.includes("shopee.");
  }
}
