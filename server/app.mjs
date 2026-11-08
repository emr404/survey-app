import { destinationPhoto } from './photos.mjs';
import { createServer } from 'node:http';
import { TravelError, validateTrip, generateRecommendations } from './recommendations.mjs';

export function createTravelServer(options = {}) {
  const attempts = new Map();
  let active = 0;
  let activePhotos = 0;
  const photoAttempts = new Map();
  return createServer((request, response) => {
    handleRequest(request, response).catch(() => {
      if (response.destroyed || response.writableEnded) return;
      if (response.headersSent) {
        response.destroy();
        return;
      }
      response.writeHead(500, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      response.end(
        JSON.stringify({ error: 'Something went wrong. Please retry.', code: 'request_failed' })
      );
    });
  });

  async function handleRequest(request, response) {
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status, data) => {
      if (response.destroyed || response.writableEnded) return;
      response.writeHead(status);
      response.end(JSON.stringify(data));
    };
    const origin = request.headers.origin;
    if (origin) {
      response.setHeader('Vary', 'Origin');
      if (options.allowedOrigin && origin !== options.allowedOrigin)
        return send(403, { error: 'This website is not allowed to use this API.' });
      if (origin === options.allowedOrigin)
        response.setHeader('Access-Control-Allow-Origin', origin);
    }
    if (request.method === 'OPTIONS') {
      if (!options.allowedOrigin || origin !== options.allowedOrigin)
        return send(403, { error: 'This website is not allowed to use this API.' });
      if (!['GET', 'POST'].includes(request.headers['access-control-request-method']))
        return send(405, { error: 'This request method is not supported.' });
      const headers = String(request.headers['access-control-request-headers'] || '')
        .toLowerCase()
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      if (headers.some((value) => value !== 'content-type'))
        return send(400, { error: 'This request header is not supported.' });
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      response.setHeader('Access-Control-Max-Age', '600');
      response.writeHead(204);
      response.end();
      return;
    }
    let url;
    try {
      url = new URL(request.url, 'http://localhost');
    } catch {
      return send(400, { error: 'This request URL could not be read.' });
    }
    if (url.pathname === '/api/destination-photo' && request.method === 'GET') {
      const now = Date.now();
      for (const [ip, entry] of photoAttempts) if (entry.expires <= now) photoAttempts.delete(ip);
      const ip = request.socket.remoteAddress;
      const entry = photoAttempts.get(ip) || { count: 0, expires: now + 60000 };
      photoAttempts.set(ip, entry);
      if (++entry.count > 40 || activePhotos >= 6) return send(200, { photo: null });
      activePhotos++;
      try {
        return send(200, {
          photo: await destinationPhoto(
            url.searchParams.get('name'),
            url.searchParams.get('country'),
            options.photoFetchImpl
          ),
        });
      } catch {
        return send(200, { photo: null });
      } finally {
        activePhotos--;
      }
    }
    if (request.url === '/api/status' && request.method === 'GET') {
      return send(200, {
        mode: 'groq',
        available: !!options.groqKey,
        ...(!options.groqKey
          ? { error: 'Add GROQ_API_KEY to .env.local and restart the API.' }
          : {}),
      });
    }
    if (request.url !== '/api/recommendations') return send(404, { error: 'Not found.' });
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      return send(405, { error: 'Use POST for this request.' });
    }
    if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json')
      return send(415, { error: 'Send your preferences as JSON.' });
    const controller = new AbortController();
    response.on('close', () => {
      if (!response.writableEnded) controller.abort();
    });
    request.setTimeout(15000, () => request.destroy());
    try {
      const now = Date.now();
      for (const [ip, entry] of attempts) if (entry.expires <= now) attempts.delete(ip);
      const ip = request.socket.remoteAddress;
      const entry = attempts.get(ip) || { count: 0, expires: now + 60000 };
      attempts.set(ip, entry);
      if (++entry.count > 30 || active >= 3) {
        response.setHeader('Retry-After', '60');
        throw new TravelError(429, 'Please wait a minute before requesting more ideas.');
      }
      const chunks = [];
      let bytes = 0;
      for await (const chunk of request) {
        bytes += chunk.length;
        if (bytes > 32768)
          throw new TravelError(413, 'Your trip details are too long. Please shorten them.');
        chunks.push(chunk);
      }
      request.setTimeout(0);
      let value;
      try {
        value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        throw new TravelError(400, 'Your preferences could not be read. Please retry.');
      }
      const preferences = validateTrip(value);
      if (active >= 3)
        throw new TravelError(429, 'Please wait a minute before requesting more ideas.');
      active++;
      try {
        const result = await generateRecommendations(preferences, options, controller.signal);
        send(200, result);
      } finally {
        active--;
      }
    } catch (error) {
      send(error instanceof TravelError ? error.status : 500, {
        error: error instanceof TravelError ? error.message : 'Something went wrong. Please retry.',
        code: error instanceof TravelError ? error.code : 'request_failed',
      });
    }
  }
}
