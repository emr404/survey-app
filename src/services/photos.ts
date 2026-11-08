import type { DestinationImage } from '@/types/requests';
import type { JsonValue } from '@/types/json';
import { isJsonObject } from '@/domain/json';
import { requestJson } from './http';

const CACHE_LIMIT = 150;
const REQUEST_TIMEOUT_MS = 15000;
const cache = new Map<string, DestinationImage>();

function safeUrl(value: string, hosts: string[]): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' && hosts.includes(url.hostname) && !url.username && !url.password
    );
  } catch {
    return false;
  }
}

function isPhotoText(value: JsonValue | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length < 2000;
}

function parsePhoto(value: JsonValue): DestinationImage | null {
  if (!isJsonObject(value) || !isJsonObject(value.photo)) return null;
  const photo = value.photo;
  const { url, alt, author, sourceUrl, license, licenseUrl } = photo;
  if (
    !isPhotoText(url) ||
    !isPhotoText(alt) ||
    !isPhotoText(author) ||
    !isPhotoText(sourceUrl) ||
    !isPhotoText(license) ||
    !isPhotoText(licenseUrl)
  )
    return null;
  if (!safeUrl(url, ['upload.wikimedia.org', 'thumb.wikimedia.org'])) return null;
  if (!safeUrl(sourceUrl, ['commons.wikimedia.org'])) return null;
  if (!safeUrl(licenseUrl, ['creativecommons.org'])) return null;
  return { url, alt, author, sourceUrl, license, licenseUrl };
}

export async function getDestinationPhoto(
  name: string,
  country: string,
  signal: AbortSignal
): Promise<DestinationImage | null> {
  if (signal.aborted) return null;
  const key = JSON.stringify([name, country]);
  const cached = cache.get(key);
  if (cached) return cached;
  const controller = new AbortController();
  const abort = (): void => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  const timeout = window.setTimeout(abort, REQUEST_TIMEOUT_MS);
  try {
    const query = new URLSearchParams({ name, country });
    const data = await requestJson(`/api/destination-photo?${query}`, {
      signal: controller.signal,
    });
    const photo = parsePhoto(data);
    if (!photo || controller.signal.aborted) return null;
    const oldest = cache.keys().next().value;
    if (cache.size >= CACHE_LIMIT && oldest !== undefined) cache.delete(oldest);
    cache.set(key, photo);
    return photo;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}

export function invalidateDestinationPhoto(name: string, country: string): void {
  cache.delete(JSON.stringify([name, country]));
}
