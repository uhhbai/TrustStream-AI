import { PlatformName } from "@truststream/shared";

export function detectPlatform(url: string): PlatformName {
  const value = url.toLowerCase();
  if (value.includes("tiktok")) return "tiktok";
  if (value.includes("instagram")) return "instagram";
  if (value.includes("shopee")) return "shopee";
  return "generic";
}
