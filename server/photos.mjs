const cache = new Map();
const clean = value => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim().slice(0, 300) : '';
const safeUrl = (value, hosts) => { try { const url = new URL(value); return url.protocol === 'https:' && hosts.includes(url.hostname) && !url.username && !url.password ? url.href : null; } catch { return null; } };
export function selectPhoto(pages = []) {
  for (const page of pages) {
    const info = page.imageinfo?.[0]; const metadata = info?.extmetadata;
    if (!info || !metadata || !['image/jpeg', 'image/png', 'image/webp'].includes(info.mime) || info.width < 800 || info.width / info.height < 1.15) continue;
    if (/\b(map|flag|logo|coat of arms)\b/i.test(page.title)) continue;
    const license = clean(metadata.LicenseShortName?.value);
    const author = clean(metadata.Artist?.value);
    const url = safeUrl(info.thumburl, ['upload.wikimedia.org', 'thumb.wikimedia.org']);
    const sourceUrl = safeUrl(info.descriptionurl, ['commons.wikimedia.org']);
    const licenseUrl = safeUrl(metadata.LicenseUrl?.value, ['creativecommons.org']);
    if (!url || !sourceUrl || !author || !licenseUrl || !/^(CC BY(?:-SA)? [\d.]+|CC0(?: [\d.]+)?)$/.test(license)) continue;
    return { url, sourceUrl, licenseUrl, license, author, alt: clean(page.title.replace(/^File:/, '').replace(/\.[^.]+$/, '').replace(/_/g, ' ')) };
  }
  return null;
}
export async function destinationPhoto(name, country, fetchImpl = fetch) {
  if (typeof name !== 'string' || typeof country !== 'string' || !name.trim() || !country.trim() || name.length > 100 || country.length > 100) return null;
  const key = JSON.stringify([name, country]);
  const saved = cache.get(key);
  if (saved?.expires > Date.now() && fetchImpl === fetch) return saved.photo;
  let photo = null;
  try {
    const headers = { 'User-Agent': 'Talaria/1.0 (travel recommendation app)' };
    // Start with the place's encyclopedia lead image, rather than matching a
    // photographer's location or unrelated metadata in Commons search results.
    const article = new URL('https://en.wikipedia.org/w/api.php');
    article.search = new URLSearchParams({ action: 'query', titles: name, redirects: '1', prop: 'pageimages|description', piprop: 'name', format: 'json', formatversion: '2' });
    const leadResponse = await fetchImpl(article, { headers, signal: AbortSignal.timeout(4000) });
    const lead = leadResponse.ok ? (await leadResponse.json()).query?.pages?.[0] : null;
    const url = new URL('https://commons.wikimedia.org/w/api.php');
    const parameters = { action: 'query', prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiurlwidth: '960', format: 'json', formatversion: '2' };
    const normalisedCountry = country.toLowerCase();
    const countryNames = { 'united kingdom': ['united kingdom', 'england', 'scotland', 'wales', 'northern ireland'], 'united states': ['united states', 'united states of america'], 'czech republic': ['czechia', 'czech republic'] };
    const countries = countryNames[normalisedCountry] || [normalisedCountry];
    const matchesCountry = typeof lead?.description === 'string' && countries.some(value => lead.description.toLowerCase().includes(value));
    if (matchesCountry && typeof lead?.pageimage === 'string') {
      url.search = new URLSearchParams({ ...parameters, titles: 'File:' + lead.pageimage });
      const response = await fetchImpl(url, { headers, signal: AbortSignal.timeout(4000) });
      if (response.ok) { const data = await response.json(); if (Array.isArray(data.query?.pages)) photo = selectPhoto(data.query.pages); }
    }
    if (!photo) {
      const terms = [name, country].map(value => value.replace(/[^\p{L}\p{N}\s'-]/gu, ' ').trim());
      url.search = new URLSearchParams({ ...parameters, generator: 'search', gsrsearch: `intitle:"${terms[0]}" "${terms[1]}" filetype:bitmap`, gsrnamespace: '6', gsrlimit: '6' });
      const response = await fetchImpl(url, { headers, signal: AbortSignal.timeout(4000) });
      if (response.ok) {
        const data = await response.json();
        const normalise = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
        if (Array.isArray(data.query?.pages)) photo = selectPhoto(data.query.pages.filter(page => typeof page.title === 'string' && normalise(page.title).includes(normalise(name))));
      }
    }
  } catch { /* Photography must never prevent recommendations from appearing. */ }
  if (fetchImpl === fetch) {
    if (cache.size >= 150) cache.delete(cache.keys().next().value);
    cache.set(key, { photo, expires: Date.now() + (photo ? 86400000 : 60000) });
  }
  return photo;
}
