import { fileURLToPath } from 'node:url';
import { startTravelApi } from './start.mjs';
const port = Number(process.env.API_PORT || 3001);
const mode = process.env.AI_MODE === 'live' ? 'live' : 'demo';
try {
  const server = await startTravelApi({ port, runtimeFile: process.env.API_DISCOVERY === 'off' ? null : fileURLToPath(new URL('../.travel-api.json', import.meta.url)),
    options: { mode, apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' } });
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
    server.close(); server.closeAllConnections();
  });
} catch (error) {
  console.error(`Could not start the travel API: ${error.message}`);
  process.exitCode = 1;
}
