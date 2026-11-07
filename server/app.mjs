import { createServer } from 'node:http';
import { TravelError, validateTrip, generateRecommendations, generateItinerary } from './recommendations.mjs';

export function createTravelServer(options = {}) {
  const attempts = new Map();
  let active = 0;
  return createServer(async (request, response) => {
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status, data) => {
      if (response.destroyed || response.writableEnded) return;
      response.writeHead(status); response.end(JSON.stringify(data));
    };
    if (request.url === '/api/status' && request.method === 'GET') {
      return send(200, { mode: options.mode === 'live' ? 'live' : 'demo', available: options.mode !== 'live' || !!options.apiKey });
    }
    if (!['/api/recommendations', '/api/itinerary'].includes(request.url)) return send(404, { error: 'Not found.' });
    if (request.method !== 'POST') { response.setHeader('Allow', 'POST'); return send(405, { error: 'Use POST for this request.' }); }
    if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') return send(415, { error: 'Send your preferences as JSON.' });
    const controller = new AbortController();
    response.on('close', () => { if (!response.writableEnded) controller.abort(); });
    request.setTimeout(15000, () => request.destroy());
    try {
      const now = Date.now();
      for (const [ip, entry] of attempts) if (entry.expires <= now) attempts.delete(ip);
      const ip = request.socket.remoteAddress;
      const entry = attempts.get(ip) || { count: 0, expires: now + 60000 };
      attempts.set(ip, entry);
      if (++entry.count > 30 || active >= 3) {
        response.setHeader('Retry-After', '60'); throw new TravelError(429, 'Please wait a minute before requesting more ideas.');
      }
      const chunks = []; let bytes = 0;
      for await (const chunk of request) {
        bytes += chunk.length;
        if (bytes > 32768) throw new TravelError(413, 'Your trip details are too long. Please shorten them.');
        chunks.push(chunk);
      }
      request.setTimeout(0);
      let value;
      try { value = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { throw new TravelError(400, 'Your preferences could not be read. Please retry.'); }
      const preferences = validateTrip(value);
      if (active >= 3) throw new TravelError(429, 'Please wait a minute before requesting more ideas.');
      active++;
      try {
        const result = request.url === '/api/itinerary'
          ? await generateItinerary(preferences, value.destination, options, controller.signal)
          : await generateRecommendations(preferences, options, controller.signal);
        send(200, result);
      } finally { active--; }
    } catch (error) {
      send(error instanceof TravelError ? error.status : 500, { error: error instanceof TravelError ? error.message : 'Something went wrong. Please retry.' });
    }
  });
}
