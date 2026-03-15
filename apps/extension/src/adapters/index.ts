import { PlatformName } from "@truststream/shared";
import { GenericAdapter } from "./generic";
import { InstagramAdapter } from "./instagram";
import { ShopeeAdapter } from "./shopee";
import { TikTokAdapter } from "./tiktok";
import { SiteAdapter } from "./types";

const adapters: SiteAdapter[] = [
  new TikTokAdapter(),
  new InstagramAdapter(),
  new ShopeeAdapter(),
  new GenericAdapter()
];

export function resolveAdapter(url: string): SiteAdapter {
  return adapters.find((adapter) => adapter.detectPage(url, document)) ?? new GenericAdapter();
}

export function adapterByPlatform(platform: PlatformName): SiteAdapter {
  if (platform === "tiktok") return new TikTokAdapter();
  if (platform === "instagram") return new InstagramAdapter();
  if (platform === "shopee") return new ShopeeAdapter();
  return new GenericAdapter();
}
