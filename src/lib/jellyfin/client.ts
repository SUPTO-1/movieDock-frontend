export type JellyfinClientConfig = {
  baseUrl: string;
  apiKey?: string;
};

const defaultConfig: JellyfinClientConfig = {
  baseUrl: process.env.NEXT_PUBLIC_JELLYFIN_URL ?? "",
  apiKey: process.env.NEXT_PUBLIC_JELLYFIN_API_KEY,
};

export function getJellyfinConfig() {
  return defaultConfig;
}

export async function jellyfinRequest(path: string, init?: RequestInit) {
  const { baseUrl, apiKey } = defaultConfig;

  if (!baseUrl) {
    throw new Error("Jellyfin base URL is not configured.");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(apiKey ? { Authorization: `MediaBrowser Token="${apiKey}"` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Jellyfin request failed with status ${response.status}`);
  }

  return response;
}