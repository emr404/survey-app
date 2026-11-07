import test from 'node:test';
import assert from 'node:assert/strict';
import { selectPhoto, destinationPhoto } from './photos.mjs';
const page = { title: 'File:Porto panorama.jpg', imageinfo: [{ width: 1600, height: 1000, mime: 'image/jpeg', thumburl: 'https://upload.wikimedia.org/photo.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:Porto_panorama.jpg', extmetadata: { LicenseShortName: { value: 'CC BY-SA 4.0' }, LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' }, Artist: { value: '<a href="unsafe">Photographer</a>' } } }] };
test('photos require safe hosts, landscape images and explicit licence/creator attribution', () => {
  const photo = selectPhoto([page]); assert.equal(photo.author, 'Photographer'); assert.equal(photo.license, 'CC BY-SA 4.0');
  const unsafe = structuredClone(page); unsafe.imageinfo[0].thumburl = 'https://untrusted.example/image'; assert.equal(selectPhoto([unsafe]), null);
  const noCredit = structuredClone(page); delete noCredit.imageinfo[0].extmetadata.Artist; assert.equal(selectPhoto([noCredit]), null);
  assert.equal(selectPhoto([{ ...page, title: 'File:Porto flag.jpg' }]), null);
});
test('photo failures do not break recommendations, and invalid place queries do not call a service', async () => {
  assert.equal(await destinationPhoto('', 'Portugal', () => { throw new Error(); }), null);
  assert.equal(await destinationPhoto('Porto', 'Portugal', async () => { throw new Error('network'); }), null);
  assert.equal(await destinationPhoto('Porto', 'Portugal', async url => {
    if (url.hostname === 'en.wikipedia.org') return new Response(JSON.stringify({ query: { pages: [{ pageimage: 'Porto panorama.jpg', description: 'City in Portugal' }] } }));
    assert.equal(url.hostname, 'commons.wikimedia.org'); assert.equal(url.searchParams.get('titles'), 'File:Porto panorama.jpg');
    return new Response(JSON.stringify({ query: { pages: [page] } }));
  }).then(p => p.author), 'Photographer');
});
