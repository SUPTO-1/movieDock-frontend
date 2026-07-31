export type JellyfinImageType = "Primary" | "Backdrop" | "Logo" | "Thumb";

export function getJellyfinImageUrl(itemId: string, imageType: JellyfinImageType) {
  const baseUrl = process.env.NEXT_PUBLIC_JELLYFIN_URL ?? "";

  if (!baseUrl) {
    return "";
  }

  return `${baseUrl}/Items/${itemId}/Images/${imageType}`;
}