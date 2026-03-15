import { PlatformName } from "@truststream/shared";
import { GenericAdapter } from "./generic";

export class InstagramAdapter extends GenericAdapter {
  getPlatformName(): PlatformName {
    return "instagram";
  }

  detectPage(url: string, _doc: Document): boolean {
    return url.includes("instagram.com");
  }
}
