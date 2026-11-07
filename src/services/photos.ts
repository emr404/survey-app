export interface DestinationImage { url: string; alt: string; author: string; sourceUrl: string; license: string; licenseUrl: string }
const cache = new Map<string, DestinationImage>();
function safeUrl(value: unknown, hosts: string[]): boolean {
  try { const url = new URL(String(value)); return url.protocol === 'https:' && hosts.includes(url.hostname) && !url.username && !url.password; } catch { return false; }
}
export async function getDestinationPhoto(name: string, country: string, signal: AbortSignal): Promise<DestinationImage | null> {
  const key = JSON.stringify([name, country]); if (cache.has(key)) return cache.get(key) || null;
  try {
    const response = await fetch(`/api/destination-photo?${new URLSearchParams({ name, country })}`, { signal });
    const data = await response.json(); const photo = data?.photo;
    if (!response.ok || !photo || !['url', 'alt', 'author', 'sourceUrl', 'license', 'licenseUrl'].every(k => typeof photo[k] === 'string' && photo[k].length > 0 && photo[k].length < 2000)) return null;
    if (!safeUrl(photo.url, ['upload.wikimedia.org', 'thumb.wikimedia.org']) || !safeUrl(photo.sourceUrl, ['commons.wikimedia.org']) || !safeUrl(photo.licenseUrl, ['creativecommons.org'])) return null;
    if (cache.size >= 150) cache.delete(cache.keys().next().value as string);
    cache.set(key, photo); return photo;
  } catch { return null; }
}
